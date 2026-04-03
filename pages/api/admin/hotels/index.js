// pages/api/admin/hotels/index.js — List + Create
import db from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const [hotels] = await db.query(`
      SELECT h.*,
        (SELECT image_url FROM hotel_images WHERE hotel_id = h.id AND is_primary = 1 LIMIT 1) AS primary_image,
        (SELECT COUNT(*) FROM room_types WHERE hotel_id = h.id) AS room_count
      FROM hotels h
      ORDER BY h.created_at DESC
    `);
    return res.json({ hotels });
  }

  if (req.method === 'POST') {
    const { name, slug, star_rating, description, address, city, country,
      latitude, longitude, phone, email, website,
      check_in_time, check_out_time, status, is_featured,
      review_score, review_count, review_label, currency,
      free_cancellation, no_prepayment,
      images, amenities, rooms, highlights } = req.body;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(`
        INSERT INTO hotels (name,slug,star_rating,description,address,city,country,
          latitude,longitude,phone,email,website,check_in_time,check_out_time,
          status,is_featured,review_score,review_count,review_label,currency,
          free_cancellation,no_prepayment)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [name,slug,star_rating||3,description||null,address||null,city,country,
         latitude||null,longitude||null,phone||null,email||null,website||null,
         check_in_time||'14:00',check_out_time||'11:00',
         status||'active',is_featured?1:0,
         review_score||0,review_count||0,review_label||null,currency||'PKR',
         free_cancellation?1:0,no_prepayment?1:0]
      );
      const hotelId = result.insertId;

      await saveRelated(conn, hotelId, images, amenities, rooms, highlights);

      await conn.commit();
      res.json({ id: hotelId, success: true });
    } catch (e) {
      await conn.rollback();
      res.status(500).json({ error: e.message });
    } finally { conn.release(); }
  }
}

async function saveRelated(conn, hotelId, images, amenities, rooms, highlights) {
  // Images
  if (images?.length) {
    await conn.query(`DELETE FROM hotel_images WHERE hotel_id = ?`, [hotelId]);
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      await conn.query(`INSERT INTO hotel_images (hotel_id,image_url,caption,is_primary,sort_order) VALUES (?,?,?,?,?)`,
        [hotelId, img.image_url, img.caption||null, img.is_primary?1:0, i]);
    }
  }

  // Amenities
  if (amenities?.length) {
    await conn.query(`DELETE FROM hotel_amenities WHERE hotel_id = ?`, [hotelId]);
    for (const name of amenities) {
      const icon = name.toLowerCase().replace(/[^a-z]/g, '-');
      await conn.query(`INSERT INTO hotel_amenities (hotel_id,name,icon) VALUES (?,?,?)`, [hotelId, name, icon]);
    }
  }

  // Highlights
  if (highlights?.length) {
    await conn.query(`DELETE FROM hotel_highlights WHERE hotel_id = ?`, [hotelId]);
    for (let i = 0; i < highlights.length; i++) {
      const h = highlights[i];
      await conn.query(`INSERT INTO hotel_highlights (hotel_id,icon,title,description,sort_order) VALUES (?,?,?,?,?)`,
        [hotelId, h.icon||'map-pin', h.title, h.description||null, i]);
    }
  }

  // Rooms
  if (rooms?.length) {
    // For new rooms (no id), insert; for existing, update
    for (const room of rooms) {
      if (room.id) {
        await conn.query(`
          UPDATE room_types SET name=?,description=?,size_sqm=?,max_guests=?,bed_type=?,
            view_type=?,price_per_night=?,original_price=?,discount_percent=?,
            free_cancellation=?,cancellation_deadline=?,no_prepayment=?,
            status=?,is_recommended=?
          WHERE id=? AND hotel_id=?`,
          [room.name,room.description||null,room.size_sqm||null,room.max_guests||2,
           room.bed_type||null,room.view_type||null,room.price_per_night,
           room.original_price||null,room.discount_percent||0,
           room.free_cancellation?1:0,room.cancellation_deadline||null,
           room.no_prepayment?1:0,room.status||'available',
           room.is_recommended?1:0, room.id, hotelId]
        );
        await saveRoomRelated(conn, room.id, room);
      } else {
        const [r] = await conn.query(`
          INSERT INTO room_types (hotel_id,name,description,size_sqm,max_guests,bed_type,
            view_type,price_per_night,original_price,discount_percent,
            free_cancellation,cancellation_deadline,no_prepayment,status,is_recommended)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [hotelId,room.name,room.description||null,room.size_sqm||null,room.max_guests||2,
           room.bed_type||null,room.view_type||null,room.price_per_night,
           room.original_price||null,room.discount_percent||0,
           room.free_cancellation?1:0,room.cancellation_deadline||null,
           room.no_prepayment?1:0,room.status||'available',room.is_recommended?1:0]
        );
        await saveRoomRelated(conn, r.insertId, room);
      }
    }
  }
}

async function saveRoomRelated(conn, roomId, room) {
  if (room.amenities?.length) {
    await conn.query(`DELETE FROM room_amenities WHERE room_type_id = ?`, [roomId]);
    for (const name of room.amenities) {
      await conn.query(`INSERT INTO room_amenities (room_type_id,name) VALUES (?,?)`, [roomId, name]);
    }
  }
  if (room.inclusions?.length) {
    await conn.query(`DELETE FROM room_inclusions WHERE room_type_id = ?`, [roomId]);
    for (const name of room.inclusions) {
      await conn.query(`INSERT INTO room_inclusions (room_type_id,name) VALUES (?,?)`, [roomId, name]);
    }
  }
  if (room.image_url) {
    await conn.query(`DELETE FROM room_images WHERE room_type_id = ?`, [roomId]);
    await conn.query(`INSERT INTO room_images (room_type_id,image_url,is_primary,sort_order) VALUES (?,?,1,0)`, [roomId, room.image_url]);
  }
}

module.exports.saveRelated = saveRelated;