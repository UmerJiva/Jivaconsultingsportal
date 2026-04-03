// pages/api/hotels/[slug].js — Full hotel detail with rooms, images, amenities
import db from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { slug } = req.query;

  try {
    // Hotel
    const [[hotel]] = await db.query(
      `SELECT * FROM hotels WHERE slug = ? AND status = 'active'`,
      [slug]
    );
    if (!hotel) return res.status(404).json({ error: 'Not found' });

    // Images
    const [images] = await db.query(
      `SELECT * FROM hotel_images WHERE hotel_id = ? ORDER BY sort_order`,
      [hotel.id]
    );

    // Amenities
    const [amenities] = await db.query(
      `SELECT * FROM hotel_amenities WHERE hotel_id = ? ORDER BY sort_order, id`,
      [hotel.id]
    );

    // Rooms with their amenities and inclusions
    const [rooms] = await db.query(
      `SELECT rt.*,
        (SELECT COUNT(*) FROM room_types rt2
         WHERE rt2.hotel_id = rt.hotel_id AND rt2.discount_percent > 0) > 0 AS has_deal
       FROM room_types rt
       WHERE rt.hotel_id = ? AND rt.status = 'available'
       ORDER BY rt.is_recommended DESC, rt.price_per_night ASC`,
      [hotel.id]
    );

    for (const room of rooms) {
      const [ra] = await db.query(
        `SELECT name FROM room_amenities WHERE room_type_id = ? ORDER BY id`,
        [room.id]
      );
      room.amenities = ra.map(r => r.name);

      const [ri] = await db.query(
        `SELECT name FROM room_inclusions WHERE room_type_id = ?`,
        [room.id]
      );
      room.inclusions = ri.map(r => r.name);

      const [rimg] = await db.query(
        `SELECT image_url FROM room_images WHERE room_type_id = ? ORDER BY sort_order LIMIT 3`,
        [room.id]
      );
      room.images = rimg;
    }

    // Highlights
    const [highlights] = await db.query(
      `SELECT * FROM hotel_highlights WHERE hotel_id = ? ORDER BY sort_order`,
      [hotel.id]
    );

    // Reviews
    const [reviews] = await db.query(
      `SELECT * FROM hotel_reviews WHERE hotel_id = ? ORDER BY created_at DESC LIMIT 10`,
      [hotel.id]
    );

    res.json({
      ...hotel,
      images,
      amenities,
      rooms,
      highlights,
      reviews,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}