// pages/api/universities/[id].js
import { query, queryOne, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;
  const { role } = req.user;

  try {
    const uni = await queryOne(`
      SELECT u.*, c.name AS country, c.flag, c.code AS country_code
      FROM universities u LEFT JOIN countries c ON c.id = u.country_id
      WHERE u.id = ?
    `, [id]);

    if (!uni) return res.status(404).json({ error: 'University not found' });

    // ── GET ──────────────────────────────────────────────────
    if (req.method === 'GET') {
      const [programs, scholarships] = await Promise.all([
        query(`SELECT * FROM programs WHERE university_id = ? AND is_active = 1 ORDER BY level, name`, [id]),
        query(`SELECT * FROM scholarships WHERE university_id = ? ORDER BY id`, [id])
      ]);

      const safeJson = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try { return JSON.parse(val); } catch { return []; }
      };

      // Get intakes
      const intakeRows = await query('SELECT intake_name FROM university_intakes WHERE university_id = ? ORDER BY intake_name', [id]);
      const intakes = intakeRows.map(r=>r.intake_name).join(',');

      return res.json({
        ...uni,
        intakes,
        features:       safeJson(uni.features),
        disciplines:    safeJson(uni.disciplines),
        program_levels: safeJson(uni.program_levels),
        photos:         safeJson(uni.photos),
        programs,
        scholarships,
      });
    }

    // ── PUT ──────────────────────────────────────────────────
    if (req.method === 'PUT') {
      if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

      const {
        name, country_id, world_ranking, logo_initials, website,
        tuition_info, status, city, address, description, founded,
        institution_type, avg_processing_days, cost_of_living,
        avg_tuition, application_fee_range, features, disciplines,
        program_levels, latitude, longitude,
        default_commission_type, default_commission_amount, default_commission_percent, default_commission_text,
        intakes = [], scholarships = [], programs = []
      } = req.body;

      const conn = await getPool().getConnection();
      try {
        await conn.beginTransaction();

        // Update university
        await conn.execute(`
          UPDATE universities SET
            name=?, country_id=?, world_ranking=?, logo_initials=?, website=?,
            tuition_info=?, status=?, city=?, address=?, description=?, founded=?,
            institution_type=?, avg_processing_days=?, cost_of_living=?,
            avg_tuition=?, application_fee_range=?,
            features=?, disciplines=?, latitude=?, longitude=?,
            default_commission_type=?, default_commission_amount=?,
            default_commission_percent=?, default_commission_text=?,
            updated_at=NOW()
          WHERE id=?
        `, [
          name||uni.name, country_id||null, world_ranking||null, logo_initials||null, website||null,
          tuition_info||null, status||uni.status, city||null, address||null,
          description||null, founded||null, institution_type||null,
          avg_processing_days||null, cost_of_living||null, avg_tuition||null,
          application_fee_range||null,
          features ? JSON.stringify(features) : null,
          disciplines ? JSON.stringify(disciplines) : null,
          latitude||null, longitude||null,
          default_commission_type||'text', default_commission_amount||null,
          default_commission_percent||null, default_commission_text||null,
          id
        ]);

        // Update intakes
        if (Array.isArray(intakes)) {
          await conn.execute('DELETE FROM university_intakes WHERE university_id = ?', [id]);
          for (const intake of intakes) {
            await conn.execute('INSERT IGNORE INTO university_intakes (university_id, intake_name) VALUES (?,?)', [id, intake]);
          }
        }

        // Update scholarships — delete all and re-insert
        if (Array.isArray(scholarships)) {
          await conn.execute('DELETE FROM scholarships WHERE university_id = ?', [id]);
          for (const s of scholarships) {
            if (!s.name) continue;
            await conn.execute(
              `INSERT INTO scholarships (university_id, name, amount_text, auto_applied, eligible_nationalities, eligible_levels)
               VALUES (?,?,?,?,?,?)`,
              [id, s.name, s.amount_text||null, s.auto_applied?1:0, s.eligible_nationalities||'All nationalities', s.eligible_levels||null]
            );
          }
        }

        // Update programs — update existing, insert new ones
        if (Array.isArray(programs)) {
          // Deactivate all existing first
          await conn.execute('UPDATE programs SET is_active=0 WHERE university_id=?', [id]);
          for (const p of programs) {
            if (!p.name) continue;
            if (p.id) {
              // Update existing
              await conn.execute(`
                UPDATE programs SET
                  name=?, level=?, tuition_fee=?, currency=?,
                  application_fee=?, app_fee_currency=?,
                  campus_city=?, location_text=?, duration_text=?,
                  available_intakes=?, tags=?, success_chance=?,
                  instant_submission=?, instant_offer=?,
                  commission_text=?, commission_type=?, commission_amount=?, commission_percent=?, is_active=1
                WHERE id=? AND university_id=?
              `, [
                p.name, p.level||'Bachelor', p.tuition_fee||null, p.currency||'USD',
                p.application_fee||0, p.app_fee_currency||'USD',
                p.campus_city||null, p.location_text||null, p.duration_text||null,
                p.available_intakes||null, p.tags||null,
                p.success_chance||'High', p.instant_submission?1:0, p.instant_offer?1:0,
                p.commission_text||null, p.commission_type||'text', p.commission_amount||null, p.commission_percent||null, p.id, id
              ]);
            } else {
              // Insert new
              await conn.execute(`
                INSERT INTO programs
                (university_id, name, level, tuition_fee, currency,
                 application_fee, app_fee_currency, campus_city, location_text,
                 duration_text, available_intakes, tags, success_chance,
                 instant_submission, instant_offer, commission_text,
                 commission_type, commission_amount, commission_percent, is_active)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
              `, [
                id, p.name, p.level||'Bachelor', p.tuition_fee||null, p.currency||'USD',
                p.application_fee||0, p.app_fee_currency||'USD',
                p.campus_city||null, p.location_text||null, p.duration_text||null,
                p.available_intakes||null, p.tags||null,
                p.success_chance||'High', p.instant_submission?1:0, p.instant_offer?1:0,
                p.commission_text||null, p.commission_type||'text',
                p.commission_amount||null, p.commission_percent||null
              ]);
            }
          }
        }

        await conn.commit();
        return res.json({ message: 'University updated' });
      } catch (err) {
        await conn.rollback(); throw err;
      } finally { conn.release(); }
    }

    // ── DELETE ───────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      await query('UPDATE universities SET status="Inactive" WHERE id=?', [id]);
      return res.json({ message: 'University deactivated' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[universities/[id]]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

export default withAuth(handler);