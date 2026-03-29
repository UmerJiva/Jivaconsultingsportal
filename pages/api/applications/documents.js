// pages/api/applications/documents.js — Upload & manage application documents
import { query, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { application_id } = req.query;
  const { role, userId, name: userName } = req.user;
  if (!application_id) return res.status(400).json({ error: 'application_id required' });

  // GET — fetch all docs for this application
  if (req.method === 'GET') {
    try {
      const docs = await query(`
        SELECT ad.*, u.name AS uploaded_by_name, ru.name AS reviewed_by_name,
               pd.name AS program_doc_name, pd.required AS is_required, pd.description AS doc_description
        FROM application_documents ad
        LEFT JOIN users u  ON u.id  = ad.uploaded_by
        LEFT JOIN users ru ON ru.id = ad.reviewed_by
        LEFT JOIN program_documents pd ON pd.id = ad.program_doc_id
        WHERE ad.application_id = ?
        ORDER BY ad.uploaded_at DESC
      `, [application_id]);
      return res.json({ documents: docs });
    } catch(e) {
      console.error('[app docs GET]', e.message);
      return res.json({ documents: [] });
    }
  }

  // POST — upload a new document
  if (req.method === 'POST') {
    const { program_doc_id, doc_name, file_name, file_url, file_size, doc_type } = req.body;
    if (!doc_name || !file_url) return res.status(400).json({ error: 'doc_name and file_url required' });

    try {
      const pool = getPool();
      const [ins] = await pool.execute(`
        INSERT INTO application_documents
          (application_id, program_doc_id, doc_name, doc_type, file_name, file_url, file_size, status, uploaded_by)
        VALUES (?,?,?,?,?,?,?,?,?)
      `, [application_id, program_doc_id||null, doc_name, doc_type||null, file_name||null, file_url, file_size||null, 'in_review', userId]);

      // Log it
      await pool.execute(`
        INSERT INTO application_logs (application_id, action, description, performed_by, performed_by_name, role)
        VALUES (?,?,?,?,?,?)
      `, [application_id, 'Document Uploaded', `"${doc_name}" was uploaded and sent for review`, userId, userName||'User', role]);

      return res.status(201).json({ message: 'Document uploaded', id: ins.insertId });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // PUT — update document status (admin only)
  if (req.method === 'PUT') {
    if (!['admin','custom'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { doc_id, status, notes } = req.body;
    try {
      const pool = getPool();
      await pool.execute(
        'UPDATE application_documents SET status=?, notes=?, reviewed_by=?, reviewed_at=NOW() WHERE id=? AND application_id=?',
        [status, notes||null, userId, doc_id, application_id]
      );
      await pool.execute(`
        INSERT INTO application_logs (application_id, action, description, performed_by, performed_by_name, role)
        VALUES (?,?,?,?,?,?)
      `, [application_id, 'Document Status Updated', `Document status changed to "${status}"`, userId, userName||'Admin', role]);
      return res.json({ message: 'Updated' });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['admin', 'agent', 'student']);