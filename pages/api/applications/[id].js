// pages/api/applications/[id].js
import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;
  const { id: userId } = req.user;
  const role = req.user.role === 'custom' ? 'admin' : req.user.role;

  try {
    const app = await queryOne(`
      SELECT a.*,
             s.id AS student_db_id,
             su.name AS student_name, su.email AS student_email,
             s.phone, s.education_level, s.gpa, s.ielts_score,
             s.passport_no, s.date_of_birth,
             u.id AS university_id, u.name AS university_name,
             c.name AS country, c.flag,
             p.id AS program_id, p.name AS program_name, p.level,
             p.tuition_fee, p.currency, p.duration_text,
             ag.id AS agent_db_id,
             au.name AS agent_name, au.email AS agent_email
      FROM applications a
      JOIN students s ON s.id = a.student_id
      JOIN users su ON su.id = s.user_id
      JOIN universities u ON u.id = a.university_id
      LEFT JOIN countries c ON c.id = u.country_id
      LEFT JOIN programs p ON p.id = a.program_id
      LEFT JOIN agents ag ON ag.id = a.agent_id
      LEFT JOIN users au ON au.id = ag.user_id
      WHERE a.id = ?
    `, [id]);

    if (!app) return res.status(404).json({ error: 'Application not found' });

    // Permission check
    if (role === 'agent' && app.agent_id !== req.user.roleId) return res.status(403).json({ error: 'Forbidden' });
    if (role === 'student' && app.student_id !== req.user.roleId) return res.status(403).json({ error: 'Forbidden' });

    if (req.method === 'GET') {
      // Status history
      let history = [];
      try {
        history = await query(`
          SELECT ash.*, u.name AS changed_by_name, u.email AS changed_by_email
          FROM application_status_history ash
          LEFT JOIN users u ON u.id = ash.changed_by
          WHERE ash.application_id = ?
          ORDER BY ash.changed_at ASC
        `, [id]);
      } catch {}

      // Comments
      let comments = [];
      try {
        comments = await query(`
          SELECT ac.*, u.name AS author_name, u.email AS author_email
          FROM application_comments ac
          LEFT JOIN users u ON u.id = ac.user_id
          WHERE ac.application_id = ?
          ORDER BY ac.created_at ASC
        `, [id]);
      } catch {}

      // Backup programs
      let backups = [];
      try {
        if (app.backup_programs) {
          backups = typeof app.backup_programs === 'string'
            ? JSON.parse(app.backup_programs)
            : app.backup_programs;
        }
      } catch {}

      return res.json({ ...app, history, comments, backup_programs: backups });
    }

    if (req.method === 'PUT') {
      if (!['admin','agent'].includes(role)) return res.status(403).json({ error: 'Forbidden' });

      const { status, intake, decision_date, notes, comment } = req.body;
      const oldStatus = app.status;

      // Update application
      await query(`
        UPDATE applications SET
          status=COALESCE(?,status),
          intake=COALESCE(?,intake),
          decision_date=COALESCE(?,decision_date),
          notes=COALESCE(?,notes),
          updated_at=NOW()
        WHERE id=?
      `, [status||null, intake||null, decision_date||null, notes!==undefined?notes:null, id]);

      // Log status change
      if (status && status !== oldStatus) {
        // Also log to application_logs for student records timeline
        try {
          await query(
            'INSERT INTO application_logs (application_id, action, description, performed_by, performed_by_name, role) VALUES (?,?,?,?,?,?)',
            [id, 'Status Changed', `Application status changed from "${oldStatus}" to "${status}"${comment ? ': ' + comment : ''}`, userId, req.user.name||'Admin', req.user.role]
          );
        } catch {}
        try {
          await query(`
            INSERT INTO application_status_history
              (application_id, status, old_status, new_status, changed_by, changed_at, note)
            VALUES (?,?,?,?,?,NOW(),?)
          `, [id, status, oldStatus, status, userId, comment||null]);
        } catch {
          // Fallback if old_status/new_status columns don't exist
          try {
            await query(
              'INSERT INTO application_status_history (application_id, status, changed_by, changed_at) VALUES (?,?,?,NOW())',
              [id, status, userId]
            );
          } catch {}
        }
      }

      // Add comment if provided
      if (comment?.trim()) {
        try {
          await query(
            'INSERT INTO application_comments (application_id, user_id, comment, created_at) VALUES (?,?,?,NOW())',
            [id, userId, comment.trim()]
          );
        } catch {}
      }

      return res.json({ message: 'Application updated' });
    }

    // POST = add comment only
    if (req.method === 'POST') {
      const { comment } = req.body;
      if (!comment?.trim()) return res.status(400).json({ error: 'Comment required' });
      try {
        await query(
          'INSERT INTO application_comments (application_id, user_id, comment, created_at) VALUES (?,?,?,NOW())',
          [id, userId, comment.trim()]
        );
        return res.json({ message: 'Comment added' });
      } catch(err) {
        return res.status(500).json({ error: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch(err) {
    console.error('[application/[id]]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

export default withAuth(handler, ['admin','agent','student']);