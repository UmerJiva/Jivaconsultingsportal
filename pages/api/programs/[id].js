// pages/api/programs/[id].js
import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;
  const { role } = req.user;

  try {
    if (req.method === 'GET') {
      const program = await queryOne(`
        SELECT
          p.*,
          u.id AS university_id, u.name AS university_name,
          u.logo_initials, u.world_ranking, u.status AS uni_status,
          u.description AS uni_description, u.founded, u.institution_type,
          u.avg_processing_days, u.cost_of_living, u.avg_tuition,
          u.application_fee_range, u.features, u.disciplines,
          u.program_levels, u.photos, u.address, u.website,
          u.latitude, u.longitude,
          c.name AS country, c.flag, c.code AS country_code,
          c2.name AS campus_country
        FROM programs p
        JOIN universities u ON u.id = p.university_id
        LEFT JOIN countries c ON c.id = u.country_id
        LEFT JOIN countries c2 ON c2.name = p.location_text
        WHERE p.id = ? AND p.is_active = 1
      `, [id]);

      if (!program) return res.status(404).json({ error: 'Program not found' });

      // Get scholarships from the university
      const scholarships = await query(
        'SELECT * FROM scholarships WHERE university_id = ? ORDER BY id',
        [program.university_id]
      );

      // Get application requirements from dedicated tables (fall back to JSON columns)
      let prereqs = [], docs = [], appReq = {};
      try {
        [prereqs, docs, appReq] = await Promise.all([
          query('SELECT * FROM program_prerequisites WHERE program_id=? ORDER BY sort_order,id', [id]),
          query('SELECT * FROM program_documents WHERE program_id=? ORDER BY sort_order,id', [id]),
          queryOne('SELECT * FROM application_requirements WHERE program_id=?', [id]) || {},
        ]);
      } catch {}

      // Build prerequisites: use DB table if available, else fall back to JSON column
      const safeArr = (val) => { if(!val)return[]; if(Array.isArray(val))return val; try{return JSON.parse(val);}catch{return[];} };
      const finalPrereqs = prereqs.length > 0 ? prereqs : safeArr(program.prerequisites);
      const finalDocs    = docs.length > 0 ? docs.map(d=>({name:d.name,type:d.doc_type,description:d.description,required:!!d.required})) : safeArr(program.required_documents);

      // Get similar programs from same university
      const similar = await query(`
        SELECT p.id, p.name, p.level, p.tuition_fee, p.currency,
               p.application_fee, p.available_intakes, p.commission_text,
               u.name AS university_name
        FROM programs p
        JOIN universities u ON u.id = p.university_id
        WHERE p.university_id = ? AND p.id != ? AND p.is_active = 1
        ORDER BY p.name ASC
        LIMIT 6
      `, [program.university_id, id]);


      return res.json({
        ...program,
        // Merge eligibility rules from application_requirements if available
        min_education_level: appReq?.min_education_level || program.min_education_level,
        min_gpa:    appReq?.min_gpa    || program.min_gpa,
        min_ielts:  appReq?.min_ielts  || program.min_ielts,
        min_toefl:  appReq?.min_toefl  || program.min_toefl,
        min_pte:    appReq?.min_pte    || program.min_pte,
        commission_text:      appReq?.commission_text      || program.commission_text,
        commission_breakdown: appReq?.commission_breakdown || program.commission_breakdown,
        post_study_work_visa: appReq?.post_study_work_visa ?? program.post_study_work_visa,
        // Step guidelines
        eligibility_guideline:   appReq?.eligibility_guideline   || null,
        intake_guideline:        appReq?.intake_guideline        || null,
        prerequisites_guideline: appReq?.prerequisites_guideline || null,
        backups_guideline:       appReq?.backups_guideline       || null,
        documents_guideline:     appReq?.documents_guideline     || null,
        // Prerequisites and documents from DB tables (or JSON fallback)
        prerequisites:    finalPrereqs,
        required_documents: finalDocs,
        photos: safeArr(program.photos),
        features: safeArr(program.features),
        disciplines: safeArr(program.disciplines),
        scholarships,
        similar,
      });
    }

    if (req.method === 'PUT') {
      if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const {
        name, level, tuition_fee, currency, application_fee, app_fee_currency,
        campus_city, location_text, duration_text, available_intakes, tags,
        success_chance, instant_submission, instant_offer, commission_text,
        description, min_gpa, min_ielts, min_toefl, min_pte,
        min_education_level, post_study_work_visa, commission_breakdown
      } = req.body;

      await query(`
        UPDATE programs SET
          name=?, level=?, tuition_fee=?, currency=?, application_fee=?,
          app_fee_currency=?, campus_city=?, location_text=?, duration_text=?,
          available_intakes=?, tags=?, success_chance=?,
          instant_submission=?, instant_offer=?, commission_text=?,
          description=?, min_gpa=?, min_ielts=?, min_toefl=?, min_pte=?,
          min_education_level=?, post_study_work_visa=?,
          commission_breakdown=?, updated_at=NOW()
        WHERE id=?
      `, [
        name, level, tuition_fee||null, currency||'USD',
        application_fee||0, app_fee_currency||'USD',
        campus_city||null, location_text||null, duration_text||null,
        available_intakes||null, tags||null, success_chance||'High',
        instant_submission?1:0, instant_offer?1:0, commission_text||null,
        description||null, min_gpa||null, min_ielts||null,
        min_toefl||null, min_pte||null, min_education_level||null,
        post_study_work_visa?1:0, commission_breakdown||null, id
      ]);
      return res.json({ message: 'Program updated' });
    }

    if (req.method === 'DELETE') {
      if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      await query('UPDATE programs SET is_active=0 WHERE id=?', [id]);
      return res.json({ message: 'Program deactivated' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[programs/[id]]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

export default withAuth(handler);