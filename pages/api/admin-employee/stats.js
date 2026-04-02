// pages/api/admin-employee/stats.js
// Returns stats scoped to the admin employee's assigned agent

import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { assignedAgentId } = req.user;
  if (!assignedAgentId)
    return res.json({ stats: { totalStudents: 0, totalApps: 0, openTasks: 0, pendingReviews: 0 } });

  const [stuRow, appRow, taskRow, reviewRow] = await Promise.all([
    queryOne('SELECT COUNT(*) AS c FROM students WHERE agent_id = ?', [assignedAgentId]),
    queryOne(`SELECT COUNT(*) AS c FROM applications a
              JOIN students s ON s.id = a.student_id WHERE s.agent_id = ?`, [assignedAgentId]),
    queryOne(`SELECT COUNT(*) AS c FROM tasks
              WHERE assigned_to_agent_id = ? AND status IN ('Pending','In Progress')`, [assignedAgentId]),
    queryOne(`SELECT COUNT(*) AS c FROM applications a
              JOIN students s ON s.id = a.student_id
              WHERE s.agent_id = ? AND a.status = 'Under Review'`, [assignedAgentId]),
  ]);

  return res.json({
    stats: {
      totalStudents:  stuRow?.c    || 0,
      totalApps:      appRow?.c    || 0,
      openTasks:      taskRow?.c   || 0,
      pendingReviews: reviewRow?.c || 0,
    }
  });
}

export default withAuth(handler, ['admin_employee']);