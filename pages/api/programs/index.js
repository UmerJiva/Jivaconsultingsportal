// pages/api/programs/index.js
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

function searchLike(s) { return `%${s}%`; }

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const {
    search = '', level = '', country = '',
    university_id = '', min_fee = '', max_fee = '',
    tag = '', field = '', intake = '', instant = '',
    page = '1', limit: rawLimit = '12', sort = 'ranking'
  } = req.query;

  const limit  = Math.min(50, Math.max(1, parseInt(rawLimit)));
  const offset = (Math.max(1, parseInt(page)) - 1) * limit;

  try {
    let where = 'WHERE p.is_active = 1 AND u.status != "Inactive"';
    const params = [];

    if (search) {
      where += ' AND (p.name LIKE ? OR u.name LIKE ? OR p.location_text LIKE ? OR p.campus_city LIKE ?)';
      const l = searchLike(search);
      params.push(l, l, l, l);
    }
    if (level)         { where += ' AND p.level = ?';                    params.push(level); }
    if (country)       { where += ' AND c.name = ?';                     params.push(country); }
    if (university_id) { where += ' AND p.university_id = ?';            params.push(university_id); }
    if (tag)           { where += ' AND FIND_IN_SET(?, p.tags)';         params.push(tag); }
    if (field)         { where += ' AND p.field_of_study = ?';           params.push(field); }
    if (intake)        { where += ' AND FIND_IN_SET(?, p.available_intakes)'; params.push(intake); }
    if (instant === 'submission') { where += ' AND p.instant_submission = 1'; }
    if (instant === 'offer')      { where += ' AND p.instant_offer = 1'; }
    if (min_fee)       { where += ' AND p.tuition_fee >= ?';             params.push(parseFloat(min_fee)); }
    if (max_fee)       { where += ' AND p.tuition_fee <= ?';             params.push(parseFloat(max_fee)); }

    const orderMap = {
      ranking:      'u.world_ranking ASC, p.name ASC',
      tuition_asc:  'p.tuition_fee ASC',
      tuition_desc: 'p.tuition_fee DESC',
      name:         'p.name ASC',
      newest:       'p.created_at DESC',
    };
    const orderBy = orderMap[sort] || orderMap.ranking;

    const countSql = `
      SELECT COUNT(*) AS cnt
      FROM programs p
      JOIN universities u ON u.id = p.university_id
      LEFT JOIN countries c ON c.id = u.country_id
      ${where}
    `;
    const dataSql = `
      SELECT
        p.id, p.name, p.level,
        p.duration_years, p.duration_text,
        p.tuition_fee, p.currency, p.application_fee, p.app_fee_currency,
        p.city, p.campus_city, p.location_text,
        p.success_chance, p.instant_offer, p.instant_submission,
        p.tags, p.available_intakes, p.commission_text,
        u.id AS university_id, u.name AS university_name,
        u.logo_initials, u.world_ranking, u.status AS uni_status,
        c.name AS country, c.flag, c.code AS country_code
      FROM programs p
      JOIN universities u ON u.id = p.university_id
      LEFT JOIN countries c ON c.id = u.country_id
      ${where}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [countRow] = await query(countSql, params);
    const programs   = await query(dataSql, [...params, limit, offset]);

    return res.json({
      programs,
      total: countRow.cnt,
      page:  parseInt(page),
      limit,
      pages: Math.ceil(countRow.cnt / limit),
    });

  } catch (err) {
    console.error('[programs API error]', err.message);
    return res.status(500).json({ error: err.message, programs: [], total: 0, pages: 0 });
  }
}

export default withAuth(handler);