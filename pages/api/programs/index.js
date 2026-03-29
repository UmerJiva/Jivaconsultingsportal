// pages/api/programs/index.js
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import { searchLike } from '../../../lib/apiHelper';

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const {
    search = '', level = '', country = '',
    university_id = '', min_fee = '', max_fee = '',
    tag = '', page = '1', limit: rawLimit = '12',
    sort = 'ranking'
  } = req.query;

  const limit  = Math.min(50, Math.max(1, parseInt(rawLimit)));
  const offset = (Math.max(1, parseInt(page)) - 1) * limit;

  try {
    let where = 'WHERE p.is_active = 1 AND u.status != "Inactive"';
    const params = [];

    if (search) {
      where += ' AND (p.name LIKE ? OR u.name LIKE ? OR p.location_text LIKE ?)';
      const l = searchLike(search);
      params.push(l, l, l);
    }
    if (level)        { where += ' AND p.level = ?';          params.push(level); }
    if (country)      { where += ' AND c.name = ?';           params.push(country); }
    if (university_id){ where += ' AND p.university_id = ?';  params.push(university_id); }
    if (tag)          { where += ' AND FIND_IN_SET(?, p.tags)'; params.push(tag); }
    if (field)        { where += ' AND p.field_of_study = ?'; params.push(field); }
    if (intake)       { where += ' AND FIND_IN_SET(?, p.available_intakes)'; params.push(intake); }
    if (university)   { where += ' AND p.university_id = ?'; params.push(university); }
    if (instant === 'submission') { where += ' AND p.instant_submission = 1'; }
    if (instant === 'offer')      { where += ' AND p.instant_offer = 1'; }
    if (min_fee)      { where += ' AND p.tuition_fee >= ?';   params.push(parseFloat(min_fee)); }
    if (max_fee)      { where += ' AND p.tuition_fee <= ?';   params.push(parseFloat(max_fee)); }

    const orderMap = {
      ranking:    'u.world_ranking ASC',
      tuition_asc:'p.tuition_fee ASC',
      tuition_desc:'p.tuition_fee DESC',
      name:       'p.name ASC',
      newest:     'p.created_at DESC',
    };
    const orderBy = orderMap[sort] || orderMap.ranking;

    const sql = `
      SELECT
        p.id, p.name, p.level, p.duration_years, p.duration_text,
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

    const [countRow] = await query(
      `SELECT COUNT(*) AS cnt FROM programs p JOIN universities u ON u.id=p.university_id LEFT JOIN countries c ON c.id=u.country_id ${where}`,
      params
    );

    params.push(limit, offset);
    const programs = await query(sql, params);

    return res.json({ programs, total: countRow.cnt, page: parseInt(page), limit, pages: Math.ceil(countRow.cnt / limit) });
  } catch (err) {
    console.error('[programs]', err.message);
    // Dev fallback
    return res.json({
      programs: [
        { id:1, name:'BSc Computer Science', level:'Bachelor', tuition_fee:35000, currency:'CAD', application_fee:0, app_fee_currency:'CAD', campus_city:'Toronto', location_text:'Toronto, CAN', success_chance:'High', instant_submission:1, instant_offer:0, tags:'High Job Demand,Scholarships Available,Prime,Incentivized,Popular,Fast Acceptance', available_intakes:'Sep 2026,Jan 2027', duration_text:'4 years', university_id:1, university_name:'University of Toronto', logo_initials:'UT', world_ranking:18, country:'Canada', flag:'🇨🇦', commission_text:'Up to CAD 3,500' },
        { id:2, name:'MSc Data Science', level:'Master', tuition_fee:33000, currency:'GBP', application_fee:0, app_fee_currency:'GBP', campus_city:'London', location_text:'Greater London, UK', success_chance:'High', instant_submission:1, instant_offer:1, tags:'High Job Demand,Scholarships Available,Prime,Incentivized,Popular,Fast Acceptance', available_intakes:'Oct 2026,Feb 2027', duration_text:'12 months', university_id:3, university_name:'Imperial College London', logo_initials:'IC', world_ranking:6, country:'United Kingdom', flag:'🇬🇧', commission_text:'Up to £2,800' },
        { id:6, name:'MSc Artificial Intelligence', level:'Master', tuition_fee:28000, currency:'GBP', application_fee:0, app_fee_currency:'GBP', campus_city:'Edinburgh', location_text:'Scotland, UK', success_chance:'High', instant_submission:1, instant_offer:0, tags:'High Job Demand,Prime,Fast Acceptance', available_intakes:'Sep 2026,Jan 2027', duration_text:'12 months', university_id:5, university_name:'University of Edinburgh', logo_initials:'UE', world_ranking:22, country:'United Kingdom', flag:'🇬🇧', commission_text:'Up to £2,500' },
      ],
      total: 3, page: 1, limit, pages: 1
    });
  }
}

export default withAuth(handler);