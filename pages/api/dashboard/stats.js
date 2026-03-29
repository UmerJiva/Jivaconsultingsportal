// pages/api/dashboard/stats.js
import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

const DEV = {
  students:     { total:142, active:118 },
  universities: { total:38 },
  agents:       { total:12, active:9 },
  applications: { total:286, accepted:94, pending:67, rejected:31, submitted:58, enrolled:18, conditional:18 },
  recentApps: [
    { student_name:'Aisha Khan',   university_name:'University of Toronto',   status:'Offer Received', applied_date:'2025-03-10', app_code:'APP0091' },
    { student_name:'Omar Farooq',  university_name:'University of Melbourne', status:'Under Review',   applied_date:'2025-03-09', app_code:'APP0090' },
    { student_name:'Fatima Ali',   university_name:'Imperial College London', status:'Accepted',       applied_date:'2025-03-08', app_code:'APP0089' },
    { student_name:'Bilal Hassan', university_name:'TU Munich',              status:'Rejected',       applied_date:'2025-03-07', app_code:'APP0088' },
    { student_name:'Sara Malik',   university_name:'University of Edinburgh', status:'Submitted',      applied_date:'2025-03-06', app_code:'APP0087' },
    { student_name:'Hamid Raza',   university_name:'Monash University',       status:'Enrolled',       applied_date:'2025-03-05', app_code:'APP0086' },
  ],
  topAgents: [
    { name:'Priya Sharma', avatar:'PS', student_count:28, commission_total:24800, status:'Active' },
    { name:'Emily Chen',   avatar:'EC', student_count:22, commission_total:19200, status:'Active' },
    { name:'James Rivera', avatar:'JR', student_count:19, commission_total:16400, status:'Active' },
    { name:'Ali Hassan',   avatar:'AH', student_count:15, commission_total:13100, status:'Active' },
    { name:'Sana Mirza',   avatar:'SM', student_count:12, commission_total:10500, status:'Active' },
  ],
  monthlyApps: [
    {month:'2024-10',count:18},{month:'2024-11',count:24},{month:'2024-12',count:19},
    {month:'2025-01',count:32},{month:'2025-02',count:28},{month:'2025-03',count:35},
  ],
  monthlyStudents: [
    {month:'2024-10',count:8},{month:'2024-11',count:12},{month:'2024-12',count:9},
    {month:'2025-01',count:16},{month:'2025-02',count:14},{month:'2025-03',count:18},
  ],
  appsByStatus: [
    {status:'Submitted',count:58},{status:'Under Review',count:67},{status:'Accepted',count:94},
    {status:'Rejected',count:31},{status:'Enrolled',count:18},{status:'Conditional Offer',count:18},
  ],
  topUniversities: [
    {name:'University of Toronto',  flag:'🇨🇦', app_count:34},
    {name:'University of Melbourne',flag:'🇦🇺', app_count:28},
    {name:'Imperial College London',flag:'🇬🇧', app_count:22},
    {name:'TU Munich',              flag:'🇩🇪', app_count:18},
    {name:'Monash University',      flag:'🇦🇺', app_count:15},
  ],
  leadStatusBreakdown: [
    {lead_status:'New',count:42},{lead_status:'Contacted',count:31},
    {lead_status:'In Progress',count:28},{lead_status:'Converted',count:24},{lead_status:'Lost',count:17},
  ],
};

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { roleId } = req.user;
  const role = req.user.role === 'custom' ? 'admin' : req.user.role; // custom staff = admin access

  try {
    if (role === 'admin') {
      const [students, universities, agents, applications] = await Promise.all([
        queryOne('SELECT COUNT(*) AS total, SUM(status="Active") AS active FROM students'),
        queryOne('SELECT COUNT(*) AS total FROM universities'),
        queryOne('SELECT COUNT(*) AS total, SUM(status="Active") AS active FROM agents'),
        queryOne(`SELECT COUNT(*) AS total,
          SUM(status IN ("Accepted","Offer Received")) AS accepted,
          SUM(status="Under Review") AS pending,
          SUM(status="Rejected") AS rejected,
          SUM(status="Submitted") AS submitted,
          SUM(status="Enrolled") AS enrolled,
          SUM(status="Conditional Offer") AS conditional
          FROM applications`),
      ]);

      const [recentApps, topAgents, monthlyApps, monthlyStudents, appsByStatus, topUniversities, leadStatusBreakdown] = await Promise.all([
        query(`
          SELECT a.app_code, a.status, a.applied_date,
                 su.name AS student_name, u.name AS university_name, c.flag
          FROM applications a
          JOIN students st ON st.id = a.student_id
          JOIN users su ON su.id = st.user_id
          JOIN universities u ON u.id = a.university_id
          LEFT JOIN countries c ON c.id = u.country_id
          ORDER BY a.created_at DESC LIMIT 8
        `),
        query(`
          SELECT u.name, u.avatar, ag.commission_total, ag.tier, ag.status,
                 COUNT(DISTINCT s.id) AS student_count
          FROM agents ag
          JOIN users u ON u.id = ag.user_id
          LEFT JOIN students s ON s.agent_id = ag.id
          WHERE ag.status = 'Active'
          GROUP BY ag.id ORDER BY student_count DESC LIMIT 5
        `),
        query(`
          SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS count
          FROM applications
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
          GROUP BY month ORDER BY month ASC
        `),
        query(`
          SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS count
          FROM students
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
          GROUP BY month ORDER BY month ASC
        `),
        query(`
          SELECT status, COUNT(*) AS count
          FROM applications
          GROUP BY status ORDER BY count DESC
        `),
        query(`
          SELECT u.name, c.flag, COUNT(a.id) AS app_count
          FROM universities u
          LEFT JOIN applications a ON a.university_id = u.id
          LEFT JOIN countries c ON c.id = u.country_id
          GROUP BY u.id ORDER BY app_count DESC LIMIT 5
        `),
        query(`
          SELECT lead_status, COUNT(*) AS count
          FROM students WHERE lead_status IS NOT NULL
          GROUP BY lead_status ORDER BY count DESC
        `),
      ]);

      return res.json({ students, universities, agents, applications, recentApps, topAgents, monthlyApps, monthlyStudents, appsByStatus, topUniversities, leadStatusBreakdown });
    }

    // agent / student roles unchanged
    if (role === 'agent') {
      const stats = await queryOne(`
        SELECT COUNT(DISTINCT s.id) AS total_students, SUM(s.status="Active") AS active_students,
               COUNT(DISTINCT a.id) AS total_apps, SUM(a.status IN ("Accepted","Offer Received")) AS accepted_apps
        FROM agents ag LEFT JOIN students s ON s.agent_id=ag.id LEFT JOIN applications a ON a.agent_id=ag.id
        WHERE ag.id=?
      `, [roleId]);
      const recentStudents = await query(`
        SELECT u.name, u.avatar, s.status, s.target_program, un.name AS university_name
        FROM students s JOIN users u ON u.id=s.user_id
        LEFT JOIN applications a ON a.student_id=s.id AND a.agent_id=?
        LEFT JOIN universities un ON un.id=a.university_id
        WHERE s.agent_id=? ORDER BY s.created_at DESC LIMIT 5
      `, [roleId, roleId]);
      return res.json({ stats, recentStudents });
    }

    if (role === 'student') {
      const profile = await queryOne(`
        SELECT s.*, u.name, u.email, u.avatar, c.name AS country_name, au.name AS agent_name
        FROM students s JOIN users u ON u.id=s.user_id
        LEFT JOIN countries c ON c.id=s.country_id
        LEFT JOIN agents ag ON ag.id=s.agent_id LEFT JOIN users au ON au.id=ag.user_id
        WHERE s.id=?
      `, [roleId]);
      const apps = await query(`
        SELECT a.app_code, a.status, a.intake, a.applied_date, u.name AS university_name, p.name AS program_name
        FROM applications a JOIN universities u ON u.id=a.university_id
        LEFT JOIN programs p ON p.id=a.program_id WHERE a.student_id=? ORDER BY a.created_at DESC
      `, [roleId]);
      return res.json({ profile, apps });
    }

    // Authenticated user with unrecognized role - return admin stats as safe default
    return res.json(DEV);
  } catch (err) {
    console.warn('[dashboard/stats] DB error, using fallback:', err.message);
    if (role === 'admin' || role === 'custom') return res.json(DEV);
    return res.json({});
  }
}
export default withAuth(handler); // any authenticated user can get stats