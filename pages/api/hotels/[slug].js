// pages/api/hotels/[slug].js
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { slug } = req.query;

  try {
    // Hotel
    const rows = await query(
      `SELECT * FROM hotels WHERE slug = ? AND status = 'active'`,
      [slug]
    );
    const hotel = rows[0];
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });

    // Images
    const images = await query(
      `SELECT * FROM hotel_images WHERE hotel_id = ? ORDER BY sort_order`,
      [hotel.id]
    );

    // Amenities
    const amenities = await query(
      `SELECT * FROM hotel_amenities WHERE hotel_id = ?`,
      [hotel.id]
    );

    // Highlights
    const highlights = await query(
      `SELECT * FROM hotel_highlights WHERE hotel_id = ? ORDER BY sort_order`,
      [hotel.id]
    );

    // Reviews
    const reviews = await query(
      `SELECT * FROM hotel_reviews WHERE hotel_id = ? ORDER BY created_at DESC LIMIT 10`,
      [hotel.id]
    );

    // Rooms
    const rooms = await query(
      `SELECT rt.*,
        (SELECT COUNT(*) FROM room_types rt2
         WHERE rt2.hotel_id = rt.hotel_id AND rt2.discount_percent > 0) > 0 AS has_deal
       FROM room_types rt
       WHERE rt.hotel_id = ? AND rt.status = 'available'
       ORDER BY rt.is_recommended DESC, rt.price_per_night ASC`,
      [hotel.id]
    );

    // Room details (amenities, inclusions, images)
    for (const room of rooms) {
      const ra   = await query(`SELECT name FROM room_amenities WHERE room_type_id = ?`, [room.id]);
      const ri   = await query(`SELECT name FROM room_inclusions WHERE room_type_id = ?`, [room.id]);
      const rimg = await query(`SELECT image_url FROM room_images WHERE room_type_id = ? ORDER BY sort_order LIMIT 1`, [room.id]);
      room.amenities  = ra.map(r => r.name);
      room.inclusions = ri.map(r => r.name);
      room.image_url  = rimg[0]?.image_url || '';
    }

    return res.json({ ...hotel, images, amenities, highlights, reviews, rooms });
  } catch (err) {
    console.error('[hotels/slug]', err.message);
    return res.status(500).json({ error: err.message });
  }
}