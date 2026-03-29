// pages/api/auth/me.js
import { getTokenFromRequest, verifyToken } from '../../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  return res.status(200).json({ user });
}
