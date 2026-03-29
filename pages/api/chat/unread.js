// pages/api/chat/unread.js — Get unread message count
import { queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { role, roleId } = req.user;
  try {
    if (role === 'agent') {
      const row = await queryOne(
        "SELECT COUNT(*) AS cnt FROM chat_messages WHERE agent_id=? AND sender_role='admin' AND is_read=0",
        [roleId]
      );
      return res.json({ unread: row?.cnt || 0 });
    }
    if (role === 'admin') {
      const row = await queryOne(
        "SELECT COUNT(*) AS cnt FROM chat_messages WHERE sender_role='agent' AND is_read=0"
      );
      return res.json({ unread: row?.cnt || 0 });
    }
    return res.json({ unread: 0 });
  } catch(err) {
    return res.json({ unread: 0 });
  }
}

export default withAuth(handler, ['admin', 'agent']);