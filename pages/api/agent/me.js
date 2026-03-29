// pages/api/agent/me.js — Returns the current agent's own agent ID
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { roleId, role } = req.user;
  if (role !== 'agent') return res.status(403).json({ error: 'Agents only' });
  return res.json({ agent_id: roleId });
}
export default withAuth(handler, ['agent']);