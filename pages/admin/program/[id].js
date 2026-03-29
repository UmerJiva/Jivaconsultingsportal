// pages/admin/program/[id].js — Same as agent but admin sees Edit/Delete
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Spinner } from '../../../components/ui/index';
import { Settings,
  ArrowLeft, Heart, ExternalLink, X, ChevronDown, ChevronUp,
  CheckCircle, XCircle, DollarSign, Calendar, GraduationCap,
  BookOpen, Award, Globe, Building2, Users, TrendingUp, BarChart2,
  Zap, Image as ImageIcon, Info, Home, Pencil, Trash2, Loader2, AlertCircle, Plus
} from 'lucide-react';
import { apiCall } from '../../../lib/useApi';

const TAG_COLORS = { 'Instant Submission':'bg-emerald-50 text-emerald-700 border-emerald-300','Instant Offer':'bg-teal-50 text-teal-700 border-teal-300','High Job Demand':'bg-teal-50 text-teal-700 border-teal-200','Scholarships Available':'bg-green-50 text-green-700 border-green-200','No Visa Cap':'bg-blue-50 text-blue-700 border-blue-200','Loans':'bg-purple-50 text-purple-700 border-purple-200','Prime':'bg-sky-50 text-sky-700 border-sky-200','Incentivized':'bg-indigo-50 text-indigo-700 border-indigo-200','Popular':'bg-pink-50 text-pink-700 border-pink-200','Fast Acceptance':'bg-amber-50 text-amber-700 border-amber-200' };
const TAG_ICONS = { 'Instant Submission':Zap,'Instant Offer':Zap,'High Job Demand':TrendingUp,'Scholarships Available':Award,'No Visa Cap':Globe,'Loans':DollarSign,'Prime':BarChart2,'Incentivized':Award,'Popular':Users,'Fast Acceptance':CheckCircle };
const inp = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder-slate-300";
const sel = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700";
const TAG_OPTIONS = ['High Job Demand','Scholarships Available','No Visa Cap','Loans','Prime','Incentivized','Popular','Fast Acceptance'];

function FL({ label, hint, children }) {
  return <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>{children}{hint&&<p className="text-xs text-slate-400 mt-1">{hint}</p>}</div>;
}

function Gallery({ photos, show, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  useEffect(()=>{ setCurrent(startIndex); }, [startIndex]);
  if (!show || !photos.length) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"><X className="w-6 h-6"/></button>
      <div className="relative max-w-5xl w-full" onClick={e=>e.stopPropagation()}>
        <img src={photos[current]} alt={`Photo ${current+1}`} className="w-full max-h-[80vh] object-contain rounded-2xl"/>
        <div className="flex justify-center gap-2 mt-3">{photos.map((_,i)=><button key={i} onClick={()=>setCurrent(i)} className={`w-2 h-2 rounded-full transition-all ${i===current?'bg-white w-5':'bg-white/40'}`}/>)}</div>
        {photos.length>1&&<><button onClick={()=>setCurrent(c=>(c-1+photos.length)%photos.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors text-xl">‹</button><button onClick={()=>setCurrent(c=>(c+1)%photos.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors text-xl">›</button></>}
      </div>
    </div>
  );
}

function Collapsible({ title, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-4">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
        <span className="font-bold text-slate-800">{title}</span>
        {open?<ChevronUp className="w-4 h-4 text-slate-400"/>:<ChevronDown className="w-4 h-4 text-slate-400"/>}
      </button>
      {open&&<div className="px-5 pb-5 border-t border-slate-100">{children}</div>}
    </div>
  );
}

function SectionHead({ id, Icon, title }) {
  return (
    <div id={id} className="flex items-center gap-3 mb-5 scroll-mt-24">
      <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-slate-600"/></div>
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    </div>
  );
}

function ScoreCard({ label, value, sub, extra }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
        {extra}
      </div>
      <div className="text-2xl font-bold text-slate-800">{value ?? '—'}</div>
      {sub&&<div className="text-xs text-brand-600 mt-1 font-medium">{sub}</div>}
    </div>
  );
}

// Edit modal
function EditModal({ open, prog, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(()=>{
    if (prog && open) {
      setForm({
        name: prog.name||'', level: prog.level||'Bachelor',
        tuition_fee: prog.tuition_fee||'', currency: prog.currency||'USD',
        application_fee: prog.application_fee||0, app_fee_currency: prog.app_fee_currency||'USD',
        campus_city: prog.campus_city||'', location_text: prog.location_text||'',
        duration_text: prog.duration_text||'', available_intakes: prog.available_intakes||'',
        tags: prog.tags||'', success_chance: prog.success_chance||'High',
        instant_submission: prog.instant_submission?true:false,
        instant_offer: prog.instant_offer?true:false,
        commission_text: prog.commission_text||'',
        description: prog.description||'',
        min_gpa: prog.min_gpa||'', min_ielts: prog.min_ielts||'',
        min_toefl: prog.min_toefl||'', min_pte: prog.min_pte||'',
        min_education_level: prog.min_education_level||'',
        post_study_work_visa: prog.post_study_work_visa?true:false,
        commission_breakdown: prog.commission_breakdown||'',
      });
      setError('');
    }
  }, [prog, open]);

  function f(k,v) { setForm(p=>({...p,[k]:v})); }
  function toggleTag(tag) {
    const cur = (form.tags||'').split(',').filter(Boolean);
    f('tags', cur.includes(tag) ? cur.filter(t=>t!==tag).join(',') : [...cur,tag].join(','));
  }

  async function handleSave() {
    if (!form.name) { setError('Program name is required'); return; }
    setSaving(true); setError('');
    try {
      await apiCall(`/api/programs/${prog.id}`, 'PUT', form);
      onSaved(); onClose();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{height:'90vh'}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Edit Program</h2>
            <p className="text-xs text-slate-400">{prog?.name}</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error&&<div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}

          <FL label="Program Name"><input className={inp} value={form.name||''} onChange={e=>f('name',e.target.value)} placeholder="MSc Data Science"/></FL>
          <div className="grid grid-cols-3 gap-4">
            <FL label="Level"><select className={sel} value={form.level||'Bachelor'} onChange={e=>f('level',e.target.value)}>{['Bachelor','Master','PhD','Diploma','Certificate'].map(l=><option key={l}>{l}</option>)}</select></FL>
            <FL label="Duration"><input className={inp} value={form.duration_text||''} onChange={e=>f('duration_text',e.target.value)} placeholder="12 months"/></FL>
            <FL label="Success Chance"><select className={sel} value={form.success_chance||'High'} onChange={e=>f('success_chance',e.target.value)}>{['High','Medium','Low'].map(c=><option key={c}>{c}</option>)}</select></FL>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2"><FL label="Tuition Fee"><input type="number" className={inp} value={form.tuition_fee||''} onChange={e=>f('tuition_fee',e.target.value)} placeholder="35000"/></FL></div>
            <FL label="Currency"><select className={sel} value={form.currency||'USD'} onChange={e=>f('currency',e.target.value)}>{['USD','GBP','CAD','AUD','EUR','SGD'].map(c=><option key={c}>{c}</option>)}</select></FL>
            <FL label="App Fee"><input type="number" className={inp} value={form.application_fee||'0'} onChange={e=>f('application_fee',e.target.value)} placeholder="0"/></FL>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FL label="Campus City"><input className={inp} value={form.campus_city||''} onChange={e=>f('campus_city',e.target.value)} placeholder="London"/></FL>
            <FL label="Location Text"><input className={inp} value={form.location_text||''} onChange={e=>f('location_text',e.target.value)} placeholder="Greater London, UK"/></FL>
          </div>
          <FL label="Available Intakes" hint="Comma-separated: Sep 2026,Jan 2027"><input className={inp} value={form.available_intakes||''} onChange={e=>f('available_intakes',e.target.value)} placeholder="Sep 2026,Jan 2027"/></FL>
          <FL label="Commission"><input className={inp} value={form.commission_text||''} onChange={e=>f('commission_text',e.target.value)} placeholder="Up to £2,800"/></FL>
          <div className="grid grid-cols-3 gap-4">
            <FL label="Instant Submission"><select className={sel} value={form.instant_submission?'1':'0'} onChange={e=>f('instant_submission',e.target.value==='1')}><option value="1">Yes</option><option value="0">No</option></select></FL>
            <FL label="Instant Offer"><select className={sel} value={form.instant_offer?'1':'0'} onChange={e=>f('instant_offer',e.target.value==='1')}><option value="1">Yes</option><option value="0">No</option></select></FL>
            <FL label="Post-Study Visa"><select className={sel} value={form.post_study_work_visa?'1':'0'} onChange={e=>f('post_study_work_visa',e.target.value==='1')}><option value="1">Yes</option><option value="0">No</option></select></FL>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <p className="text-sm font-bold text-slate-700 mb-3">Admission Requirements</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FL label="Min. Education Level"><input className={inp} value={form.min_education_level||''} onChange={e=>f('min_education_level',e.target.value)} placeholder="4-Year Bachelor's Degree"/></FL>
              <FL label="Min. GPA (%)"><input type="number" className={inp} value={form.min_gpa||''} onChange={e=>f('min_gpa',e.target.value)} placeholder="55"/></FL>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FL label="Min. IELTS"><input type="number" step="0.5" className={inp} value={form.min_ielts||''} onChange={e=>f('min_ielts',e.target.value)} placeholder="6.0"/></FL>
              <FL label="Min. TOEFL"><input type="number" className={inp} value={form.min_toefl||''} onChange={e=>f('min_toefl',e.target.value)} placeholder="60"/></FL>
              <FL label="Min. PTE"><input type="number" className={inp} value={form.min_pte||''} onChange={e=>f('min_pte',e.target.value)} placeholder="56"/></FL>
            </div>
          </div>

          <FL label="Program Tags">
            <div className="flex flex-wrap gap-2 mt-1">
              {TAG_OPTIONS.map(tag=>{ const active=(form.tags||'').split(',').includes(tag); return (
                <button key={tag} type="button" onClick={()=>toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${active?'bg-brand-700 text-white border-brand-700':'border-slate-200 text-slate-600 hover:border-brand-400 hover:bg-brand-50'}`}>
                  {tag}
                </button>
              ); })}
            </div>
          </FL>

          <FL label="Program Description">
            <textarea rows={5} className={inp+' resize-none'} value={form.description||''} onChange={e=>f('description',e.target.value)} placeholder="Describe the program…"/>
          </FL>
          <FL label="Commission Breakdown">
            <textarea rows={4} className={inp+' resize-none'} value={form.commission_breakdown||''} onChange={e=>f('commission_breakdown',e.target.value)} placeholder="Detailed commission explanation…"/>
          </FL>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-white transition-colors text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {saving&&<Loader2 className="w-4 h-4 animate-spin"/>}Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProgramDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [prog, setProg]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lightbox, setLightbox] = useState({ show:false, index:0 });
  const [showMoreDesc, setShowMoreDesc] = useState(false);
  const [showPostStudy, setShowPostStudy] = useState(true);
  const [showCommission, setShowCommission] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showServices, setShowServices] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const TABS = ['overview','admission_requirements','scholarships','similar_programs'];
  const TAB_LABELS = { overview:'Overview', admission_requirements:'Admission Requirements', scholarships:'Scholarships', similar_programs:'Similar Programs' };

  function load() {
    if (!id) return;
    fetch(`/api/programs/${id}`).then(r=>r.json()).then(d=>{ setProg(d); setLoading(false); }).catch(()=>setLoading(false));
  }

  useEffect(()=>{ load(); }, [id]);
  useEffect(()=>{
    if (!prog) return;
    const handler = () => {
      for (const tab of [...TABS].reverse()) {
        const el = document.getElementById(tab);
        if (el && el.getBoundingClientRect().top <= 100) { setActiveTab(tab); break; }
      }
    };
    window.addEventListener('scroll', handler, { passive:true });
    return () => window.removeEventListener('scroll', handler);
  }, [prog]);

  function scrollTo(tab) {
    const el = document.getElementById(tab);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior:'smooth' });
    setActiveTab(tab);
  }

  async function handleDelete() {
    if (!confirm(`Deactivate "${prog?.name}"?`)) return;
    await apiCall(`/api/programs/${id}`, 'DELETE');
    router.push('/admin/universities');
  }

  if (loading) return <AdminLayout title="Program"><div className="flex justify-center py-20"><Spinner size="lg"/></div></AdminLayout>;
  if (!prog || prog.error) return <AdminLayout title="Program"><div className="text-center py-20 text-slate-400 text-lg">Program not found</div></AdminLayout>;

  const tags    = (prog.tags||'').split(',').filter(Boolean);
  const photos  = prog.photos || [];
  const intakes = (prog.available_intakes||'').split(',').filter(Boolean);
  const scholarships = prog.scholarships || [];
  const similar      = prog.similar || [];
  const fee    = prog.tuition_fee ? `${prog.currency} ${Number(prog.tuition_fee).toLocaleString()}` : '—';
  const appFee = prog.application_fee == 0 ? 'Free' : `${prog.app_fee_currency} ${prog.application_fee}`;
  const intakeRows = intakes.map((intake,i)=>({ intake, status: i<2 ? 'Open' : 'Likely open' }));

  return (
    <AdminLayout title={prog.name}>
      <div className="max-w-full">

        {/* Back + admin actions */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={()=>router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors">
            <ArrowLeft className="w-4 h-4"/>Back
          </button>
          <div className="flex items-center gap-2">
            <button onClick={()=>setShowEdit(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-brand-300 text-brand-700 font-bold text-sm hover:bg-brand-50 transition-colors shadow-sm">
              <Pencil className="w-4 h-4"/>Edit Program
            </button>
            <button onClick={()=>router.push(`/admin/program/${id}/requirements`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-700 font-bold text-sm hover:bg-amber-100 transition-colors shadow-sm">
              <Settings className="w-4 h-4"/>Application Requirements
            </button>
            <button onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors shadow-sm">
              <Trash2 className="w-4 h-4"/>Deactivate
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center font-bold text-brand-700 text-base shadow-sm overflow-hidden shrink-0">
              {photos[0] ? <img src={photos[0]} alt={prog.university_name} className="w-full h-full object-cover"/> : prog.logo_initials||prog.university_name?.[0]||'U'}
            </div>
            <div>
              <button onClick={()=>router.push(`/admin/university/${prog.university_id}`)} className="text-brand-600 hover:text-brand-800 font-semibold text-sm hover:underline">{prog.university_name}</button>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">{prog.flag&&<span>{prog.flag}</span>}{[prog.campus_city,prog.country].filter(Boolean).join(', ')}</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3" style={{fontFamily:'Georgia,serif'}}>{prog.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-0">
            <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">#{prog.id}</span>
            {prog.instant_submission&&<span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-300"><CheckCircle className="w-3 h-3"/>Instant Submission</span>}
            {prog.instant_offer&&<span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border bg-teal-50 text-teal-700 border-teal-300"><Zap className="w-3 h-3"/>Instant Offer</span>}
            {tags.map(tag=>{ const Icon=TAG_ICONS[tag]||CheckCircle; return <span key={tag} className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${TAG_COLORS[tag]||'bg-slate-50 text-slate-500 border-slate-200'}`}><Icon className="w-3 h-3"/>{tag}</span>; })}
          </div>
          {photos.length>0&&(
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="col-span-1 row-span-2 relative rounded-xl overflow-hidden h-52 cursor-pointer group" onClick={()=>setLightbox({show:true,index:0})}>
                <img src={photos[0]} alt="Campus" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                <button onClick={e=>{e.stopPropagation();setLightbox({show:true,index:0});}} className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5"/>View Photos {photos.length>1&&`(${photos.length})`}</button>
              </div>
              {[1,2,3,4].map(idx=>(
                <div key={idx} onClick={()=>photos[idx]&&setLightbox({show:true,index:idx})} className="relative rounded-xl overflow-hidden h-24 cursor-pointer group bg-slate-100">
                  {photos[idx]?<img src={photos[idx]} alt={`Photo ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>:<div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300"/>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky tabs */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm mb-0">
          <div className="flex overflow-x-auto">
            {TABS.map(tab=>(
              <button key={tab} onClick={()=>scrollTo(tab)}
                className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap -mb-px ${activeTab===tab?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* Two column */}
        <div className="flex gap-6 mt-6">
          <div className="flex-1 min-w-0">

            {/* OVERVIEW */}
            <div id="overview" className="scroll-mt-20 mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0"><Building2 className="w-4 h-4 text-slate-600"/></div>
                <h2 className="text-xl font-bold text-slate-800">Program Summary</h2>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <p className="text-sm font-bold text-slate-700 mb-3">Program Description</p>
                <div className={`text-sm text-slate-700 leading-relaxed ${!showMoreDesc?'line-clamp-6':''}`}>
                  {prog.description || `${prog.name} is an internationally recognized program at ${prog.university_name}.`}
                </div>
                {(prog.description||'').length > 400 && (
                  <button onClick={()=>setShowMoreDesc(p=>!p)} className="flex items-center gap-1 text-brand-600 font-semibold text-sm mt-3 hover:text-brand-800">
                    {showMoreDesc?<><ChevronUp className="w-4 h-4"/>Show Less</>:<><ChevronDown className="w-4 h-4"/>Show More</>}
                  </button>
                )}
              </div>
            </div>

            {/* ADMISSION */}
            <div id="admission_requirements" className="scroll-mt-20 mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0"><BarChart2 className="w-4 h-4 text-slate-600"/></div>
                <h2 className="text-xl font-bold text-slate-800">Admission Requirements</h2>
              </div>
              <p className="text-sm text-slate-500 mb-4">May vary depending on student nationality and education background.</p>
              <div className="mb-5">
                <h3 className="text-base font-bold text-slate-700 mb-3">Academic Background</h3>
                <div className="grid grid-cols-2 gap-4">
                  <ScoreCard label="Minimum Level of Education Completed" value={prog.min_education_level||"4-Year Bachelor's Degree"}/>
                  <div className="border border-slate-200 rounded-xl p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Minimum GPA</div>
                      <button className="text-xs text-brand-600 hover:underline font-medium">Convert grades</button>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{prog.min_gpa ? `${prog.min_gpa}%` : '—'}</div>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-700 mb-3">Minimum Language Test Scores</h3>
                <div className="grid grid-cols-3 gap-4">
                  <ScoreCard label="IELTS" value={prog.min_ielts||'—'}/>
                  <ScoreCard label="TOEFL" value={prog.min_toefl||'—'}/>
                  <ScoreCard label="PTE" value={prog.min_pte||'—'}/>
                </div>
              </div>
              <Collapsible title="This program requires valid language test results" defaultOpen={false}>
                <p className="text-sm text-slate-600 mt-3">Applicants interested in applying for direct admission, but are yet to complete an acceptable language test, can do so, but must provide valid results before receiving a final offer letter.</p>
              </Collapsible>
              <p className="text-xs text-slate-400 mt-3">The program requirements above should only be used as a guide and do not guarantee admission into the program.</p>
            </div>

            {/* SCHOLARSHIPS */}
            <div id="scholarships" className="scroll-mt-20 mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0"><Award className="w-4 h-4 text-slate-600"/></div>
                <h2 className="text-xl font-bold text-slate-800">Scholarships</h2>
              </div>
              {scholarships.length===0
                ? <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center"><Award className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500 text-sm">No scholarships listed yet.</p></div>
                : <div className="grid sm:grid-cols-2 gap-4">{scholarships.map(s=>(
                    <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm hover:border-brand-200 transition-all">
                      <h3 className="font-bold text-slate-800 mb-0.5">{s.name}</h3>
                      <p className="text-xs text-slate-500 mb-4">{prog.university_name} — All campuses</p>
                      <div className="space-y-2.5">
                        {[['Amount',s.amount_text||'—'],['Auto applied',s.auto_applied?'Yes':'No'],['Eligible nationalities',s.eligible_nationalities||'All nationalities'],['Eligible program levels',s.eligible_levels||'All program levels']].map(([k,v])=>(
                          <div key={k}><div className="text-xs font-bold text-slate-700">{k}</div><div className="text-sm text-slate-600 leading-snug line-clamp-2">{v}</div></div>
                        ))}
                      </div>
                      <button className="flex items-center gap-1 text-brand-600 font-semibold text-sm mt-4 hover:text-brand-800 transition-colors">Learn more <ExternalLink className="w-3.5 h-3.5"/></button>
                    </div>
                  ))}</div>
              }
            </div>

            {/* SIMILAR */}
            <div id="similar_programs" className="scroll-mt-20 mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4 text-slate-600"/></div>
                <h2 className="text-xl font-bold text-slate-800">Similar Programs</h2>
              </div>
              {similar.length===0
                ? <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center"><BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500 text-sm">No similar programs found.</p></div>
                : <div className="space-y-3">{similar.map(p=>{
                    const pIntakes=(p.available_intakes||'').split(',').filter(Boolean);
                    return (
                      <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <button onClick={()=>router.push(`/admin/program/${p.id}`)} className="font-bold text-slate-800 text-base hover:text-brand-700 transition-colors text-left">{p.name}</button>
                            <p className="text-xs text-slate-500 mt-0.5">{p.university_name}</p>
                            <div className="grid grid-cols-4 gap-3 mt-3">{[['Earliest intake',pIntakes[0]||'—'],['Deadline',pIntakes[0]||'—'],['Gross tuition',p.tuition_fee?`${p.currency} ${Number(p.tuition_fee).toLocaleString()}`:'—'],['Application fee',p.application_fee==0?'Free':'Paid']].map(([k,v])=>(
                              <div key={k} className="text-xs"><div className="text-slate-400">{k}</div><div className="font-semibold text-slate-700 mt-0.5">{v}</div></div>
                            ))}</div>
                            {p.commission_text&&<div className="flex items-center gap-2 mt-2 text-xs"><span className="text-slate-400">Commission</span><span className="font-bold text-slate-700">{p.commission_text}</span></div>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={()=>router.push(`/admin/program/${p.id}`)} className="flex items-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors border-2 border-brand-200 hover:border-brand-400">View <ExternalLink className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}</div>
              }
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 shrink-0">
            <div className="sticky top-20 space-y-4">
              {/* Admin: no Create Application, just info */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-center">
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Admin View</div>
                <p className="text-xs text-amber-700">Only students and agents can submit applications. Use Edit to update program details.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="divide-y divide-slate-100">
                  {[[GraduationCap,prog.level?`${prog.level}'s Degree`:prog.level,'Program Level'],[Calendar,prog.duration_text||'—','Program Length'],[Home,prog.cost_of_living||'—','Cost of Living'],[DollarSign,fee,'Gross Tuition'],[DollarSign,appFee,'Application Fee']].map(([Icon,v,label])=>(
                    <div key={label} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-slate-500"/></div>
                      <div><div className="font-bold text-slate-800 text-sm">{v}</div><div className="text-xs text-slate-400">{label}</div></div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-sm font-bold text-slate-700 mb-2">Other Fees</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Approx. CAS Deposit (one time)</span>
                    <span className="font-bold text-slate-800">{prog.currency} {prog.tuition_fee?(Number(prog.tuition_fee)*0.47).toLocaleString(undefined,{maximumFractionDigits:2}):'—'}</span>
                  </div>
                </div>
              </div>

              {/* Program Intakes */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4"/>Program Intakes</h3>
                {intakeRows.length===0 ? <p className="text-slate-400 text-sm">No intakes available.</p>
                  : <div className="space-y-2">{intakeRows.map(({intake,status},i)=>(
                      <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status==='Open'?'bg-emerald-100 text-emerald-700':'bg-amber-50 text-amber-600'}`}>{status}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400"/>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{intake}</span>
                      </div>
                    ))}</div>
                }
              </div>

              {/* Commissions */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button onClick={()=>setShowCommission(o=>!o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                  <span className="font-bold text-slate-800">Commissions</span>
                  {showCommission?<ChevronUp className="w-4 h-4 text-slate-400"/>:<ChevronDown className="w-4 h-4 text-slate-400"/>}
                </button>
                {showCommission&&(
                  <div className="px-5 pb-5 border-t border-slate-100">
                    <div className="mt-4 flex justify-center mb-4">
                      <span className="bg-emerald-100 text-emerald-700 font-bold px-5 py-2 rounded-full text-sm">{prog.commission_text||'Contact for details'}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Commission Breakdown</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{prog.commission_breakdown||'Commission details not set. Edit this program to add commission breakdown.'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Gallery photos={photos} show={lightbox.show} startIndex={lightbox.index} onClose={()=>setLightbox({show:false,index:0})}/>
      <EditModal open={showEdit} prog={prog} onClose={()=>setShowEdit(false)} onSaved={()=>{ setShowEdit(false); load(); }}/>
    </AdminLayout>
  );
}