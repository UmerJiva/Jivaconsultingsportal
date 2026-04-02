// pages/api/agent-employees/index.js
// GET  — agent lists their team
// POST — agent creates a team member with permissions

import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import bcrypt from 'bcryptjs';

const PERM_KEYS = [
  'can_view_students', 'can_add_students', 'can_edit_students', 'can_delete_students',
  'can_view_applications', 'can_add_applications', 'can_edit_applications', 'can_delete_applications',
  'can_view_documents', 'can_upload_documents', 'can_delete_documents',
  'can_view_universities', 'can_view_programs',
  'can_chat_agent', 'can_view_tasks', 'can_update_task_status',
];

async function handler(req, res) {
  const agentId = req.user.roleId ?? null;
  if (!agentId) return res.status(400).json({ error: 'Agent profile not found.' });

  // ── GET ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const employees = await query(`
        SELECT
          ae.id          AS emp_id,
          ae.phone,
          ae.designation,
          ae.is_active,
          ${PERM_KEYS.map(k => `ae.${k}`).join(',\n          ')},
          u.id           AS user_id,
          u.name,
          u.email,
          u.avatar
        FROM agent_employees ae
        JOIN users u ON u.id = ae.user_id
        WHERE ae.agent_id = ?
        ORDER BY ae.created_at DESC
      `, [agentId]);

      // Attach assigned students to each employee
      for (const emp of employees) {
        const assigned = await query(`
          SELECT s.id, u2.name
          FROM agent_employee_students aes
          JOIN students s  ON s.id  = aes.student_id
          JOIN users   u2  ON u2.id = s.user_id
          WHERE aes.agent_employee_id = ?
        `, [emp.emp_id]);
        emp.assigned_students = assigned;
      }

      return res.json({ employees });
    } catch (e) {
      console.error('[agent-employees GET]', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { name, email, password, phone, designation, ...rest } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });

    try {
      const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
      if (existing) return res.status(400).json({ error: 'Email already in use' });

      const hash = await bcrypt.hash(password, 10);

      const userResult = await query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hash, 'agent_employee']
      );
      const userId = userResult.insertId;

      // Build permission values (default false if not provided)
      const permValues = PERM_KEYS.map(k => (rest[k] ? 1 : 0));

      await query(`
        INSERT INTO agent_employees
          (user_id, agent_id, phone, designation, ${PERM_KEYS.join(', ')})
        VALUES (?, ?, ?, ?, ${PERM_KEYS.map(() => '?').join(', ')})
      `, [userId, agentId, phone || null, designation || null, ...permValues]);

      return res.status(201).json({ success: true });
    } catch (e) {
      console.error('[agent-employees POST]', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['agent']);