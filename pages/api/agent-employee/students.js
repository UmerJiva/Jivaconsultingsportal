// pages/api/agent-employee/students.js
// Agent employee sees ONLY their assigned students

import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  // Your JWT stores agent_employees.id as roleId
  const empId = req.user.roleId ?? null;

  if (!empId) {
    return res.status(400).json({ error: 'Employee profile not found.' });
  }

  try {
    // Step 1: get assigned student IDs from DB
    const assigned = await query(
      'SELECT student_id FROM agent_employee_students WHERE agent_employee_id = ?',
      [empId]
    );

    if (assigned.length === 0) {
      return res.json({ students: [] });
    }

    const studentIds = assigned.map(r => r.student_id);
    const placeholders = studentIds.map(() => '?').join(',');

    // Step 2: fetch full student details
    // Note: student_documents uses `verified` column, not `status`
    const students = await query(`
      SELECT
        s.id,
        s.gpa,
        s.ielts_score,
        u.name,
        u.email,
        u.avatar,
        c.name                                                         AS country_name,
        COUNT(DISTINCT a.id)                                           AS app_count,
        COUNT(DISTINCT CASE WHEN sd.verified = 0 THEN sd.id END)      AS docs_pending
      FROM students s
      JOIN  users         u  ON u.id  = s.user_id
      LEFT JOIN countries c  ON c.id  = s.country_id
      LEFT JOIN applications      a  ON a.student_id  = s.id
      LEFT JOIN student_documents sd ON sd.student_id = s.id
      WHERE s.id IN (${placeholders})
      GROUP BY s.id, s.gpa, s.ielts_score, u.name, u.email, u.avatar, c.name
      ORDER BY u.name ASC
    `, studentIds);

    return res.json({ students });
  } catch (e) {
    console.error('[agent-employee/students GET]', e.message);
    return res.status(500).json({ error: e.message });
  }
}

export default withAuth(handler, ['agent_employee']);