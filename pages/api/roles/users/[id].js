// pages/api/roles/users/[id].js
import { getPool } from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';
import bcrypt from 'bcryptjs';

async function handler(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error:'Admin only' });
  const { id } = req.query;
  const pool = getPool();

  if (req.method === 'PUT') {
    const { name, email, phone, custom_role_id, is_active, password } = req.body;
    try {
      if (password?.trim()) {
        const hash = await bcrypt.hash(password, 10);
        await pool.execute('UPDATE users SET name=?,email=?,phone=?,custom_role_id=?,is_active=?,password=? WHERE id=?',
          [name, email, phone||null, custom_role_id||null, is_active?1:0, hash, id]);
      } else {
        await pool.execute('UPDATE users SET name=?,email=?,phone=?,custom_role_id=?,is_active=? WHERE id=?',
          [name, email, phone||null, custom_role_id||null, is_active?1:0, id]);
      }
      return res.json({ message:'Updated' });
    } catch(e) { return res.status(500).json({ error:e.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      await pool.execute('UPDATE users SET is_active=0 WHERE id=?', [id]);
      return res.json({ message:'Deactivated' });
    } catch(e) { return res.status(500).json({ error:e.message }); }
  }
  return res.status(405).json({ error:'Method not allowed' });
}
export default withAuth(handler, ['admin']);