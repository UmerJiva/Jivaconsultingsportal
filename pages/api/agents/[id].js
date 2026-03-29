// pages/api/agents/[id].js
import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;
  const role = req.user.role === 'custom' ? 'admin' : req.user.role;


  try {
    const agent = await queryOne(`
      SELECT ag.*, u.name, u.email, u.avatar, u.is_active, u.id AS user_id,
             c.name AS country, c.flag
      FROM agents ag
      JOIN users u ON u.id = ag.user_id
      LEFT JOIN countries c ON c.id = ag.country_id
      WHERE ag.id = ?
    `, [id]);

    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    if (req.method === 'GET') {
      const [students, applications, conv] = await Promise.all([
        query(`
          SELECT s.id, s.status, s.lead_status, s.education_level, s.gpa, s.ielts_score,
                 s.first_name, s.last_name, u.name, u.email,
                 (SELECT COUNT(*) FROM applications a WHERE a.student_id=s.id) AS app_count
          FROM students s JOIN users u ON u.id=s.user_id
          WHERE s.agent_id=? ORDER BY s.created_at DESC LIMIT 10
        `, [id]),
        query(`
          SELECT a.id, a.app_code, a.status, a.intake, a.applied_date,
                 p.name AS program_name, u2.name AS university_name, c2.flag
          FROM applications a
          JOIN students s ON s.id=a.student_id
          LEFT JOIN programs p ON p.id=a.program_id
          LEFT JOIN universities u2 ON u2.id=a.university_id
          LEFT JOIN countries c2 ON c2.id=u2.country_id
          WHERE a.agent_id=? ORDER BY a.applied_date DESC LIMIT 10
        `, [id]),
        // Get or create chat conversation
        queryOne('SELECT id, agent_unread, admin_unread FROM chat_conversations WHERE agent_id=? ORDER BY id DESC LIMIT 1', [id]).catch(()=>null),
      ]);

      const stats = await queryOne(`
        SELECT
          COUNT(DISTINCT s.id) AS total_students,
          SUM(s.status='Active') AS active_students,
          COUNT(DISTINCT a.id) AS total_apps,
          SUM(a.status IN ('Accepted','Offer Received')) AS accepted_apps,
          SUM(a.status='Enrolled') AS enrolled,
          SUM(a.status='Rejected') AS rejected_apps
        FROM agents ag
        LEFT JOIN students s ON s.agent_id=ag.id
        LEFT JOIN applications a ON a.agent_id=ag.id
        WHERE ag.id=?
      `, [id]);

      return res.json({ ...agent, students, applications, stats, conversation: conv });
    }

    if (req.method === 'PUT') {
      if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const {
        city, country_id, phone, status, commission_total,
        company_name, company_website, license_no,
        agreement_date, agreement_status, certificate_no,
        certificate_date, notes, recruiter_type
      } = req.body;

      await query(`
        UPDATE agents SET
          city=COALESCE(?,city), country_id=COALESCE(?,country_id),
          phone=COALESCE(?,phone), status=COALESCE(?,status),
          commission_total=COALESCE(?,commission_total),
          company_name=?, company_website=?, license_no=?,
          agreement_date=?, agreement_status=?,
          certificate_no=?, certificate_date=?, notes=?, recruiter_type=?,
          updated_at=NOW()
        WHERE id=?
      `, [city||null, country_id||null, phone||null, status||null,
          commission_total||null, company_name||null, company_website||null,
          license_no||null, agreement_date||null, agreement_status||null,
          certificate_no||null, certificate_date||null, notes||null,
          recruiter_type||null, id]);

      if (req.body.name) await query('UPDATE users SET name=? WHERE id=?', [req.body.name, agent.user_id]);

      return res.json({ message: 'Agent updated' });
    }

    if (req.method === 'DELETE') {
      if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      await query('UPDATE users SET is_active=0 WHERE id=?', [agent.user_id]);
      return res.json({ message: 'Agent deactivated' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch(err) {
    console.error('[agents/id]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
export default withAuth(handler, ['admin','agent']);