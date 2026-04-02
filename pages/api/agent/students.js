// pages/api/agent/students.js
// Returns all students belonging to the logged-in agent
// Used by the My Team page to populate the student assignment dropdown

import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  // JWT stores agent's agents.id as roleId
  const agentId = req.user.roleId ?? null;

  if (!agentId) {
    return res.status(400).json({ error: 'Agent profile not found.' });
  }

  try {
    const limit  = Math.min(500, parseInt(req.query.limit) || 200);
    const search = req.query.search || '';

    let where = 'WHERE s.agent_id = ?';
    const params = [agentId];

    if (search) {
      where += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like);
    }

    const students = await query(`
      SELECT
        s.id,
        s.gpa,
        s.ielts_score,
        u.name,
        u.email,
        u.avatar,
        COUNT(a.id) AS app_count
      FROM students s
      JOIN  users        u ON u.id = s.user_id
      LEFT JOIN applications a ON a.student_id = s.id
      ${where}
      GROUP BY s.id, s.gpa, s.ielts_score, u.name, u.email, u.avatar
      ORDER BY u.name ASC
      LIMIT ?
    `, [...params, limit]);

    return res.json({ students });
  } catch (e) {
    console.error('[agent/students GET]', e.message);
    return res.status(500).json({ error: e.message });
  }
}

export default withAuth(handler, ['agent']);