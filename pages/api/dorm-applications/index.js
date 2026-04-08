// pages/api/dorm-applications/index.js
import { query, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { role, roleId } = req.user;

  if (req.method === 'GET') {
    const { status = '', search = '', page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (role === 'agent')   { where += ' AND da.agent_id = ?';   params.push(roleId); }
    if (role === 'student') { where += ' AND da.student_id = ?'; params.push(roleId); }
    if (status) { where += ' AND da.status = ?'; params.push(status); }
    if (search) {
      where += ' AND (h.name LIKE ? OR u.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countRows = await query(
      `SELECT COUNT(*) AS cnt FROM dorm_applications da
       JOIN hotels h ON h.id = da.hotel_id
       JOIN students s ON s.id = da.student_id
       JOIN users u ON u.id = s.user_id
       ${where}`, params
    );
    const total = countRows[0]?.cnt || 0;

    const apps = await query(
      `SELECT da.*,
         h.name AS hotel_name, h.city, h.country,
         rt.name AS room_name,
         u.name AS student_name,
         u.email AS student_email,
         (SELECT COUNT(*) FROM dorm_application_documents dad WHERE dad.dorm_app_id = da.id) AS doc_count,
         (SELECT COUNT(*) FROM dorm_application_documents dad WHERE dad.dorm_app_id = da.id AND dad.status = 'Approved') AS doc_approved
       FROM dorm_applications da
       JOIN hotels h ON h.id = da.hotel_id
       LEFT JOIN room_types rt ON rt.id = da.room_type_id
       JOIN students s ON s.id = da.student_id
       JOIN users u ON u.id = s.user_id
       ${where}
       ORDER BY da.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return res.json({ applications: apps, total, pages: Math.ceil(total / parseInt(limit)) });
  }

  if (req.method === 'POST') {
    const { hotel_id, room_type_id, student_id, move_in_date, duration, notes } = req.body || {};
    if (!hotel_id || !student_id) return res.status(400).json({ error: 'Hotel and student are required' });

    // Determine agent_id
    let agent_id = null;
    if (role === 'agent') agent_id = roleId;

    // For student applying themselves
    let finalStudentId = student_id;
    if (role === 'student') finalStudentId = roleId;

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO dorm_applications (hotel_id, room_type_id, student_id, agent_id, move_in_date, duration, notes, status)
         VALUES (?,?,?,?,?,?,?,'Submitted')`,
        [hotel_id, room_type_id || null, finalStudentId, agent_id, move_in_date || null, duration || null, notes || null]
      );

      const appId = result.insertId;
      // Auto-generate app code
      await conn.execute(
        `UPDATE dorm_applications SET app_code = ? WHERE id = ?`,
        [`DA-${String(appId + 1000).padStart(5, '0')}`, appId]
      );

      await conn.commit();
      return res.status(201).json({ id: appId, app_code: `DA-${String(appId + 1000).padStart(5, '0')}` });
    } catch (err) {
      await conn.rollback();
      return res.status(500).json({ error: err.message });
    } finally { conn.release(); }
  }

  return res.status(405).end();
}

export default withAuth(handler, ['admin', 'agent', 'student', 'custom']);