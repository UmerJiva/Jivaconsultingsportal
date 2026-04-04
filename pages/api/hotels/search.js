// pages/api/hotels/search.js
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { destination, checkIn, checkOut, adults, children, rooms, deal } = req.query;

  try {
    let sql = `
      SELECT
        h.id, h.name, h.slug, h.star_rating, h.city, h.country,
        h.review_score, h.review_count, h.review_label,
        h.free_cancellation, h.no_prepayment, h.is_featured, h.currency,
        (SELECT image_url FROM hotel_images
          WHERE hotel_id = h.id AND is_primary = 1 LIMIT 1) AS primary_image,
        (SELECT MIN(rt.price_per_night) FROM room_types rt
          WHERE rt.hotel_id = h.id AND rt.status = 'available') AS min_price,
        (SELECT original_price FROM room_types rt
          WHERE rt.hotel_id = h.id AND rt.status = 'available'
          ORDER BY price_per_night LIMIT 1) AS original_price,
        (SELECT name FROM room_types rt
          WHERE rt.hotel_id = h.id AND rt.is_recommended = 1 LIMIT 1) AS recommended_room,
        (SELECT bed_type FROM room_types rt
          WHERE rt.hotel_id = h.id AND rt.is_recommended = 1 LIMIT 1) AS bed_type,
        (SELECT COUNT(*) FROM room_types rt
          WHERE rt.hotel_id = h.id AND rt.discount_percent > 0) > 0 AS has_deal
      FROM hotels h
      WHERE h.status = 'active'
    `;

    const params = [];

    if (destination) {
      sql += ` AND (h.city LIKE ? OR h.country LIKE ? OR h.name LIKE ?)`;
      const d = `%${destination}%`;
      params.push(d, d, d);
    }

    if (deal === 'getaway') {
      sql += ` AND EXISTS (SELECT 1 FROM room_types rt WHERE rt.hotel_id = h.id AND rt.discount_percent > 0)`;
    }

    sql += ` ORDER BY h.is_featured DESC, h.review_score DESC`;

    const hotels = await query(sql, params);
    return res.json({ hotels, total: hotels.length });
  } catch (err) {
    console.error('[hotels/search]', err.message);
    return res.status(500).json({ error: err.message });
  }
}