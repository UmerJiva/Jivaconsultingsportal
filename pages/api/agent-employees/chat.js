// pages/api/agent-employee/chat.js
// Chat between agent_employee and their agent
// Reuses the same chat_messages table with agent_id as the channel

import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const empId = req.user.roleId ?? null;
  if (!empId) return res.status(400).json({ error: 'Employee profile not found' });

  // Get this employee's agent_id to use as the chat channel
  const emp = await queryOne(
    'SELECT agent_id FROM agent_employees WHERE id = ?', [empId]
  );
  if (!emp) return res.status(404).json({ error: 'Employee record not found' });

  const agentId = emp.agent_id;

  // GET — fetch messages
  if (req.method === 'GET') {
    try {
      const messages = await query(`
        SELECT
          cm.*,
          u.name AS sender_name
        FROM chat_messages cm
        JOIN users u ON u.id = cm.sender_id
        WHERE cm.agent_id = ?
          AND cm.sender_role IN ('agent', 'agent_employee')
        ORDER BY cm.created_at ASC
        LIMIT 200
      `, [agentId]);

      // Mark agent's messages as read
      await query(`
        UPDATE chat_messages
        SET is_read = 1
        WHERE agent_id = ? AND sender_role = 'agent' AND is_read = 0
      `, [agentId]);

      return res.json({ messages });
    } catch (e) {
      console.error('[agent-employee/chat GET]', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — send a message
  if (req.method === 'POST') {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

    try {
      await query(`
        INSERT INTO chat_messages (agent_id, sender_id, sender_role, message)
        VALUES (?, ?, 'agent_employee', ?)
      `, [agentId, req.user.userId, message.trim()]);

      return res.status(201).json({ success: true });
    } catch (e) {
      console.error('[agent-employee/chat POST]', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['agent_employee']);