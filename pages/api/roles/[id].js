// pages/api/roles/[id].js
import { queryOne, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import { savePermissions } from './index';

async function handler(req, res) {
  const { id } = req.query;

  const role = await queryOne('SELECT * FROM custom_roles WHERE id = ?', [id]);
  if (!role) return res.status(404).json({ error: 'Role not found' });

  // PUT — update role
  if (req.method === 'PUT') {
    const { name, description = '', color = '#6366f1', icon = 'Shield', permissions = {} } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Role name required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    try {
      const pool = getPool();
      await pool.execute(
        'UPDATE custom_roles SET name=?, slug=?, description=?, color=?, icon=? WHERE id=?',
        [name.trim(), slug, description, color, icon, id]
      );
      await savePermissions(pool, id, permissions);
      return res.json({ success: true });
    } catch (e) {
      console.error('[roles PUT]', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE — remove role (deactivates users assigned to it)
  if (req.method === 'DELETE') {
    try {
      const pool = getPool();
      // Deactivate users with this role
      await pool.execute(
        "UPDATE users SET is_active = 0 WHERE custom_role_id = ? AND role = 'custom'",
        [id]
      );
      await pool.execute('DELETE FROM role_permissions WHERE role_id = ?', [id]);
      await pool.execute('DELETE FROM custom_roles WHERE id = ?', [id]);
      return res.json({ success: true });
    } catch (e) {
      console.error('[roles DELETE]', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['admin']);