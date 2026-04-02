// ================================================================
// Save as: pages/api/admin-employees/[id].js
// PUT   — update admin employee
// PATCH — toggle is_active
// ================================================================

import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import bcrypt from 'bcryptjs';

async function handler(req, res) {
  const { id } = req.query;

  const emp = await queryOne('SELECT * FROM admin_employees WHERE id = ?', [id]);
  if (!emp) return res.status(404).json({ error: 'Not found' });

  if (req.method === 'PUT') {
    const { name, email, password, phone, designation, assigned_agent_id,
            can_add_universities, can_add_programs,
            can_manage_applications, can_assign_tasks, can_chat_agent } = req.body;

    // Update user
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await query('UPDATE users SET name=?, email=?, password=? WHERE id=?',
        [name, email, hash, emp.user_id]);
    } else {
      await query('UPDATE users SET name=?, email=? WHERE id=?',
        [name, email, emp.user_id]);
    }

    // Update emp record
    await query(`
      UPDATE admin_employees SET
        assigned_agent_id=?, phone=?, designation=?,
        can_add_universities=?, can_add_programs=?,
        can_manage_applications=?, can_assign_tasks=?, can_chat_agent=?
      WHERE id=?
    `, [
      assigned_agent_id || null, phone || null, designation || null,
      can_add_universities ? 1 : 0, can_add_programs ? 1 : 0,
      can_manage_applications ? 1 : 0, can_assign_tasks ? 1 : 0, can_chat_agent ? 1 : 0,
      id,
    ]);
    return res.json({ success: true });
  }

  if (req.method === 'PATCH') {
    const { is_active } = req.body;
    await query('UPDATE admin_employees SET is_active=? WHERE id=?', [is_active, id]);
    await query('UPDATE users SET is_active=? WHERE id=?', [is_active, emp.user_id]);
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['admin']);
