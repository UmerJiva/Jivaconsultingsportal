// pages/api/students/education.js — CRUD for student education history
import { query, queryOne, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { role } = req.user;
  if (!['admin','agent'].includes(role)) return res.status(403).json({ error: 'Forbidden' });

  const { student_id } = req.query;
  if (!student_id) return res.status(400).json({ error: 'student_id required' });

  // GET — list all education records for a student
  if (req.method === 'GET') {
    try {
      const records = await query(
        'SELECT * FROM student_educations WHERE student_id=? ORDER BY is_highest DESC, grad_year DESC',
        [student_id]
      );
      return res.json({ educations: records });
    } catch(err) {
      console.error('[education GET]', err.message);
      return res.json({ educations: [] });
    }
  }

  // POST — add new education record
  if (req.method === 'POST') {
    const {
      education_level, institution_name, edu_country,
      field_of_study, degree_name, grad_year, start_year,
      gpa, grade_scale, is_highest, education_verified
    } = req.body;

    if (!education_level || !institution_name) {
      return res.status(400).json({ error: 'Education level and institution name are required' });
    }

    try {
      // If marking as highest, unset others
      if (is_highest) {
        await query('UPDATE student_educations SET is_highest=0 WHERE student_id=?', [student_id]);
      }

      const pool = getPool();
      const [insResult] = await pool.execute(`
        INSERT INTO student_educations
          (student_id, education_level, institution_name, edu_country, field_of_study, degree_name,
           grad_year, start_year, gpa, grade_scale, is_highest, education_verified)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        student_id, education_level, institution_name, edu_country||null,
        field_of_study||null, degree_name||null, grad_year||null, start_year||null,
        gpa||null, grade_scale||'4.0', is_highest?1:0, education_verified?1:0
      ]);

      // Sync highest to students table for backwards compat
      if (is_highest) {
        await query(
          'UPDATE students SET education_level=?, institution_name=?, edu_country=?, grad_year=?, gpa=?, grade_scale=? WHERE id=?',
          [education_level, institution_name, edu_country||null, grad_year||null, gpa||null, grade_scale||'4.0', student_id]
        );
      }

      return res.status(201).json({ message: 'Education added', id: insResult.insertId });
    } catch(err) {
      console.error('[education POST]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT — update an education record
  if (req.method === 'PUT') {
    const { id, education_level, institution_name, edu_country, field_of_study,
            degree_name, grad_year, start_year, gpa, grade_scale, is_highest, education_verified } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    try {
      if (is_highest) {
        await query('UPDATE student_educations SET is_highest=0 WHERE student_id=?', [student_id]);
      }

      await query(`
        UPDATE student_educations SET
          education_level=?, institution_name=?, edu_country=?, field_of_study=?,
          degree_name=?, grad_year=?, start_year=?, gpa=?, grade_scale=?,
          is_highest=?, education_verified=?
        WHERE id=? AND student_id=?
      `, [
        education_level, institution_name, edu_country||null, field_of_study||null,
        degree_name||null, grad_year||null, start_year||null, gpa||null, grade_scale||'4.0',
        is_highest?1:0, education_verified?1:0, id, student_id
      ]);

      // Sync highest to students table
      if (is_highest) {
        await query(
          'UPDATE students SET education_level=?, institution_name=?, edu_country=?, grad_year=?, gpa=?, grade_scale=? WHERE id=?',
          [education_level, institution_name, edu_country||null, grad_year||null, gpa||null, grade_scale||'4.0', student_id]
        );
      }

      return res.json({ message: 'Education updated' });
    } catch(err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      await query('DELETE FROM student_educations WHERE id=? AND student_id=?', [id, student_id]);
      return res.json({ message: 'Deleted' });
    } catch(err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['admin','agent']);