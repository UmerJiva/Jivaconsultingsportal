// pages/api/roles/[id].js
import { query, queryOne, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error:'Admin only' });
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const role = await queryOne('SELECT * FROM custom_roles WHERE id=?', [id]);
      if (!role) return res.status(404).json({ error:'Not found' });
      const perms = await query('SELECT * FROM role_permissions WHERE role_id=?', [id]);
      const permissions = {};
      perms.forEach(p => { try { permissions[p.module] = JSON.parse(p.permissions); } catch { permissions[p.module] = []; } });
      const users = await query('SELECT u.id, u.name, u.email, u.avatar FROM users u WHERE u.custom_role_id=? AND u.is_active=1', [id]);
      return res.json({ ...role, permissions, users });
    } catch(e) { return res.status(500).json({ error:e.message }); }
  }

  if (req.method === 'PUT') {
    const { name, description, color, icon, is_active, permissions={} } = req.body;
    try {
      const pool = getPool();
      const slug = name?.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      await pool.execute(
        'UPDATE custom_roles SET name=?, slug=?, description=?, color=?, icon=?, is_active=? WHERE id=?',
        [name, slug, description||'', color||'#6366f1', icon||'Shield', is_active?1:0, id]
      );
      // Replace all permissions
      await pool.execute('DELETE FROM role_permissions WHERE role_id=?', [id]);
      for (const [module, perms] of Object.entries(permissions)) {
        if (!Array.isArray(perms) || perms.length === 0) continue;
        await pool.execute(
          'INSERT INTO role_permissions (role_id, module, permissions) VALUES (?,?,?)',
          [id, module, JSON.stringify(perms)]
        );
      }
      return res.json({ message:'Updated' });
    } catch(e) { return res.status(500).json({ error:e.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const pool = getPool();
      // Unlink users
      await pool.execute('UPDATE users SET custom_role_id=NULL WHERE custom_role_id=?', [id]);
      await pool.execute('DELETE FROM role_permissions WHERE role_id=?', [id]);
      await pool.execute('DELETE FROM custom_roles WHERE id=?', [id]);
      return res.json({ message:'Deleted' });
    } catch(e) { return res.status(500).json({ error:e.message }); }
  }

  return res.status(405).json({ error:'Method not allowed' });
}
export default withAuth(handler, ['admin']);