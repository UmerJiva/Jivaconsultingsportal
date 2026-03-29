// pages/api/agents/index.js
import bcrypt from 'bcryptjs';
import { withAuth } from '../../../lib/auth';
import { paginate, searchLike } from '../../../lib/apiHelper';
// import { DEV_AGENTS } from '../../../lib/devData';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { search = '', status = '' } = req.query;
    const { limit, offset } = paginate(req);
    try {
      const { query } = await import('../../../lib/db');
      let where = 'WHERE 1=1';
      const params = [];
      if (search) { where += ' AND (u.name LIKE ? OR u.email LIKE ? OR ag.city LIKE ?)'; const l = searchLike(search); params.push(l, l, l); }
      if (status) { where += ' AND ag.status = ?'; params.push(status); }
      const agents = await query(`
        SELECT ag.id, ag.city, ag.phone, ag.status, ag.commission_total, ag.joined_at, ag.country_id,
               u.name, u.email, u.avatar, c.name AS country, c.flag,
               COUNT(DISTINCT s.id) AS total_students,
               SUM(s.status = 'Active') AS active_students
        FROM agents ag JOIN users u ON u.id = ag.user_id
        LEFT JOIN countries c ON c.id = ag.country_id
        LEFT JOIN students s ON s.agent_id = ag.id
        ${where} GROUP BY ag.id ORDER BY total_students DESC LIMIT ? OFFSET ?
      `, [...params, limit, offset]);
      const [{ cnt }] = await query(`SELECT COUNT(*) AS cnt FROM agents ag JOIN users u ON u.id=ag.user_id ${where}`, params);
      return res.json({ agents, total: cnt });
    } catch (err) {
      let data = [...DEV_AGENTS];
      if (search) { const q = search.toLowerCase(); data = data.filter(a => a.name.toLowerCase().includes(q)); }
      if (status) data = data.filter(a => a.status === status);
      return res.json({ agents: data.slice(offset, offset + limit), total: data.length });
    }
  }

  if (req.method === 'POST') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const { queryOne, getPool } = await import('../../../lib/db');
      const { name, email, password = 'Agent@123', phone, city, country_id, status = 'Active', joined_at } = req.body;
      if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
      const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
      if (existing) return res.status(409).json({ error: 'Email already registered' });
      const hash = await bcrypt.hash(password, 10);
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const conn = await getPool().getConnection();
      try {
        await conn.beginTransaction();
        const [userRes] = await conn.execute('INSERT INTO users (name, email, password, role, avatar) VALUES (?,?,?,?,?)', [name, email, hash, 'agent', initials]);
        const [agentRes] = await conn.execute('INSERT INTO agents (user_id, city, country_id, phone, status, joined_at) VALUES (?,?,?,?,?,?)', [userRes.insertId, city||null, country_id||null, phone||null, status, joined_at||null]);
        await conn.commit();
        return res.status(201).json({ message: 'Agent created', id: agentRes.insertId });
      } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    } catch (err) {
      return res.status(503).json({ error: 'Database not connected.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['admin']);