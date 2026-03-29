// pages/api/programs/[id]/requirements.js
import { query, queryOne } from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';

async function handler(req, res) {
  const { id: program_id } = req.query;
  const { role } = req.user;

  if (req.method === 'GET') {
    try {
      const [req_row, prereqs, docs] = await Promise.all([
        queryOne('SELECT * FROM application_requirements WHERE program_id=?', [program_id]),
        query('SELECT * FROM program_prerequisites WHERE program_id=? ORDER BY sort_order,id', [program_id]),
        query('SELECT * FROM program_documents WHERE program_id=? ORDER BY sort_order,id', [program_id]),
      ]);
      return res.json({ requirements: req_row||{}, prerequisites: prereqs, documents: docs });
    } catch(err) {
      console.error('[requirements GET]', err.message);
      return res.json({ requirements:{}, prerequisites:[], documents:[] });
    }
  }

  if (req.method === 'PUT') {
    if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const {
      min_education_level, min_gpa, min_ielts, min_toefl, min_pte, min_duolingo,
      eligibility_guideline, intake_guideline, prerequisites_guideline,
      backups_guideline, documents_guideline,
      post_study_work_visa, commission_breakdown, commission_text,
      prerequisites = [], documents = []
    } = req.body;

    try {
      await query(`
        INSERT INTO application_requirements
          (program_id, min_education_level, min_gpa, min_ielts, min_toefl, min_pte, min_duolingo,
           eligibility_guideline, intake_guideline, prerequisites_guideline,
           backups_guideline, documents_guideline,
           post_study_work_visa, commission_breakdown, commission_text)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
          min_education_level=VALUES(min_education_level), min_gpa=VALUES(min_gpa),
          min_ielts=VALUES(min_ielts), min_toefl=VALUES(min_toefl),
          min_pte=VALUES(min_pte), min_duolingo=VALUES(min_duolingo),
          eligibility_guideline=VALUES(eligibility_guideline),
          intake_guideline=VALUES(intake_guideline),
          prerequisites_guideline=VALUES(prerequisites_guideline),
          backups_guideline=VALUES(backups_guideline),
          documents_guideline=VALUES(documents_guideline),
          post_study_work_visa=VALUES(post_study_work_visa),
          commission_breakdown=VALUES(commission_breakdown),
          commission_text=VALUES(commission_text), updated_at=NOW()
      `, [program_id, min_education_level||null, min_gpa||null, min_ielts||null,
          min_toefl||null, min_pte||null, min_duolingo||null,
          eligibility_guideline||null, intake_guideline||null,
          prerequisites_guideline||null, backups_guideline||null,
          documents_guideline||null, post_study_work_visa?1:0,
          commission_breakdown||null, commission_text||null]);

      await query('DELETE FROM program_prerequisites WHERE program_id=?', [program_id]);
      for (let i=0; i<prerequisites.length; i++) {
        const p = prerequisites[i];
        if (!p.title?.trim()) continue;
        await query('INSERT INTO program_prerequisites (program_id,sort_order,title,body) VALUES (?,?,?,?)',
          [program_id, i, p.title.trim(), p.body||null]);
      }

      await query('DELETE FROM program_documents WHERE program_id=?', [program_id]);
      for (let i=0; i<documents.length; i++) {
        const d = documents[i];
        if (!d.name?.trim()) continue;
        await query('INSERT INTO program_documents (program_id,sort_order,name,doc_type,description,required) VALUES (?,?,?,?,?,?)',
          [program_id, i, d.name.trim(), d.doc_type||null, d.description||null, d.required?1:0]);
      }

      // Sync to programs table for eligibility checks
      await query(`UPDATE programs SET min_education_level=?,min_gpa=?,min_ielts=?,min_toefl=?,min_pte=?,
        post_study_work_visa=?,commission_text=?,commission_breakdown=? WHERE id=?`,
        [min_education_level||null, min_gpa||null, min_ielts||null, min_toefl||null,
         min_pte||null, post_study_work_visa?1:0, commission_text||null, commission_breakdown||null, program_id]);

      return res.json({ message: 'Saved successfully' });
    } catch(err) {
      console.error('[requirements PUT]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
export default withAuth(handler, ['admin','agent','student']);