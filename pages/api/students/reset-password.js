// pages/api/students/reset-password.js
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { role } = req.user;
  if (!['admin','agent'].includes(role)) return res.status(403).json({ error: 'Forbidden' });

  const { student_id, password } = req.body;
  if (!student_id || !password) return res.status(400).json({ error: 'student_id and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const student = await queryOne('SELECT user_id FROM students WHERE id=?', [student_id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const hash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password=? WHERE id=?', [hash, student.user_id]);
    return res.json({ message: 'Password updated successfully' });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
export default withAuth(handler, ['admin','agent']);