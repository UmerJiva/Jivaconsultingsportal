// pages/api/settings.js — Portal settings CRUD
import { query, queryOne } from '../../lib/db';
import { withAuth } from '../../lib/auth';

// In-memory cache so AdminLayout doesn't hit DB on every render
let settingsCache = null;
let cacheTime = 0;
const CACHE_TTL = 30000; // 30s

async function getSettings() {
  const now = Date.now();
  if (settingsCache && now - cacheTime < CACHE_TTL) return settingsCache;
  try {
    const rows = await query('SELECT `key`, `value` FROM portal_settings');
    const map = {};
    rows.forEach(r => { map[r.key] = r.value; });
    settingsCache = map;
    cacheTime = now;
    return map;
  } catch {
    return null; // DB not ready yet
  }
}

async function handler(req, res) {
  const rawRole = (req.user || {}).role;
  const role = rawRole === 'custom' ? 'admin' : rawRole;

  // GET — anyone can read (used by AdminLayout)
  if (req.method === 'GET') {
    const settings = await getSettings();
    // Return defaults if DB not ready
    const defaults = {
      portal_name: 'EduPortal',
      portal_tagline: 'Management System',
      portal_logo_icon: 'GraduationCap',
      portal_color: '#059669',
      timezone: 'Asia/Karachi',
      language: 'en',
      date_format: 'DD/MM/YYYY',
      currency: 'USD',
      email_from: 'noreply@eduportal.com',
      email_from_name: 'EduPortal',
      smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '',
      sms_provider: '', sms_api_key: '',
      crm_provider: '', crm_api_key: '',
      notify_new_app: '1', notify_status_change: '1', notify_new_student: '1',
      session_timeout: '60', min_password_len: '8',
      require_2fa: '0', maintenance_mode: '0',
      footer_text: '© 2025 EduPortal. All rights reserved.',
    };
    return res.json({ settings: settings || defaults });
  }

  // POST — admin only
  if (req.method === 'POST') {
    if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const updates = req.body; // { key: value, ... }
    try {
      for (const [key, value] of Object.entries(updates)) {
        await query(
          'INSERT INTO portal_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)',
          [key, String(value ?? '')]
        );
      }
      // Bust cache
      settingsCache = null;
      return res.json({ message: 'Settings saved' });
    } catch(err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);