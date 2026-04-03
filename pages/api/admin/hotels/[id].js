// pages/api/admin/hotels/[id].js — GET, PUT, PATCH, DELETE
import db from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  // GET — full hotel detail for admin edit form
  if (req.method === 'GET') {
    const [[hotel]] = await db.query(`SELECT * FROM hotels WHERE id = ?`, [id]);
    if (!hotel) return res.status(404).json({ error: 'Not found' });

    const [images]     = await db.query(`SELECT * FROM hotel_images WHERE hotel_id = ? ORDER BY sort_order`, [id]);
    const [amenities]  = await db.query(`SELECT * FROM hotel_amenities WHERE hotel_id = ?`, [id]);
    const [highlights] = await db.query(`SELECT * FROM hotel_highlights WHERE hotel_id = ? ORDER BY sort_order`, [id]);
    const [rooms]      = await db.query(`SELECT * FROM room_types WHERE hotel_id = ? ORDER BY is_recommended DESC, price_per_night`, [id]);

    for (const room of rooms) {
      const [ra]   = await db.query(`SELECT name FROM room_amenities WHERE room_type_id = ?`, [room.id]);
      const [ri]   = await db.query(`SELECT name FROM room_inclusions WHERE room_type_id = ?`, [room.id]);
      const [rimg] = await db.query(`SELECT image_url FROM room_images WHERE room_type_id = ? ORDER BY sort_order LIMIT 1`, [room.id]);
      room.amenities = ra.map(r => r.name);
      room.inclusions = ri.map(r => r.name);
      room.image_url = rimg[0]?.image_url || '';
    }

    return res.json({ ...hotel, images, amenities, highlights, rooms });
  }

  // PUT — full update
  if (req.method === 'PUT') {
    const { name, slug, star_rating, description, address, city, country,
      latitude, longitude, phone, email, website,
      check_in_time, check_out_time, status, is_featured,
      review_score, review_count, review_label, currency,
      free_cancellation, no_prepayment,
      images, amenities, rooms, highlights } = req.body;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(`
        UPDATE hotels SET name=?,slug=?,star_rating=?,description=?,address=?,city=?,country=?,
          latitude=?,longitude=?,phone=?,email=?,website=?,check_in_time=?,check_out_time=?,
          status=?,is_featured=?,review_score=?,review_count=?,review_label=?,currency=?,
          free_cancellation=?,no_prepayment=?
        WHERE id=?`,
        [name,slug,star_rating||3,description||null,address||null,city,country,
         latitude||null,longitude||null,phone||null,email||null,website||null,
         check_in_time||'14:00',check_out_time||'11:00',
         status||'active',is_featured?1:0,
         review_score||0,review_count||0,review_label||null,currency||'PKR',
         free_cancellation?1:0,no_prepayment?1:0, id]
      );

      const { saveRelated } = require('./index');
      await saveRelated(conn, id, images, amenities, rooms, highlights);

      await conn.commit();
      res.json({ success: true });
    } catch (e) {
      await conn.rollback();
      res.status(500).json({ error: e.message });
    } finally { conn.release(); }
    return;
  }

  // PATCH — partial update (status toggle etc.)
  if (req.method === 'PATCH') {
    const updates = req.body;
    const keys = Object.keys(updates);
    if (!keys.length) return res.status(400).json({ error: 'No fields' });
    const set = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...Object.values(updates), id];
    await db.query(`UPDATE hotels SET ${set} WHERE id = ?`, vals);
    return res.json({ success: true });
  }

  // DELETE
  if (req.method === 'DELETE') {
    await db.query(`DELETE FROM hotels WHERE id = ?`, [id]);
    return res.json({ success: true });
  }

  res.status(405).end();
}