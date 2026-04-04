// pages/api/admin/leads/index.js — list leads
import { query } from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { status, search, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT l.*,
        u.name AS assigned_name
      FROM leads l
      LEFT JOIN users u ON u.id = l.assigned_to
      WHERE 1=1
    `;
    const params = [];

    if (status) { sql += ` AND l.status = ?`; params.push(status); }
    if (search) {
      sql += ` AND (l.name LIKE ? OR l.email LIKE ? OR l.phone LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [countResult] = await query(`SELECT COUNT(*) AS total FROM leads WHERE 1=1${status ? ' AND status = ?' : ''}`, status ? [status] : []);

    const leads = await query(sql, params);
    return res.json({ leads, total: countResult.total });
  }

  return res.status(405).end();
}

export default withAuth(handler, ['admin', 'custom']);