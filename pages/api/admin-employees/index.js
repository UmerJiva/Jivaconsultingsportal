// ================================================================
// pages/api/admin-employees/index.js
// GET  — list all admin employees (admin only)
// POST — create admin employee (admin only)
// ================================================================

import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth-server';
import bcrypt from 'bcryptjs';

async function handler(req, res) {
  if (req.method === 'GET') {
    const rows = await query(`
      SELECT
        ae.id              AS emp_id,
        ae.assigned_agent_id,
        ae.designation,    ae.phone,
        ae.can_add_universities, ae.can_add_programs,
        ae.can_manage_applications, ae.can_assign_tasks, ae.can_chat_agent,
        ae.is_active,
        u.id               AS user_id,
        u.name,            u.email,    u.avatar,
        u2.name            AS agent_name
      FROM admin_employees ae
      JOIN  users  u  ON u.id  = ae.user_id
      LEFT JOIN agents a   ON a.id  = ae.assigned_agent_id
      LEFT JOIN users  u2  ON u2.id = a.user_id
      ORDER BY ae.created_at DESC
    `);
    return res.json({ employees: rows });
  }

  if (req.method === 'POST') {
    const { name, email, password, phone, designation,
            assigned_agent_id,
            can_add_universities, can_add_programs,
            can_manage_applications, can_assign_tasks, can_chat_agent } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password required' });

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, 'admin_employee']
    );
    const userId = userResult.insertId;

    // Create admin_employee record
    await query(`
      INSERT INTO admin_employees
        (user_id, assigned_agent_id, phone, designation,
         can_add_universities, can_add_programs, can_manage_applications,
         can_assign_tasks, can_chat_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      assigned_agent_id || null,
      phone || null,
      designation || null,
      can_add_universities ? 1 : 0,
      can_add_programs     ? 1 : 0,
      can_manage_applications !== false ? 1 : 0,
      can_assign_tasks        !== false ? 1 : 0,
      can_chat_agent          !== false ? 1 : 0,
    ]);

    return res.status(201).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['admin']);


