// pages/api/agent/tasks.js — Auto-generates tasks from real data
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function generateTasks(agentId) {
  const tasks = [];

  const students = await query(`
    SELECT s.*, u.name AS full_name, u.email
    FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE s.agent_id = ? AND u.is_active = 1
  `, [agentId]);

  for (const s of students) {
    const name = [s.first_name, s.last_name].filter(Boolean).join(' ') || s.full_name || 'Unknown';
    const sid  = s.id;

    // ── Profile field checks ─────────────────────────────────
    const profileChecks = [
      { field:'first_name',      label:'First Name'           , val: s.first_name      },
      { field:'last_name',       label:'Last Name'            , val: s.last_name       },
      { field:'date_of_birth',   label:'Date of Birth'        , val: s.date_of_birth   },
      { field:'gender',          label:'Gender'               , val: s.gender          },
      { field:'phone',           label:'Phone Number'         , val: s.phone           },
      { field:'passport_no',     label:'Passport Number'      , val: s.passport_no     },
      { field:'passport_expiry', label:'Passport Expiry Date' , val: s.passport_expiry },
      { field:'address_line',    label:'Street Address'       , val: s.address_line    },
      { field:'city',            label:'City'                 , val: s.city            },
      { field:'address_country', label:'Country of Residence' , val: s.address_country },
      { field:'education_level', label:'Education Level'      , val: s.education_level },
      { field:'institution_name','label':'Institution Name'   , val: s.institution_name },
      { field:'gpa',             label:'GPA / Grade'          , val: s.gpa             },
      { field:'grad_year',       label:'Graduation Year'      , val: s.grad_year       },
    ];

    const missing = profileChecks.filter(c => !c.val || String(c.val).trim() === '');

    // Each missing field becomes its own task card
    for (const m of missing) {
      tasks.push({
        id:           `profile_${sid}_${m.field}`,
        type:         'profile_incomplete',
        priority:     'medium',
        title:        m.label,
        description:  `${m.label} is missing from ${name}'s profile`,
        student_id:   sid,
        student_name: name,
        application_id: null,
        app_code:     null,
        university_name: null,
        intake:       null,
        field:        m.field,
        action_url:   `/agent/student/${sid}`,
        action_label: 'Complete Profile',
      });
    }

    // ── Missing English test score ────────────────────────────
    if (!s.ielts_score && !s.toefl_score && !s.pte_score && !s.duolingo_score) {
      tasks.push({
        id:           `test_${sid}`,
        type:         'missing_test_score',
        priority:     'high',
        title:        'English Test Score (IELTS / TOEFL / PTE)',
        description:  'No English test score on record',
        student_id:   sid,
        student_name: name,
        application_id: null,
        app_code:     null,
        university_name: null,
        intake:       null,
        field:        'ielts_score',
        action_url:   `/agent/student/${sid}`,
        action_label: 'Add Test Score',
      });
    }

    // ── Passport expiring ─────────────────────────────────────
    if (s.passport_expiry) {
      const monthsLeft = (new Date(s.passport_expiry) - new Date()) / (1000*60*60*24*30);
      if (monthsLeft < 6) {
        tasks.push({
          id:           `passport_${sid}`,
          type:         'passport_expiring',
          priority:     monthsLeft < 2 ? 'high' : 'medium',
          title:        'Passport Expiry Date',
          description:  `Passport expires ${new Date(s.passport_expiry).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}`,
          student_id:   sid,
          student_name: name,
          application_id: null,
          app_code:     null,
          university_name: null,
          intake:       null,
          field:        'passport_expiry',
          action_url:   `/agent/student/${sid}`,
          action_label: 'Update Passport',
        });
      }
    }

    // ── Applications ──────────────────────────────────────────
    let apps = [];
    try {
      apps = await query(`
        SELECT a.id, a.app_code, a.status, a.intake, a.applied_date,
               p.name AS program_name, u2.name AS university_name,
               p.min_ielts, p.min_gpa
        FROM applications a
        LEFT JOIN programs p ON p.id = a.program_id
        LEFT JOIN universities u2 ON u2.id = a.university_id
        WHERE a.student_id = ? AND a.status != 'Withdrawn'
        ORDER BY a.applied_date DESC
      `, [sid]);
    } catch {}

    for (const app of apps) {
      const prog = app.program_name || '';
      const uni  = app.university_name || '';
      const code = app.app_code;

      // ── Required document tasks (from program_documents table) ──
      let docs = [];
      try {
        docs = await query(
          'SELECT * FROM program_documents WHERE program_id = (SELECT program_id FROM applications WHERE id=?) ORDER BY sort_order',
          [app.id]
        );
      } catch {}

      for (const doc of docs.filter(d=>d.required)) {
        tasks.push({
          id:           `doc_${app.id}_${doc.id}`,
          type:         'intake_missing',
          priority:     'medium',
          title:        doc.name,
          description:  doc.description || `Required document for ${prog}`,
          student_id:   sid,
          student_name: name,
          application_id: app.id,
          app_code:     code,
          university_name: uni,
          intake:       app.intake || null,
          field:        `doc_${doc.id}`,
          action_url:   `/agent/applications`,
          action_label: 'View Application',
        });
      }

      // If no documents configured, show generic app requirement tasks
      if (docs.length === 0) {
        const defaultDocs = [
          'Copy of Education Transcripts',
          'Copy of Education Certificate',
          'Passport Copy',
          'English Language Proficiency Test',
          'Study Gap Explanation',
        ];
        for (const docName of defaultDocs) {
          tasks.push({
            id:           `doc_${app.id}_${docName.replace(/\s/g,'_')}`,
            type:         'intake_missing',
            priority:     'medium',
            title:        docName,
            description:  `Required for application to ${prog}`,
            student_id:   sid,
            student_name: name,
            application_id: app.id,
            app_code:     code,
            university_name: uni,
            intake:       app.intake || null,
            field:        docName,
            action_url:   `/agent/applications`,
            action_label: 'View Application',
          });
        }
      }

      // ── No intake selected ───────────────────────────────────
      if (!app.intake) {
        tasks.push({
          id:           `intake_${app.id}`,
          type:         'intake_missing',
          priority:     'high',
          title:        'Select Academic Intake',
          description:  `Application #${code} has no intake date`,
          student_id:   sid,
          student_name: name,
          application_id: app.id,
          app_code:     code,
          university_name: uni,
          intake:       null,
          field:        'intake',
          action_url:   `/agent/applications`,
          action_label: 'Update Intake',
        });
      }

      // ── Follow up ────────────────────────────────────────────
      if (app.status === 'Submitted' && app.applied_date) {
        const days = Math.floor((new Date()-new Date(app.applied_date))/86400000);
        if (days >= 7) {
          tasks.push({
            id:           `followup_${app.id}`,
            type:         'follow_up',
            priority:     days >= 30 ? 'high' : 'medium',
            title:        `Follow up — ${days} days no update`,
            description:  `Application #${code} submitted ${days} days ago`,
            student_id:   sid,
            student_name: name,
            application_id: app.id,
            app_code:     code,
            university_name: uni,
            intake:       app.intake,
            field:        'status',
            action_url:   `/agent/applications`,
            action_label: 'View Application',
          });
        }
      }

      // ── Conditional offer ────────────────────────────────────
      if (app.status === 'Conditional Offer') {
        tasks.push({
          id:           `conditional_${app.id}`,
          type:         'conditional_offer',
          priority:     'high',
          title:        'Conditional Offer — Action Required',
          description:  `Fulfil conditions for ${prog}`,
          student_id:   sid,
          student_name: name,
          application_id: app.id,
          app_code:     code,
          university_name: uni,
          intake:       app.intake,
          field:        'status',
          action_url:   `/agent/applications`,
          action_label: 'View Offer',
        });
      }

      // ── Offer received ───────────────────────────────────────
      if (app.status === 'Offer Received') {
        tasks.push({
          id:           `offer_${app.id}`,
          type:         'offer_received',
          priority:     'high',
          title:        'Confirm Student Enrolment',
          description:  `Offer received for ${prog}`,
          student_id:   sid,
          student_name: name,
          application_id: app.id,
          app_code:     code,
          university_name: uni,
          intake:       app.intake,
          field:        'status',
          action_url:   `/agent/applications`,
          action_label: 'Confirm Enrolment',
        });
      }
    }

    // ── No applications yet ───────────────────────────────────
    if (apps.length === 0 && s.education_level) {
      tasks.push({
        id:           `noapps_${sid}`,
        type:         'no_application',
        priority:     'low',
        title:        'No Application Created',
        description:  'Student profile ready but no applications submitted',
        student_id:   sid,
        student_name: name,
        application_id: null,
        app_code:     null,
        university_name: null,
        intake:       null,
        field:        null,
        action_url:   `/agent/applications/new?student=${sid}`,
        action_label: 'Create Application',
      });
    }
  }

  // Sort high → medium → low
  const order = { high:0, medium:1, low:2 };
  tasks.sort((a,b) => order[a.priority]-order[b.priority]);
  return tasks;
}

async function handler(req, res) {
  const { role, roleId } = req.user;
  if (role !== 'agent') return res.status(403).json({ error: 'Agents only' });

  if (req.method === 'GET') {
    try {
      let dismissed = new Set();
      try {
        const rows = await query(
          "SELECT CONCAT(type,'|',COALESCE(student_id,''),'|',COALESCE(application_id,''),'|',COALESCE(field,'')) AS k FROM agent_tasks WHERE agent_id=? AND status='dismissed'",
          [roleId]
        );
        dismissed = new Set(rows.map(r=>r.k));
      } catch {}

      const all   = await generateTasks(roleId);
      const tasks = all.filter(t => !dismissed.has(`${t.type}|${t.student_id||''}|${t.application_id||''}|${t.field||''}`));

      return res.json({
        tasks,
        total:  tasks.length,
        high:   tasks.filter(t=>t.priority==='high').length,
        medium: tasks.filter(t=>t.priority==='medium').length,
        low:    tasks.filter(t=>t.priority==='low').length,
      });
    } catch(err) {
      console.error('[tasks]', err.message);
      return res.json({ tasks:[], total:0, high:0, medium:0, low:0 });
    }
  }

  if (req.method === 'POST') {
    const { type, student_id, application_id, field, action='dismiss' } = req.body;
    try {
      await query(`
        INSERT INTO agent_tasks (agent_id,type,student_id,application_id,field,status,title,description,priority)
        VALUES (?,?,?,?,?,?,?,?,'medium')
        ON DUPLICATE KEY UPDATE status=VALUES(status),updated_at=NOW()
      `, [roleId, type, student_id||null, application_id||null, field||null,
          action==='dismiss'?'dismissed':'snoozed', type, '']);
    } catch {}
    return res.json({ message:'ok' });
  }

  return res.status(405).json({ error:'Method not allowed' });
}
export default withAuth(handler, ['agent']);