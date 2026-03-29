// pages/api/universities/upload-image.js
// Handles base64 image upload and saves to /public/uploads/universities/
import { withAuth } from '../../../lib/auth';
import fs from 'fs';
import path from 'path';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const { image, filename, university_id } = req.body;
  if (!image || !filename) return res.status(400).json({ error: 'image and filename required' });

  try {
    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'universities');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Strip base64 header and save
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const ext = image.match(/data:image\/(\w+);/)?.[1] || 'jpg';
    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}.${ext}`;
    const filePath = path.join(uploadDir, safeName);

    fs.writeFileSync(filePath, base64Data, 'base64');

    const url = `/uploads/universities/${safeName}`;

    // If university_id provided, append to photos JSON in DB
    if (university_id) {
      const { queryOne, query } = await import('../../../lib/db');
      const uni = await queryOne('SELECT photos FROM universities WHERE id = ?', [university_id]);
      const existing = (() => {
        if (!uni?.photos) return [];
        if (Array.isArray(uni.photos)) return uni.photos;
        try { return JSON.parse(uni.photos); } catch { return []; }
      })();
      const updated = [...existing, url];
      await query('UPDATE universities SET photos = ? WHERE id = ?', [JSON.stringify(updated), university_id]);
    }

    return res.json({ url, message: 'Image uploaded successfully' });
  } catch (err) {
    console.error('[upload-image]', err);
    return res.status(500).json({ error: err.message });
  }
}

export default withAuth(handler, ['admin']);