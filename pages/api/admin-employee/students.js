// pages/api/agent-employee/students.js
// Agent employee sees ONLY their assigned students

import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { empId, assignedStudentIds } = req.user;

  if (!assignedStudentIds || assignedStudentIds.length === 0)
    return res.json({ students: [] });

  if (req.method === 'GET') {
    const placeholders = assignedStudentIds.map(() => '?').join(',');
    const students = await query(`
      SELECT
        s.id,           s.gpa,        s.ielts_score,
        u.name,         u.email,      u.avatar,
        c.name          AS country_name,
        COUNT(a.id)     AS app_count,
        COUNT(CASE WHEN sd.status = 'Pending' THEN 1 END) AS docs_pending
      FROM students s
      JOIN users    u  ON u.id  = s.user_id
      LEFT JOIN countries c  ON c.id  = s.country_id
      LEFT JOIN applications a  ON a.student_id = s.id
      LEFT JOIN student_documents sd ON sd.student_id = s.id AND sd.status = 'Pending'
      WHERE s.id IN (${placeholders})
      GROUP BY s.id, s.gpa, s.ielts_score, u.name, u.email, u.avatar, c.name
      ORDER BY u.name
    `, assignedStudentIds);

    return res.json({ students });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['agent_employee']);