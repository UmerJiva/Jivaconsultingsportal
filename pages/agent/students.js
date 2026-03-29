// pages/agent/students.js — identical UI to admin but agent-scoped
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Avatar, Spinner, EmptyState } from '../../components/ui/index';
import {
  Plus, Users, RefreshCw, Filter, Grid3x3, List,
  ArrowUpDown, ArrowUp, ArrowDown,
  Pencil, Trash2, Eye, ChevronLeft, ChevronRight,
  CheckCircle, AlertTriangle, X, Upload, Info
} from 'lucide-react';
import { apiCall } from '../../lib/useApi';

// ── shared helpers (same as admin) ────────────────────────────
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

function AddStudentModal({ open, onClose, onSaved, countries: countryList }) {
  const EMPTY={first_name:'',middle_name:'',last_name:'',date_of_birth:'',country_id:'',passport_no:'',passport_expiry:'',gender:'',email:'',phone:'',password:'',status:'',referral_source:'',country_of_interest:'',services_of_interest:[],lead_status:'New',recruiter_type:'Owner',education_level:'',notes:'',consent:false};
  const [form,setForm]=useState(EMPTY);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [createdCreds, setCreatedCreds] = useState(null); // show after success
  useEffect(()=>{if(open){setForm(EMPTY);setError('');setCreatedCreds(null);}}, [open]);
  function f(k,v){setForm(p=>({...p,[k]:v}));}
  function toggleService(s){setForm(p=>({...p,services_of_interest:p.services_of_interest.includes(s)?p.services_of_interest.filter(x=>x!==s):[...p.services_of_interest,s]}));}

  // Auto-generate password from name
  function autoPassword() {
    const base = (form.first_name||'Student').replace(/\s/g,'');
    const rand  = Math.floor(1000+Math.random()*9000);
    f('password', `${base}@${rand}`);
  }

  async function handleSubmit(){
    if(!form.first_name||!form.last_name||!form.email||!form.country_id){setError('First name, last name, email and country are required.');return;}
    if(!form.consent){setError('Please confirm student consent before adding.');return;}
    const pwd = form.password.trim() || `Student@${Math.floor(1000+Math.random()*9000)}`;
    setSaving(true);setError('');
    try{
      await apiCall('/api/students','POST',{...form,services_of_interest:form.services_of_interest.join(','),password:pwd,consent:undefined});
      // Show credentials to agent
      setCreatedCreds({ email: form.email, password: pwd, name: `${form.first_name} ${form.last_name}` });
      onSaved();
    }catch(e){setError(e.message);}finally{setSaving(false);}
  }

  if(!open) return null;

  // ── Success: show credentials ──────────────────────────────
  if (createdCreds) return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white h-full w-full max-w-lg flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Student Created!</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600"/>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">{createdCreds.name} added!</h3>
          <p className="text-sm text-slate-500 mb-8">Share these login credentials with the student so they can access their dashboard.</p>

          {/* Credentials card */}
          <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 text-left mb-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Login Credentials</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Email Address</p>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                  <p className="flex-1 text-sm font-semibold text-slate-800 font-mono">{createdCreds.email}</p>
                  <button onClick={()=>navigator.clipboard.writeText(createdCreds.email)}
                    className="text-xs text-brand-600 font-bold hover:text-brand-800 px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors">Copy</button>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Password</p>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                  <p className="flex-1 text-sm font-semibold text-slate-800 font-mono">{createdCreds.password}</p>
                  <button onClick={()=>navigator.clipboard.writeText(createdCreds.password)}
                    className="text-xs text-brand-600 font-bold hover:text-brand-800 px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors">Copy</button>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 font-medium">⚠️ Save these credentials now. The password won't be shown again.</p>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">Close</button>
            <button onClick={()=>{ navigator.clipboard.writeText(`Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`); }}
              className="flex-1 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm transition-colors">
              Copy Both
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white h-full w-full max-w-lg flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Add new student</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"/>
            <p className="text-sm text-blue-700">Did you know you can also bulk import students. <a href="#" className="underline font-semibold">Learn how here</a>.</p>
          </div>
          {error&&<div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-4">Personal information</h3>
            <button className="flex items-center gap-2 border-2 border-brand-400 text-brand-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-brand-50 transition-colors mb-2"><Upload className="w-4 h-4"/>Autofill with passport</button>
            <p className="text-xs text-slate-400 mb-5">Auto-complete this section by uploading the student's passport. This is optional, but strongly recommended.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FL label="First name" required><input className={inp} placeholder="First name" value={form.first_name} onChange={e=>f('first_name',e.target.value)}/></FL>
                <FL label="Last name" required><input className={inp} placeholder="Last name" value={form.last_name} onChange={e=>f('last_name',e.target.value)}/></FL>
              </div>
              <FL label="Middle name"><input className={inp} placeholder="Middle name (optional)" value={form.middle_name} onChange={e=>f('middle_name',e.target.value)}/></FL>
              <FL label="Date of birth" required><input type="date" className={inp} value={form.date_of_birth} onChange={e=>f('date_of_birth',e.target.value)}/></FL>
              <FL label="Country of citizenship" required>
                <select className={sel} value={form.country_id} onChange={e=>f('country_id',e.target.value)}>
                  <option value="">Please choose a country</option>
                  {countryList.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                </select>
              </FL>
              <FL label="Passport number" hint="Passport number is optional, but strongly recommended."><input className={inp} placeholder="e.g. AB1234567" value={form.passport_no} onChange={e=>f('passport_no',e.target.value)}/></FL>
              <FL label="Passport expiry date"><input type="date" className={inp} value={form.passport_expiry} onChange={e=>f('passport_expiry',e.target.value)}/></FL>
              <FL label="Gender">
                <div className="flex gap-6 mt-1">
                  {['Male','Female'].map(g=>(
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="ag_gender" value={g} checked={form.gender===g} onChange={()=>f('gender',g)} className="w-4 h-4 accent-brand-600"/>
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
              <FL label="Student Email" required hint="This email will be used for the student's login account."><input type="email" className={inp} placeholder="student@email.com" value={form.email} onChange={e=>f('email',e.target.value)}/></FL>
              <FL label="Phone number"><input className={inp} placeholder="+92 300 1234567" value={form.phone} onChange={e=>f('phone',e.target.value)}/></FL>
              {/* Password field */}
              <FL label="Login Password" hint="Student will use this password to login. Leave blank to auto-generate.">
                <div className="flex gap-2">
                  <input className={inp} placeholder="e.g. Hamza@1234 (leave blank to auto-generate)"
                    value={form.password} onChange={e=>f('password',e.target.value)}/>
                  <button type="button" onClick={autoPassword}
                    className="shrink-0 px-3 py-2.5 border-2 border-brand-300 text-brand-600 rounded-xl text-xs font-bold hover:bg-brand-50 transition-colors whitespace-nowrap">
                    Auto
                  </button>
                </div>
              </FL>
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
                      <input type="checkbox" checked={form.services_of_interest.includes(s)} onChange={()=>toggleService(s)} className="w-3.5 h-3.5 accent-brand-600"/>
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
            </div>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={form.consent} onChange={e=>f('consent',e.target.checked)} className="w-4 h-4 mt-0.5 accent-brand-600 shrink-0"/>
            <span className="text-sm text-slate-600 leading-relaxed">I confirm that I have received express written consent from the student whom I am creating this profile for and I can provide proof of their consent upon request. To learn more please refer to the <a href="#" className="text-brand-600 underline font-medium">Personal Data Consent</a> article.</span>
          </label>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-white transition-colors text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {saving&&<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}Add student
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentStudentsPage() {
  const router = useRouter();
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
    try{const data=await fetch(`/api/students?${buildParams()}`).then(r=>r.json());setStudents(data.students||[]);setTotal(data.total||0);setPages(data.pages||1);}
    finally{setLoading(false);}
  },[buildParams]);

  useEffect(()=>{load();},[load]);
  useEffect(()=>{fetch('/api/countries').then(r=>r.json()).then(d=>setCountries(d.countries||[]));},[]);

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
          <button onClick={()=>setShowFilters(f=>!f)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${showFilters||activeFiltersCount>0?'bg-brand-50 border-brand-300 text-brand-700':'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
            <Filter className="w-4 h-4"/>Filters{activeFiltersCount>0&&<span className="bg-brand-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeFiltersCount}</span>}
          </button>
          <div className="flex bg-white border border-slate-200 rounded-xl p-0.5">
            <button onClick={()=>setView('table')} className={`p-2 rounded-lg transition-colors ${view==='table'?'bg-brand-700 text-white':'text-slate-500 hover:text-slate-700'}`}><List className="w-4 h-4"/></button>
            <button onClick={()=>setView('grid')} className={`p-2 rounded-lg transition-colors ${view==='grid'?'bg-brand-700 text-white':'text-slate-500 hover:text-slate-700'}`}><Grid3x3 className="w-4 h-4"/></button>
          </div>
          <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500"><RefreshCw className="w-4 h-4"/></button>
          <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
            <Plus className="w-4 h-4"/>Add new student
          </button>
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
          :students.length===0?<EmptyState icon={Users} title="No students found" description="Add your first student to get started."/>
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
                  <tr className="border-b border-slate-200 bg-white">
                    <td className="px-3 py-2"/>
                    {CF_.map((c,i)=>(
                      <td key={i} className="px-2 py-1.5 min-w-[100px]">
                        {c.f_type==='text'&&<input value={colFilters[c.key]||''} onChange={e=>cf_(c.key,e.target.value)} placeholder={c.placeholder} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 bg-slate-50 placeholder-slate-300"/>}
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(s=>(
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-0.5">
                          <button onClick={()=>router.push(`/agent/student/${s.id}`)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-brand-600 transition-colors" title="View full profile"><Eye className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                      <td className="px-3 py-3"><button onClick={()=>{setSelected(s);setShowView(true);}} className="font-mono text-xs text-brand-600 hover:underline font-bold">{s.id}</button></td>
                      <td className="px-3 py-3"><a href={`mailto:${s.email}`} className="text-xs text-brand-600 hover:underline max-w-[180px] truncate block">{s.email}</a></td>
                      <td className="px-3 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">{s.first_name||s.full_name?.split(' ')[0]||'—'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{s.last_name||s.full_name?.split(' ').slice(1).join(' ')||'—'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{s.flag&&<span className="mr-1">{s.flag}</span>}{s.nationality||'—'}</td>
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
                        <div className="font-bold text-slate-800 text-sm">{s.full_name||`${s.first_name} ${s.last_name||''}`}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[140px]">{s.email}</div>
                      </div>
                    </div>
                    <LeadBadge status={s.lead_status||'New'}/>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">🌍 {s.nationality||'—'}</div>
                  <EducationCell level={s.education_level} verified={s.education_verified}/>
                  <div className="mt-3 pt-3 border-t border-slate-100"><AppBadges row={s}/></div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {!loading&&pages>1&&(
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>Showing {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)} of {total}</span>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white"><ChevronLeft className="w-4 h-4"/></button>
            {Array.from({length:Math.min(5,pages)},(_,i)=>{const p=Math.max(1,Math.min(pages-4,page-2))+i;return<button key={p} onClick={()=>setPage(p)} className={`w-9 h-9 rounded-xl border text-sm font-semibold ${p===page?'bg-brand-700 text-white border-brand-700':'border-slate-200 hover:bg-slate-50 bg-white'}`}>{p}</button>;})}
            <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      )}

      <AddStudentModal open={showAdd} onClose={()=>setShowAdd(false)} onSaved={load} countries={countries}/>

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
                  <div className="font-bold text-slate-800 text-lg">{selected.full_name||`${selected.first_name} ${selected.last_name||''}`}</div>
                  <div className="text-sm text-slate-500">{selected.email}</div>
                  <div className="mt-1.5"><LeadBadge status={selected.lead_status||'New'}/></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['Student ID',`#${selected.id}`],['Phone',selected.phone||'—'],['Nationality',`${selected.flag||''} ${selected.nationality||'—'}`],['Education',selected.education_level||'—'],['IELTS',selected.ielts_score||'—'],['GPA',selected.gpa||'—'],['Target Program',selected.target_program||'—'],['Target Intake',selected.target_intake||'—']].map(([k,v])=>(
                  <div key={k} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xs text-slate-400 mb-0.5">{k}</div>
                    <div className="font-semibold text-slate-800 text-sm truncate">{v}</div>
                  </div>
                ))}
              </div>
              <div><div className="text-xs font-semibold text-slate-500 mb-2">Applications</div><AppBadges row={selected}/></div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}