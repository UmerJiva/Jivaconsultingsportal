
// Save as: pages/api/admin-employee/tasks/[id].js
// PATCH — update task status (agent can also update, admin_employee too)
// DELETE — cancel a task
// ================================================================

import { query, queryOne } from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';

async function taskHandler(req, res) {
  const { id } = req.query;
  const { assignedAgentId, id: userId, role } = req.user;

  const task = await queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
  if (!task) return res.status(404).json({ error: 'Not found' });

  // Security: admin_employee can only modify tasks for their agent
  if (role === 'admin_employee' && task.assigned_to_agent_id !== assignedAgentId)
    return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'PATCH') {
    const { status, title, description, due_date, priority } = req.body;
    await query(`
      UPDATE tasks SET
        status      = COALESCE(?, status),
        title       = COALESCE(?, title),
        description = COALESCE(?, description),
        due_date    = COALESCE(?, due_date),
        priority    = COALESCE(?, priority)
      WHERE id = ?
    `, [status || null, title || null, description || null, due_date || null, priority || null, id]);
    return res.json({ success: true });
  }

  if (req.method === 'DELETE') {
    await query("UPDATE tasks SET status = 'Cancelled' WHERE id = ?", [id]);
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(taskHandler, ['admin_employee', 'agent']);
