// pages/api/applications/check-eligibility.js
import { queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { program_id, student_id } = req.query;
  if (!program_id || !student_id) return res.status(400).json({ error: 'program_id and student_id required' });

  try {
    const program = await queryOne(`
      SELECT p.id, p.name, p.level, p.min_gpa, p.min_ielts, p.min_toefl, p.min_pte,
             p.min_education_level, p.university_id, u.name AS university_name
      FROM programs p JOIN universities u ON u.id = p.university_id
      WHERE p.id = ? AND p.is_active = 1
    `, [program_id]);
    if (!program) return res.status(404).json({ error: 'Program not found' });

    const student = await queryOne(`
      SELECT s.id, s.education_level, s.gpa, s.ielts_score, s.status,
             u.name, u.email
      FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = ?
    `, [student_id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Already applied?
    const existing = await queryOne(`
      SELECT id, status, app_code FROM applications
      WHERE student_id = ? AND program_id = ? AND status != 'Withdrawn'
    `, [student_id, program_id]);

    if (existing) return res.json({
      eligible: false, status: 'already_applied',
      application_id: existing.id, app_code: existing.app_code,
      message: 'Student already has an application to this program.',
      student: { id: student.id, name: student.name, email: student.email },
    });

    const issues = [];
    const EDU_RANK = { 'High School':0,'Grade 10':1,'Diploma':2,'Certificate':2,'Bachelors':3,'Bachelor':3,'Masters':4,'Master':4,'PhD':5 };
    const rankOf = (s='') => { for (const [k,v] of Object.entries(EDU_RANK)) if (s.toLowerCase().includes(k.toLowerCase())) return v; return -1; };

    if (program.min_education_level) {
      const minR = rankOf(program.min_education_level);
      const stuR = rankOf(student.education_level||'');
      if (stuR < minR) issues.push("The student does not meet the program's minimum level of education");
    }
    if (program.min_gpa && student.gpa && Number(student.gpa) < Number(program.min_gpa))
      issues.push(`GPA ${student.gpa} is below the minimum required ${program.min_gpa}`);

    const langOk = (program.min_ielts && student.ielts_score && Number(student.ielts_score) >= Number(program.min_ielts));
    const langNeeded = program.min_ielts || program.min_toefl || program.min_pte;
    if (langNeeded && !langOk) issues.push("The program does not accept the student's english test score");

    if (issues.length === 0) return res.json({ eligible: true, status: 'eligible', message: 'Student is eligible for this program.', student: { id: student.id, name: student.name, email: student.email } });

    const conditional = issues.every(i => i.includes('english test'));
    return res.json({
      eligible: conditional ? 'conditional' : false,
      status: conditional ? 'conditional' : 'not_eligible',
      issues,
      message: conditional ? 'Student is conditionally eligible for this program.' : 'Unfortunately, this student is not eligible to apply to the selected program for these reasons:',
      student: { id: student.id, name: student.name, email: student.email },
    });
  } catch(err) {
    console.error('[check-eligibility]', err.message);
    return res.json({ eligible: 'conditional', status: 'conditional', message: 'Student is conditionally eligible for this program.', student: { id: student_id, name: 'Student', email: '' } });
  }
}
export default withAuth(handler);