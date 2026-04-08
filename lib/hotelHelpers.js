// lib/hotelHelpers.js — Dormitory DB helpers (used inside transactions)

export async function saveHotelRelated(conn, hotelId, { images, amenities, rooms, highlights } = {}) {

  // ── Images ────────────────────────────────────────────────
  // Supports both base64 (from file upload) and regular URLs
  if (Array.isArray(images)) {
    await conn.execute(`DELETE FROM hotel_images WHERE hotel_id = ?`, [hotelId]);
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img?.image_url) continue;
      await conn.execute(
        `INSERT INTO hotel_images (hotel_id, image_url, caption, is_primary, sort_order) VALUES (?,?,?,?,?)`,
        [hotelId, img.image_url, img.caption || null, img.is_primary ? 1 : 0, i]
      );
    }
  }

  // ── Amenities ─────────────────────────────────────────────
  if (Array.isArray(amenities)) {
    await conn.execute(`DELETE FROM hotel_amenities WHERE hotel_id = ?`, [hotelId]);
    for (const name of amenities) {
      if (!name?.trim()) continue;
      const icon = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await conn.execute(
        `INSERT INTO hotel_amenities (hotel_id, name, icon) VALUES (?,?,?)`,
        [hotelId, name.trim(), icon]
      );
    }
  }

  // ── Highlights ────────────────────────────────────────────
  if (Array.isArray(highlights)) {
    await conn.execute(`DELETE FROM hotel_highlights WHERE hotel_id = ?`, [hotelId]);
    for (let i = 0; i < highlights.length; i++) {
      const h = highlights[i];
      if (!h?.title?.trim()) continue;
      await conn.execute(
        `INSERT INTO hotel_highlights (hotel_id, icon, title, description, sort_order) VALUES (?,?,?,?,?)`,
        [hotelId, h.icon || 'map-pin', h.title.trim(), h.description || null, i]
      );
    }
  }

  // ── Rooms ─────────────────────────────────────────────────
  if (Array.isArray(rooms)) {
    for (const room of rooms) {
      if (!room?.name?.trim()) continue;

      if (room.id) {
        // Update existing room
        await conn.execute(
          `UPDATE room_types SET
            name=?, description=?, size_sqm=?, max_guests=?, bed_type=?,
            price_per_night=?, original_price=?,
            status=?, is_recommended=?
           WHERE id=? AND hotel_id=?`,
          [
            room.name.trim(), room.description || null,
            room.size_sqm || null, room.max_guests || 1,
            room.bed_type || null,
            room.price_per_night || 0,
            room.actual_price || null,   // actual_price stored in original_price column
            room.status || 'available',
            room.is_recommended ? 1 : 0,
            room.id, hotelId,
          ]
        );
        await saveRoomRelated(conn, room.id, room);
      } else {
        // Insert new room
        const [r] = await conn.execute(
          `INSERT INTO room_types
            (hotel_id, name, description, size_sqm, max_guests, bed_type,
             price_per_night, original_price, status, is_recommended)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [
            hotelId, room.name.trim(), room.description || null,
            room.size_sqm || null, room.max_guests || 1,
            room.bed_type || null,
            room.price_per_night || 0,
            room.actual_price || null,   // actual_price stored in original_price column
            room.status || 'available',
            room.is_recommended ? 1 : 0,
          ]
        );
        await saveRoomRelated(conn, r.insertId, room);
      }
    }
  }
}

async function saveRoomRelated(conn, roomId, room) {
  // Room amenities
  if (Array.isArray(room.amenities)) {
    await conn.execute(`DELETE FROM room_amenities WHERE room_type_id = ?`, [roomId]);
    for (const name of room.amenities) {
      if (!name?.trim()) continue;
      await conn.execute(
        `INSERT INTO room_amenities (room_type_id, name) VALUES (?,?)`,
        [roomId, name.trim()]
      );
    }
  }

  // Room inclusions
  if (Array.isArray(room.inclusions)) {
    await conn.execute(`DELETE FROM room_inclusions WHERE room_type_id = ?`, [roomId]);
    for (const name of room.inclusions) {
      if (!name?.trim()) continue;
      await conn.execute(
        `INSERT INTO room_inclusions (room_type_id, name) VALUES (?,?)`,
        [roomId, name.trim()]
      );
    }
  }

  // Room photo (base64 or URL)
  if (room.image_url) {
    await conn.execute(`DELETE FROM room_images WHERE room_type_id = ?`, [roomId]);
    await conn.execute(
      `INSERT INTO room_images (room_type_id, image_url, is_primary, sort_order) VALUES (?,?,1,0)`,
      [roomId, room.image_url]
    );
  }
}