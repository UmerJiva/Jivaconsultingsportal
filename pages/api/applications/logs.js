// pages/api/applications/logs.js
import { query, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { application_id } = req.query;
  if (!application_id) return res.status(400).json({ error: 'application_id required' });

  if (req.method === 'GET') {
    try {
      const logs = await query(
        'SELECT * FROM application_logs WHERE application_id=? ORDER BY created_at ASC',
        [application_id]
      );
      return res.json({ logs });
    } catch(e) {
      console.error('[app logs]', e.message);
      return res.json({ logs: [] });
    }
  }

  // POST — add a log entry (internal use)
  if (req.method === 'POST') {
    const { action, description } = req.body;
    const { userId, name: userName, role } = req.user;
    try {
      const pool = getPool();
      await pool.execute(
        'INSERT INTO application_logs (application_id, action, description, performed_by, performed_by_name, role) VALUES (?,?,?,?,?,?)',
        [application_id, action, description||null, userId, userName||'User', role]
      );
      return res.status(201).json({ message: 'Logged' });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['admin', 'agent', 'student']);