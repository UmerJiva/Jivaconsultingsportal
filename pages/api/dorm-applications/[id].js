// pages/api/dorm-applications/[id].js
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;
  const { role, roleId } = req.user;

  if (req.method === 'GET') {
    const rows = await query(
      `SELECT da.*,
         h.name AS hotel_name, h.city, h.country, h.address, h.phone AS hotel_phone,
         h.email AS hotel_email, h.slug AS hotel_slug,
         rt.name AS room_name, rt.price_per_night AS room_price,
         rt.bed_type, rt.size_sqm,
         u.name AS student_name,
         u.email AS student_email,
         u.phone AS student_phone,
         s.id AS student_db_id
       FROM dorm_applications da
       JOIN hotels h ON h.id = da.hotel_id
       LEFT JOIN room_types rt ON rt.id = da.room_type_id
       JOIN students s ON s.id = da.student_id
       JOIN users u ON u.id = s.user_id
       WHERE da.id = ?`,
      [id]
    );
    const app = rows[0];
    if (!app) return res.status(404).json({ error: 'Application not found' });

    // Access control
    if (role === 'student' && app.student_id !== roleId) return res.status(403).json({ error: 'Forbidden' });
    if (role === 'agent'   && app.agent_id   !== roleId) return res.status(403).json({ error: 'Forbidden' });

    // Required documents for this dormitory
    const requiredDocs = await query(
      `SELECT * FROM dorm_required_documents WHERE hotel_id = ? ORDER BY sort_order`,
      [app.hotel_id]
    );

    // Uploaded documents
    const uploadedDocs = await query(
      `SELECT * FROM dorm_application_documents WHERE dorm_app_id = ? ORDER BY uploaded_at DESC`,
      [id]
    );

    return res.json({ ...app, required_docs: requiredDocs, uploaded_docs: uploadedDocs });
  }

  if (req.method === 'PATCH') {
    const ADMIN_FIELDS = ['status', 'admin_notes'];
    const ALL_FIELDS   = ['notes', 'move_in_date', 'duration', ...ADMIN_FIELDS];
    const updates = req.body || {};

    // Students/agents can only update their own notes
    const allowed = role === 'admin' || role === 'custom'
      ? ALL_FIELDS
      : ['notes', 'move_in_date', 'duration'];

    const safe = Object.keys(updates).filter(k => allowed.includes(k));
    if (!safe.length) return res.status(400).json({ error: 'No valid fields' });

    const set  = safe.map(k => `${k} = ?`).join(', ');
    const vals = [...safe.map(k => updates[k]), id];
    await query(`UPDATE dorm_applications SET ${set} WHERE id = ?`, vals);
    return res.json({ success: true });
  }

  if (req.method === 'DELETE') {
    if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    await query(`DELETE FROM dorm_applications WHERE id = ?`, [id]);
    return res.json({ success: true });
  }

  return res.status(405).end();
}

export default withAuth(handler, ['admin', 'agent', 'student', 'custom']);