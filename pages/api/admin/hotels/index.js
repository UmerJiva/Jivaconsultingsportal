// pages/api/admin/hotels/index.js — Dormitory API
import { query, getPool } from '../../../../lib/db';
import { saveHotelRelated } from '../../../../lib/hotelHelpers';

export default async function handler(req, res) {

  // ── GET ───────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { status } = req.query;
      let sql = `
        SELECT h.*,
          (SELECT image_url FROM hotel_images WHERE hotel_id = h.id AND is_primary = 1 LIMIT 1) AS primary_image,
          (SELECT COUNT(*) FROM room_types WHERE hotel_id = h.id) AS room_count
        FROM hotels h
      `;
      const params = [];
      if (status) { sql += ` WHERE h.status = ?`; params.push(status); }
      sql += ` ORDER BY h.created_at DESC`;
      const hotels = await query(sql, params);
      return res.json({ hotels });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST ──────────────────────────────────────────────────
  if (req.method === 'POST') {
    const {
      name, slug, description, address, city, country,
      phone, email, website, status, is_featured, currency,
      images, amenities, rooms, highlights,
    } = req.body || {};

    if (!name || !city || !country) {
      return res.status(400).json({ error: 'Dormitory name, city and country are required.' });
    }

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const autoSlug = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const [result] = await conn.execute(
        `INSERT INTO hotels
          (name, slug, description, address, city, country,
           phone, email, website, status, is_featured, currency)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          name, slug || autoSlug,
          description || null, address || null, city, country,
          phone || null, email || null, website || null,
          status || 'active', is_featured ? 1 : 0,
          currency || 'PKR',
        ]
      );

      const hotelId = result.insertId;
      await saveHotelRelated(conn, hotelId, { images, amenities, rooms, highlights });

      await conn.commit();
      return res.status(201).json({ id: hotelId, success: true });
    } catch (err) {
      await conn.rollback();
      console.error('[hotels POST]', err.message);
      return res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}