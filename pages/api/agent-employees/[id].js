// pages/api/agent-employees/[id].js
// PUT   — update employee info + permissions
// PATCH — toggle is_active

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
  const { id } = req.query;
  const agentId = req.user.roleId ?? null;

  const emp = await queryOne(
    'SELECT * FROM agent_employees WHERE id = ? AND agent_id = ?',
    [id, agentId]
  );
  if (!emp) return res.status(404).json({ error: 'Not found' });

  if (req.method === 'PUT') {
    const { name, email, password, phone, designation, ...rest } = req.body;
    try {
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        await query('UPDATE users SET name=?, email=?, password=? WHERE id=?',
          [name, email, hash, emp.user_id]);
      } else {
        await query('UPDATE users SET name=?, email=? WHERE id=?',
          [name, email, emp.user_id]);
      }
      const permValues    = PERM_KEYS.map(k => (rest[k] ? 1 : 0));
      const permSetClause = PERM_KEYS.map(k => `${k}=?`).join(', ');
      await query(
        `UPDATE agent_employees SET phone=?, designation=?, ${permSetClause} WHERE id=?`,
        [phone || null, designation || null, ...permValues, id]
      );
      return res.json({ success: true });
    } catch (e) {
      console.error('[agent-employees PUT]', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'PATCH') {
    const { is_active } = req.body;
    await query('UPDATE agent_employees SET is_active=? WHERE id=?', [is_active, id]);
    await query('UPDATE users SET is_active=? WHERE id=?', [is_active, emp.user_id]);
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['agent']);