// pages/api/admin/hotels/[id].js — Dormitory API
import { query, getPool } from '../../../../lib/db';
import { saveHotelRelated } from '../../../../lib/hotelHelpers';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // ── GET ───────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const rows = await query(`SELECT * FROM hotels WHERE id = ?`, [id]);
      const hotel = rows[0];
      if (!hotel) return res.status(404).json({ error: 'Dormitory not found' });

      const images     = await query(`SELECT * FROM hotel_images WHERE hotel_id = ? ORDER BY sort_order`, [id]);
      const amenities  = await query(`SELECT * FROM hotel_amenities WHERE hotel_id = ?`, [id]);
      const highlights = await query(`SELECT * FROM hotel_highlights WHERE hotel_id = ? ORDER BY sort_order`, [id]);
      const rooms      = await query(
        `SELECT * FROM room_types WHERE hotel_id = ? ORDER BY is_recommended DESC, price_per_night ASC`, [id]
      );

      for (const room of rooms) {
        const ra   = await query(`SELECT name FROM room_amenities WHERE room_type_id = ?`, [room.id]);
        const ri   = await query(`SELECT name FROM room_inclusions WHERE room_type_id = ?`, [room.id]);
        const rimg = await query(`SELECT image_url FROM room_images WHERE room_type_id = ? LIMIT 1`, [room.id]);
        room.amenities  = ra.map(r => r.name);
        room.inclusions = ri.map(r => r.name);
        room.image_url  = rimg[0]?.image_url || '';
      }

      return res.json({ ...hotel, images, amenities, highlights, rooms });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PUT ───────────────────────────────────────────────────
  if (req.method === 'PUT') {
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

      await conn.execute(
        `UPDATE hotels SET
          name=?, slug=?, description=?, address=?, city=?, country=?,
          phone=?, email=?, website=?, status=?, is_featured=?, currency=?
         WHERE id=?`,
        [
          name, slug || autoSlug,
          description || null, address || null, city, country,
          phone || null, email || null, website || null,
          status || 'active', is_featured ? 1 : 0,
          currency || 'PKR',
          id,
        ]
      );

      await saveHotelRelated(conn, id, { images, amenities, rooms, highlights });

      await conn.commit();
      return res.json({ success: true });
    } catch (err) {
      await conn.rollback();
      console.error('[hotel PUT]', err.message);
      return res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  }

  // ── PATCH — status toggle ─────────────────────────────────
  if (req.method === 'PATCH') {
    const ALLOWED = ['status', 'is_featured'];
    const updates = req.body || {};
    const safe    = Object.keys(updates).filter(k => ALLOWED.includes(k));
    if (!safe.length) return res.status(400).json({ error: 'No valid fields to update' });
    try {
      const set  = safe.map(k => `${k} = ?`).join(', ');
      const vals = [...safe.map(k => updates[k]), id];
      await query(`UPDATE hotels SET ${set} WHERE id = ?`, vals);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE ────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      await query(`DELETE FROM hotels WHERE id = ?`, [id]);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}