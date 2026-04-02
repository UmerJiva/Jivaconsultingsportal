// pages/api/preferences/index.js
import { query, queryOne } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

// Default options seeded in memory if DB tables don't exist yet
const DEFAULT_OPTIONS = [
  // Countries
  { id:1,  question_key:'study_countries', option_value:'USA',            option_label:'🇺🇸 United States',   sort_order:1,  is_active:1 },
  { id:2,  question_key:'study_countries', option_value:'Canada',         option_label:'🇨🇦 Canada',           sort_order:2,  is_active:1 },
  { id:3,  question_key:'study_countries', option_value:'United Kingdom', option_label:'🇬🇧 United Kingdom',   sort_order:3,  is_active:1 },
  { id:4,  question_key:'study_countries', option_value:'Australia',      option_label:'🇦🇺 Australia',        sort_order:4,  is_active:1 },
  { id:5,  question_key:'study_countries', option_value:'Ireland',        option_label:'🇮🇪 Ireland',          sort_order:5,  is_active:1 },
  { id:6,  question_key:'study_countries', option_value:'Germany',        option_label:'🇩🇪 Germany',          sort_order:6,  is_active:1 },
  { id:7,  question_key:'study_countries', option_value:'New Zealand',    option_label:'🇳🇿 New Zealand',      sort_order:7,  is_active:1 },
  { id:8,  question_key:'study_countries', option_value:'France',         option_label:'🇫🇷 France',           sort_order:8,  is_active:1 },
  { id:9,  question_key:'study_countries', option_value:'Netherlands',    option_label:'🇳🇱 Netherlands',      sort_order:9,  is_active:1 },
  { id:10, question_key:'study_countries', option_value:'Singapore',      option_label:'🇸🇬 Singapore',        sort_order:10, is_active:1 },
  // Education levels
  { id:11, question_key:'edu_levels', option_value:'Primary',    option_label:'Primary / Elementary School',                      sort_order:1, is_active:1 },
  { id:12, question_key:'edu_levels', option_value:'Secondary',  option_label:'Secondary School',                                  sort_order:2, is_active:1 },
  { id:13, question_key:'edu_levels', option_value:'Bachelor',   option_label:"Bachelor's Degree / College Diploma / Undergraduate", sort_order:3, is_active:1 },
  { id:14, question_key:'edu_levels', option_value:'Master',     option_label:"Master's Degree / Post-graduate",                  sort_order:4, is_active:1 },
  { id:15, question_key:'edu_levels', option_value:'PhD',        option_label:'Doctoral / PhD',                                    sort_order:5, is_active:1 },
  { id:16, question_key:'edu_levels', option_value:'ESL',        option_label:'English as a Second Language (ESL)',               sort_order:6, is_active:1 },
  // Budget
  { id:17, question_key:'budget', option_value:'10k_or_less', option_label:'~$10K or less',                           sort_order:1, is_active:1 },
  { id:18, question_key:'budget', option_value:'10k_20k',     option_label:'~$10K–$20K',                              sort_order:2, is_active:1 },
  { id:19, question_key:'budget', option_value:'20k_plus',    option_label:'More than $20K',                          sort_order:3, is_active:1 },
  { id:20, question_key:'budget', option_value:'loan',        option_label:'I would like to apply for an education loan', sort_order:4, is_active:1 },
  // Fields of study
  { id:21, question_key:'fields_of_study', option_value:'Accounting',           option_label:'Accounting',            sort_order:1,  is_active:1 },
  { id:22, question_key:'fields_of_study', option_value:'Architecture',         option_label:'Architecture',          sort_order:2,  is_active:1 },
  { id:23, question_key:'fields_of_study', option_value:'Biology',              option_label:'Biology',               sort_order:3,  is_active:1 },
  { id:24, question_key:'fields_of_study', option_value:'Business & Management',option_label:'Business & Management', sort_order:4,  is_active:1 },
  { id:25, question_key:'fields_of_study', option_value:'Computer Science & IT',option_label:'Computer Science & IT', sort_order:5,  is_active:1 },
  { id:26, question_key:'fields_of_study', option_value:'Data Science & AI',    option_label:'Data Science & AI',     sort_order:6,  is_active:1 },
  { id:27, question_key:'fields_of_study', option_value:'Education',            option_label:'Education',             sort_order:7,  is_active:1 },
  { id:28, question_key:'fields_of_study', option_value:'Engineering',          option_label:'Engineering',           sort_order:8,  is_active:1 },
  { id:29, question_key:'fields_of_study', option_value:'Finance & Accounting', option_label:'Finance & Accounting',  sort_order:9,  is_active:1 },
  { id:30, question_key:'fields_of_study', option_value:'Health Sciences',      option_label:'Health Sciences',       sort_order:10, is_active:1 },
  { id:31, question_key:'fields_of_study', option_value:'Law',                  option_label:'Law',                   sort_order:11, is_active:1 },
  { id:32, question_key:'fields_of_study', option_value:'Media & Communications',option_label:'Media & Communications',sort_order:12,is_active:1 },
  { id:33, question_key:'fields_of_study', option_value:'Nursing',              option_label:'Nursing',               sort_order:13, is_active:1 },
  { id:34, question_key:'fields_of_study', option_value:'Psychology',           option_label:'Psychology',            sort_order:14, is_active:1 },
  { id:35, question_key:'fields_of_study', option_value:'Tourism & Hospitality',option_label:'Tourism & Hospitality', sort_order:15, is_active:1 },
];

async function ensureTables() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS \`preference_options\` (
        \`id\`           INT AUTO_INCREMENT PRIMARY KEY,
        \`question_key\` VARCHAR(50) NOT NULL,
        \`option_value\` VARCHAR(100) NOT NULL,
        \`option_label\` VARCHAR(200) NOT NULL,
        \`sort_order\`   INT DEFAULT 0,
        \`is_active\`    TINYINT(1) DEFAULT 1,
        \`created_at\`   DATETIME DEFAULT NOW()
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS \`student_preferences\` (
        \`id\`              INT AUTO_INCREMENT PRIMARY KEY,
        \`student_id\`      INT NOT NULL UNIQUE,
        \`study_countries\` TEXT DEFAULT NULL,
        \`edu_levels\`      TEXT DEFAULT NULL,
        \`fields_of_study\` TEXT DEFAULT NULL,
        \`budget\`          VARCHAR(50) DEFAULT NULL,
        \`start_dates\`     TEXT DEFAULT NULL,
        \`nationality_id\`  INT DEFAULT NULL,
        \`completed\`       TINYINT(1) DEFAULT 0,
        \`updated_at\`      DATETIME DEFAULT NOW()
      )
    `);
    // Seed defaults if empty
    const [{ cnt }] = await query('SELECT COUNT(*) AS cnt FROM preference_options');
    if (cnt === 0) {
      for (const o of DEFAULT_OPTIONS) {
        await query(
          'INSERT IGNORE INTO preference_options (question_key,option_value,option_label,sort_order,is_active) VALUES (?,?,?,?,?)',
          [o.question_key, o.option_value, o.option_label, o.sort_order, o.is_active]
        );
      }
    }
    return true;
  } catch { return false; }
}

async function handler(req, res) {
  const { role, userId } = req.user;

  if (req.method === 'GET') {
    try {
      await ensureTables();
      const options = await query('SELECT * FROM preference_options WHERE is_active=1 ORDER BY question_key, sort_order', []);
      let prefs = null;
      if (role === 'student') {
        const s = await queryOne('SELECT id FROM students WHERE user_id=?', [userId]);
        if (s) prefs = await queryOne('SELECT * FROM student_preferences WHERE student_id=?', [s.id]);
      }
      return res.json({ options, prefs });
    } catch(e) {
      console.error('[preferences GET]', e.message);
      // Return defaults in-memory if DB completely unavailable
      return res.json({ options: DEFAULT_OPTIONS, prefs: null });
    }
  }

  if (req.method === 'POST') {
    const { student_id, ...data } = req.body;
    try {
      await ensureTables();
      const sid = student_id || (await queryOne('SELECT id FROM students WHERE user_id=?', [userId]))?.id;
      if (!sid) return res.status(400).json({ error: 'Student not found' });
      const j = v => v ? JSON.stringify(v) : null;
      await query(`
        INSERT INTO student_preferences
          (student_id, study_countries, edu_levels, fields_of_study, budget, start_dates, nationality_id, completed, updated_at)
        VALUES (?,?,?,?,?,?,?,?,NOW())
        ON DUPLICATE KEY UPDATE
          study_countries=VALUES(study_countries), edu_levels=VALUES(edu_levels),
          fields_of_study=VALUES(fields_of_study), budget=VALUES(budget),
          start_dates=VALUES(start_dates), nationality_id=VALUES(nationality_id),
          completed=VALUES(completed), updated_at=NOW()
      `, [sid, j(data.study_countries), j(data.edu_levels), j(data.fields_of_study),
          data.budget||null, j(data.start_dates), data.nationality_id||null, data.completed?1:0]);
      return res.json({ message: 'Saved' });
    } catch(e) {
      console.error('[preferences POST]', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'PUT') {
    if (!['admin','custom'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { options } = req.body;
    try {
      await ensureTables();
      for (const opt of (options||[])) {
        if (opt.id && opt.id < 10000) {
          await query(
            'UPDATE preference_options SET option_label=?, option_value=?, is_active=?, sort_order=? WHERE id=?',
            [opt.option_label, opt.option_value, opt.is_active?1:0, opt.sort_order||0, opt.id]
          );
        } else {
          await query(
            'INSERT INTO preference_options (question_key, option_value, option_label, sort_order, is_active) VALUES (?,?,?,?,?)',
            [opt.question_key, opt.option_value, opt.option_label, opt.sort_order||0, 1]
          );
        }
      }
      return res.json({ message: 'Updated' });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    if (!['admin','custom'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.body;
    try {
      await ensureTables();
      await query('DELETE FROM preference_options WHERE id=?', [id]);
      return res.json({ message: 'Deleted' });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, ['admin','agent','student','custom']);