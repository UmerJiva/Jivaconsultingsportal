// pages/api/roles/index.js
import { query, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error:'Admin only' });

  if (req.method === 'GET') {
    try {
      const roles = await query(`
        SELECT r.*, COUNT(u.id) AS user_count
        FROM custom_roles r
        LEFT JOIN users u ON u.custom_role_id = r.id AND u.is_active=1
        GROUP BY r.id ORDER BY r.created_at ASC
      `);
      // Fetch permissions for all roles
      const perms = await query('SELECT * FROM role_permissions');
      const permMap = {};
      perms.forEach(p => {
        if (!permMap[p.role_id]) permMap[p.role_id] = {};
        try { permMap[p.role_id][p.module] = JSON.parse(p.permissions); }
        catch { permMap[p.role_id][p.module] = []; }
      });
      const result = roles.map(r => ({ ...r, permissions: permMap[r.id] || {} }));
      return res.json({ roles: result });
    } catch(e) {
      console.error('[roles GET]', e.message);
      return res.json({ roles: [] });
    }
  }

  if (req.method === 'POST') {
    const { name, description='', color='#6366f1', icon='Shield', permissions={} } = req.body;
    if (!name?.trim()) return res.status(400).json({ error:'Role name required' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    try {
      const pool = getPool();
      const [ins] = await pool.execute(
        'INSERT INTO custom_roles (name, slug, description, color, icon) VALUES (?,?,?,?,?)',
        [name.trim(), slug, description, color, icon]
      );
      const roleId = ins.insertId;
      // Save permissions
      for (const [module, perms] of Object.entries(permissions)) {
        if (!Array.isArray(perms) || perms.length === 0) continue;
        await pool.execute(
          'INSERT INTO role_permissions (role_id, module, permissions) VALUES (?,?,?) ON DUPLICATE KEY UPDATE permissions=VALUES(permissions)',
          [roleId, module, JSON.stringify(perms)]
        );
      }
      return res.status(201).json({ message:'Role created', id:roleId, slug });
    } catch(e) {
      if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error:'A role with this name already exists' });
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error:'Method not allowed' });
}
export default withAuth(handler, ['admin']);