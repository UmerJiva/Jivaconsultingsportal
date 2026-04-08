// pages/api/admin/hotels/[id]/required-docs.js
// Admin sets which documents are required for applying to this dormitory
import { query, getPool } from '../../../../../lib/db';
import { withAuth } from '../../../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const docs = await query(
      `SELECT * FROM dorm_required_documents WHERE hotel_id = ? ORDER BY sort_order, id`,
      [id]
    );
    return res.json({ docs });
  }

  if (req.method === 'POST') {
    const { name, description, is_required = 1, sort_order = 0 } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Document name required' });
    const result = await query(
      `INSERT INTO dorm_required_documents (hotel_id, name, description, is_required, sort_order) VALUES (?,?,?,?,?)`,
      [id, name.trim(), description || null, is_required ? 1 : 0, sort_order]
    );
    return res.status(201).json({ id: result.insertId });
  }

  if (req.method === 'PUT') {
    // Bulk replace all docs
    const { docs } = req.body || {};
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(`DELETE FROM dorm_required_documents WHERE hotel_id = ?`, [id]);
      for (let i = 0; i < (docs || []).length; i++) {
        const d = docs[i];
        if (!d.name?.trim()) continue;
        await conn.execute(
          `INSERT INTO dorm_required_documents (hotel_id, name, description, is_required, sort_order) VALUES (?,?,?,?,?)`,
          [id, d.name.trim(), d.description || null, d.is_required ? 1 : 0, i]
        );
      }
      await conn.commit();
      return res.json({ success: true });
    } catch (err) {
      await conn.rollback();
      return res.status(500).json({ error: err.message });
    } finally { conn.release(); }
  }

  if (req.method === 'DELETE') {
    const { doc_id } = req.query;
    await query(`DELETE FROM dorm_required_documents WHERE id = ? AND hotel_id = ?`, [doc_id, id]);
    return res.json({ success: true });
  }

  return res.status(405).end();
}

export default withAuth(handler, ['admin', 'custom']);