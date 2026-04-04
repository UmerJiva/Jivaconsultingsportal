// pages/api/admin-employee/tasks.js
// Admin employee creates/manages tasks for their assigned agent
// GET  — list tasks for assigned agent
// POST — create task for assigned agent

import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { assignedAgentId, id: userId } = req.user;
  if (!assignedAgentId)
    return res.status(400).json({ error: 'No agent assigned' });

  if (req.method === 'GET') {
    const tasks = await query(`
      SELECT t.*, u.name AS created_by_name
      FROM tasks t
      JOIN users u ON u.id = t.created_by_user_id
      WHERE t.assigned_to_agent_id = ?
      ORDER BY
        FIELD(t.priority,'Urgent','High','Medium','Low'),
        FIELD(t.status,'Pending','In Progress','Done','Cancelled'),
        t.created_at DESC
    `, [assignedAgentId]);
    return res.json({ tasks });
  }

  if (req.method === 'POST') {
    const { title, description, due_date, priority = 'Medium' } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const result = await query(`
      INSERT INTO tasks (created_by_user_id, assigned_to_agent_id, title, description, due_date, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, assignedAgentId, title, description || null, due_date || null, priority]);

    return res.status(201).json({ success: true, taskId: result.insertId });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['admin_employee']);


