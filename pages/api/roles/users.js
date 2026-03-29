// pages/api/roles/users.js
import { query, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import bcrypt from 'bcryptjs';

async function handler(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error:'Admin only' });

  if (req.method === 'GET') {
    const { role_id='', search='', page='1', limit='20' } = req.query;
    const lim = Math.min(100, parseInt(limit)||20);
    const off = (Math.max(1,parseInt(page))-1)*lim;
    let where = "WHERE (u.role='custom' OR u.custom_role_id IS NOT NULL)";
    const params = [];
    if (role_id) { where += ' AND u.custom_role_id=?'; params.push(role_id); }
    if (search)  { where += ' AND (u.name LIKE ? OR u.email LIKE ?)'; const l=`%${search}%`; params.push(l,l); }
    try {
      const users = await query(`
        SELECT u.id, u.name, u.email, u.avatar, u.phone, u.role, u.custom_role_id, u.is_active, u.created_at,
               r.name AS role_name, r.color AS role_color, r.icon AS role_icon, r.slug AS role_slug
        FROM users u LEFT JOIN custom_roles r ON r.id = u.custom_role_id
        ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?
      `, [...params, lim, off]);
      const cntRows = await query(`SELECT COUNT(*) AS c FROM users u ${where}`, params);
      return res.json({ users, total:cntRows[0]?.c||0, pages:Math.ceil((cntRows[0]?.c||0)/lim)||1 });
    } catch(e) {
      console.error('[role users GET]', e.message);
      return res.json({ users:[], total:0, pages:1 });
    }
  }

  if (req.method === 'POST') {
    const { name, email, password='User@123', phone, custom_role_id, is_active=1 } = req.body;
    if (!name || !email) return res.status(400).json({ error:'Name and email required' });
    try {
      const pool = getPool();
      const hash = await bcrypt.hash(password, 10);
      const [ins] = await pool.execute(
        'INSERT INTO users (name, email, password, role, custom_role_id, phone, is_active) VALUES (?,?,?,?,?,?,?)',
        [name, email.toLowerCase().trim(), hash, 'custom', custom_role_id||null, phone||null, is_active?1:0]
      );
      return res.status(201).json({ message:'User created', id:ins.insertId });
    } catch(e) {
      if (e.code==='ER_DUP_ENTRY') return res.status(409).json({ error:'Email already exists' });
      return res.status(500).json({ error:e.message });
    }
  }
  return res.status(405).json({ error:'Method not allowed' });
}
export default withAuth(handler, ['admin']);