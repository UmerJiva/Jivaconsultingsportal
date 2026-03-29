// pages/api/students/index.js
import bcrypt from 'bcryptjs';
import { withAuth } from '../../../lib/auth';

export default withAuth(async function handler(req, res) {
  const { role, roleId } = req.user;

  // ── GET — list students ────────────────────────────────────
  if (req.method === 'GET') {
    const {
      search = '', status = '', lead_status = '',
      nationality = '', recruiter_type = '', education = '',
      page = '1', limit: rawLimit = '20',
      sort = 'created_at', dir = 'desc',
      // per-column filters
      f_id = '', f_email = '', f_first = '', f_last = '',
      f_nationality = '', f_recruiter = '', f_education = '',
    } = req.query;

    const limit  = Math.min(100, Math.max(1, parseInt(rawLimit)));
    const offset = (Math.max(1, parseInt(page)) - 1) * limit;

    try {
      const { query } = await import('../../../lib/db');

      let where = 'WHERE u.is_active = 1';
      const params = [];

      if (role === 'agent') { where += ' AND s.agent_id = ?'; params.push(roleId); }

      // Global search
      if (search) {
        where += ' AND (u.name LIKE ? OR u.email LIKE ? OR c.name LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ?)';
        const l = `%${search}%`;
        params.push(l, l, l, l, l);
      }

      // Per-column filters
      if (f_id)          { where += ' AND s.id LIKE ?';           params.push(`%${f_id}%`); }
      if (f_email)       { where += ' AND u.email LIKE ?';        params.push(`%${f_email}%`); }
      if (f_first)       { where += ' AND s.first_name LIKE ?';   params.push(`%${f_first}%`); }
      if (f_last)        { where += ' AND s.last_name LIKE ?';    params.push(`%${f_last}%`); }
      if (f_nationality) { where += ' AND c.name LIKE ?';         params.push(`%${f_nationality}%`); }
      if (f_recruiter)   { where += ' AND s.recruiter_type = ?';  params.push(f_recruiter); }
      if (f_education)   { where += ' AND s.education_level LIKE ?'; params.push(`%${f_education}%`); }

      // Dropdown filters
      if (status)        { where += ' AND s.status = ?';          params.push(status); }
      if (lead_status)   { where += ' AND s.lead_status = ?';     params.push(lead_status); }
      if (nationality)   { where += ' AND c.name = ?';            params.push(nationality); }
      if (recruiter_type){ where += ' AND s.recruiter_type = ?';  params.push(recruiter_type); }
      if (education)     { where += ' AND s.education_level LIKE ?'; params.push(`%${education}%`); }

      // Allowed sort columns
      const SORT_MAP = {
        id: 's.id', name: 'u.name', email: 'u.email',
        created_at: 's.created_at', status: 's.status',
        lead_status: 's.lead_status',
      };
      const orderCol = SORT_MAP[sort] || 's.created_at';
      const orderDir = dir === 'asc' ? 'ASC' : 'DESC';

      const sql = `
        SELECT
          s.id,
          s.first_name,
          s.last_name,
          s.status,
          s.lead_status,
          s.recruiter_type,
          s.education_level,
          s.education_verified,
          s.referral_source,
          s.gpa,
          s.ielts_score,
          s.toefl_score,
          s.target_program,
          s.target_intake,
          s.phone,
          s.agent_id,
          s.created_at,
          u.name        AS full_name,
          u.email,
          u.avatar,
          c.name        AS nationality,
          c.flag,
          au.name       AS agent_name,
          au.email      AS agent_email,
          -- Application counts per status
          COUNT(DISTINCT app.id)                                                      AS app_total,
          SUM(app.status = 'Submitted')                                               AS app_submitted,
          SUM(app.status = 'Under Review')                                            AS app_review,
          SUM(app.status IN ('Accepted','Offer Received'))                            AS app_accepted,
          SUM(app.status = 'Conditional')                                             AS app_conditional,
          SUM(app.status = 'Rejected')                                                AS app_rejected
        FROM students s
        JOIN  users       u   ON u.id   = s.user_id
        LEFT JOIN countries   c   ON c.id   = s.country_id
        LEFT JOIN agents      ag  ON ag.id  = s.agent_id
        LEFT JOIN users       au  ON au.id  = ag.user_id
        LEFT JOIN applications app ON app.student_id = s.id
        ${where}
        GROUP BY s.id
        ORDER BY ${orderCol} ${orderDir}
        LIMIT ? OFFSET ?
      `;

      // Count query
      const countSql = `
        SELECT COUNT(DISTINCT s.id) AS cnt
        FROM students s
        JOIN users u ON u.id = s.user_id
        LEFT JOIN countries c ON c.id = s.country_id
        ${where}
      `;

      const [countResult] = await query(countSql, params);
      const total = countResult?.cnt || 0;

      params.push(limit, offset);
      const students = await query(sql, params);

      return res.json({ students, total, page: parseInt(page), limit, pages: Math.ceil(total / limit) });

    } catch (err) {
      console.error('[students GET]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — create student ──────────────────────────────────
  if (req.method === 'POST') {
    if (!['admin','agent'].includes(role)) return res.status(403).json({ error: 'Forbidden' });

    const {
      first_name, last_name, email,
      password = 'Student@123',
      phone, country_id, date_of_birth, passport_no,
      gpa, ielts_score, toefl_score,
      target_program, target_intake,
      agent_id, status = 'Pending',
      lead_status = 'New', recruiter_type = 'Owner',
      education_level, referral_source, notes,
    } = req.body;

    if (!first_name || !email) return res.status(400).json({ error: 'First name and email required' });

    const fullName = [first_name, last_name].filter(Boolean).join(' ');
    const initials = [first_name[0], last_name?.[0]].filter(Boolean).join('').toUpperCase();

    try {
      const { queryOne, getPool } = await import('../../../lib/db');

      const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const hash = await bcrypt.hash(password, 10);
      const conn = await getPool().getConnection();

      try {
        await conn.beginTransaction();

        const [userRes] = await conn.execute(
          'INSERT INTO users (name, email, password, role, avatar) VALUES (?,?,?,?,?)',
          [fullName, email.toLowerCase(), hash, 'student', initials]
        );

        const [stuRes] = await conn.execute(
          `INSERT INTO students
           (user_id, first_name, last_name, agent_id, phone, country_id,
            date_of_birth, passport_no, gpa, ielts_score, toefl_score,
            target_program, target_intake, status, lead_status, recruiter_type,
            education_level, referral_source, notes)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            userRes.insertId, first_name, last_name||null,
            // Agent always assigned to themselves; admin can assign freely
            role === 'agent' ? roleId : (agent_id||null),
            phone||null, country_id||null, date_of_birth||null, passport_no||null,
            gpa||null, ielts_score||null, toefl_score||null,
            target_program||null, target_intake||null,
            status, lead_status, recruiter_type,
            education_level||null, referral_source||null, notes||null,
          ]
        );

        await conn.commit();
        return res.status(201).json({ message: 'Student created', id: stuRes.insertId });
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('[students POST]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, ['admin', 'agent']);