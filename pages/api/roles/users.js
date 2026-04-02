// pages/api/roles/users.js
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const { role_id = '', search = '' } = req.query;

  try {
    let where = "WHERE (u.role = 'custom' OR u.custom_role_id IS NOT NULL)";
    const params = [];

    if (role_id) {
      where += ' AND u.custom_role_id = ?';
      params.push(role_id);
    }
    if (search) {
      where += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like);
    }

    const users = await query(`
      SELECT
        u.id, u.name, u.email, u.avatar, u.is_active, u.created_at,
        r.name  AS role_name,
        r.color AS role_color,
        r.slug  AS role_slug
      FROM users u
      LEFT JOIN custom_roles r ON r.id = u.custom_role_id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT 100
    `, params);

    return res.json({ users });
  } catch (e) {
    console.error('[roles/users GET]', e.message);
    return res.json({ users: [] });
  }
}

export default withAuth(handler, ['admin']);