// pages/api/students/[id].js
import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { id, by_user } = req.query;
  const { role, roleId, userId } = req.user;

  try {
    // by_user=1 lets a student look themselves up by userId instead of student id
    const lookupWhere = by_user ? 's.user_id = ?' : 's.id = ?';
    const lookupId    = by_user ? userId : id;
    const student = await queryOne(`
      SELECT s.*, u.name, u.email, u.avatar, u.is_active,
             c.name AS nationality, c.flag,
             au.name AS agent_name, au.email AS agent_email
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN countries c ON c.id = s.country_id
      LEFT JOIN agents ag ON ag.id = s.agent_id
      LEFT JOIN users au ON au.id = ag.user_id
      WHERE ${lookupWhere}
    `, [lookupId]);

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Permission: admin sees all, agent sees own students, student sees only self
    if (role === 'agent' && student.agent_id !== roleId) return res.status(403).json({ error: 'Forbidden' });
    if (role === 'student') {
      const self = await queryOne('SELECT id FROM students WHERE user_id=?', [userId]);
      if (!self || self.id !== parseInt(id)) return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
      const applications = await query(`
        SELECT a.id, a.app_code, a.status, a.intake, a.applied_date, a.decision_date,
               u.name AS university_name, c.name AS country, c.flag,
               p.name AS program_name, p.level
        FROM applications a
        JOIN universities u ON u.id = a.university_id
        LEFT JOIN countries c ON c.id = u.country_id
        LEFT JOIN programs p ON p.id = a.program_id
        WHERE a.student_id = ?
        ORDER BY a.applied_date DESC
      `, [id]);

      // Try to get documents
      let documents = [];
      try { documents = await query('SELECT * FROM student_documents WHERE student_id=? ORDER BY uploaded_at DESC', [id]); } catch {}

      return res.json({ ...student, applications, documents });
    }

    if (req.method === 'PUT') {
      // Students can update their own profile
      if (role === 'student') {
        const self = await queryOne('SELECT id FROM students WHERE user_id=?', [userId]);
        if (!self || self.id !== parseInt(student.id)) return res.status(403).json({ error: 'Forbidden' });
      } else if (!['admin','agent','custom'].includes(role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const {
        // Personal
        first_name, middle_name, last_name, date_of_birth, gender, marital_status,
        native_language, country_id, passport_no, passport_expiry,
        // Address
        address_line, city, province, postal_code, address_country, phone,
        // Education
        education_level, institution_name, edu_country, grad_year, gpa, grade_scale, education_verified,
        // Tests
        ielts_score, ielts_date, toefl_score, pte_score, duolingo_score, sat_score, gre_score,
        // Visa
        has_visa, visa_country, visa_type, visa_expiry, refused_visa, study_permit,
        // Lead / internal
        lead_status, referral_source, recruiter_type, notes,
        target_program, target_intake, services_of_interest, country_of_interest,
        status, agent_id,
        // New fields
        other_language, different_name, alt_first_name, alt_middle_name, alt_last_name,
        background_details, study_permit_type, language_status, open_to_esl, english_exam_type,
        ielts_l, ielts_r, ielts_w, ielts_s,
        has_gre, gre_date, gre_v_score, gre_v_rank, gre_q_score, gre_q_rank, gre_w_score, gre_w_rank,
        has_gmat, gmat_date, gmat_v_score, gmat_v_rank, gmat_q_score, gmat_q_rank, gmat_w_score, gmat_w_rank, gmat_total_score, gmat_total_rank,
      } = req.body;

      // Check profile completeness
      const profile_completed = (first_name && last_name && date_of_birth && education_level && (ielts_score || toefl_score)) ? 1 : 0;

      await query(`
        UPDATE students SET
          first_name=?, middle_name=?, last_name=?, date_of_birth=?, gender=?,
          marital_status=?, native_language=?, country_id=?, passport_no=?, passport_expiry=?,
          address_line=?, city=?, province=?, postal_code=?, address_country=?, phone=?,
          education_level=?, institution_name=?, edu_country=?, grad_year=?, gpa=?,
          grade_scale=?, education_verified=?,
          ielts_score=?, ielts_date=?, toefl_score=?, pte_score=?, duolingo_score=?,
          sat_score=?, gre_score=?,
          has_visa=?, visa_country=?, visa_type=?, visa_expiry=?, refused_visa=?, study_permit=?,
          lead_status=?, referral_source=?, recruiter_type=?, notes=?,
          target_program=?, target_intake=?, services_of_interest=?, country_of_interest=?,
          status=?, agent_id=?, profile_completed=?,
          other_language=?, different_name=?, alt_first_name=?, alt_middle_name=?, alt_last_name=?,
          background_details=?, study_permit_type=?, language_status=?, open_to_esl=?, english_exam_type=?,
          ielts_l=?, ielts_r=?, ielts_w=?, ielts_s=?,
          has_gre=?, gre_date=?, gre_v_score=?, gre_v_rank=?, gre_q_score=?, gre_q_rank=?, gre_w_score=?, gre_w_rank=?,
          has_gmat=?, gmat_date=?, gmat_v_score=?, gmat_v_rank=?, gmat_q_score=?, gmat_q_rank=?, gmat_w_score=?, gmat_w_rank=?, gmat_total_score=?, gmat_total_rank=?,
          updated_at=NOW()
        WHERE id=?
      `, [
        first_name||null, middle_name||null, last_name||null, date_of_birth||null, gender||null,
        marital_status||null, native_language||null, country_id||null, passport_no||null, passport_expiry||null,
        address_line||null, city||null, province||null, postal_code||null, address_country||null, phone||null,
        education_level||null, institution_name||null, edu_country||null, grad_year||null, gpa||null,
        grade_scale||'4.0', education_verified?1:0,
        ielts_score||null, ielts_date||null, toefl_score||null, pte_score||null, duolingo_score||null,
        sat_score||null, gre_score||null,
        has_visa?1:0, visa_country||null, visa_type||null, visa_expiry||null, refused_visa?1:0, study_permit||null,
        lead_status||'New', referral_source||null, recruiter_type||'Owner', notes||null,
        target_program||null, target_intake||null, services_of_interest||null, country_of_interest||null,
        status||student.status, agent_id||student.agent_id, profile_completed,
        other_language||null, different_name||'no', alt_first_name||null, alt_middle_name||null, alt_last_name||null,
        background_details||null, study_permit_type||null, language_status||null, open_to_esl?1:0, english_exam_type||null,
        ielts_l||null, ielts_r||null, ielts_w||null, ielts_s||null,
        has_gre?1:0, gre_date||null, gre_v_score||null, gre_v_rank||null, gre_q_score||null, gre_q_rank||null, gre_w_score||null, gre_w_rank||null,
        has_gmat?1:0, gmat_date||null, gmat_v_score||null, gmat_v_rank||null, gmat_q_score||null, gmat_q_rank||null, gmat_w_score||null, gmat_w_rank||null, gmat_total_score||null, gmat_total_rank||null,
        id
      ]);

      // Also update user name if name fields changed
      if (first_name || last_name) {
        const fullName = [first_name, last_name].filter(Boolean).join(' ');
        if (fullName) await query('UPDATE users SET name=? WHERE id=?', [fullName, student.user_id]);
      }

      return res.json({ message: 'Student updated' });
    }

    if (req.method === 'DELETE') {
      if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      await query('UPDATE users SET is_active=0 WHERE id=?', [student.user_id]);
      return res.json({ message: 'Student deactivated' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch(err) {
    console.error('[students/[id]]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

export default withAuth(handler);