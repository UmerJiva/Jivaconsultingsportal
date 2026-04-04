// pages/api/public/leads.js — PUBLIC endpoint, no auth required
// Called from the Jiva Consulting website contact form
import { query } from '../../../lib/db';

const ALLOWED_ORIGINS = [
  'https://jivaconsultingsportal.vercel.app',
  'http://localhost:3000',  // for local dev of the other website
  'http://localhost:3001',
];

export default async function handler(req, res) {

  // ── CORS — only allow requests from your website ──────────
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, destination, field_of_study, message } = req.body || {};

  // Validate required fields
  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  // Basic email check
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  if (!emailOk) return res.status(400).json({ error: 'Invalid email address.' });

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;

    await query(
      `INSERT INTO leads (name, email, phone, destination, field_of_study, message, source, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, 'website', ?)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phone?.trim() || null,
        destination?.trim() || null,
        field_of_study?.trim() || null,
        message?.trim() || null,
        ip,
      ]
    );

    return res.status(201).json({ success: true, message: 'Your enquiry has been received. We will contact you within 24 hours.' });
  } catch (err) {
    console.error('[leads POST]', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}