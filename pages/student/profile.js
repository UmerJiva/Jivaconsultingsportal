// pages/student/profile.js — Complete student self-service profile
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import StudentLayout from '../../components/layout/StudentLayout';
import {
  CheckCircle, ArrowRight, ChevronDown, ChevronUp, Save,
  Upload, AlertCircle, Info, Star, Loader2, X
} from 'lucide-react';

const SECTIONS = [
  { id:'personal',     label:'Personal Information',   icon:'👤' },
  { id:'contact',      label:'Contact & Address',      icon:'📍' },
  { id:'background',   label:'Background Information', icon:'🛂' },
  { id:'education',    label:'Education History',      icon:'🎓' },
  { id:'tests',        label:'Test Scores',            icon:'📝' },
];

const COUNTRIES = ['Pakistan','Canada','United Kingdom','United States','Australia','Germany','UAE','Turkey','Malaysia','Singapore','India','Bangladesh','France','Netherlands','Sweden','Norway'];
const PROVINCES = {
  Pakistan:       ['Punjab','Sindh','KPK','Balochistan','Islamabad'],
  Canada:         ['Ontario','British Columbia','Alberta','Quebec','Manitoba'],
  'United Kingdom':['England','Scotland','Wales','Northern Ireland'],
  'United States':['California','New York','Texas','Florida','Illinois'],
};
const EDU_LEVELS = [
  'High School / O-Levels','A-Levels / FSc / ICS / ICOM',
  'Diploma','Certificate','Associate Degree',
  "Bachelor's Degree",'Post-Graduate Diploma',
  "Master's Degree",'MPhil','Doctoral / PhD',
];

// Grade fields per education level
const EDU_GRADE_FIELDS = {
  'High School / O-Levels':     ['subjects','grades'],
  'A-Levels / FSc / ICS / ICOM':['subjects','grades','marks','percentage'],
  'Diploma':                    ['gpa','grade_scale'],
  'Certificate':                ['gpa','grade_scale'],
  'Associate Degree':           ['gpa','grade_scale'],
  "Bachelor's Degree":          ['gpa','grade_scale'],
  'Post-Graduate Diploma':      ['gpa','grade_scale'],
  "Master's Degree":            ['gpa','grade_scale'],
  'MPhil':                      ['gpa','grade_scale'],
  'Doctoral / PhD':             ['gpa','grade_scale','thesis'],
};

const inp = "w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 bg-white transition-colors placeholder-slate-300";
const sel = "w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 bg-white transition-colors";

function SectionBlock({ id, label, icon, active, done, onToggle, children }) {
  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden mb-4 shadow-sm transition-all
      ${active ? 'border-brand-400' : done ? 'border-emerald-300' : 'border-slate-200'}`}>
      <button onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-bold text-slate-800">{label}</span>
          {done && !active && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
        {active ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      {active && (
        <div className="px-6 pb-6 border-t-2 border-brand-100 pt-5">{children}</div>
      )}
    </div>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Radio({ name, value, checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <div onClick={onChange}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer shrink-0 transition-all
          ${checked ? 'border-brand-600 bg-brand-600' : 'border-slate-300 hover:border-brand-400'}`}>
        {checked && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

export default function StudentProfile() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('personal');
  const [saved, setSaved]   = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [studentId, setStudentId] = useState(null);
  const [scanning, setScanning]   = useState(false);
  const passportRef = useRef(null);
  const nameProofRef = useRef(null);
  const [passportFile, setPassportFile] = useState(null);
  const [countries, setCountries] = useState([]);

  // ── Form state ────────────────────────────────────────────
  const [personal, setPersonal] = useState({
    first_name:'', middle_name:'', last_name:'', date_of_birth:'',
    gender:'', marital_status:'', native_language:'', other_language:'',
    country_id:'', passport_no:'', passport_expiry:'',
  });
  const [contact, setContact] = useState({
    phone:'', address_line:'', city:'', address_country:'', province:'', postal_code:'',
    different_name:'no', alt_first_name:'', alt_middle_name:'', alt_last_name:'',
  });
  const [background, setBackground] = useState({
    refused_visa:'', study_permit_type:'', background_details:'',
    has_visa: false, visa_country:'', visa_type:'', visa_expiry:'',
  });
  const [education, setEducation] = useState({
    education_level:'', institution_name:'', edu_country:'', grad_year:'', start_year:'',
    field_of_study:'', degree_name:'',
    gpa:'', grade_scale:'4.0', marks:'', percentage:'', subjects:'', grades:'', thesis:'',
  });
  const [tests, setTests] = useState({
    language_status:'has_proof', english_exam_type:'', open_to_esl: false,
    ielts_score:'', ielts_date:'', ielts_l:'', ielts_r:'', ielts_w:'', ielts_s:'',
    toefl_score:'', pte_score:'', duolingo_score:'',
    has_gre: false, gre_date:'', gre_v_score:'', gre_v_rank:'', gre_q_score:'', gre_q_rank:'', gre_w_score:'', gre_w_rank:'',
    has_gmat: false, gmat_date:'', gmat_v_score:'', gmat_v_rank:'', gmat_q_score:'', gmat_q_rank:'', gmat_w_score:'', gmat_w_rank:'', gmat_total_score:'', gmat_total_rank:'',
  });

  function sp(k,v) { setPersonal(p=>({...p,[k]:v})); }
  function sc(k,v) { setContact(p=>({...p,[k]:v})); }
  function sb(k,v) { setBackground(p=>({...p,[k]:v})); }
  function se(k,v) { setEducation(p=>({...p,[k]:v})); }
  function st(k,v) { setTests(p=>({...p,[k]:v})); }

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(async d => {
      if (!d.user?.userId) return;
      // Load student data
      const res = await fetch(`/api/students/${d.user.userId}?by_user=1`).catch(()=>null);
      if (!res?.ok) return;
      const data = await res.json();
      const s = data.student || data;
      if (!s) return;
      setStudentId(s.id);
      setPersonal({
        first_name: s.first_name||'', middle_name: s.middle_name||'', last_name: s.last_name||'',
        date_of_birth: s.date_of_birth?.split('T')[0]||'', gender: s.gender||'',
        marital_status: s.marital_status||'', native_language: s.native_language||'',
        other_language: s.other_language||'', country_id: s.country_id||'',
        passport_no: s.passport_no||'', passport_expiry: s.passport_expiry?.split('T')[0]||'',
      });
      setContact({
        phone: s.phone||'', address_line: s.address_line||'', city: s.city||'',
        address_country: s.address_country||'', province: s.province||'', postal_code: s.postal_code||'',
        different_name: s.different_name||'no', alt_first_name: s.alt_first_name||'',
        alt_middle_name: s.alt_middle_name||'', alt_last_name: s.alt_last_name||'',
      });
      setBackground({
        refused_visa: s.refused_visa ? 'Yes' : (s.refused_visa===0?'No':''),
        study_permit_type: s.study_permit_type||'',
        background_details: s.background_details||'',
        has_visa: !!s.has_visa, visa_country: s.visa_country||'',
        visa_type: s.visa_type||'', visa_expiry: s.visa_expiry?.split('T')[0]||'',
      });
      setEducation({
        education_level: s.education_level||'', institution_name: s.institution_name||'',
        edu_country: s.edu_country||'', grad_year: s.grad_year||'', start_year: s.start_year||'',
        field_of_study: s.field_of_study||'', degree_name: s.degree_name||'',
        gpa: s.gpa||'', grade_scale: s.grade_scale||'4.0',
        marks: s.marks||'', percentage: s.percentage||'',
        subjects: s.subjects||'', grades: s.grades||'', thesis: s.thesis||'',
      });
      setTests({
        language_status: s.language_status||'has_proof', english_exam_type: s.english_exam_type||'',
        open_to_esl: !!s.open_to_esl,
        ielts_score: s.ielts_score||'', ielts_date: s.ielts_date?.split('T')[0]||'',
        ielts_l: s.ielts_l||'', ielts_r: s.ielts_r||'', ielts_w: s.ielts_w||'', ielts_s: s.ielts_s||'',
        toefl_score: s.toefl_score||'', pte_score: s.pte_score||'', duolingo_score: s.duolingo_score||'',
        has_gre: !!s.has_gre, gre_date: s.gre_date?.split('T')[0]||'',
        gre_v_score: s.gre_v_score||'', gre_v_rank: s.gre_v_rank||'',
        gre_q_score: s.gre_q_score||'', gre_q_rank: s.gre_q_rank||'',
        gre_w_score: s.gre_w_score||'', gre_w_rank: s.gre_w_rank||'',
        has_gmat: !!s.has_gmat, gmat_date: s.gmat_date?.split('T')[0]||'',
        gmat_v_score: s.gmat_v_score||'', gmat_v_rank: s.gmat_v_rank||'',
        gmat_q_score: s.gmat_q_score||'', gmat_q_rank: s.gmat_q_rank||'',
        gmat_w_score: s.gmat_w_score||'', gmat_w_rank: s.gmat_w_rank||'',
        gmat_total_score: s.gmat_total_score||'', gmat_total_rank: s.gmat_total_rank||'',
      });
    });
    fetch('/api/countries').then(r=>r.json()).then(d=>setCountries(d.countries||[]));
    if (router.query.section) setActiveSection(router.query.section);
  }, [router.query.section]);

  // ── Passport autofill ─────────────────────────────────────
  async function handlePassportScan(file) {
    if (!file) return;
    setPassportFile(file);
    setScanning(true); setError('');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514', max_tokens: 800,
            messages: [{ role: 'user', content: [
              { type: 'image', source: { type: 'base64', media_type: file.type||'image/jpeg', data: base64 } },
              { type: 'text', text: 'Extract passport details. Return ONLY JSON: {first_name, middle_name, last_name, date_of_birth (YYYY-MM-DD), passport_no, passport_expiry (YYYY-MM-DD), gender (Male/Female), nationality}. Empty string for missing fields.' }
            ]}]
          })
        });
        const data = await response.json();
        const parsed = JSON.parse((data.content?.[0]?.text||'{}').replace(/```json|```/g,'').trim());
        const matchedCountry = countries.find(c =>
          c.name.toLowerCase().includes((parsed.nationality||'').toLowerCase()) ||
          (parsed.nationality||'').toLowerCase().includes(c.name.toLowerCase())
        );
        setPersonal(p => ({
          ...p,
          first_name:      parsed.first_name      || p.first_name,
          middle_name:     parsed.middle_name     || p.middle_name,
          last_name:       parsed.last_name       || p.last_name,
          date_of_birth:   parsed.date_of_birth   || p.date_of_birth,
          passport_no:     parsed.passport_no     || p.passport_no,
          passport_expiry: parsed.passport_expiry || p.passport_expiry,
          gender:          parsed.gender          || p.gender,
          country_id:      matchedCountry?.id     || p.country_id,
        }));
      } catch { setError('Could not read passport. Please fill details manually.'); }
      setScanning(false);
    };
    reader.readAsDataURL(file);
  }

  // ── Save ──────────────────────────────────────────────────
  async function saveSection(sectionId) {
    if (!studentId) { setError('Student ID not found. Please refresh.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...personal, ...contact, ...education, ...tests,
        refused_visa: background.refused_visa === 'Yes' ? 1 : 0,
        has_visa: background.has_visa ? 1 : 0,
        visa_country: background.visa_country,
        visa_type: background.visa_type,
        visa_expiry: background.visa_expiry,
        study_permit_type: background.study_permit_type,
        background_details: background.background_details,
      };
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error||'Save failed'); }
      setSaved(p => ({ ...p, [sectionId]: true }));
      const idx = SECTIONS.findIndex(s => s.id === sectionId);
      if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx+1].id);
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  function toggle(id) { setActiveSection(s => s === id ? '' : id); }
  const completedCount = Object.keys(saved).length;

  const gradeFields = EDU_GRADE_FIELDS[education.education_level] || ['gpa','grade_scale'];

  function SaveBtn({ sectionId }) {
    return (
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
        {error && <div className="flex items-center gap-2 text-red-600 text-xs font-semibold"><AlertCircle className="w-4 h-4"/>{error}</div>}
        <button onClick={() => saveSection(sectionId)} disabled={saving} className="ml-auto flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
          Save & Continue
        </button>
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="text-5xl select-none">👥</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>My Profile</h1>
            <p className="text-slate-500 text-sm mt-0.5">Complete all sections to strengthen your applications</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sticky top-24">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Sections</p>
              {SECTIONS.map(sec => {
                const isActive = activeSection === sec.id;
                const isDone   = saved[sec.id];
                return (
                  <button key={sec.id} onClick={() => toggle(sec.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left mb-0.5
                      ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {isDone
                      ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0"/>
                      : <ArrowRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-400'}`}/>}
                    {sec.label}
                  </button>
                );
              })}
              <div className="mt-3 pt-3 border-t border-slate-100 px-3">
                <div className="text-xs text-slate-500 mb-1">{completedCount} of {SECTIONS.length} complete</div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{width:`${(completedCount/SECTIONS.length)*100}%`}}/>
                </div>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="flex-1 min-w-0">

            {/* ── PERSONAL ── */}
            <SectionBlock id="personal" label="Personal Information" icon="👤"
              active={activeSection==='personal'} done={saved.personal} onToggle={toggle}>

              {/* Passport autofill */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 mb-6 text-center hover:border-brand-300 transition-colors">
                <input ref={passportRef} type="file" className="hidden" accept="image/*,.pdf" onChange={e=>handlePassportScan(e.target.files[0])}/>
                {scanning ? (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Loader2 className="w-5 h-5 text-brand-600 animate-spin"/>
                    <span className="text-sm text-brand-600 font-semibold">Reading your passport…</span>
                  </div>
                ) : passportFile ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-emerald-700 font-semibold"><CheckCircle className="w-4 h-4 text-emerald-500"/>{passportFile.name} — auto-filled</span>
                    <button onClick={()=>passportRef.current?.click()} className="text-xs text-brand-600 font-bold hover:underline">Change</button>
                  </div>
                ) : (
                  <>
                    <button onClick={()=>passportRef.current?.click()} className="flex items-center gap-2 mx-auto border-2 border-brand-400 text-brand-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-brand-50 transition-colors">
                      <Upload className="w-4 h-4"/> Autofill with passport
                    </button>
                    <p className="text-xs text-slate-400 mt-2">Upload your passport image to auto-fill your details. Optional but recommended.</p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="First name" required><input className={inp} placeholder="Aisha" value={personal.first_name} onChange={e=>sp('first_name',e.target.value)}/></Field>
                <Field label="Middle name"><input className={inp} placeholder="(optional)" value={personal.middle_name} onChange={e=>sp('middle_name',e.target.value)}/></Field>
                <Field label="Last name" required><input className={inp} placeholder="Khan" value={personal.last_name} onChange={e=>sp('last_name',e.target.value)}/></Field>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="Date of birth" required><input type="date" className={inp} value={personal.date_of_birth} onChange={e=>sp('date_of_birth',e.target.value)}/></Field>
                <Field label="Native / First language" required><input className={inp} placeholder="Urdu" value={personal.native_language} onChange={e=>sp('native_language',e.target.value)}/></Field>
                <Field label="Other language(s)"><input className={inp} placeholder="English, Arabic…" value={personal.other_language} onChange={e=>sp('other_language',e.target.value)}/></Field>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Country of citizenship" required>
                  <select className={sel} value={personal.country_id} onChange={e=>sp('country_id',e.target.value)}>
                    <option value="">Select country</option>
                    {countries.length ? countries.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)
                      : COUNTRIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Passport number" hint="Strongly recommended"><input className={inp} placeholder="AB1234567" value={personal.passport_no} onChange={e=>sp('passport_no',e.target.value)}/></Field>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Passport expiry date"><input type="date" className={inp} value={personal.passport_expiry} onChange={e=>sp('passport_expiry',e.target.value)}/></Field>
              </div>
              <div className="grid grid-cols-2 gap-8 mb-2">
                <Field label="Marital status" required>
                  <div className="space-y-2 mt-1">
                    {['Single','Married','Divorced','Widowed'].map(opt=>(
                      <Radio key={opt} name="marital" value={opt} checked={personal.marital_status===opt} onChange={()=>sp('marital_status',opt)} label={opt}/>
                    ))}
                  </div>
                </Field>
                <Field label="Gender" required>
                  <div className="space-y-2 mt-1">
                    {['Male','Female','Non-binary','Prefer not to say'].map(opt=>(
                      <Radio key={opt} name="gender" value={opt} checked={personal.gender===opt} onChange={()=>sp('gender',opt)} label={opt}/>
                    ))}
                  </div>
                </Field>
              </div>
              <SaveBtn sectionId="personal"/>
            </SectionBlock>

            {/* ── CONTACT & NAME DISCREPANCY ── */}
            <SectionBlock id="contact" label="Contact & Address" icon="📍"
              active={activeSection==='contact'} done={saved.contact} onToggle={toggle}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Street Address" required><input className={inp} placeholder="House #12, Street 4" value={contact.address_line} onChange={e=>sc('address_line',e.target.value)}/></Field>
                <Field label="City / Town" required><input className={inp} placeholder="Karachi" value={contact.city} onChange={e=>sc('city',e.target.value)}/></Field>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="Country" required>
                  <select className={sel} value={contact.address_country} onChange={e=>sc('address_country',e.target.value)}>
                    <option value="">Select</option>
                    {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Province / State" required>
                  <select className={sel} value={contact.province} onChange={e=>sc('province',e.target.value)}>
                    <option value="">Select</option>
                    {(PROVINCES[contact.address_country]||[]).map(p=><option key={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Postal / Zip Code"><input className={inp} placeholder="75500" value={contact.postal_code} onChange={e=>sc('postal_code',e.target.value)}/></Field>
              </div>
              <Field label="Phone Number" required>
                <input className={inp} placeholder="+92 300 1234567" value={contact.phone} onChange={e=>sc('phone',e.target.value)}/>
              </Field>

              {/* Name discrepancy */}
              <div className="mt-5 border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  Do any of your documents show a different name than your passport? <span className="text-red-500">*</span>
                </p>
                <div className="flex gap-6 mb-3">
                  {['yes','no'].map(v=>(
                    <Radio key={v} name="diff_name" value={v} checked={contact.different_name===v} onChange={()=>sc('different_name',v)} label={v==='yes'?'Yes':'No'}/>
                  ))}
                </div>
                {contact.different_name === 'yes' && (
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Alternate First Name" required><input className={inp} value={contact.alt_first_name} onChange={e=>sc('alt_first_name',e.target.value)} placeholder="First"/></Field>
                      <Field label="Alternate Middle Name"><input className={inp} value={contact.alt_middle_name} onChange={e=>sc('alt_middle_name',e.target.value)} placeholder="Middle"/></Field>
                      <Field label="Alternate Last Name"><input className={inp} value={contact.alt_last_name} onChange={e=>sc('alt_last_name',e.target.value)} placeholder="Last"/></Field>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Upload Proof of Name Change <span className="text-red-500">*</span></p>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center cursor-pointer hover:border-brand-300 transition-colors" onClick={()=>nameProofRef.current?.click()}>
                        <input ref={nameProofRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"/>
                        <p className="text-xs text-slate-400">Drag and drop, or <span className="text-brand-600 font-semibold">Browse Files</span></p>
                        <p className="text-[10px] text-slate-300 mt-1">PDF, JPEG or PNG · Max 20MB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <SaveBtn sectionId="contact"/>
            </SectionBlock>

            {/* ── BACKGROUND INFORMATION ── */}
            <SectionBlock id="background" label="Background Information" icon="🛂"
              active={activeSection==='background'} done={saved.background} onToggle={toggle}>
              <div className="space-y-5">

                {/* Visa refusal */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    Have you been refused a visa from Canada, the USA, the United Kingdom, New Zealand, Australia or Ireland? <span className="text-red-500">*</span>
                  </p>
                  <div className="flex gap-6">
                    {['Yes','No'].map(v=>(
                      <Radio key={v} name="refused" value={v} checked={background.refused_visa===v} onChange={()=>sb('refused_visa',v)} label={v}/>
                    ))}
                  </div>
                </div>

                {/* Study permit */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Do you have a valid Study Permit / Visa?</p>
                  <select className={sel} value={background.study_permit_type} onChange={e=>sb('study_permit_type',e.target.value)}>
                    <option value=""></option>
                    <option value="Yes - Study Permit">Yes — Study Permit</option>
                    <option value="Yes - Visitor Visa">Yes — Visitor Visa</option>
                    <option value="Yes - Work Permit">Yes — Work Permit</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Visa details */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <label className="flex items-center gap-2.5 cursor-pointer mb-3">
                    <input type="checkbox" checked={background.has_visa} onChange={e=>sb('has_visa',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                    <span className="text-sm font-semibold text-slate-700">I currently hold a valid visa</span>
                  </label>
                  {background.has_visa && (
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200">
                      <Field label="Country Issued By">
                        <select className={sel} value={background.visa_country} onChange={e=>sb('visa_country',e.target.value)}>
                          <option value="">Select</option>
                          {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                        </select>
                      </Field>
                      <Field label="Visa Type">
                        <select className={sel} value={background.visa_type} onChange={e=>sb('visa_type',e.target.value)}>
                          <option value="">Select</option>
                          {['Student Visa','Work Visa','Tourist Visa','Residence Permit','Other'].map(t=><option key={t}>{t}</option>)}
                        </select>
                      </Field>
                      <Field label="Expiry Date"><input type="date" className={inp} value={background.visa_expiry} onChange={e=>sb('visa_expiry',e.target.value)}/></Field>
                    </div>
                  )}
                </div>

                {/* Details box — show if any yes answer */}
                {(background.refused_visa === 'Yes' || (background.study_permit_type && background.study_permit_type !== 'No')) && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">If you answered 'Yes' to any of the questions above, please provide more details:</p>
                    <textarea rows={3} className={inp+' resize-none'} value={background.background_details} onChange={e=>sb('background_details',e.target.value)} placeholder="Please provide details…"/>
                  </div>
                )}
              </div>
              <SaveBtn sectionId="background"/>
            </SectionBlock>

            {/* ── EDUCATION ── */}
            <SectionBlock id="education" label="Education History" icon="🎓"
              active={activeSection==='education'} done={saved.education} onToggle={toggle}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Education Level" required>
                    <select className={sel} value={education.education_level} onChange={e=>se('education_level',e.target.value)}>
                      <option value="">Select level</option>
                      {EDU_LEVELS.map(l=><option key={l}>{l}</option>)}
                    </select>
                  </Field>
                  <Field label="Institution Name" required><input className={inp} placeholder="University of Karachi" value={education.institution_name} onChange={e=>se('institution_name',e.target.value)}/></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Degree / Qualification Name"><input className={inp} placeholder="BSc Computer Science" value={education.degree_name} onChange={e=>se('degree_name',e.target.value)}/></Field>
                  <Field label="Field of Study"><input className={inp} placeholder="Computer Science" value={education.field_of_study} onChange={e=>se('field_of_study',e.target.value)}/></Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Country of Study" required>
                    <select className={sel} value={education.edu_country} onChange={e=>se('edu_country',e.target.value)}>
                      <option value="">Select</option>
                      {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Start Year"><input type="number" className={inp} placeholder="2019" min="1980" max="2030" value={education.start_year} onChange={e=>se('start_year',e.target.value)}/></Field>
                  <Field label="Graduation Year" required><input type="number" className={inp} placeholder="2023" min="1980" max="2030" value={education.grad_year} onChange={e=>se('grad_year',e.target.value)}/></Field>
                </div>

                {/* Dynamic grade fields by level */}
                {education.education_level && (
                  <div className="border-2 border-brand-100 bg-brand-50/30 rounded-2xl p-4 space-y-3">
                    <div className="text-xs font-bold text-brand-600 uppercase tracking-wider">Grades for {education.education_level}</div>
                    {gradeFields.includes('gpa') && (
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="GPA / Score" required><input type="number" step="0.01" className={inp} placeholder="3.5" min="0" max="10" value={education.gpa} onChange={e=>se('gpa',e.target.value)}/></Field>
                        <Field label="Grade Scale">
                          <select className={sel} value={education.grade_scale} onChange={e=>se('grade_scale',e.target.value)}>
                            {['4.0','5.0','10.0','100%','CGPA','Distinction/Merit/Pass'].map(s=><option key={s}>{s}</option>)}
                          </select>
                        </Field>
                      </div>
                    )}
                    {gradeFields.includes('marks') && (
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Total Marks Obtained"><input type="number" className={inp} placeholder="900" value={education.marks} onChange={e=>se('marks',e.target.value)}/></Field>
                        <Field label="Percentage (%)"><input type="number" step="0.01" className={inp} placeholder="82.5" min="0" max="100" value={education.percentage} onChange={e=>se('percentage',e.target.value)}/></Field>
                      </div>
                    )}
                    {gradeFields.includes('subjects') && (
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Subjects" hint="Comma separated"><input className={inp} placeholder="Physics, Chemistry, Math" value={education.subjects} onChange={e=>se('subjects',e.target.value)}/></Field>
                        <Field label="Grades / Results" hint="Comma separated"><input className={inp} placeholder="A, B+, A*" value={education.grades} onChange={e=>se('grades',e.target.value)}/></Field>
                      </div>
                    )}
                    {gradeFields.includes('thesis') && (
                      <Field label="Thesis Title (if applicable)"><input className={inp} placeholder="Research thesis title" value={education.thesis} onChange={e=>se('thesis',e.target.value)}/></Field>
                    )}
                  </div>
                )}
              </div>
              <SaveBtn sectionId="education"/>
            </SectionBlock>

            {/* ── TEST SCORES ── */}
            <SectionBlock id="tests" label="Test Scores" icon="📝"
              active={activeSection==='tests'} done={saved.tests} onToggle={toggle}>
              <div className="space-y-4">

                {/* Language status */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-sm font-bold text-slate-700 mb-3">English Language Proficiency</p>
                  <div className="space-y-3">
                    {[
                      { v:'has_proof',       label:'I have or will have proof of language proficiency before I apply.' },
                      { v:'no_test_delayed', label:'I have not taken a language test and will only apply to programs allowing proof after acceptance.' },
                      { v:'exemption',       label:'I believe my academic or nationality background may qualify me for an exemption.' },
                      { v:'no_plan',         label:'I have not taken a language test, and do not plan to take one.' },
                    ].map(opt=>(
                      <Radio key={opt.v} name="lang_status" value={opt.v} checked={tests.language_status===opt.v} onChange={()=>st('language_status',opt.v)} label={opt.label}/>
                    ))}
                  </div>

                  {tests.language_status === 'no_test_delayed' && (
                    <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mt-3 text-xs text-blue-700">
                      <Info className="w-4 h-4 shrink-0 mt-0.5"/>
                      Note: You will be able to apply for conditional admission by enrolling in an ESL program if the academic program does not accept delayed submission of English Language Proficiency scores.
                    </div>
                  )}

                  <label className="flex items-center gap-2.5 cursor-pointer mt-3">
                    <input type="checkbox" checked={tests.open_to_esl} onChange={e=>st('open_to_esl',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                    <span className="text-sm text-slate-700">I'm open to taking a language proficiency course before starting my academic program.</span>
                  </label>

                  {/* English exam details */}
                  {tests.language_status === 'has_proof' && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                      <Field label="English exam type" required>
                        <select className={sel} value={tests.english_exam_type} onChange={e=>st('english_exam_type',e.target.value)}>
                          <option value="">Select</option>
                          {['IELTS','TOEFL','PTE','Duolingo','Cambridge (CAE/CPE)'].map(t=><option key={t}>{t}</option>)}
                        </select>
                      </Field>
                      {tests.english_exam_type === 'IELTS' && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">IELTS</div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Overall Band Score"><input type="number" step="0.5" min="0" max="9" className={inp} value={tests.ielts_score} onChange={e=>st('ielts_score',e.target.value)} placeholder="7.0"/></Field>
                            <Field label="Test Date"><input type="date" className={inp} value={tests.ielts_date} onChange={e=>st('ielts_date',e.target.value)}/></Field>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {[['Listening','ielts_l'],['Reading','ielts_r'],['Writing','ielts_w'],['Speaking','ielts_s']].map(([label,key])=>(
                              <Field key={key} label={label}><input type="number" step="0.5" min="0" max="9" className={inp} value={tests[key]} onChange={e=>st(key,e.target.value)} placeholder="7.0"/></Field>
                            ))}
                          </div>
                        </div>
                      )}
                      {tests.english_exam_type === 'TOEFL' && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">TOEFL iBT</div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Total Score"><input type="number" className={inp} value={tests.toefl_score} onChange={e=>st('toefl_score',e.target.value)} placeholder="100"/></Field>
                            <Field label="Test Date"><input type="date" className={inp}/></Field>
                          </div>
                        </div>
                      )}
                      {tests.english_exam_type === 'PTE' && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">PTE Academic</div>
                          <Field label="Score"><input type="number" className={inp} value={tests.pte_score} onChange={e=>st('pte_score',e.target.value)} placeholder="65"/></Field>
                        </div>
                      )}
                      {tests.english_exam_type === 'Duolingo' && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duolingo English Test</div>
                          <Field label="Score"><input type="number" className={inp} value={tests.duolingo_score} onChange={e=>st('duolingo_score',e.target.value)} placeholder="110"/></Field>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* GRE */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={tests.has_gre} onChange={e=>st('has_gre',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                    <span className="text-sm font-semibold text-slate-700">I have GRE exam scores</span>
                  </label>
                  {tests.has_gre && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                      <Field label="GRE Exam Date" required><input type="date" className={inp} value={tests.gre_date} onChange={e=>st('gre_date',e.target.value)}/></Field>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr><th className="text-left pb-2 font-bold text-slate-500 text-xs uppercase"></th>{['Verbal','Quantitative','Writing'].map(c=><th key={c} className="pb-2 font-bold text-slate-600 text-xs text-center">{c}</th>)}</tr></thead>
                          <tbody>
                            {[['Score','gre_v_score','gre_q_score','gre_w_score'],['Rank','gre_v_rank','gre_q_rank','gre_w_rank']].map(([label,...keys])=>(
                              <tr key={label}><td className="pr-3 py-1 text-xs text-slate-500 font-semibold">{label}</td>
                                {keys.map(k=><td key={k} className="py-1 px-1"><input className={inp} value={tests[k]} onChange={e=>st(k,e.target.value)} placeholder="—"/></td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* GMAT */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={tests.has_gmat} onChange={e=>st('has_gmat',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                    <span className="text-sm font-semibold text-slate-700">I have GMAT exam scores</span>
                  </label>
                  {tests.has_gmat && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                      <Field label="GMAT Exam Date" required><input type="date" className={inp} value={tests.gmat_date} onChange={e=>st('gmat_date',e.target.value)}/></Field>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr><th className="text-left pb-2 font-bold text-slate-500 text-xs uppercase"></th>{['Verbal','Quantitative','Writing','Total'].map(c=><th key={c} className="pb-2 font-bold text-slate-600 text-xs text-center">{c}</th>)}</tr></thead>
                          <tbody>
                            {[['Score','gmat_v_score','gmat_q_score','gmat_w_score','gmat_total_score'],['Rank','gmat_v_rank','gmat_q_rank','gmat_w_rank','gmat_total_rank']].map(([label,...keys])=>(
                              <tr key={label}><td className="pr-3 py-1 text-xs text-slate-500 font-semibold">{label}</td>
                                {keys.map(k=><td key={k} className="py-1 px-1"><input className={inp} value={tests[k]} onChange={e=>st(k,e.target.value)} placeholder="—"/></td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <SaveBtn sectionId="tests"/>
            </SectionBlock>

          </div>
        </div>
      </div>
    </StudentLayout>
  );
}