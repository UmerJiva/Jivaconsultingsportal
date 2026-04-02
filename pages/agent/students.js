// pages/agent/students.js — identical UI to admin but agent-scoped + permission-gated
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Avatar, Spinner, EmptyState } from '../../components/ui/index';
import {
  Plus, Users, RefreshCw, Filter, Grid3x3, List,
  ArrowUpDown, ArrowUp, ArrowDown,
  Pencil, Trash2, Eye, ChevronLeft, ChevronRight,
  CheckCircle, AlertTriangle, X, Upload, Info, Lock
} from 'lucide-react';
import { apiCall } from '../../lib/useApi';
import usePermissions, { AccessDenied } from '../../lib/usePermissions';

// ── shared helpers ────────────────────────────────────────────
const APP_COLORS = ['','bg-amber-400','bg-blue-500','bg-emerald-500','bg-purple-500','bg-red-400'];
const APP_KEYS   = ['app_total','app_submitted','app_review','app_accepted','app_conditional','app_rejected'];
const APP_LABELS = ['Total','Submitted','Review','Accepted','Conditional','Rejected'];

function AppBadges({ row }) {
  const badges = APP_KEYS.slice(1).map((k,i)=>({ v:Number(row[k]||0), color:APP_COLORS[i+1], label:APP_LABELS[i+1] })).filter(b=>b.v>0);
  if (!badges.length) return <span className="text-xs text-slate-300">—</span>;
  return <div className="flex items-center gap-1 flex-wrap">{badges.map(b=><span key={b.label} title={`${b.label}: ${b.v}`} className={`${b.color} text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm`}>{b.v}</span>)}</div>;
}

function EducationCell({ level, verified }) {
  if (!level) return <span className="flex items-center gap-1 text-amber-600 text-xs font-medium"><AlertTriangle className="w-3.5 h-3.5"/>Education Missing</span>;
  return <span className="flex items-center gap-1 text-xs text-slate-700">{verified?<CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0"/>:<AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0"/>}{level}</span>;
}

function LeadBadge({ status }) {
  const map={'New':'bg-sky-50 text-sky-700 border-sky-200','Contacted':'bg-blue-50 text-blue-700 border-blue-200','In Progress':'bg-amber-50 text-amber-700 border-amber-200','Converted':'bg-emerald-50 text-emerald-700 border-emerald-200','Lost':'bg-red-50 text-red-600 border-red-200','On Hold':'bg-slate-100 text-slate-500 border-slate-200'};
  const cls=map[status]||'bg-slate-100 text-slate-500 border-slate-200';
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}><span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"/>{status||'New'}</span>;
}

const COUNTRIES=['Pakistan','Canada','United Kingdom','United States','Australia','Germany','UAE','Turkey','Malaysia','Singapore','India','Bangladesh'];
const LEAD_STATUSES=['New','Contacted','In Progress','Converted','Lost','On Hold'];
const RECRUITER_TYPES=['Owner','Staff','Partner'];
const EDU_LEVELS=['High School','Grade 10 (Pakistan)','Bachelors (Pakistan)','Bachelors (Turkey)','Masters (Pakistan)','Masters (Turkey)','PhD','Diploma','Certificate'];
const REFERRAL_SOURCES=['Website','Social Media','Referral','Agent','Email Campaign','Walk-in','Other'];
const SERVICES=['Undergraduate','Postgraduate','PhD','English Language','Diploma','Certificate','Foundation','Short Courses'];

const inp="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder-slate-300 transition-colors";
const sel="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 transition-colors";

function FL({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}{required&&<span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {hint&&<p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Add Student Modal ─────────────────────────────────────────
function AddStudentModal({ open, onClose, onSaved, countries: countryList, agents }) {
  const EMPTY = {
    first_name:'', middle_name:'', last_name:'', date_of_birth:'', country_id:'',
    passport_no:'', passport_expiry:'', gender:'',
    email:'', phone:'',
    different_name:'no', alt_first_name:'', alt_middle_name:'', alt_last_name:'',
    refused_visa:'', study_permit:'', background_details:'',
    language_status:'has_proof',
    english_exam_type:'',
    ielts_score:'', ielts_date:'', ielts_l:'', ielts_r:'', ielts_w:'', ielts_s:'',
    toefl_score:'', pte_score:'', duolingo_score:'',
    open_to_esl: false,
    has_gre: false,
    gre_date:'', gre_v_score:'', gre_v_rank:'', gre_q_score:'', gre_q_rank:'', gre_w_score:'', gre_w_rank:'',
    has_gmat: false,
    gmat_date:'', gmat_v_score:'', gmat_v_rank:'', gmat_q_score:'', gmat_q_rank:'', gmat_w_score:'', gmat_w_rank:'', gmat_total_score:'', gmat_total_rank:'',
    referral_source:'', country_of_interest:'', services_of_interest:[], lead_status:'New',
    recruiter_type:'Owner', education_level:'', agent_id:'', notes:'',
    consent: false,
  };

  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [scanning, setScanning] = useState(false);
  const [passportFile, setPassportFile] = useState(null);
  const passportRef = useRef(null);
  const nameProofRef = useRef(null);

  useEffect(() => { if (open) { setForm(EMPTY); setError(''); setPassportFile(null); } }, [open]);

  function f(k, v) { setForm(p => ({ ...p, [k]: v })); }
  function toggleService(s) {
    setForm(p => ({
      ...p,
      services_of_interest: p.services_of_interest.includes(s)
        ? p.services_of_interest.filter(x => x !== s)
        : [...p.services_of_interest, s]
    }));
  }

  async function handlePassportScan(file) {
    if (!file) return;
    setPassportFile(file);
    setScanning(true);
    setError('');
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        const mimeType = file.type || 'image/jpeg';
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1000,
              messages: [{
                role: 'user',
                content: [
                  { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
                  { type: 'text', text: 'Extract passport information from this image. Return ONLY a JSON object with these exact keys: first_name, middle_name, last_name, date_of_birth (YYYY-MM-DD format), passport_no, passport_expiry (YYYY-MM-DD format), gender (Male or Female), nationality. If a field is not visible return empty string. Return only raw JSON, no markdown.' }
                ]
              }]
            })
          });
          const data = await response.json();
          const text = data.content?.[0]?.text || '';
          const clean = text.replace(/```json|```/g,'').trim();
          const parsed = JSON.parse(clean);
          const matchedCountry = countryList.find(c =>
            c.name.toLowerCase().includes((parsed.nationality||'').toLowerCase()) ||
            (parsed.nationality||'').toLowerCase().includes(c.name.toLowerCase())
          );
          setForm(p => ({
            ...p,
            first_name: parsed.first_name||p.first_name, middle_name: parsed.middle_name||p.middle_name,
            last_name: parsed.last_name||p.last_name, date_of_birth: parsed.date_of_birth||p.date_of_birth,
            passport_no: parsed.passport_no||p.passport_no, passport_expiry: parsed.passport_expiry||p.passport_expiry,
            gender: parsed.gender||p.gender, country_id: matchedCountry?.id||p.country_id,
          }));
        } catch(err) { setError('Could not read passport. Please fill details manually.'); }
        setScanning(false);
      };
      reader.readAsDataURL(file);
    } catch { setError('Failed to scan passport.'); setScanning(false); }
  }

  async function handleSubmit() {
    if (!form.first_name || !form.last_name || !form.email || !form.country_id) {
      setError('First name, last name, email and country of citizenship are required.'); return;
    }
    if (!form.consent) { setError('Please confirm student consent before adding.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, services_of_interest: form.services_of_interest.join(','), password: 'Student@123' };
      delete payload.consent;
      await apiCall('/api/students', 'POST', payload);
      onSaved(); onClose();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!open) return null;

  const showEnglishExamFields = form.language_status === 'has_proof';
  const showEslNote = form.language_status === 'no_test_delayed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white h-full w-full max-w-lg flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Add new student</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

          <div>
            <h3 className="text-base font-bold text-slate-800 mb-4">Personal information</h3>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 mb-5 text-center hover:border-brand-300 transition-colors">
              <input ref={passportRef} type="file" className="hidden" accept="image/*,.pdf" onChange={e => handlePassportScan(e.target.files[0])} />
              {scanning ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="w-6 h-6 border-2 border-brand-600/30 border-t-brand-600 rounded-full animate-spin"/>
                  <p className="text-sm text-brand-600 font-semibold">Reading passport…</p>
                </div>
              ) : passportFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-500"/>{passportFile.name} — details auto-filled
                  </div>
                  <button onClick={() => passportRef.current?.click()} className="text-xs text-brand-600 font-bold hover:underline">Change</button>
                </div>
              ) : (
                <button onClick={() => passportRef.current?.click()} className="flex items-center gap-2 mx-auto border-2 border-brand-400 text-brand-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-brand-50 transition-colors">
                  <Upload className="w-4 h-4" /> Autofill with passport
                </button>
              )}
              {!passportFile && !scanning && <p className="text-xs text-slate-400 mt-2">Auto-complete this section by uploading the student's passport image or scan. Optional but recommended.</p>}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FL label="First name" required><input className={inp} placeholder="First name" value={form.first_name} onChange={e=>f('first_name',e.target.value)} /></FL>
                <FL label="Last name" required><input className={inp} placeholder="Last name" value={form.last_name} onChange={e=>f('last_name',e.target.value)} /></FL>
              </div>
              <FL label="Middle name"><input className={inp} placeholder="Middle name (optional)" value={form.middle_name} onChange={e=>f('middle_name',e.target.value)} /></FL>
              <FL label="Date of birth" required><input type="date" className={inp} value={form.date_of_birth} onChange={e=>f('date_of_birth',e.target.value)} /></FL>
              <FL label="Country of citizenship" required>
                <select className={sel} value={form.country_id} onChange={e=>f('country_id',e.target.value)}>
                  <option value="">Please choose a country</option>
                  {countryList.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                </select>
              </FL>
              <FL label="Passport number" hint="Passport number is optional, but strongly recommended."><input className={inp} placeholder="e.g. AB1234567" value={form.passport_no} onChange={e=>f('passport_no',e.target.value)} /></FL>
              <FL label="Passport expiry date"><input type="date" className={inp} value={form.passport_expiry} onChange={e=>f('passport_expiry',e.target.value)} /></FL>
              <FL label="Gender">
                <div className="flex gap-6 mt-1">
                  {['Male','Female'].map(g=>(
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="gender_add" value={g} checked={form.gender===g} onChange={()=>f('gender',g)} className="w-4 h-4 accent-brand-600" />
                      <span className="text-sm text-slate-700 font-medium">{g}</span>
                    </label>
                  ))}
                </div>
              </FL>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800 mb-4">Contact information</h3>
            <div className="space-y-4">
              <FL label="Student Email" required hint="This email will be used for the student's login account."><input type="email" className={inp} placeholder="student@email.com" value={form.email} onChange={e=>f('email',e.target.value)} /></FL>
              <FL label="Phone number"><input className={inp} placeholder="+92 300 1234567" value={form.phone} onChange={e=>f('phone',e.target.value)} /></FL>
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <p className="text-sm font-semibold text-slate-700 mb-3">Do any of your documents show a different name than your passport? <span className="text-red-500">*</span></p>
                <div className="flex gap-6 mb-3">
                  {['yes','no'].map(v=>(
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <div onClick={()=>f('different_name',v)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${form.different_name===v?'border-brand-600 bg-brand-600':'border-slate-300 hover:border-brand-400'}`}>
                        {form.different_name===v && <div className="w-2 h-2 rounded-full bg-white"/>}
                      </div>
                      <span className="text-sm text-slate-700 font-medium capitalize">{v}</span>
                    </label>
                  ))}
                </div>
                {form.different_name === 'yes' && (
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="grid grid-cols-3 gap-2">
                      <FL label="Alternate First Name" required><input className={inp} value={form.alt_first_name} onChange={e=>f('alt_first_name',e.target.value)} placeholder="First"/></FL>
                      <FL label="Alternate Middle Name"><input className={inp} value={form.alt_middle_name} onChange={e=>f('alt_middle_name',e.target.value)} placeholder="Middle"/></FL>
                      <FL label="Alternate Last Name"><input className={inp} value={form.alt_last_name} onChange={e=>f('alt_last_name',e.target.value)} placeholder="Last"/></FL>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Upload Proof of Name Change <span className="text-red-500">*</span></p>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center cursor-pointer hover:border-brand-300 transition-colors" onClick={()=>nameProofRef.current?.click()}>
                        <input ref={nameProofRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"/>
                        <p className="text-xs text-slate-400">Drag and drop, or <span className="text-brand-600 font-semibold">Browse Files</span></p>
                        <p className="text-[10px] text-slate-300 mt-1">PDF, JPEG or PNG. Max 20MB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800 mb-4">Background Information</h3>
            <div className="border border-slate-200 rounded-2xl p-4 space-y-5 bg-slate-50/50">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">Have you been refused a visa from Canada, the USA, the United Kingdom, New Zealand, Australia or Ireland? <span className="text-red-500">*</span></p>
                <div className="flex gap-6">
                  {['Yes','No'].map(v=>(
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <div onClick={()=>f('refused_visa',v)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${form.refused_visa===v?'border-brand-600 bg-brand-600':'border-slate-300 hover:border-brand-400'}`}>
                        {form.refused_visa===v && <div className="w-2 h-2 rounded-full bg-white"/>}
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Do you have a valid Study Permit / Visa?</p>
                <select className={sel} value={form.study_permit} onChange={e=>f('study_permit',e.target.value)}>
                  <option value=""></option>
                  <option value="Yes - Study Permit">Yes - Study Permit</option>
                  <option value="Yes - Visitor Visa">Yes - Visitor Visa</option>
                  <option value="Yes - Work Permit">Yes - Work Permit</option>
                  <option value="No">No</option>
                </select>
              </div>
              {(form.refused_visa === 'Yes' || (form.study_permit && form.study_permit !== 'No')) && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">If you answered 'Yes' to any of the questions above, please provide more details below:</p>
                  <textarea rows={3} className={inp + ' resize-none'} value={form.background_details} onChange={e=>f('background_details',e.target.value)} placeholder="Please provide details…"/>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800 mb-4">Test Scores</h3>
            <div className="border border-slate-200 rounded-2xl p-4 space-y-4 bg-slate-50/50">
              {[
                { v:'has_proof',       label:'I have or will have proof of language proficiency before I apply.' },
                { v:'no_test_delayed', label:'I have not taken a language test and will only apply to programs allowing proof after acceptance.' },
                { v:'exemption',       label:'I believe my academic or nationality background may qualify me for an exemption.' },
                { v:'no_plan',         label:'I have not taken a language test, and do not plan to take one.' },
              ].map(opt=>(
                <label key={opt.v} className="flex items-start gap-2.5 cursor-pointer">
                  <div onClick={()=>f('language_status',opt.v)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer mt-0.5 shrink-0 transition-all ${form.language_status===opt.v?'border-brand-600 bg-brand-600':'border-slate-300 hover:border-brand-400'}`}>
                    {form.language_status===opt.v && <div className="w-2 h-2 rounded-full bg-white"/>}
                  </div>
                  <span className="text-sm text-slate-700 leading-snug">{opt.label}</span>
                </label>
              ))}
              {showEslNote && <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700"><Info className="w-4 h-4 shrink-0 mt-0.5"/>Note: You will be able to apply for conditional admission by enrolling in an ESL program if the academic program does not accept delayed submission of English Language Proficiency scores.</div>}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.open_to_esl} onChange={e=>f('open_to_esl',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                <span className="text-sm text-slate-700">I'm open to taking a language proficiency course before starting my academic program.</span>
              </label>
              {showEnglishExamFields && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <FL label="English exam type" required>
                    <select className={sel} value={form.english_exam_type} onChange={e=>f('english_exam_type',e.target.value)}>
                      <option value="">Select</option>
                      {['IELTS','TOEFL','PTE','Duolingo','Cambridge (CAE/CPE)'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </FL>
                  {form.english_exam_type === 'IELTS' && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">IELTS Scores</div>
                      <div className="grid grid-cols-2 gap-3">
                        <FL label="Overall Score"><input type="number" step="0.5" min="0" max="9" className={inp} value={form.ielts_score} onChange={e=>f('ielts_score',e.target.value)} placeholder="7.0"/></FL>
                        <FL label="Test Date"><input type="date" className={inp} value={form.ielts_date} onChange={e=>f('ielts_date',e.target.value)}/></FL>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[['L','ielts_l'],['R','ielts_r'],['W','ielts_w'],['S','ielts_s']].map(([label,key])=>(
                          <FL key={key} label={label}><input type="number" step="0.5" min="0" max="9" className={inp} value={form[key]} onChange={e=>f(key,e.target.value)} placeholder="7.0"/></FL>
                        ))}
                      </div>
                    </div>
                  )}
                  {form.english_exam_type === 'TOEFL' && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">TOEFL Scores</div>
                      <div className="grid grid-cols-2 gap-3">
                        <FL label="Total Score"><input type="number" className={inp} value={form.toefl_score} onChange={e=>f('toefl_score',e.target.value)} placeholder="100"/></FL>
                        <FL label="Test Date"><input type="date" className={inp}/></FL>
                      </div>
                    </div>
                  )}
                  {form.english_exam_type === 'PTE' && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">PTE Score</div>
                      <FL label="Score"><input type="number" className={inp} value={form.pte_score} onChange={e=>f('pte_score',e.target.value)} placeholder="65"/></FL>
                    </div>
                  )}
                  {form.english_exam_type === 'Duolingo' && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Duolingo Score</div>
                      <FL label="Score"><input type="number" className={inp} value={form.duolingo_score} onChange={e=>f('duolingo_score',e.target.value)} placeholder="110"/></FL>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800 mb-4">Lead management</h3>
            <div className="space-y-4">
              <FL label="Status">
                <select className={sel} value={form.lead_status} onChange={e=>f('lead_status',e.target.value)}>
                  <option value="">Please choose a status</option>
                  {LEAD_STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </FL>
              <FL label="Referral Source">
                <select className={sel} value={form.referral_source} onChange={e=>f('referral_source',e.target.value)}>
                  <option value="">Please choose a referral source</option>
                  {REFERRAL_SOURCES.map(s=><option key={s}>{s}</option>)}
                </select>
              </FL>
              <FL label="Assign Agent">
                <select className={sel} value={form.agent_id} onChange={e=>f('agent_id',e.target.value)}>
                  <option value="">No agent assigned</option>
                  {agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FL>
              <FL label="Country of Interest">
                <select className={sel} value={form.country_of_interest} onChange={e=>f('country_of_interest',e.target.value)}>
                  <option value="">Search country…</option>
                  {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </FL>
              <FL label="Services of Interest">
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {SERVICES.map(s=>(
                    <label key={s} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${form.services_of_interest.includes(s)?'border-brand-500 bg-brand-50 text-brand-700':'border-slate-200 text-slate-600 hover:border-brand-300'}`}>
                      <input type="checkbox" checked={form.services_of_interest.includes(s)} onChange={()=>toggleService(s)} className="w-3.5 h-3.5 accent-brand-600" />{s}
                    </label>
                  ))}
                </div>
              </FL>
              <FL label="Education Level">
                <select className={sel} value={form.education_level} onChange={e=>f('education_level',e.target.value)}>
                  <option value="">Select education level</option>
                  {EDU_LEVELS.map(l=><option key={l}>{l}</option>)}
                </select>
              </FL>
              <FL label="Recruiter Type">
                <select className={sel} value={form.recruiter_type} onChange={e=>f('recruiter_type',e.target.value)}>
                  {RECRUITER_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </FL>
              <FL label="Notes">
                <textarea rows={3} className={inp + ' resize-none'} placeholder="Any additional notes about this student…" value={form.notes} onChange={e=>f('notes',e.target.value)} />
              </FL>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" checked={form.consent} onChange={e=>f('consent',e.target.checked)} className="w-4 h-4 mt-0.5 accent-brand-600 shrink-0" />
            <span className="text-sm text-slate-600 leading-relaxed">
              I confirm that I have received express written consent from the student whom I am creating this profile for and I can provide proof of their consent upon request.
            </span>
          </label>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-white transition-colors text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Add student
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Main Page ─────────────────────────────────────────────────
export default function AgentStudentsPage() {
  const router = useRouter();

  // ── PERMISSIONS ──────────────────────────────────────────────
  const { can, isEmployee, loading: permLoading } = usePermissions();

  const [students,setStudents]=useState([]);
  const [total,setTotal]=useState(0);
  const [pages,setPages]=useState(1);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState(1);
  const [sort,setSort]=useState('created_at');
  const [dir,setDir]=useState('desc');
  const [colFilters,setColFilters]=useState({f_id:'',f_email:'',f_first:'',f_last:'',f_nationality:'',f_recruiter:'',f_education:''});
  const [showFilters,setShowFilters]=useState(false);
  const [panelFilters,setPanelFilters]=useState({status:'',lead_status:'',recruiter_type:''});
  const [view,setView]=useState('table');
  const [countries,setCountries]=useState([]);
  const [showAdd,setShowAdd]=useState(false);
  const [showView,setShowView]=useState(false);
  const [selected,setSelected]=useState(null);
  const LIMIT=20;

  const buildParams=useCallback(()=>{
    const p=new URLSearchParams({page,limit:LIMIT,sort,dir,...colFilters,...panelFilters});
    for(const[k,v]of[...p.entries()]){if(!v)p.delete(k);}
    return p.toString();
  },[page,sort,dir,colFilters,panelFilters]);

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      // agent_employee: use scoped endpoint, agent: use normal endpoint
      const endpoint = isEmployee ? `/api/agent-employee/students` : `/api/students?${buildParams()}`;
      const data=await fetch(endpoint).then(r=>r.json());
      setStudents(data.students||[]);
      setTotal(data.total||(data.students||[]).length||0);
      setPages(data.pages||1);
    } finally{setLoading(false);}
  },[buildParams, isEmployee]);

  useEffect(()=>{ if (!permLoading) load(); },[load, permLoading]);
  useEffect(()=>{fetch('/api/countries').then(r=>r.json()).then(d=>setCountries(d.countries||[]));},[]);

  // Block page entirely if employee has no view permission
  if (!permLoading && isEmployee && !can('view_students')) {
    return (
      <AdminLayout title="My Students">
        <AccessDenied message="You don't have permission to view students. Ask your agent to grant you access." />
      </AdminLayout>
    );
  }

  function cf_(k,v){setColFilters(p=>({...p,[k]:v}));setPage(1);}
  function pf_(k,v){setPanelFilters(p=>({...p,[k]:v}));setPage(1);}
  function toggleSort(col){if(sort===col)setDir(d=>d==='asc'?'desc':'asc');else{setSort(col);setDir('asc');}setPage(1);}
  function SortIcon({col}){if(sort!==col)return<ArrowUpDown className="w-3 h-3 text-slate-400 ml-1 shrink-0"/>;return dir==='asc'?<ArrowUp className="w-3 h-3 text-brand-500 ml-1 shrink-0"/>:<ArrowDown className="w-3 h-3 text-brand-500 ml-1 shrink-0"/>;}

  const activeFiltersCount=Object.values({...panelFilters,...colFilters}).filter(Boolean).length;

  const COLS=[
    {key:'id',label:'STUDENT ID',sort:'id'},{key:'email',label:'STUDENT EMAIL',sort:'email'},
    {key:'first_name',label:'FIRST NAME',sort:'name'},{key:'last_name',label:'LAST NAME',sort:null},
    {key:'nationality',label:'NATIONALITY',sort:null},{key:'education',label:'EDUCATION',sort:null},
    {key:'apps',label:'APPLICATIONS',sort:null},{key:'lead',label:'LEAD STATUS',sort:'lead_status'},
  ];
  const CF_=[
    {key:'f_id',f_type:'text',placeholder:'ID…'},{key:'f_email',f_type:'text',placeholder:'Email…'},
    {key:'f_first',f_type:'text',placeholder:'First…'},{key:'f_last',f_type:'text',placeholder:'Last…'},
    {key:'f_nationality',f_type:'text',placeholder:'Country…'},{key:'f_education',f_type:'text',placeholder:'Education…'},
    {key:'',f_type:'none'},{key:'',f_type:'none'},
  ];

  return (
    <AdminLayout title="My Students">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>My Students</h2>
          <p className="text-sm text-slate-500 mt-0.5">{loading?'…':`${total} students`}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filters — always visible */}
          <button onClick={()=>setShowFilters(f=>!f)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${showFilters||activeFiltersCount>0?'bg-brand-50 border-brand-300 text-brand-700':'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
            <Filter className="w-4 h-4"/>Filters{activeFiltersCount>0&&<span className="bg-brand-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeFiltersCount}</span>}
          </button>
          <div className="flex bg-white border border-slate-200 rounded-xl p-0.5">
            <button onClick={()=>setView('table')} className={`p-2 rounded-lg transition-colors ${view==='table'?'bg-brand-700 text-white':'text-slate-500 hover:text-slate-700'}`}><List className="w-4 h-4"/></button>
            <button onClick={()=>setView('grid')} className={`p-2 rounded-lg transition-colors ${view==='grid'?'bg-brand-700 text-white':'text-slate-500 hover:text-slate-700'}`}><Grid3x3 className="w-4 h-4"/></button>
          </div>
          <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500"><RefreshCw className="w-4 h-4"/></button>

          {/* Add student — only if can_add_students */}
          {can('add_students') && (
            <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
              <Plus className="w-4 h-4"/>Add new student
            </button>
          )}
        </div>
      </div>

      {showFilters&&(
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Filter</h3>
            {activeFiltersCount>0&&<button onClick={()=>{setPanelFilters({status:'',lead_status:'',recruiter_type:''});setColFilters({f_id:'',f_email:'',f_first:'',f_last:'',f_nationality:'',f_recruiter:'',f_education:''}); }} className="text-xs text-red-500 font-semibold flex items-center gap-1"><X className="w-3 h-3"/>Clear all</button>}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[['Lead Status','lead_status',LEAD_STATUSES],['Student Status','status',['Active','Pending','Rejected','Enrolled']]].map(([label,key,opts])=>(
              <div key={key}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
                <select className={sel} value={panelFilters[key]} onChange={e=>pf_(key,e.target.value)}><option value="">All</option>{opts.map(o=><option key={o}>{o}</option>)}</select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading?<div className="flex justify-center py-20"><Spinner size="lg"/></div>
          :students.length===0?<EmptyState icon={Users} title="No students found" description={isEmployee ? "No students have been assigned to you yet." : "Add your first student to get started."}/>
          :view==='table'?(
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ACTIONS</th>
                    {COLS.map(col=>(
                      <th key={col.key} onClick={()=>col.sort&&toggleSort(col.sort)} className={`px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.sort?'cursor-pointer hover:text-brand-600':''}`}>
                        <div className="flex items-center">{col.label}{col.sort&&<SortIcon col={col.sort}/>}</div>
                      </th>
                    ))}
                  </tr>
                  {/* Column filters — hide for employees (no filter URL params) */}
                  {!isEmployee && (
                    <tr className="border-b border-slate-200 bg-white">
                      <td className="px-3 py-2"/>
                      {CF_.map((c,i)=>(
                        <td key={i} className="px-2 py-1.5 min-w-[100px]">
                          {c.f_type==='text'&&<input value={colFilters[c.key]||''} onChange={e=>cf_(c.key,e.target.value)} placeholder={c.placeholder} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 bg-slate-50 placeholder-slate-300"/>}
                        </td>
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {students.map(s=>(
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-0.5">
                          {/* View — always shown if can_view_students */}
                          <button onClick={()=>router.push(`/agent/student/${s.id}`)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-brand-600 transition-colors" title="View full profile">
                            <Eye className="w-3.5 h-3.5"/>
                          </button>
                          {/* Edit — only if can_edit_students */}
                          {can('edit_students') && (
                            <button onClick={()=>router.push(`/agent/student/${s.id}?edit=1`)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-amber-600 transition-colors" title="Edit student">
                              <Pencil className="w-3.5 h-3.5"/>
                            </button>
                          )}
                          {/* Delete — only if can_delete_students */}
                          {can('delete_students') && (
                            <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete student">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3"><button onClick={()=>{setSelected(s);setShowView(true);}} className="font-mono text-xs text-brand-600 hover:underline font-bold">{s.id}</button></td>
                      <td className="px-3 py-3"><a href={`mailto:${s.email}`} className="text-xs text-brand-600 hover:underline max-w-[180px] truncate block">{s.email}</a></td>
                      <td className="px-3 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">{s.first_name||s.name?.split(' ')[0]||'—'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{s.last_name||s.name?.split(' ').slice(1).join(' ')||'—'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{s.flag&&<span className="mr-1">{s.flag}</span>}{s.nationality||s.country_name||'—'}</td>
                      <td className="px-3 py-3 min-w-[160px]"><EducationCell level={s.education_level} verified={s.education_verified}/></td>
                      <td className="px-3 py-3"><AppBadges row={s}/></td>
                      <td className="px-3 py-3 whitespace-nowrap"><LeadBadge status={s.lead_status||'New'}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ):(
            <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map(s=>(
                <div key={s.id} className="border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={()=>{setSelected(s);setShowView(true);}}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={s.avatar||'??'} size="md"/>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{s.name||`${s.first_name} ${s.last_name||''}`}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[140px]">{s.email}</div>
                      </div>
                    </div>
                    <LeadBadge status={s.lead_status||'New'}/>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">🌍 {s.nationality||s.country_name||'—'}</div>
                  <EducationCell level={s.education_level} verified={s.education_verified}/>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <AppBadges row={s}/>
                    <div className="flex gap-1">
                      {can('edit_students') && <button onClick={e=>{e.stopPropagation();router.push(`/agent/student/${s.id}?edit=1`);}} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"><Pencil className="w-3.5 h-3.5"/></button>}
                      {can('delete_students') && <button onClick={e=>{e.stopPropagation();}} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5"/></button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {!loading&&pages>1&&!isEmployee&&(
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>Showing {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)} of {total}</span>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white"><ChevronLeft className="w-4 h-4"/></button>
            {Array.from({length:Math.min(5,pages)},(_,i)=>{const p=Math.max(1,Math.min(pages-4,page-2))+i;return<button key={p} onClick={()=>setPage(p)} className={`w-9 h-9 rounded-xl border text-sm font-semibold ${p===page?'bg-brand-700 text-white border-brand-700':'border-slate-200 hover:bg-slate-50 bg-white'}`}>{p}</button>;})}
            <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      )}

      {/* Add student modal — only if permitted */}
      {can('add_students') && (
        <AddStudentModal open={showAdd} onClose={()=>setShowAdd(false)} onSaved={load} countries={countries} agents={[]}/>
      )}

      {showView&&selected&&(
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowView(false)}/>
          <div className="relative bg-white h-full w-full max-w-lg flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Student Profile</h2>
              <button onClick={()=>setShowView(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <Avatar initials={selected.avatar||'??'} size="lg"/>
                <div>
                  <div className="font-bold text-slate-800 text-lg">{selected.name||`${selected.first_name} ${selected.last_name||''}`}</div>
                  <div className="text-sm text-slate-500">{selected.email}</div>
                  <div className="mt-1.5"><LeadBadge status={selected.lead_status||'New'}/></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['Student ID',`#${selected.id}`],['Phone',selected.phone||'—'],['Nationality',`${selected.flag||''} ${selected.nationality||selected.country_name||'—'}`],['Education',selected.education_level||'—'],['IELTS',selected.ielts_score||'—'],['GPA',selected.gpa||'—'],['Target Program',selected.target_program||'—'],['Target Intake',selected.target_intake||'—']].map(([k,v])=>(
                  <div key={k} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xs text-slate-400 mb-0.5">{k}</div>
                    <div className="font-semibold text-slate-800 text-sm truncate">{v}</div>
                  </div>
                ))}
              </div>
              <div><div className="text-xs font-semibold text-slate-500 mb-2">Applications</div><AppBadges row={selected}/></div>

              {/* Full profile link — always show */}
              <button onClick={()=>{setShowView(false);router.push(`/agent/student/${selected.id}`);}}
                className="w-full py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm transition-colors">
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}