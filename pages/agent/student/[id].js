// pages/agent/student/[id].js — Agent student profile (full edit)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Spinner } from '../../../components/ui/index';
import ApplicationWizard from '../../../components/ApplicationWizard';
import {
  ArrowLeft, Save, CheckCircle, AlertTriangle, User, MapPin,
  GraduationCap, FileText, Globe, Briefcase, Plus, BookOpen,
  Loader2, Phone, Mail, TrendingUp, ChevronDown, ChevronUp,
  KeyRound, Eye, EyeOff, Copy, RefreshCw, ExternalLink, Shield,
  Calendar, Award, BarChart2, X
} from 'lucide-react';
import { apiCall } from '../../../lib/useApi';

// ── Styles ────────────────────────────────────────────────────
const inp = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder-slate-300 transition-colors";
const sel = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 transition-colors";
const ta  = inp + " resize-none";

const COUNTRIES  = ['Pakistan','Canada','United Kingdom','United States','Australia','Germany','UAE','Turkey','Malaysia','Singapore','India','Bangladesh','France','Netherlands'];
const PROVINCES  = { Pakistan:['Punjab','Sindh','KPK','Balochistan','Islamabad'], Canada:['Ontario','British Columbia','Alberta','Quebec'], 'United Kingdom':['England','Scotland','Wales','Northern Ireland'] };
const EDU_LEVELS = ['High School','Grade 10 (Pakistan)','Diploma','Certificate','Bachelors (Pakistan)','Bachelors (Turkey)','Masters (Pakistan)','Masters (Turkey)','PhD'];
const LEAD_STATUSES = ['New','Contacted','In Progress','Converted','Lost','On Hold'];
const STATUS_COLORS = {
  'Submitted':      'bg-blue-50 text-blue-700 border-blue-200',
  'Under Review':   'bg-amber-50 text-amber-700 border-amber-200',
  'Accepted':       'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Rejected':       'bg-red-50 text-red-600 border-red-200',
  'Enrolled':       'bg-green-50 text-green-700 border-green-200',
  'Pending':        'bg-slate-100 text-slate-600 border-slate-200',
  'Conditional':    'bg-purple-50 text-purple-700 border-purple-200',
  'Offer Received': 'bg-teal-50 text-teal-700 border-teal-200',
};

// ── Section component ─────────────────────────────────────────
function Section({ icon: Icon, title, badge, children, defaultOpen=true, color='brand' }) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = { brand:'bg-brand-50 text-brand-600', sky:'bg-sky-50 text-sky-600', emerald:'bg-emerald-50 text-emerald-600', purple:'bg-purple-50 text-purple-600', amber:'bg-amber-50 text-amber-600', slate:'bg-slate-100 text-slate-600', red:'bg-red-50 text-red-600' };
  const cc = colors[color]||colors.brand;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${cc} rounded-xl flex items-center justify-center shrink-0`}>
            <Icon className="w-4 h-4"/>
          </div>
          <span className="font-bold text-slate-800">{title}</span>
          {badge && (
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3"/>Saved
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400"/> : <ChevronDown className="w-5 h-5 text-slate-400"/>}
      </button>
      {open && <div className="px-6 pb-6 pt-4 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// ── Field label ───────────────────────────────────────────────
function FL({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Save button ───────────────────────────────────────────────
function SaveBtn({ onClick, saving }) {
  return (
    <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
      <button onClick={onClick} disabled={saving}
        className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 shadow-sm">
        {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
        {saving ? 'Saving…' : 'Save Section'}
      </button>
    </div>
  );
}

// ── Login Credentials ─────────────────────────────────────────
function LoginCredentials({ student, studentId }) {
  const [newPwd, setNewPwd]   = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [copied, setCopied]   = useState('');

  function copy(text, label) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  function autoPwd() {
    const base = (student?.first_name || 'Student').replace(/\s/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setNewPwd(`${base}@${rand}`);
  }

  async function handleReset() {
    if (!newPwd.trim() || newPwd.length < 6) { setMsg('error:Minimum 6 characters required'); return; }
    setSaving(true); setMsg('');
    try {
      const r = await fetch('/api/students/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, password: newPwd.trim() }),
      });
      const d = await r.json();
      if (!r.ok) setMsg(`error:${d.error}`);
      else { setMsg('success:Password updated successfully!'); setNewPwd(''); }
    } catch(e) { setMsg(`error:${e.message}`); }
    finally { setSaving(false); }
  }

  const isError   = msg.startsWith('error:');
  const isSuccess = msg.startsWith('success:');
  const msgText   = msg.split(':').slice(1).join(':');

  return (
    <Section icon={KeyRound} title="Login Credentials" color="slate" defaultOpen={false}>
      {/* Email */}
      <div className="mb-5 mt-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Student Login Email</p>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <Mail className="w-4 h-4 text-slate-400 shrink-0"/>
          <p className="flex-1 text-sm font-mono font-semibold text-slate-800">{student?.email || '—'}</p>
          <button onClick={() => copy(student?.email, 'email')}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors
              ${copied === 'email' ? 'bg-emerald-100 text-emerald-700' : 'text-brand-600 hover:bg-brand-50'}`}>
            <Copy className="w-3 h-3"/>{copied === 'email' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Password reset */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reset Password</p>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <input type={showPwd ? 'text' : 'password'} value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              placeholder="Enter new password for student…"
              className={inp + " pr-16 font-mono"}/>
            <button type="button" onClick={() => setShowPwd(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
            </button>
          </div>
          <button onClick={autoPwd} title="Auto-generate password"
            className="shrink-0 px-3 py-2.5 border-2 border-brand-300 text-brand-600 rounded-xl text-xs font-bold hover:bg-brand-50 transition-colors">
            Auto
          </button>
          <button onClick={() => newPwd && copy(newPwd, 'pwd')} title="Copy password"
            className={`shrink-0 flex items-center gap-1 px-3 py-2.5 border rounded-xl text-xs font-bold transition-colors
              ${copied === 'pwd' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Copy className="w-3 h-3"/>{copied === 'pwd' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button onClick={handleReset} disabled={saving || !newPwd.trim()}
          className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Shield className="w-4 h-4"/>}
          {saving ? 'Updating…' : 'Update Password'}
        </button>
        {msg && (
          <div className={`flex items-center gap-2 mt-3 text-sm rounded-xl px-4 py-2.5 ${isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {isSuccess ? <CheckCircle className="w-4 h-4 shrink-0"/> : <AlertTriangle className="w-4 h-4 shrink-0"/>}
            {msgText}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          <Globe className="w-3 h-3"/>Student logs in at <span className="font-mono font-semibold text-slate-600 mx-1">/login</span> using their email and password.
        </p>
      </div>
    </Section>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AgentStudentProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState({});
  const [saved,  setSaved]      = useState({});
  const [error,  setError]      = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [countries, setCountries]   = useState([]);
  const [activeTab, setActiveTab]   = useState('profile');

  // Form sections
  const [personal,   setPersonal]   = useState({ first_name:'',middle_name:'',last_name:'',date_of_birth:'',gender:'',marital_status:'',native_language:'',country_id:'',passport_no:'',passport_expiry:'' });
  const [address,    setAddress]    = useState({ address_line:'',city:'',province:'',postal_code:'',address_country:'',phone:'' });
  const [education,  setEducation]  = useState({ education_level:'',institution_name:'',edu_country:'',grad_year:'',gpa:'',grade_scale:'4.0',education_verified:false });
  const [tests,      setTests]      = useState({ ielts_score:'',ielts_date:'',toefl_score:'',pte_score:'',duolingo_score:'',sat_score:'',gre_score:'' });
  const [visa,       setVisa]       = useState({ has_visa:false,visa_country:'',visa_type:'',visa_expiry:'',refused_visa:false,study_permit:'' });
  const [lead,       setLead]       = useState({ lead_status:'New',referral_source:'',recruiter_type:'Owner',notes:'',target_program:'',target_intake:'',services_of_interest:'',country_of_interest:'',status:'Active' });

  function load() {
    if (!id) return;
    setLoading(true);
    fetch(`/api/students/${id}`).then(r => r.json()).then(d => {
      setStudent(d);
      setPersonal({ first_name:d.first_name||d.name?.split(' ')[0]||'', middle_name:d.middle_name||'', last_name:d.last_name||d.name?.split(' ').slice(1).join(' ')||'', date_of_birth:d.date_of_birth?.split('T')[0]||'', gender:d.gender||'', marital_status:d.marital_status||'', native_language:d.native_language||'', country_id:d.country_id||'', passport_no:d.passport_no||'', passport_expiry:d.passport_expiry?.split('T')[0]||'' });
      setAddress({ address_line:d.address_line||'', city:d.city||'', province:d.province||'', postal_code:d.postal_code||'', address_country:d.address_country||'', phone:d.phone||'' });
      setEducation({ education_level:d.education_level||'', institution_name:d.institution_name||'', edu_country:d.edu_country||'', grad_year:d.grad_year||'', gpa:d.gpa||'', grade_scale:d.grade_scale||'4.0', education_verified:!!d.education_verified });
      setTests({ ielts_score:d.ielts_score||'', ielts_date:d.ielts_date?.split('T')[0]||'', toefl_score:d.toefl_score||'', pte_score:d.pte_score||'', duolingo_score:d.duolingo_score||'', sat_score:d.sat_score||'', gre_score:d.gre_score||'' });
      setVisa({ has_visa:!!d.has_visa, visa_country:d.visa_country||'', visa_type:d.visa_type||'', visa_expiry:d.visa_expiry?.split('T')[0]||'', refused_visa:!!d.refused_visa, study_permit:d.study_permit||'' });
      setLead({ lead_status:d.lead_status||'New', referral_source:d.referral_source||'', recruiter_type:d.recruiter_type||'Owner', notes:d.notes||'', target_program:d.target_program||'', target_intake:d.target_intake||'', services_of_interest:d.services_of_interest||'', country_of_interest:d.country_of_interest||'', status:d.status||'Active' });
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => { fetch('/api/countries').then(r => r.json()).then(d => setCountries(d.countries||[])); }, []);

  async function saveSection(section, data) {
    setSaving(s => ({ ...s, [section]: true })); setError('');
    try {
      await apiCall(`/api/students/${id}`, 'PUT', { ...personal, ...address, ...education, ...tests, ...visa, ...lead, ...data });
      setSaved(s => ({ ...s, [section]: true }));
      load();
    } catch(e) { setError(e.message || 'Save failed'); }
    finally { setSaving(s => ({ ...s, [section]: false })); }
  }

  const sp = (k,v) => setPersonal(p => ({ ...p, [k]:v }));
  const sa = (k,v) => setAddress(p  => ({ ...p, [k]:v }));
  const se = (k,v) => setEducation(p=> ({ ...p, [k]:v }));
  const st = (k,v) => setTests(p   => ({ ...p, [k]:v }));
  const sv = (k,v) => setVisa(p    => ({ ...p, [k]:v }));
  const sl = (k,v) => setLead(p    => ({ ...p, [k]:v }));

  if (loading) return <AdminLayout title="Student Profile"><div className="flex justify-center py-20"><Spinner size="lg"/></div></AdminLayout>;
  if (!student) return <AdminLayout title="Student Profile"><div className="text-center py-20 text-slate-400">Student not found</div></AdminLayout>;

  const applications = student.applications || [];
  const fullName = [personal.first_name, personal.last_name].filter(Boolean).join(' ') || student.name || 'Unknown';
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Profile completion
  const profileChecks = [
    { label:'First Name',     done:!!personal.first_name },
    { label:'Last Name',      done:!!personal.last_name },
    { label:'Date of Birth',  done:!!personal.date_of_birth },
    { label:'Phone',          done:!!address.phone },
    { label:'Passport No.',   done:!!personal.passport_no },
    { label:'Address',        done:!!address.address_line },
    { label:'Education Level',done:!!education.education_level },
    { label:'GPA',            done:!!education.gpa },
    { label:'Test Score',     done:!!(tests.ielts_score||tests.toefl_score||tests.pte_score) },
    { label:'Gender',         done:!!personal.gender },
  ];
  const pct = Math.round((profileChecks.filter(c => c.done).length / profileChecks.length) * 100);

  const TABS = [
    { key:'profile',      label:'Profile'      },
    { key:'applications', label:`Applications (${applications.length})` },
    { key:'credentials',  label:'Login'        },
  ];

  return (
    <AdminLayout title={fullName}>
      <div className="max-w-full">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors">
            <ArrowLeft className="w-4 h-4"/>Back to Students
          </button>
          <button onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
            <Plus className="w-4 h-4"/>Create Application
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0"/>{error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4"/></button>
          </div>
        )}

        <div className="flex gap-5">

          {/* ── LEFT SIDEBAR ── */}
          <div className="w-72 shrink-0">
            <div className="sticky top-4 space-y-4">

              {/* Student card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Banner */}
                <div className="h-16 bg-gradient-to-r from-brand-700 to-brand-500"/>
                <div className="px-5 pb-5 -mt-8">
                  {/* Avatar */}
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-400 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-white mb-3">
                    {initials}
                  </div>
                  <h2 className="font-bold text-slate-800 text-lg leading-tight">{fullName}</h2>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5"/>{student.email}
                  </p>
                  {address.phone && (
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5"/>{address.phone}
                    </p>
                  )}
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border
                      ${lead.lead_status==='Converted'?'bg-emerald-50 text-emerald-700 border-emerald-200':
                        lead.lead_status==='New'?'bg-sky-50 text-sky-700 border-sky-200':
                        'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {lead.lead_status}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border
                      ${lead.status==='Active'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile completion */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Profile Completion</h3>
                  <span className={`text-sm font-bold ${pct>=80?'text-emerald-600':pct>=50?'text-amber-600':'text-red-500'}`}>{pct}%</span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full transition-all duration-700 ${pct>=80?'bg-emerald-500':pct>=50?'bg-amber-500':'bg-red-400'}`} style={{width:`${pct}%`}}/>
                </div>
                {pct < 100 && (
                  <div className="space-y-1.5">
                    {profileChecks.map(({ label, done }) => (
                      <div key={label} className="flex items-center gap-2 text-xs">
                        {done
                          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0"/>
                          : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0"/>
                        }
                        <span className={done ? 'text-slate-600' : 'text-slate-400'}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
                {pct === 100 && (
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <CheckCircle className="w-4 h-4"/>Profile complete!
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-brand-500"/>Quick Info
                </h3>
                <div className="space-y-2">
                  {[
                    ['Education', education.education_level||'—'],
                    ['GPA',       education.gpa ? `${education.gpa} / ${education.grade_scale||'4.0'}` : '—'],
                    ['IELTS',     tests.ielts_score||'—'],
                    ['TOEFL',     tests.toefl_score||'—'],
                    ['Passport',  personal.passport_no||'—'],
                    ['Target',    lead.target_program||'—'],
                  ].map(([k,v]) => (
                    <div key={k} className="flex items-start justify-between gap-2 text-xs py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-slate-400 shrink-0">{k}</span>
                      <span className="font-semibold text-slate-700 text-right truncate max-w-[130px]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Applications mini list */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-500"/>Applications
                  </h3>
                  <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full">{applications.length}</span>
                </div>
                {applications.length === 0
                  ? <p className="text-xs text-slate-400">No applications yet.</p>
                  : <div className="space-y-2">
                      {applications.slice(0, 4).map(a => (
                        <div key={a.id} className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-700 truncate">{a.program_name||'—'}</div>
                            <div className="text-[10px] text-slate-400 truncate">{a.university_name}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${STATUS_COLORS[a.status]||'bg-slate-100 text-slate-500 border-slate-200'}`}>{a.status}</span>
                        </div>
                      ))}
                    </div>
                }
                <button onClick={() => setWizardOpen(true)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border-2 border-brand-200 transition-colors">
                  <Plus className="w-3.5 h-3.5"/>New Application
                </button>
              </div>

              {/* Agent note */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-4 h-4 text-amber-600 shrink-0"/>
                  <span className="text-xs font-bold text-amber-700">Agent Access</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">You can edit all sections on behalf of the student.</p>
              </div>
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 min-w-0">

            {/* Tab bar */}
            <div className="flex gap-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-1 mb-5">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${activeTab===tab.key?'bg-brand-700 text-white shadow-sm':'text-slate-600 hover:bg-slate-100'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && <>

              {/* PERSONAL */}
              <Section icon={User} title="Personal Information" badge={saved.personal} color="brand">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FL label="First Name" required><input className={inp} value={personal.first_name} onChange={e=>sp('first_name',e.target.value)} placeholder="Muhammad"/></FL>
                  <FL label="Last Name" required><input className={inp} value={personal.last_name} onChange={e=>sp('last_name',e.target.value)} placeholder="Ali"/></FL>
                </div>
                <FL label="Middle Name"><input className={inp} value={personal.middle_name} onChange={e=>sp('middle_name',e.target.value)} placeholder="Optional"/></FL>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FL label="Date of Birth"><input type="date" className={inp} value={personal.date_of_birth} onChange={e=>sp('date_of_birth',e.target.value)}/></FL>
                  <FL label="Gender">
                    <select className={sel} value={personal.gender} onChange={e=>sp('gender',e.target.value)}>
                      <option value="">Select</option>{['Male','Female','Other'].map(g=><option key={g}>{g}</option>)}
                    </select>
                  </FL>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FL label="Marital Status">
                    <select className={sel} value={personal.marital_status} onChange={e=>sp('marital_status',e.target.value)}>
                      <option value="">Select</option>{['Single','Married','Divorced','Widowed'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </FL>
                  <FL label="Native Language"><input className={inp} value={personal.native_language} onChange={e=>sp('native_language',e.target.value)} placeholder="Urdu"/></FL>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FL label="Country of Citizenship">
                    <select className={sel} value={personal.country_id} onChange={e=>sp('country_id',e.target.value)}>
                      <option value="">Select country</option>
                      {countries.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                    </select>
                  </FL>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FL label="Passport Number" hint="Strongly recommended"><input className={inp} value={personal.passport_no} onChange={e=>sp('passport_no',e.target.value)} placeholder="AB1234567"/></FL>
                  <FL label="Passport Expiry"><input type="date" className={inp} value={personal.passport_expiry} onChange={e=>sp('passport_expiry',e.target.value)}/></FL>
                </div>
                <SaveBtn onClick={()=>saveSection('personal',personal)} saving={!!saving.personal}/>
              </Section>

              {/* ADDRESS */}
              <Section icon={MapPin} title="Address & Contact" badge={saved.address} color="sky">
                <FL label="Street Address"><input className={inp} value={address.address_line} onChange={e=>sa('address_line',e.target.value)} placeholder="House #12, Street 4, Block B"/></FL>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FL label="City"><input className={inp} value={address.city} onChange={e=>sa('city',e.target.value)} placeholder="Karachi"/></FL>
                  <FL label="Country">
                    <select className={sel} value={address.address_country} onChange={e=>sa('address_country',e.target.value)}>
                      <option value="">Select</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </FL>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FL label="Province/State">
                    <select className={sel} value={address.province} onChange={e=>sa('province',e.target.value)}>
                      <option value="">Select</option>{(PROVINCES[address.address_country]||[]).map(p=><option key={p}>{p}</option>)}
                    </select>
                  </FL>
                  <FL label="Postal Code"><input className={inp} value={address.postal_code} onChange={e=>sa('postal_code',e.target.value)} placeholder="75500"/></FL>
                </div>
                <FL label="Phone Number" required><input className={inp} value={address.phone} onChange={e=>sa('phone',e.target.value)} placeholder="+92 300 1234567"/></FL>
                <SaveBtn onClick={()=>saveSection('address',address)} saving={!!saving.address}/>
              </Section>

              {/* EDUCATION */}
              <Section icon={GraduationCap} title="Education History" badge={saved.education} color="emerald">
                <FL label="Highest Education Level">
                  <select className={sel} value={education.education_level} onChange={e=>se('education_level',e.target.value)}>
                    <option value="">Select level</option>{EDU_LEVELS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </FL>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FL label="Institution Name"><input className={inp} value={education.institution_name} onChange={e=>se('institution_name',e.target.value)} placeholder="University of Karachi"/></FL>
                  <FL label="Country of Study">
                    <select className={sel} value={education.edu_country} onChange={e=>se('edu_country',e.target.value)}>
                      <option value="">Select</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </FL>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <FL label="Graduation Year"><input type="number" className={inp} value={education.grad_year} onChange={e=>se('grad_year',e.target.value)} placeholder="2023"/></FL>
                  <FL label="GPA / Score"><input type="number" step="0.01" className={inp} value={education.gpa} onChange={e=>se('gpa',e.target.value)} placeholder="3.5"/></FL>
                  <FL label="Grade Scale">
                    <select className={sel} value={education.grade_scale} onChange={e=>se('grade_scale',e.target.value)}>
                      {['4.0','5.0','10.0','100%','CGPA'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </FL>
                </div>
                <label className="flex items-center gap-3 cursor-pointer mt-4">
                  <input type="checkbox" checked={education.education_verified} onChange={e=>se('education_verified',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                  <span className="text-sm font-medium text-slate-700">Education documents verified</span>
                </label>
                <SaveBtn onClick={()=>saveSection('education',education)} saving={!!saving.education}/>
              </Section>

              {/* TEST SCORES */}
              <Section icon={FileText} title="Test Scores" badge={saved.tests} color="purple">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 bg-brand-500 rounded-full"/>IELTS
                    </div>
                    <FL label="Overall Score"><input type="number" step="0.5" min="0" max="9" className={inp} value={tests.ielts_score} onChange={e=>st('ielts_score',e.target.value)} placeholder="7.0"/></FL>
                    <FL label="Test Date"><input type="date" className={inp} value={tests.ielts_date} onChange={e=>st('ielts_date',e.target.value)}/></FL>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 bg-brand-400 rounded-full"/>TOEFL
                    </div>
                    <FL label="Score"><input type="number" className={inp} value={tests.toefl_score} onChange={e=>st('toefl_score',e.target.value)} placeholder="90"/></FL>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[['PTE','pte_score','65'],['Duolingo','duolingo_score','110'],['SAT','sat_score','1400']].map(([label,key,ph])=>(
                    <div key={key} className="border border-slate-200 rounded-xl p-4">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{label}</div>
                      <input type="number" className={inp} value={tests[key]} onChange={e=>st(key,e.target.value)} placeholder={ph}/>
                    </div>
                  ))}
                </div>
                <SaveBtn onClick={()=>saveSection('tests',tests)} saving={!!saving.tests}/>
              </Section>

              {/* VISA */}
              <Section icon={Globe} title="Visa & Study Permit" badge={saved.visa} color="amber">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input type="checkbox" checked={visa.has_visa} onChange={e=>sv('has_visa',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                  <span className="text-sm font-semibold text-slate-700">Student currently holds a valid visa</span>
                </label>
                {visa.has_visa && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                    <FL label="Visa Country">
                      <select className={sel} value={visa.visa_country} onChange={e=>sv('visa_country',e.target.value)}>
                        <option value="">Select</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </FL>
                    <FL label="Visa Type"><input className={inp} value={visa.visa_type} onChange={e=>sv('visa_type',e.target.value)} placeholder="Student Visa"/></FL>
                    <FL label="Visa Expiry"><input type="date" className={inp} value={visa.visa_expiry} onChange={e=>sv('visa_expiry',e.target.value)}/></FL>
                    <FL label="Study Permit No."><input className={inp} value={visa.study_permit} onChange={e=>sv('study_permit',e.target.value)} placeholder="SP-12345"/></FL>
                  </div>
                )}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={visa.refused_visa} onChange={e=>sv('refused_visa',e.target.checked)} className="w-4 h-4 accent-brand-600 mt-0.5"/>
                    <div>
                      <span className="text-sm font-semibold text-amber-800">Student has previously been refused a visa</span>
                      <p className="text-xs text-amber-600 mt-0.5">Flags student for additional review during applications.</p>
                    </div>
                  </label>
                </div>
                <SaveBtn onClick={()=>saveSection('visa',visa)} saving={!!saving.visa}/>
              </Section>

              {/* LEAD MANAGEMENT */}
              <Section icon={TrendingUp} title="Lead Management & Preferences" badge={saved.lead} color="slate" defaultOpen={false}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FL label="Lead Status">
                    <select className={sel} value={lead.lead_status} onChange={e=>sl('lead_status',e.target.value)}>
                      {LEAD_STATUSES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </FL>
                  <FL label="Student Status">
                    <select className={sel} value={lead.status} onChange={e=>sl('status',e.target.value)}>
                      {['Active','Pending','Enrolled','Graduated','Withdrawn'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </FL>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FL label="Target Program"><input className={inp} value={lead.target_program} onChange={e=>sl('target_program',e.target.value)} placeholder="BSc Computer Science"/></FL>
                  <FL label="Target Intake"><input className={inp} value={lead.target_intake} onChange={e=>sl('target_intake',e.target.value)} placeholder="Fall 2025"/></FL>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FL label="Country of Interest">
                    <select className={sel} value={lead.country_of_interest} onChange={e=>sl('country_of_interest',e.target.value)}>
                      <option value="">Select</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </FL>
                  <FL label="Referral Source">
                    <select className={sel} value={lead.referral_source} onChange={e=>sl('referral_source',e.target.value)}>
                      <option value="">Select</option>
                      {['Website','Social Media','Referral','Agent','Email Campaign','Walk-in','Other'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </FL>
                </div>
                <FL label="Agent Notes">
                  <textarea rows={4} className={ta} value={lead.notes} onChange={e=>sl('notes',e.target.value)} placeholder="Private notes about this student…"/>
                </FL>
                <SaveBtn onClick={()=>saveSection('lead',lead)} saving={!!saving.lead}/>
              </Section>
            </>}

            {/* ── APPLICATIONS TAB ── */}
            {activeTab === 'applications' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Applications ({applications.length})</h3>
                  <button onClick={() => setWizardOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-colors border border-brand-200">
                    <Plus className="w-3.5 h-3.5"/>New Application
                  </button>
                </div>
                {applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <BookOpen className="w-10 h-10 mb-3 opacity-40"/>
                    <p className="font-medium">No applications yet</p>
                    <button onClick={() => setWizardOpen(true)} className="mt-3 text-brand-600 text-sm font-bold hover:underline">Create first application →</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          {['App Code','Program','School','Intake','Applied Date','Status'].map(h=>(
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map(a => (
                          <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs font-bold text-brand-600">{a.app_code}</td>
                            <td className="px-4 py-3 text-xs font-semibold text-slate-700 max-w-[160px] truncate">{a.program_name||'—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-600 max-w-[130px] truncate">{a.flag} {a.university_name||'—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">{a.intake||'—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">{a.applied_date ? new Date(a.applied_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[a.status]||'bg-slate-100 text-slate-500 border-slate-200'}`}>{a.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── LOGIN TAB ── */}
            {activeTab === 'credentials' && (
              <LoginCredentials student={student} studentId={id}/>
            )}

          </div>
        </div>
      </div>

      <ApplicationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        program={null}
        userRole="agent"
        preselectedStudentId={student?.id}
        preselectedStudent={{ id:student?.id, name:fullName, email:student?.email }}
      />
    </AdminLayout>
  );
}