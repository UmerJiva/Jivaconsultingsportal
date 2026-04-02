// pages/api/agent-employee/applications.js
// Returns applications only for students assigned to this agent employee

import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const empId = req.user.roleId ?? null;
  if (!empId) return res.status(400).json({ error: 'Employee profile not found' });

  try {
    // Get assigned student IDs for this employee
    const assigned = await query(
      'SELECT student_id FROM agent_employee_students WHERE agent_employee_id = ?',
      [empId]
    );

    if (assigned.length === 0) return res.json({ applications: [] });

    const studentIds = assigned.map(r => r.student_id);
    const placeholders = studentIds.map(() => '?').join(',');
    const limit = Math.min(200, parseInt(req.query.limit) || 50);

    const applications = await query(`
      SELECT
        a.id,
        a.status,
        a.created_at,
        a.intake,
        u.name        AS student_name,
        p.name        AS program_name,
        uni.name      AS university_name
      FROM applications a
      JOIN students  s   ON s.id   = a.student_id
      JOIN users     u   ON u.id   = s.user_id
      LEFT JOIN programs    p   ON p.id   = a.program_id
      LEFT JOIN universities uni ON uni.id = p.university_id
      WHERE a.student_id IN (${placeholders})
      ORDER BY a.created_at DESC
      LIMIT ?
    `, [...studentIds, limit]);

    return res.json({ applications });
  } catch (e) {
    console.error('[agent-employee/applications]', e.message);
    return res.status(500).json({ error: e.message });
  }
}

export default withAuth(handler, ['agent_employee']);