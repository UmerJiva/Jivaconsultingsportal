// pages/api/applications/index.js
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { roleId } = req.user;
  const role = req.user.role === 'custom' ? 'admin' : req.user.role;


  if (req.method === 'GET') {
    const {
      search='', status='', student_id='', program_id='',
      intake='', page='1', limit='20'
    } = req.query;

    try {
      const { query } = await import('../../../lib/db');
      let where = 'WHERE 1=1';
      const params = [];

      if (role === 'agent')   { where += ' AND a.agent_id = ?';   params.push(roleId); }
      if (role === 'student') { where += ' AND a.student_id = ?'; params.push(roleId); }
      if (student_id) { where += ' AND a.student_id = ?'; params.push(student_id); }
      if (program_id) { where += ' AND a.program_id = ?'; params.push(program_id); }
      if (status)     { where += ' AND a.status = ?';     params.push(status); }
      if (intake)     { where += ' AND a.intake = ?';     params.push(intake); }
      if (search) {
        where += ` AND (su.name LIKE ? OR u.name LIKE ? OR p.name LIKE ? OR a.app_code LIKE ?)`;
        const l = `%${search}%`;
        params.push(l, l, l, l);
      }

      const lim = Math.min(100, parseInt(limit)||20);
      const off = (Math.max(1, parseInt(page))-1) * lim;

      const apps = await query(`
        SELECT a.id, a.app_code, a.status, a.intake, a.applied_date,
               a.payment_date, a.notes, a.offer_letter, a.decision_date,
               s.id AS student_id, s.first_name, s.last_name, s.passport_no,
               su.name AS student_name, su.email AS student_email,
               u.id AS university_id, u.name AS university_name,
               c.name AS country, c.flag,
               p.id AS program_id, p.name AS program_name, p.level,
               p.tuition_fee, p.currency,
               au.name AS agent_name
        FROM applications a
        JOIN students s ON s.id = a.student_id
        JOIN users su ON su.id = s.user_id
        JOIN universities u ON u.id = a.university_id
        LEFT JOIN countries c ON c.id = u.country_id
        LEFT JOIN programs p ON p.id = a.program_id
        LEFT JOIN agents ag ON ag.id = a.agent_id
        LEFT JOIN users au ON au.id = ag.user_id
        ${where}
        ORDER BY a.applied_date DESC
        LIMIT ? OFFSET ?
      `, [...params, lim, off]);

      const countRows = await query(
        `SELECT COUNT(*) AS cnt FROM applications a
         JOIN students s ON s.id=a.student_id
         JOIN users su ON su.id=s.user_id
         JOIN universities u ON u.id=a.university_id
         LEFT JOIN programs p ON p.id=a.program_id
         ${where}`, params
      );
      const cnt = countRows[0]?.cnt || 0;
      return res.json({ applications: apps, total: cnt, pages: Math.ceil(cnt/lim) });
    } catch(err) {
      console.error('[apps GET]', err.message);
      return res.json({ applications: [], total: 0, pages: 1 });
    }
  }

  if (req.method === 'POST') {
    const { student_id, program_id, university_id, intake, notes, backup_programs=[] } = req.body;
    if (!student_id || !program_id) return res.status(400).json({ error: 'student_id and program_id required' });

    try {
      const { query, queryOne } = await import('../../../lib/db');
      const existing = await queryOne(
        'SELECT id FROM applications WHERE student_id=? AND program_id=? AND status!="Withdrawn"',
        [student_id, program_id]
      );
      if (existing) return res.status(409).json({ error: 'Application already exists', application_id: existing.id });

      const prog = await queryOne('SELECT university_id FROM programs WHERE id=?', [program_id]);
      const uniId = university_id || prog?.university_id;
      if (!uniId) return res.status(400).json({ error: 'University not found' });

      const code = 'APP' + String(Date.now()).slice(-7);
      const [result] = await query(
        'INSERT INTO applications (student_id, program_id, university_id, agent_id, intake, notes, app_code, status) VALUES (?,?,?,?,?,?,?,?)',
        [student_id, program_id, uniId, role==='agent'?roleId:null, intake||null, notes||null, code, 'Submitted']
      );
      return res.status(201).json({ message: 'Application created', id: result.insertId, app_code: code });
    } catch(err) {
      console.error('[apps POST]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
export default withAuth(handler, ['admin','agent','student']);