// pages/api/dorm-applications/[id]/documents.js
import { query } from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;
  const { role, roleId } = req.user;

  // Verify access
  const rows = await query(`SELECT * FROM dorm_applications WHERE id = ?`, [id]);
  const app = rows[0];
  if (!app) return res.status(404).json({ error: 'Not found' });
  if (role === 'student' && app.student_id !== roleId) return res.status(403).json({ error: 'Forbidden' });
  if (role === 'agent'   && app.agent_id   !== roleId) return res.status(403).json({ error: 'Forbidden' });

  // POST — upload a document
  if (req.method === 'POST') {
    const { required_doc_id, file_name, file_data, file_url } = req.body || {};
    if (!file_name) return res.status(400).json({ error: 'file_name is required' });

    // Remove old upload for same required_doc_id if exists
    if (required_doc_id) {
      await query(
        `DELETE FROM dorm_application_documents WHERE dorm_app_id = ? AND required_doc_id = ?`,
        [id, required_doc_id]
      );
    }

    const result = await query(
      `INSERT INTO dorm_application_documents (dorm_app_id, required_doc_id, file_name, file_url, file_data, status)
       VALUES (?,?,?,?,?,'Pending')`,
      [id, required_doc_id || null, file_name, file_url || null, file_data || null]
    );

    return res.status(201).json({ id: result.insertId });
  }

  // PATCH — admin approves/rejects a document
  if (req.method === 'PATCH') {
    if (role !== 'admin' && role !== 'custom') return res.status(403).json({ error: 'Forbidden' });
    const { doc_id, status, admin_note } = req.body || {};
    await query(
      `UPDATE dorm_application_documents SET status = ?, admin_note = ? WHERE id = ? AND dorm_app_id = ?`,
      [status, admin_note || null, doc_id, id]
    );
    return res.json({ success: true });
  }

  return res.status(405).end();
}

export default withAuth(handler, ['admin', 'agent', 'student', 'custom']);