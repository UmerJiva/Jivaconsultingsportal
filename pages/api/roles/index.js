// pages/api/roles/index.js
import { query, queryOne, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  // GET — list all custom roles with permission data
  if (req.method === 'GET') {
    try {
      const roles = await query(`
        SELECT r.*, COUNT(u.id) AS user_count
        FROM custom_roles r
        LEFT JOIN users u ON u.custom_role_id = r.id AND COALESCE(u.is_active,1) = 1
        GROUP BY r.id
        ORDER BY r.created_at ASC
      `);

      const perms = await query('SELECT * FROM role_permissions');
      const permMap = {};
      perms.forEach(p => {
        if (!permMap[p.role_id]) permMap[p.role_id] = {};
        try   { permMap[p.role_id][p.module] = JSON.parse(p.permissions); }
        catch { permMap[p.role_id][p.module] = []; }
      });

      const result = roles.map(r => ({ ...r, permissions: permMap[r.id] || {} }));
      return res.json({ roles: result });
    } catch (e) {
      console.error('[roles GET]', e.message);
      return res.json({ roles: [] });
    }
  }

  // POST — create new role
  if (req.method === 'POST') {
    const { name, description = '', color = '#6366f1', icon = 'Shield', permissions = {} } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Role name required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    try {
      const existing = await queryOne('SELECT id FROM custom_roles WHERE slug = ?', [slug]);
      if (existing) return res.status(400).json({ error: 'A role with this name already exists' });

      const pool = getPool();
      const [ins] = await pool.execute(
        'INSERT INTO custom_roles (name, slug, description, color, icon) VALUES (?,?,?,?,?)',
        [name.trim(), slug, description, color, icon]
      );
      const roleId = ins.insertId;

      // Save permissions
      await savePermissions(pool, roleId, permissions);

      return res.status(201).json({ success: true, roleId });
    } catch (e) {
      console.error('[roles POST]', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export async function savePermissions(pool, roleId, permissions) {
  await pool.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
  for (const [module, actions] of Object.entries(permissions)) {
    if (!Array.isArray(actions) || actions.length === 0) continue;
    await pool.execute(
      'INSERT INTO role_permissions (role_id, module, permissions) VALUES (?,?,?)',
      [roleId, module, JSON.stringify(actions)]
    );
  }
}

export default withAuth(handler, ['admin']);