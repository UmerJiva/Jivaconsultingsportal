// pages/api/agent-employees/[id]/students.js
// PUT — replace all student assignments for an agent employee

import { query, queryOne } from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'PUT')
    return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;

  // JWT stores agent's agents.id as roleId
  const agentId = req.user.roleId ?? null;

  if (!agentId) {
    return res.status(400).json({ error: 'Agent profile not found.' });
  }

  try {
    // Make sure this employee belongs to this agent
    const emp = await queryOne(
      'SELECT id FROM agent_employees WHERE id = ? AND agent_id = ?',
      [id, agentId]
    );

    if (!emp) {
      return res.status(404).json({ error: 'Employee not found or does not belong to you.' });
    }

    const { student_ids = [] } = req.body;

    // Delete existing assignments for this employee
    await query(
      'DELETE FROM agent_employee_students WHERE agent_employee_id = ?',
      [id]
    );

    // Insert new assignments
    if (student_ids.length > 0) {
      for (const studentId of student_ids) {
        await query(
          'INSERT IGNORE INTO agent_employee_students (agent_employee_id, student_id) VALUES (?, ?)',
          [id, studentId]
        );
      }
    }

    return res.json({ success: true, assigned: student_ids.length });
  } catch (e) {
    console.error('[agent-employees/students PUT]', e.message);
    return res.status(500).json({ error: e.message });
  }
}

export default withAuth(handler, ['agent']);