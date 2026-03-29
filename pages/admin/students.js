// pages/admin/students.js
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { StatusBadge, Avatar, Spinner, EmptyState } from '../../components/ui/index';
import {
  Plus, Users, RefreshCw, Filter, Grid3x3, List,
  ArrowUpDown, ArrowUp, ArrowDown,
  Pencil, Trash2, Eye, ChevronLeft, ChevronRight,
  CheckCircle, AlertTriangle, X, Upload, Info
} from 'lucide-react';
import { apiCall } from '../../lib/useApi';

// ── Helpers ───────────────────────────────────────────────────
const APP_COLORS = ['','bg-amber-400','bg-blue-500','bg-emerald-500','bg-purple-500','bg-red-400'];
const APP_KEYS   = ['app_total','app_submitted','app_review','app_accepted','app_conditional','app_rejected'];
const APP_LABELS = ['Total','Submitted','Review','Accepted','Conditional','Rejected'];

function AppBadges({ row }) {
  const badges = APP_KEYS.slice(1).map((k,i) => ({ v: Number(row[k]||0), color: APP_COLORS[i+1], label: APP_LABELS[i+1] })).filter(b => b.v > 0);
  if (!badges.length) return <span className="text-xs text-slate-300">—</span>;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {badges.map(b => (
        <span key={b.label} title={`${b.label}: ${b.v}`}
          className={`${b.color} text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm`}>
          {b.v}
        </span>
      ))}
    </div>
  );
}

function EducationCell({ level, verified }) {
  if (!level) return <span className="flex items-center gap-1 text-amber-600 text-xs font-medium"><AlertTriangle className="w-3.5 h-3.5" />Education Missing</span>;
  return <span className="flex items-center gap-1 text-xs text-slate-700">{verified ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}{level}</span>;
}

function LeadBadge({ status }) {
  const map = { 'New':'bg-sky-50 text-sky-700 border-sky-200','Contacted':'bg-blue-50 text-blue-700 border-blue-200','In Progress':'bg-amber-50 text-amber-700 border-amber-200','Converted':'bg-emerald-50 text-emerald-700 border-emerald-200','Lost':'bg-red-50 text-red-600 border-red-200','On Hold':'bg-slate-100 text-slate-500 border-slate-200' };
  const cls = map[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}><span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />{status||'New'}</span>;
}

const COUNTRIES = ['Pakistan','Canada','United Kingdom','United States','Australia','Germany','UAE','Turkey','Malaysia','Singapore','India','Bangladesh','France','Netherlands','Sweden','Norway','Denmark'];
const LEAD_STATUSES   = ['New','Contacted','In Progress','Converted','Lost','On Hold'];
const RECRUITER_TYPES = ['Owner','Staff','Partner'];
const EDU_LEVELS      = ['High School','Grade 10 (Pakistan)','Bachelors (Pakistan)','Bachelors (Turkey)','Masters (Pakistan)','Masters (Turkey)','PhD','Diploma','Certificate'];
const REFERRAL_SOURCES = ['Website','Social Media','Referral','Agent','Email Campaign','Walk-in','Other'];
const SERVICES = ['Undergraduate','Postgraduate','PhD','English Language','Diploma','Certificate','Foundation','Short Courses'];

const inp = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder-slate-300 transition-colors";
const sel = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 transition-colors";

function FL({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Add Student Modal ─────────────────────────────────────────
function AddStudentModal({ open, onClose, onSaved, countries: countryList, agents }) {
  const EMPTY = { first_name:'',middle_name:'',last_name:'',date_of_birth:'',country_id:'',passport_no:'',passport_expiry:'',gender:'',email:'',phone:'',status:'',referral_source:'',country_of_interest:'',services_of_interest:[],lead_status:'New',recruiter_type:'Owner',education_level:'',agent_id:'',notes:'',consent:false };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => { if (open) { setForm(EMPTY); setError(''); } }, [open]);

  function f(k,v) { setForm(p=>({...p,[k]:v})); }
  function toggleService(s) {
    setForm(p => ({ ...p, services_of_interest: p.services_of_interest.includes(s) ? p.services_of_interest.filter(x=>x!==s) : [...p.services_of_interest, s] }));
  }

  async function handleSubmit() {
    if (!form.first_name || !form.last_name || !form.email || !form.country_id) { setError('First name, last name, email and country of citizenship are required.'); return; }
    if (!form.consent) { setError('Please confirm student consent before adding.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, services_of_interest: form.services_of_interest.join(','), password: 'Student@123' };
      delete payload.consent;
      await apiCall('/api/students','POST',payload);
      onSaved();
      onClose();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white h-full w-full max-w-lg flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Add new student</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Info banner */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">Did you know you can also bulk import students. <a href="#" className="underline font-semibold">Learn how here</a>.</p>
          </div>

          {/* Error */}
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

          {/* ── Personal Information ── */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-4">Personal information</h3>

            {/* Autofill button */}
            <button className="flex items-center gap-2 border-2 border-brand-400 text-brand-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-brand-50 transition-colors mb-2">
              <Upload className="w-4 h-4" /> Autofill with passport
            </button>
            <p className="text-xs text-slate-400 mb-5">Auto-complete this section by uploading the student's passport. This is optional, but strongly recommended.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FL label="First name" required>
                  <input className={inp} placeholder="First name" value={form.first_name} onChange={e=>f('first_name',e.target.value)} />
                </FL>
                <FL label="Last name" required>
                  <input className={inp} placeholder="Last name" value={form.last_name} onChange={e=>f('last_name',e.target.value)} />
                </FL>
              </div>

              <FL label="Middle name">
                <input className={inp} placeholder="Middle name (optional)" value={form.middle_name} onChange={e=>f('middle_name',e.target.value)} />
              </FL>

              <FL label="Date of birth" required>
                <input type="date" className={inp} value={form.date_of_birth} onChange={e=>f('date_of_birth',e.target.value)} />
              </FL>

              <FL label="Country of citizenship" required>
                <select className={sel} value={form.country_id} onChange={e=>f('country_id',e.target.value)}>
                  <option value="">Please choose a country</option>
                  {countryList.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                </select>
              </FL>

              <FL label="Passport number" hint="Passport number is optional, but strongly recommended.">
                <input className={inp} placeholder="e.g. AB1234567" value={form.passport_no} onChange={e=>f('passport_no',e.target.value)} />
              </FL>

              <FL label="Passport expiry date">
                <input type="date" className={inp} value={form.passport_expiry} onChange={e=>f('passport_expiry',e.target.value)} />
              </FL>

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

          {/* ── Contact Information ── */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-4">Contact information</h3>
            <div className="space-y-4">
              <FL label="Student Email" required hint="This email will be used for the student's login account.">
                <input type="email" className={inp} placeholder="student@email.com" value={form.email} onChange={e=>f('email',e.target.value)} />
              </FL>
              <FL label="Phone number">
                <input className={inp} placeholder="+92 300 1234567" value={form.phone} onChange={e=>f('phone',e.target.value)} />
              </FL>
            </div>
          </div>

          {/* ── Lead Management ── */}
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
                    <label key={s} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium
                      ${form.services_of_interest.includes(s) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-brand-300'}`}>
                      <input type="checkbox" checked={form.services_of_interest.includes(s)} onChange={()=>toggleService(s)} className="w-3.5 h-3.5 accent-brand-600" />
                      {s}
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

          {/* ── Consent ── */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" checked={form.consent} onChange={e=>f('consent',e.target.checked)} className="w-4 h-4 mt-0.5 accent-brand-600 shrink-0" />
            <span className="text-sm text-slate-600 leading-relaxed">
              I confirm that I have received express written consent from the student whom I am creating this profile for and I can provide proof of their consent upon request. To learn more please refer to the{' '}
              <a href="#" className="text-brand-600 underline font-medium">Personal Data Consent/Confirm Visa+Enrolment</a> article.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-white transition-colors text-sm">
            Cancel
          </button>
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

// ── Edit Student Modal ────────────────────────────────────────
function EditStudentModal({ open, student, onClose, onSaved, countries: countryList, agents }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (student) setForm({
      phone: student.phone||'', country_id: student.country_id||'',
      gpa: student.gpa||'', ielts_score: student.ielts_score||'',
      target_program: student.target_program||'', target_intake: student.target_intake||'',
      agent_id: student.agent_id||'', status: student.status||'Pending',
      lead_status: student.lead_status||'New', recruiter_type: student.recruiter_type||'Owner',
      education_level: student.education_level||'', referral_source: student.referral_source||'',
      notes: student.notes||'',
    });
    setError('');
  }, [student]);

  function f(k,v) { setForm(p=>({...p,[k]:v})); }

  async function handleSubmit() {
    setSaving(true); setError('');
    try {
      await apiCall(`/api/students/${student.id}`,'PUT',form);
      onSaved();
      onClose();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!open || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white h-full w-full max-w-lg flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Edit Student</h2>
            <p className="text-xs text-slate-400 mt-0.5">{student.full_name || `${student.first_name} ${student.last_name||''}`}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">Contact</h3>
            <div className="grid grid-cols-2 gap-3">
              <FL label="Phone"><input className={inp} value={form.phone} onChange={e=>f('phone',e.target.value)} placeholder="+92 300 0000000" /></FL>
              <FL label="Nationality">
                <select className={sel} value={form.country_id} onChange={e=>f('country_id',e.target.value)}>
                  <option value="">Select</option>
                  {countryList.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                </select>
              </FL>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">Academic</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FL label="IELTS Score"><input type="number" step="0.5" min="0" max="9" className={inp} value={form.ielts_score} onChange={e=>f('ielts_score',e.target.value)} placeholder="7.0" /></FL>
              <FL label="GPA"><input type="number" step="0.01" min="0" max="4" className={inp} value={form.gpa} onChange={e=>f('gpa',e.target.value)} placeholder="3.5" /></FL>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FL label="Target Program"><input className={inp} value={form.target_program} onChange={e=>f('target_program',e.target.value)} placeholder="BSc Computer Science" /></FL>
              <FL label="Target Intake"><input className={inp} value={form.target_intake} onChange={e=>f('target_intake',e.target.value)} placeholder="Fall 2025" /></FL>
            </div>
            <FL label="Education Level">
              <select className={sel} value={form.education_level} onChange={e=>f('education_level',e.target.value)}>
                <option value="">Select</option>
                {EDU_LEVELS.map(l=><option key={l}>{l}</option>)}
              </select>
            </FL>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">Lead Management</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FL label="Student Status">
                <select className={sel} value={form.status} onChange={e=>f('status',e.target.value)}>
                  {['Pending','Active','Rejected','Enrolled','Graduated','Withdrawn'].map(s=><option key={s}>{s}</option>)}
                </select>
              </FL>
              <FL label="Lead Status">
                <select className={sel} value={form.lead_status} onChange={e=>f('lead_status',e.target.value)}>
                  {LEAD_STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </FL>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FL label="Recruiter Type">
                <select className={sel} value={form.recruiter_type} onChange={e=>f('recruiter_type',e.target.value)}>
                  {RECRUITER_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </FL>
              <FL label="Referral Source">
                <select className={sel} value={form.referral_source} onChange={e=>f('referral_source',e.target.value)}>
                  <option value="">Select</option>
                  {REFERRAL_SOURCES.map(s=><option key={s}>{s}</option>)}
                </select>
              </FL>
            </div>
            <FL label="Assign Agent">
              <select className={sel} value={form.agent_id} onChange={e=>f('agent_id',e.target.value)}>
                <option value="">No agent</option>
                {agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </FL>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">Notes</h3>
            <textarea rows={3} className={inp + ' resize-none'} value={form.notes} onChange={e=>f('notes',e.target.value)} placeholder="Any notes…" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-white transition-colors text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [sort, setSort]         = useState('created_at');
  const [dir, setDir]           = useState('desc');
  const [colFilters, setColFilters] = useState({ f_id:'',f_email:'',f_first:'',f_last:'',f_nationality:'',f_recruiter:'',f_education:'' });
  const [showFilters, setShowFilters] = useState(false);
  const [panelFilters, setPanelFilters] = useState({ status:'',lead_status:'',recruiter_type:'' });
  const [view, setView]         = useState('table');
  const [countries, setCountries] = useState([]);
  const [agents, setAgents]     = useState([]);
  const [showAdd, setShowAdd]   = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);
  const LIMIT = 20;

  const buildParams = useCallback(() => {
    const p = new URLSearchParams({ page, limit:LIMIT, sort, dir, ...colFilters, ...panelFilters });
    for (const [k,v] of [...p.entries()]) { if (!v) p.delete(k); }
    return p.toString();
  }, [page, sort, dir, colFilters, panelFilters]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch(`/api/students?${buildParams()}`).then(r=>r.json());
      setStudents(data.students||[]); setTotal(data.total||0); setPages(data.pages||1);
    } finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/countries').then(r=>r.json()).then(d=>setCountries(d.countries||[]));
    fetch('/api/agents?limit=100').then(r=>r.json()).then(d=>setAgents(d.agents||[]));
  }, []);

  function cf(k,v) { setColFilters(p=>({...p,[k]:v})); setPage(1); }
  function pf(k,v) { setPanelFilters(p=>({...p,[k]:v})); setPage(1); }
  function toggleSort(col) { if (sort===col) setDir(d=>d==='asc'?'desc':'asc'); else { setSort(col); setDir('asc'); } setPage(1); }

  function SortIcon({ col }) {
    if (sort!==col) return <ArrowUpDown className="w-3 h-3 text-slate-400 ml-1 shrink-0" />;
    return dir==='asc' ? <ArrowUp className="w-3 h-3 text-brand-500 ml-1 shrink-0" /> : <ArrowDown className="w-3 h-3 text-brand-500 ml-1 shrink-0" />;
  }

  async function handleDelete(s) {
    if (!confirm(`Deactivate ${s.full_name||s.first_name}?`)) return;
    await apiCall(`/api/students/${s.id}`,'DELETE');
    load();
  }

  const activeFiltersCount = Object.values({...panelFilters,...colFilters}).filter(Boolean).length;

  const COLS = [
    { key:'id',          label:'STUDENT ID',       sort:'id'         },
    { key:'email',       label:'STUDENT EMAIL',     sort:'email'      },
    { key:'first_name',  label:'FIRST NAME',        sort:'name'       },
    { key:'last_name',   label:'LAST NAME',         sort:null         },
    { key:'nationality', label:'NATIONALITY',       sort:null         },
    { key:'agent',       label:'RECRUITMENT PAR…',  sort:null         },
    { key:'recruiter',   label:'RECRUITER TYPE',    sort:null         },
    { key:'education',   label:'EDUCATION',         sort:null         },
    { key:'apps',        label:'APPLICATIONS',      sort:null         },
    { key:'lead',        label:'LEAD STATUS',       sort:'lead_status'},
  ];

  const COL_FILTERS = [
    { key:'f_id',f_type:'text',placeholder:'ID…' },
    { key:'f_email',f_type:'text',placeholder:'Email…' },
    { key:'f_first',f_type:'text',placeholder:'First…' },
    { key:'f_last',f_type:'text',placeholder:'Last…' },
    { key:'f_nationality',f_type:'text',placeholder:'Country…' },
    { key:'',f_type:'none' },
    { key:'f_recruiter',f_type:'select' },
    { key:'f_education',f_type:'text',placeholder:'Education…' },
    { key:'',f_type:'none' },
    { key:'',f_type:'none' },
  ];

  return (
    <AdminLayout title="Students">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>Students</h2>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? '…' : `${total} students total`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(f=>!f)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all
              ${showFilters||activeFiltersCount>0 ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
            <Filter className="w-4 h-4" /> Filters
            {activeFiltersCount>0 && <span className="bg-brand-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeFiltersCount}</span>}
          </button>
          <div className="flex bg-white border border-slate-200 rounded-xl p-0.5">
            <button onClick={()=>setView('table')} className={`p-2 rounded-lg transition-colors ${view==='table'?'bg-brand-700 text-white':'text-slate-500 hover:text-slate-700'}`}><List className="w-4 h-4" /></button>
            <button onClick={()=>setView('grid')} className={`p-2 rounded-lg transition-colors ${view==='grid'?'bg-brand-700 text-white':'text-slate-500 hover:text-slate-700'}`}><Grid3x3 className="w-4 h-4" /></button>
          </div>
          <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={()=>setShowAdd(true)}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
            <Plus className="w-4 h-4" /> Add new student
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Filter Students</h3>
            {activeFiltersCount>0 && (
              <button onClick={()=>{setPanelFilters({status:'',lead_status:'',recruiter_type:''}); setColFilters({f_id:'',f_email:'',f_first:'',f_last:'',f_nationality:'',f_recruiter:'',f_education:''}); }}
                className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"><X className="w-3 h-3"/>Clear all</button>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[['Student Status','status',['Active','Pending','Rejected','Enrolled','Graduated','Withdrawn']],['Lead Status','lead_status',LEAD_STATUSES],['Recruiter Type','recruiter_type',RECRUITER_TYPES]].map(([label,key,opts])=>(
              <div key={key}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
                <select className={sel} value={panelFilters[key]} onChange={e=>pf(key,e.target.value)}>
                  <option value="">All</option>
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Sort By</label>
              <select className={sel} value={sort} onChange={e=>setSort(e.target.value)}>
                <option value="created_at">Date Added</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="lead_status">Lead Status</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {view==='table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            : students.length===0 ? <EmptyState icon={Users} title="No students found" description="Try adjusting your filters or add a new student." />
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ACTIONS</th>
                      {COLS.map(col=>(
                        <th key={col.key} onClick={()=>col.sort&&toggleSort(col.sort)}
                          className={`px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.sort?'cursor-pointer hover:text-brand-600':''}`}>
                          <div className="flex items-center">{col.label}{col.sort&&<SortIcon col={col.sort} />}</div>
                        </th>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-200 bg-white">
                      <td className="px-3 py-2" />
                      {COL_FILTERS.map((cf_,i)=>(
                        <td key={i} className="px-2 py-1.5 min-w-[100px]">
                          {cf_.f_type==='text' && <input value={colFilters[cf_.key]||''} onChange={e=>cf(cf_.key,e.target.value)} placeholder={cf_.placeholder} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 bg-slate-50 placeholder-slate-300" />}
                          {cf_.f_type==='select' && <select value={colFilters.f_recruiter||''} onChange={e=>cf('f_recruiter',e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 bg-slate-50"><option value="">All</option>{RECRUITER_TYPES.map(t=><option key={t}>{t}</option>)}</select>}
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s=>(
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-0.5">
                            <button onClick={()=>router.push(`/admin/student/${s.id}`)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-brand-600 transition-colors" title="View full profile"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={()=>{setSelected(s);setShowEdit(true);}} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-brand-600 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={()=>handleDelete(s)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                        <td className="px-3 py-3"><button onClick={()=>{setSelected(s);setShowView(true);}} className="font-mono text-xs text-brand-600 hover:underline font-bold">{s.id}</button></td>
                        <td className="px-3 py-3"><a href={`mailto:${s.email}`} className="text-xs text-brand-600 hover:underline max-w-[180px] truncate block">{s.email}</a></td>
                        <td className="px-3 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">{s.first_name||s.full_name?.split(' ')[0]||'—'}</td>
                        <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{s.last_name||s.full_name?.split(' ').slice(1).join(' ')||'—'}</td>
                        <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{s.flag&&<span className="mr-1">{s.flag}</span>}{s.nationality||'—'}</td>
                        <td className="px-3 py-3">{s.agent_email ? <a href={`mailto:${s.agent_email}`} className="text-xs text-brand-600 hover:underline max-w-[140px] truncate block" title={s.agent_name}>{s.agent_email}</a> : <span className="text-xs text-slate-300">—</span>}</td>
                        <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{s.recruiter_type||'Owner'}</td>
                        <td className="px-3 py-3 min-w-[160px]"><EducationCell level={s.education_level} verified={s.education_verified} /></td>
                        <td className="px-3 py-3"><AppBadges row={s} /></td>
                        <td className="px-3 py-3 whitespace-nowrap"><LeadBadge status={s.lead_status||'New'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? <div className="col-span-3 flex justify-center py-20"><Spinner size="lg" /></div>
            : students.length===0 ? <div className="col-span-3"><EmptyState icon={Users} title="No students found" /></div>
            : students.map(s=>(
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={s.avatar||'??'} size="md" />
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{s.full_name||`${s.first_name} ${s.last_name||''}`}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[160px]">{s.email}</div>
                      </div>
                    </div>
                    <LeadBadge status={s.lead_status||'New'} />
                  </div>
                  <div className="space-y-1.5 mb-3 text-xs text-slate-500">
                    <div>🌍 {s.nationality||'—'}</div>
                    <div>#{s.id} · {s.recruiter_type||'Owner'}</div>
                    <EducationCell level={s.education_level} verified={s.education_verified} />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <AppBadges row={s} />
                    <div className="flex gap-1">
                      <button onClick={()=>{setSelected(s);setShowEdit(true);}} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={()=>handleDelete(s)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {/* Pagination */}
      {!loading && pages>1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>Showing {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)} of {total}</span>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({length:Math.min(7,pages)},(_,i)=>{ const p=Math.max(1,Math.min(pages-6,page-3))+i; return <button key={p} onClick={()=>setPage(p)} className={`w-9 h-9 rounded-xl border text-sm font-semibold transition-colors ${p===page?'bg-brand-700 text-white border-brand-700':'border-slate-200 hover:bg-slate-50 bg-white'}`}>{p}</button>; })}
            <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddStudentModal open={showAdd} onClose={()=>setShowAdd(false)} onSaved={load} countries={countries} agents={agents} />
      <EditStudentModal open={showEdit} student={selected} onClose={()=>setShowEdit(false)} onSaved={load} countries={countries} agents={agents} />

      {/* View modal */}
      {showView && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowView(false)} />
          <div className="relative bg-white h-full w-full max-w-lg flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Student Profile</h2>
              <button onClick={()=>setShowView(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <Avatar initials={selected.avatar||'??'} size="lg" />
                <div>
                  <div className="font-bold text-slate-800 text-lg">{selected.full_name||`${selected.first_name} ${selected.last_name||''}`}</div>
                  <div className="text-sm text-slate-500">{selected.email}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <LeadBadge status={selected.lead_status||'New'} />
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['Student ID',`#${selected.id}`],['Phone',selected.phone||'—'],['Nationality',`${selected.flag||''} ${selected.nationality||'—'}`],['Agent',selected.agent_name||'—'],['Recruiter',selected.recruiter_type||'—'],['Referral',selected.referral_source||'—'],['Education',selected.education_level||'—'],['IELTS',selected.ielts_score||'—'],['GPA',selected.gpa||'—'],['Target Program',selected.target_program||'—'],['Target Intake',selected.target_intake||'—'],['Added',selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—']].map(([k,v])=>(
                  <div key={k} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xs text-slate-400 mb-0.5">{k}</div>
                    <div className="font-semibold text-slate-800 text-sm truncate">{v}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-2">Applications</div>
                <AppBadges row={selected} />
              </div>
              {selected.notes && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-slate-700"><span className="text-xs font-bold text-amber-600 block mb-1">Notes</span>{selected.notes}</div>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button onClick={()=>{setShowView(false);setShowEdit(true);}} className="w-full py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm transition-colors">Edit Student</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}