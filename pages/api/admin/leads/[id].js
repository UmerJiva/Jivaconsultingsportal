// pages/api/admin/leads/[id].js
import { query } from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PATCH') {
    const ALLOWED = ['status', 'assigned_to', 'notes'];
    const updates = req.body || {};
    const safe = Object.keys(updates).filter(k => ALLOWED.includes(k));
    if (!safe.length) return res.status(400).json({ error: 'No valid fields' });

    const set  = safe.map(k => `${k} = ?`).join(', ');
    const vals = [...safe.map(k => updates[k]), id];
    await query(`UPDATE leads SET ${set} WHERE id = ?`, vals);
    return res.json({ success: true });
  }

  if (req.method === 'DELETE') {
    await query(`DELETE FROM leads WHERE id = ?`, [id]);
    return res.json({ success: true });
  }

  return res.status(405).end();
}

export default withAuth(handler, ['admin', 'custom']);