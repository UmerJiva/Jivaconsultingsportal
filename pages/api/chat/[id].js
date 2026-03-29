// pages/api/chat/[id].js — Live chat between agent and admin
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { id: agentId } = req.query;
  const { role, userId, roleId } = req.user;

  // Agent can only access their own chat channel
  if (role === 'agent' && String(roleId) !== String(agentId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      const messages = await query(`
        SELECT cm.*, u.name AS sender_name, u.avatar AS sender_avatar
        FROM chat_messages cm
        JOIN users u ON u.id = cm.sender_id
        WHERE cm.agent_id = ?
        ORDER BY cm.created_at ASC
        LIMIT 200
      `, [agentId]);

      // Mark incoming messages as read
      if (role === 'admin') {
        await query(
          "UPDATE chat_messages SET is_read=1 WHERE agent_id=? AND sender_role='agent' AND is_read=0",
          [agentId]
        );
      } else {
        await query(
          "UPDATE chat_messages SET is_read=1 WHERE agent_id=? AND sender_role='admin' AND is_read=0",
          [agentId]
        );
      }

      return res.json({ messages });
    } catch (err) {
      console.error('[chat GET]', err.message);
      return res.json({ messages: [] });
    }
  }

  if (req.method === 'POST') {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message required' });
    }

    try {
      await query(
        'INSERT INTO chat_messages (agent_id, sender_id, sender_role, message) VALUES (?, ?, ?, ?)',
        [agentId, userId, role, message.trim()]
      );
      return res.json({ message: 'Sent' });
    } catch (err) {
      console.error('[chat POST]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['admin', 'agent']);