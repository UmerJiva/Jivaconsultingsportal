// pages/api/universities/index.js
import { query, queryOne, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import { paginate, searchLike } from '../../../lib/apiHelper';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { search = '', status = '' } = req.query;
    const { limit, offset } = paginate(req);
    const params = [];
    let where = 'WHERE 1=1';
    if (search) { where += ' AND (u.name LIKE ? OR c.name LIKE ?)'; const l=searchLike(search); params.push(l,l); }
    if (status) { where += ' AND u.status = ?'; params.push(status); }

    try {
      const unis = await query(`
        SELECT u.id, u.name, u.world_ranking, u.logo_initials, u.website,
               u.tuition_info, u.status, u.city, u.country_id,
               c.name AS country, c.flag,
               COUNT(DISTINCT p.id) AS program_count,
               COUNT(DISTINCT a.student_id) AS student_count,
               GROUP_CONCAT(DISTINCT i.intake_name ORDER BY i.intake_name SEPARATOR ',') AS intakes
        FROM universities u
        LEFT JOIN countries c ON c.id = u.country_id
        LEFT JOIN programs p ON p.university_id = u.id AND p.is_active=1
        LEFT JOIN applications a ON a.university_id = u.id AND a.status NOT IN ('Rejected','Withdrawn')
        LEFT JOIN university_intakes i ON i.university_id = u.id
        ${where}
        GROUP BY u.id ORDER BY u.world_ranking ASC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      const [{ cnt }] = await query(
        `SELECT COUNT(*) AS cnt FROM universities u LEFT JOIN countries c ON c.id=u.country_id ${where}`, params
      );
      return res.json({ universities: unis, total: cnt });
    } catch (err) {
      console.error('[universities GET]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    if (req.user.role !== 'admin' && req.user.role !== 'custom') return res.status(403).json({ error: 'Forbidden' });
    const {
      name, country_id, world_ranking, logo_initials, website,
      tuition_info, status = 'Active', city, address, description,
      founded, institution_type, avg_processing_days, cost_of_living,
      avg_tuition, application_fee_range, features, disciplines,
      default_commission_type = 'text', default_commission_amount, default_commission_percent, default_commission_text,
      intakes = [], scholarships = [], programs = []
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO universities
         (name, country_id, world_ranking, logo_initials, website, tuition_info,
          status, city, address, description, founded, institution_type,
          avg_processing_days, cost_of_living, avg_tuition, application_fee_range,
          features, disciplines,
          default_commission_type, default_commission_amount, default_commission_percent, default_commission_text)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          name, country_id||null, world_ranking||null, logo_initials||null,
          website||null, tuition_info||null, status, city||null, address||null,
          description||null, founded||null, institution_type||null,
          avg_processing_days||null, cost_of_living||null, avg_tuition||null,
          application_fee_range||null,
          features ? JSON.stringify(features) : null,
          disciplines ? JSON.stringify(disciplines) : null,
          default_commission_type||'text', default_commission_amount||null,
          default_commission_percent||null, default_commission_text||null,
        ]
      );
      const uniId = result.insertId;

      // Intakes
      for (const intake of intakes) {
        await conn.execute('INSERT IGNORE INTO university_intakes (university_id, intake_name) VALUES (?,?)', [uniId, intake]);
      }

      // Scholarships
      for (const s of scholarships) {
        if (!s.name) continue;
        await conn.execute(
          `INSERT INTO scholarships (university_id, name, amount_text, auto_applied, eligible_nationalities, eligible_levels)
           VALUES (?,?,?,?,?,?)`,
          [uniId, s.name, s.amount_text||null, s.auto_applied?1:0, s.eligible_nationalities||'All nationalities', s.eligible_levels||null]
        );
      }

      // Programs
      for (const p of programs) {
        if (!p.name) continue;
        await conn.execute(
          `INSERT INTO programs
           (university_id, name, level, tuition_fee, currency, application_fee,
            app_fee_currency, campus_city, location_text, duration_text,
            available_intakes, tags, success_chance, instant_submission,
            instant_offer, commission_text, commission_type, commission_amount, commission_percent, is_active)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
          [
            uniId, p.name, p.level||'Bachelor', p.tuition_fee||null, p.currency||'USD',
            p.application_fee||0, p.app_fee_currency||'USD',
            p.campus_city||null, p.location_text||null, p.duration_text||null,
            p.available_intakes||null, p.tags||null,
            p.success_chance||'High', p.instant_submission?1:0, p.instant_offer?1:0,
            p.commission_text||null, p.commission_type||'text',
            p.commission_amount||null, p.commission_percent||null
          ]
        );
      }

      await conn.commit();
      return res.status(201).json({ message: 'University created', id: uniId });
    } catch (err) {
      await conn.rollback();
      console.error('[universities POST]', err.message);
      return res.status(500).json({ error: err.message });
    } finally { conn.release(); }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['admin', 'agent', 'student']);