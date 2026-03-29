// pages/admin/universities.js — with university-level commission defaults
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { StatusBadge, Spinner } from '../../components/ui/index';
import {
  Plus, Building2, RefreshCw, Search, Pencil, Trash2, Eye,
  Grid3x3, List, X, ChevronLeft, ChevronRight,
  Upload, Image as ImageIcon, GraduationCap, BookOpen, DollarSign,
  CheckCircle, MapPin, Globe, Award, Briefcase, Home, Users,
  TrendingUp, AlertCircle, Loader2, Star, Calendar, Percent,
  Hash, ToggleLeft, ToggleRight, Copy, Wand2
} from 'lucide-react';
import { apiCall } from '../../lib/useApi';

const inp = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder-slate-300 transition-colors";
const sel = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 transition-colors";

const INTAKE_OPTIONS = ['January','February','March','July','August','September','October','November','Winter','Summer','Fall','Spring'];
const FEATURES_LIST  = ['Post Graduation Permit','Co-op/Internship Participation','Work While Studying','Conditional Offer Letter','Accommodations','Scholarships Available','On-campus Housing','Career Services'];
const FEATURE_ICONS  = { 'Post Graduation Permit':GraduationCap,'Co-op/Internship Participation':Briefcase,'Work While Studying':TrendingUp,'Conditional Offer Letter':CheckCircle,'Accommodations':Home,'Scholarships Available':Award,'On-campus Housing':Building2,'Career Services':Users };
const TAG_OPTIONS    = ['High Job Demand','Scholarships Available','No Visa Cap','Loans','Prime','Incentivized','Popular','Fast Acceptance'];
const TAG_COLORS     = { 'High Job Demand':'bg-teal-50 text-teal-700 border-teal-200','Scholarships Available':'bg-green-50 text-green-700 border-green-200','No Visa Cap':'bg-blue-50 text-blue-700 border-blue-200','Loans':'bg-purple-50 text-purple-700 border-purple-200','Prime':'bg-sky-50 text-sky-700 border-sky-200','Incentivized':'bg-indigo-50 text-indigo-700 border-indigo-200','Popular':'bg-pink-50 text-pink-700 border-pink-200','Fast Acceptance':'bg-amber-50 text-amber-700 border-amber-200' };

function safeArr(val) { if(!val)return[]; if(Array.isArray(val))return val; try{return JSON.parse(val);}catch{return[];} }
function safePhotos(u) { return safeArr(u?.photos); }

function FL({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}{required&&<span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint&&<p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Commission input (reused for both uni-level and per-program) ──
function CommissionInput({ type, amount, percent, text, onChange, label='Commission', compact=false }) {
  const typeOptions = [
    { value:'text',    icon:Star,    label:'Custom text' },
    { value:'fixed',   icon:DollarSign, label:'Fixed amount' },
    { value:'percent', icon:Percent, label:'% of tuition' },
  ];
  return (
    <div className={compact ? '' : 'bg-white border border-slate-200 rounded-2xl p-4'}>
      {!compact && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{label}</div>}
      {/* Type selector */}
      <div className="flex gap-1.5 mb-3">
        {typeOptions.map(opt=>(
          <button key={opt.value} type="button" onClick={()=>onChange('type', opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all
              ${type===opt.value ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-200 text-slate-600 hover:border-brand-300 bg-white'}`}>
            <opt.icon className="w-3 h-3"/>{opt.label}
          </button>
        ))}
      </div>
      {/* Input based on type */}
      {type==='fixed' && (
        <div className="flex gap-2">
          <input type="number" step="0.01" min="0" className={inp} placeholder="e.g. 2800"
            value={amount||''} onChange={e=>onChange('amount', e.target.value)}/>
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 text-sm text-slate-500 font-semibold shrink-0">USD</div>
        </div>
      )}
      {type==='percent' && (
        <div className="flex gap-2 items-center">
          <input type="number" step="0.1" min="0" max="100" className={inp} placeholder="e.g. 10"
            value={percent||''} onChange={e=>onChange('percent', e.target.value)}/>
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 text-sm text-slate-500 font-semibold shrink-0">
            <Percent className="w-3.5 h-3.5 mr-1"/>of tuition
          </div>
        </div>
      )}
      {type==='text' && (
        <input className={inp} placeholder="e.g. Up to £2,800 per enrollment"
          value={text||''} onChange={e=>onChange('text', e.target.value)}/>
      )}
      {/* Preview */}
      {type==='percent' && percent && (
        <p className="text-xs text-brand-600 mt-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3"/>Automatically calculated from each program's tuition fee
        </p>
      )}
    </div>
  );
}

// ── Image uploader ────────────────────────────────────────────
function ImageUploader({ images, onChange, universityId }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  function fileToBase64(file) { return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
  async function handleFiles(files) {
    setUploadError('');
    const next = [...images];
    for (const file of files) {
      if (!file.type.startsWith('image/')) { setUploadError('Only image files allowed'); continue; }
      if (file.size > 8*1024*1024) { setUploadError('Image must be under 8MB'); continue; }
      setUploading(true);
      try {
        const base64 = await fileToBase64(file);
        try { const result = await apiCall('/api/universities/upload-image','POST',{ image:base64, filename:file.name, university_id:universityId||null }); next.push(result.url); }
        catch { next.push(base64); }
      } finally { setUploading(false); }
    }
    onChange(next);
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-500">Upload photos for the university gallery. <span className="font-semibold">First image = cover photo.</span></p>
        {uploadError&&<p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{uploadError}</p>}
      </div>
      <div onDrop={e=>{e.preventDefault();handleFiles([...e.dataTransfer.files]);}} onDragOver={e=>e.preventDefault()}
        onClick={()=>fileRef.current?.click()}
        className="border-2 border-dashed border-slate-300 hover:border-brand-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-brand-50 mb-4">
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e=>handleFiles([...e.target.files])}/>
        {uploading ? <div className="flex flex-col items-center gap-2 text-brand-600"><Loader2 className="w-8 h-8 animate-spin"/><p className="text-sm font-medium">Uploading…</p></div>
          : <div className="flex flex-col items-center gap-2 text-slate-400"><Upload className="w-8 h-8"/><p className="text-sm font-semibold text-slate-600">Click to upload or drag & drop</p><p className="text-xs">PNG, JPG, WEBP — max 8MB each</p></div>}
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((src,i)=>(
            <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
              <img src={src} alt={`Photo ${i+1}`} className="w-full h-full object-cover" onError={e=>{e.target.style.display='none';}}/>
              {i===0&&<span className="absolute top-1.5 left-1.5 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">Cover</span>}
              <button type="button" onClick={()=>onChange(images.filter((_,idx)=>idx!==i))}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"><X className="w-3 h-3"/></button>
            </div>
          ))}
          <div onClick={()=>fileRef.current?.click()} className="aspect-video rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-400 flex items-center justify-center cursor-pointer transition-colors hover:bg-brand-50">
            <div className="text-center text-slate-400"><Plus className="w-5 h-5 mx-auto mb-1"/><span className="text-xs font-medium">Add more</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Scholarship form ──────────────────────────────────────────
function ScholarshipForm({ scholarships, onChange }) {
  function add() { onChange([...scholarships,{name:'',amount_text:'',auto_applied:true,eligible_nationalities:'All nationalities',eligible_levels:'All program levels'}]); }
  function remove(i) { onChange(scholarships.filter((_,idx)=>idx!==i)); }
  function upd(i,k,v) { const n=[...scholarships]; n[i]={...n[i],[k]:v}; onChange(n); }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">Add scholarships offered at this university.</p>
        <button type="button" onClick={add} className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors border border-brand-200"><Plus className="w-4 h-4"/>Add Scholarship</button>
      </div>
      {scholarships.length===0
        ? <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center"><Award className="w-10 h-10 text-slate-300 mx-auto mb-2"/><p className="text-slate-400 text-sm font-medium">No scholarships yet</p><button type="button" onClick={add} className="mt-3 text-brand-600 text-sm font-bold hover:underline">+ Add first scholarship</button></div>
        : <div className="space-y-4">{scholarships.map((s,i)=>(
            <div key={i} className="border-2 border-slate-200 hover:border-brand-200 rounded-2xl p-5 space-y-4 relative transition-colors">
              <button type="button" onClick={()=>remove(i)} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4"/></button>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider"><Award className="w-3.5 h-3.5 text-brand-400"/>Scholarship #{i+1}</div>
              <FL label="Name" required><input className={inp} placeholder="International Excellence Award" value={s.name||''} onChange={e=>upd(i,'name',e.target.value)}/></FL>
              <div className="grid grid-cols-2 gap-4">
                <FL label="Amount"><input className={inp} placeholder="CAD 5,000–15,000" value={s.amount_text||''} onChange={e=>upd(i,'amount_text',e.target.value)}/></FL>
                <FL label="Auto Applied"><select className={sel} value={s.auto_applied?'1':'0'} onChange={e=>upd(i,'auto_applied',e.target.value==='1')}><option value="1">Yes</option><option value="0">No</option></select></FL>
              </div>
              <FL label="Eligible Nationalities"><input className={inp} placeholder="All nationalities" value={s.eligible_nationalities||''} onChange={e=>upd(i,'eligible_nationalities',e.target.value)}/></FL>
              <FL label="Eligible Program Levels"><input className={inp} placeholder="Bachelor's Degree, Master's Degree" value={s.eligible_levels||''} onChange={e=>upd(i,'eligible_levels',e.target.value)}/></FL>
            </div>
          ))}</div>
      }
    </div>
  );
}

// ── Program form ──────────────────────────────────────────────
function ProgramForm({ programs, onChange, defaultCommission }) {
  function add() {
    // Pre-fill commission from university default if set
    const comm = defaultCommission?.type && defaultCommission.type !== 'text'
      ? { commission_type: defaultCommission.type, commission_amount: defaultCommission.amount, commission_percent: defaultCommission.percent, commission_text: defaultCommission.text }
      : { commission_type:'text', commission_amount:'', commission_percent:'', commission_text: defaultCommission?.text||'' };
    onChange([...programs,{ name:'',level:'Bachelor',tuition_fee:'',currency:'USD',application_fee:'0',app_fee_currency:'USD',campus_city:'',location_text:'',duration_text:'',available_intakes:'',tags:'',success_chance:'High',instant_submission:1,instant_offer:0, ...comm }]);
  }
  function remove(i) { onChange(programs.filter((_,idx)=>idx!==i)); }
  function upd(i,k,v) { const n=[...programs]; n[i]={...n[i],[k]:v}; onChange(n); }
  function toggleTag(i,tag) { const cur=(programs[i].tags||'').split(',').filter(Boolean); upd(i,'tags',cur.includes(tag)?cur.filter(t=>t!==tag).join(','):[...cur,tag].join(',')); }

  // Apply university default to all programs at once
  function applyDefaultToAll() {
    if (!defaultCommission?.type || defaultCommission.type === 'none') return;
    const updated = programs.map(p => ({
      ...p,
      commission_type:    defaultCommission.type,
      commission_amount:  defaultCommission.amount,
      commission_percent: defaultCommission.percent,
      commission_text:    defaultCommission.text,
    }));
    onChange(updated);
  }

  // Preview calculated commission for a program
  function calcCommission(p) {
    if (!p.commission_type || p.commission_type === 'text') return p.commission_text || null;
    if (p.commission_type === 'fixed')   return p.commission_amount ? `$${parseFloat(p.commission_amount).toLocaleString()}` : null;
    if (p.commission_type === 'percent') {
      const tuition = parseFloat(p.tuition_fee) || 0;
      const pct     = parseFloat(p.commission_percent) || 0;
      if (tuition && pct) return `${p.currency||'USD'} ${(tuition * pct / 100).toLocaleString()} (${pct}% of tuition)`;
      return `${pct}% of tuition`;
    }
    return null;
  }

  const hasDefault = defaultCommission?.type && defaultCommission.type !== 'none';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">Add programs offered at this university.</p>
        <div className="flex items-center gap-2">
          {hasDefault && programs.length > 0 && (
            <button type="button" onClick={applyDefaultToAll}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors border border-emerald-200">
              <Wand2 className="w-3.5 h-3.5"/>Apply default commission to all
            </button>
          )}
          <button type="button" onClick={add} className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors border border-brand-200">
            <Plus className="w-4 h-4"/>Add Program
          </button>
        </div>
      </div>

      {programs.length===0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2"/>
          <p className="text-slate-400 text-sm font-medium">No programs yet</p>
          <button type="button" onClick={add} className="mt-3 text-brand-600 text-sm font-bold hover:underline">+ Add first program</button>
        </div>
      ) : (
        <div className="space-y-5">
          {programs.map((p,i)=>{
            const preview = calcCommission(p);
            return (
              <div key={i} className="border-2 border-slate-200 hover:border-brand-200 rounded-2xl overflow-hidden transition-colors">
                {/* Program header */}
                <div className="flex items-center justify-between bg-slate-50 px-5 py-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <BookOpen className="w-3.5 h-3.5 text-brand-400"/>
                    Program #{i+1}
                    {p.name && <span className="text-slate-700 font-semibold ml-1">— {p.name}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasDefault && (
                      <button type="button"
                        onClick={()=>{
                          upd(i,'commission_type',    defaultCommission.type);
                          upd(i,'commission_amount',  defaultCommission.amount);
                          upd(i,'commission_percent', defaultCommission.percent);
                          upd(i,'commission_text',    defaultCommission.text);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors">
                        <Copy className="w-3 h-3"/>Use default
                      </button>
                    )}
                    <button type="button" onClick={()=>remove(i)} className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4"/></button>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <FL label="Program Name" required><input className={inp} placeholder="MSc Data Science" value={p.name||''} onChange={e=>upd(i,'name',e.target.value)}/></FL>
                  <div className="grid grid-cols-3 gap-4">
                    <FL label="Level"><select className={sel} value={p.level||'Bachelor'} onChange={e=>upd(i,'level',e.target.value)}>{['Bachelor','Master','PhD','Diploma','Certificate'].map(l=><option key={l}>{l}</option>)}</select></FL>
                    <FL label="Duration"><input className={inp} placeholder="12 months" value={p.duration_text||''} onChange={e=>upd(i,'duration_text',e.target.value)}/></FL>
                    <FL label="Success Chance"><select className={sel} value={p.success_chance||'High'} onChange={e=>upd(i,'success_chance',e.target.value)}>{['High','Medium','Low'].map(c=><option key={c}>{c}</option>)}</select></FL>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2"><FL label="Tuition Fee"><input type="number" className={inp} placeholder="35000" value={p.tuition_fee||''} onChange={e=>upd(i,'tuition_fee',e.target.value)}/></FL></div>
                    <FL label="Currency"><select className={sel} value={p.currency||'USD'} onChange={e=>upd(i,'currency',e.target.value)}>{['USD','GBP','CAD','AUD','EUR','SGD'].map(c=><option key={c}>{c}</option>)}</select></FL>
                    <FL label="App Fee"><input type="number" className={inp} placeholder="0" value={p.application_fee||'0'} onChange={e=>upd(i,'application_fee',e.target.value)}/></FL>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FL label="Campus City"><input className={inp} placeholder="London" value={p.campus_city||''} onChange={e=>upd(i,'campus_city',e.target.value)}/></FL>
                    <FL label="Location Text"><input className={inp} placeholder="Greater London, UK" value={p.location_text||''} onChange={e=>upd(i,'location_text',e.target.value)}/></FL>
                  </div>
                  <FL label="Available Intakes" hint="Comma-separated e.g. Sep 2026,Jan 2027">
                    <input className={inp} placeholder="Sep 2026,Jan 2027,May 2027" value={p.available_intakes||''} onChange={e=>upd(i,'available_intakes',e.target.value)}/>
                  </FL>

                  {/* ── Commission per program ── */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5"/>Commission for this program
                      </div>
                      {preview && (
                        <div className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                          ≈ {preview}
                        </div>
                      )}
                    </div>
                    <CommissionInput
                      compact
                      type={p.commission_type||'text'}
                      amount={p.commission_amount}
                      percent={p.commission_percent}
                      text={p.commission_text}
                      onChange={(k,v) => upd(i, k==='type'?'commission_type':k==='amount'?'commission_amount':k==='percent'?'commission_percent':'commission_text', v)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FL label="Instant Submission"><select className={sel} value={p.instant_submission?'1':'0'} onChange={e=>upd(i,'instant_submission',e.target.value==='1')}><option value="1">Yes</option><option value="0">No</option></select></FL>
                    <FL label="Instant Offer"><select className={sel} value={p.instant_offer?'1':'0'} onChange={e=>upd(i,'instant_offer',e.target.value==='1')}><option value="1">Yes</option><option value="0">No</option></select></FL>
                  </div>
                  <FL label="Program Tags">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {TAG_OPTIONS.map(tag=>{ const active=(p.tags||'').split(',').includes(tag); return (
                        <button key={tag} type="button" onClick={()=>toggleTag(i,tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${active?'bg-brand-700 text-white border-brand-700':'border-slate-200 text-slate-600 hover:border-brand-400 hover:bg-brand-50'}`}>
                          {tag}
                        </button>
                      ); })}
                    </div>
                  </FL>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── University Card ───────────────────────────────────────────
function UniCard({ u, onView, onEdit, onDelete }) {
  const photos   = safePhotos(u);
  const cover    = photos[0];
  const features = safeArr(u.features);
  const intakes  = u.intakes ? u.intakes.split(',').filter(Boolean) : [];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group">
      <div className={`relative h-36 overflow-hidden shrink-0 ${!cover?'bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500':''}`}>
        {cover ? <img src={cover} alt={u.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          : <div className="absolute inset-0"><div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"/></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"/>
        <div className="absolute top-3 left-3 w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-bold text-brand-700 text-lg shadow-md border border-white/80">{u.logo_initials||u.name?.[0]||'U'}</div>
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button onClick={()=>onView(u)} className="p-2 rounded-xl bg-black/40 hover:bg-brand-600 text-white backdrop-blur-sm transition-colors shadow"><Eye className="w-3.5 h-3.5"/></button>
          <button onClick={()=>onEdit(u)} className="p-2 rounded-xl bg-black/40 hover:bg-brand-600 text-white backdrop-blur-sm transition-colors shadow"><Pencil className="w-3.5 h-3.5"/></button>
          <button onClick={()=>onDelete(u)} className="p-2 rounded-xl bg-black/40 hover:bg-red-500 text-white backdrop-blur-sm transition-colors shadow"><Trash2 className="w-3.5 h-3.5"/></button>
        </div>
        {u.world_ranking && <div className="absolute bottom-3 right-3 bg-white/95 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">#{u.world_ranking}</div>}
        {photos.length > 1 && <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm"><ImageIcon className="w-3 h-3"/>{photos.length} photos</div>}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <button onClick={()=>onView(u)} className="font-bold text-slate-800 text-left text-base leading-snug hover:text-brand-700 transition-colors mb-1 line-clamp-2">{u.name}</button>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3"><MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400"/>{[u.city,u.country].filter(Boolean).join(', ')||'—'}</div>
        <div className="flex items-center justify-between mb-3">
          <StatusBadge status={u.status}/>
          {u.tuition_info && <span className="flex items-center gap-1 text-xs text-slate-500 font-medium"><DollarSign className="w-3 h-3 text-slate-400"/>{u.tuition_info}</span>}
        </div>
        {/* Commission preview */}
        {(u.default_commission_type && u.default_commission_type !== 'text') || u.default_commission_text ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mb-3">
            <DollarSign className="w-3 h-3 shrink-0"/>
            <span className="font-semibold truncate">
              {u.default_commission_type === 'fixed'   ? `$${Number(u.default_commission_amount||0).toLocaleString()} fixed` :
               u.default_commission_type === 'percent' ? `${u.default_commission_percent}% of tuition` :
               u.default_commission_text || '—'}
            </span>
          </div>
        ) : null}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[[u.program_count||0,'Programs',BookOpen],[u.student_count||0,'Students',Users],[features.length,'Features',CheckCircle]].map(([v,label,Icon])=>(
            <div key={label} className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <div className="text-sm font-bold text-brand-700">{v}</div>
              <div className="flex items-center justify-center gap-0.5 mt-0.5"><Icon className="w-3 h-3 text-slate-400"/><span className="text-[10px] text-slate-400">{label}</span></div>
            </div>
          ))}
        </div>
        {intakes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {intakes.slice(0,4).map(i=><span key={i} className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full text-[10px] font-bold border border-brand-100">{i}</span>)}
            {intakes.length > 4 && <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold">+{intakes.length-4}</span>}
          </div>
        )}
        <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100">
          <button onClick={()=>onView(u)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 text-slate-600 hover:text-brand-700 text-xs font-bold transition-all"><Eye className="w-3.5 h-3.5"/>View Detail</button>
          <button onClick={()=>onEdit(u)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold transition-colors shadow-sm"><Pencil className="w-3.5 h-3.5"/>Edit</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
function UniModal({ open, editing, onClose, onSaved, countries }) {
  const EMPTY = { name:'',country_id:'',city:'',address:'',world_ranking:'',logo_initials:'',website:'',tuition_info:'',avg_tuition:'',application_fee_range:'',cost_of_living:'',founded:'',institution_type:'Public',avg_processing_days:'',description:'',status:'Active',features:[],intakes:[],disciplines:'',photos:[],default_commission_type:'text',default_commission_amount:'',default_commission_percent:'',default_commission_text:'' };
  const [form,setForm]           = useState(EMPTY);
  const [scholarships,setScholarships] = useState([]);
  const [programs,setPrograms]   = useState([]);
  const [saving,setSaving]       = useState(false);
  const [error,setError]         = useState('');
  const [tab,setTab]             = useState('basic');

  const TABS = [
    { id:'basic',        label:'Basic Info',     Icon:Building2   },
    { id:'commission',   label:'Commission',     Icon:DollarSign  },
    { id:'photos',       label:'Photos',         Icon:ImageIcon   },
    { id:'details',      label:'Cost & Details', Icon:Globe       },
    { id:'features',     label:'Features',       Icon:Star        },
    { id:'scholarships', label:'Scholarships',   Icon:Award       },
    { id:'programs',     label:'Programs',       Icon:BookOpen    },
    { id:'about',        label:'Description',    Icon:Globe       },
  ];

  useEffect(()=>{
    if (!open) return;
    setError(''); setTab('basic');
    if (editing) {
      setForm({ name:editing.name||'',country_id:editing.country_id||'',city:editing.city||'',address:editing.address||'',world_ranking:editing.world_ranking||'',logo_initials:editing.logo_initials||'',website:editing.website||'',tuition_info:editing.tuition_info||'',avg_tuition:editing.avg_tuition||'',application_fee_range:editing.application_fee_range||'',cost_of_living:editing.cost_of_living||'',founded:editing.founded||'',institution_type:editing.institution_type||'Public',avg_processing_days:editing.avg_processing_days||'',description:editing.description||'',status:editing.status||'Active',features:safeArr(editing.features),intakes:editing.intakes?editing.intakes.split(',').filter(Boolean):[],disciplines:safeArr(editing.disciplines).map(d=>`${d.name}:${d.pct}`).join('\n'),photos:safeArr(editing.photos),
        default_commission_type:  editing.default_commission_type  ||'text',
        default_commission_amount: editing.default_commission_amount ||'',
        default_commission_percent:editing.default_commission_percent||'',
        default_commission_text:  editing.default_commission_text  ||'',
      });
      setScholarships(editing.scholarships||[]);
      setPrograms((editing.programs||[]).map(p=>({ ...p,
        commission_type:    p.commission_type    ||'text',
        commission_amount:  p.commission_amount  ||'',
        commission_percent: p.commission_percent ||'',
        commission_text:    p.commission_text    ||'',
      })));
    } else { setForm(EMPTY); setScholarships([]); setPrograms([]); }
  }, [open, editing]);

  function f(k,v) { setForm(p=>({...p,[k]:v})); }
  function toggleFeature(feat) { setForm(p=>({...p,features:p.features.includes(feat)?p.features.filter(x=>x!==feat):[...p.features,feat]})); }
  function toggleIntake(i) { setForm(p=>({...p,intakes:p.intakes.includes(i)?p.intakes.filter(x=>x!==i):[...p.intakes,i]})); }

  async function handleSave() {
    if (!form.name) { setError('University name is required'); return; }
    setSaving(true); setError('');
    try {
      const disciplines = form.disciplines ? form.disciplines.split('\n').filter(Boolean).map(line=>{ const[name,...rest]=line.split(':'); return{name:name?.trim(),pct:parseInt(rest.join(':'))||50}; }) : [];
      const payload = { ...form, disciplines, intakes:form.intakes, scholarships, programs };
      if (editing) await apiCall(`/api/universities/${editing.id}`,'PUT',payload);
      else await apiCall('/api/universities','POST',payload);
      onSaved(); onClose();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!open) return null;

  const defaultCommission = { type: form.default_commission_type, amount: form.default_commission_amount, percent: form.default_commission_percent, text: form.default_commission_text };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl" style={{height:'92vh',maxHeight:'900px'}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 border border-brand-200 rounded-2xl flex items-center justify-center shrink-0"><Building2 className="w-5 h-5 text-brand-600"/></div>
            <div><h2 className="text-lg font-bold text-slate-800">{editing?'Edit University':'Add New University'}</h2>{editing&&<p className="text-xs text-slate-400 mt-0.5">{editing.name}</p>}</div>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-5 h-5"/></button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          {TABS.map(({id,label,Icon})=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold border-b-2 transition-colors
                ${tab===id?'border-brand-600 text-brand-700 bg-white':'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'}`}>
              <Icon className="w-4 h-4"/>
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error&&<div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}

          {/* BASIC */}
          {tab==='basic'&&(
            <div className="space-y-5">
              <FL label="University Name" required><input className={inp} placeholder="University of Toronto" value={form.name} onChange={e=>f('name',e.target.value)}/></FL>
              <div className="grid grid-cols-2 gap-5">
                <FL label="Country" required><select className={sel} value={form.country_id} onChange={e=>f('country_id',e.target.value)}><option value="">Select country</option>{countries.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}</select></FL>
                <FL label="City"><input className={inp} placeholder="Toronto" value={form.city} onChange={e=>f('city',e.target.value)}/></FL>
              </div>
              <FL label="Full Address"><input className={inp} placeholder="27 King's College Circle, Toronto, ON" value={form.address} onChange={e=>f('address',e.target.value)}/></FL>
              <div className="grid grid-cols-4 gap-5">
                <FL label="World Ranking"><input type="number" className={inp} placeholder="18" value={form.world_ranking} onChange={e=>f('world_ranking',e.target.value)}/></FL>
                <FL label="Logo Initials"><input maxLength={4} className={inp} placeholder="UT" value={form.logo_initials} onChange={e=>f('logo_initials',e.target.value)}/></FL>
                <FL label="Status"><select className={sel} value={form.status} onChange={e=>f('status',e.target.value)}>{['Partner','Active','Inactive'].map(s=><option key={s}>{s}</option>)}</select></FL>
                <FL label="Type"><select className={sel} value={form.institution_type} onChange={e=>f('institution_type',e.target.value)}>{['Public','Private','College'].map(t=><option key={t}>{t}</option>)}</select></FL>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <FL label="Website"><input className={inp} placeholder="utoronto.ca" value={form.website} onChange={e=>f('website',e.target.value)}/></FL>
                <FL label="Founded Year"><input type="number" className={inp} placeholder="1827" value={form.founded} onChange={e=>f('founded',e.target.value)}/></FL>
              </div>
              <FL label="Available Intakes">
                <div className="flex flex-wrap gap-2 mt-1">
                  {INTAKE_OPTIONS.map(i=>(
                    <button key={i} type="button" onClick={()=>toggleIntake(i)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${form.intakes.includes(i)?'bg-brand-700 text-white border-brand-700':'border-slate-200 text-slate-600 hover:border-brand-400 hover:bg-brand-50'}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </FL>
            </div>
          )}

          {/* ── COMMISSION TAB ── */}
          {tab==='commission'&&(
            <div className="space-y-6">
              {/* Explanation banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <Wand2 className="w-5 h-5 text-emerald-700"/>
                </div>
                <div>
                  <div className="font-bold text-emerald-800 mb-1">University-Wide Default Commission</div>
                  <p className="text-sm text-emerald-700 leading-relaxed">
                    Set a default commission that applies across all programs at this university. When you add new programs, they'll automatically inherit this commission. You can also click <b>"Apply default commission to all"</b> in the Programs tab to update existing programs at once — or override individual programs with a different rate.
                  </p>
                </div>
              </div>

              {/* Commission type selector + inputs */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
                <div className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-brand-600"/>Default Commission Mode
                </div>

                {/* 3 mode cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { type:'text',    label:'Custom Text',      desc:'Write a free-form commission description (e.g. "Up to £2,800")',  icon:Star          },
                    { type:'fixed',   label:'Fixed Amount',     desc:'A fixed dollar/currency amount per enrollment',                   icon:DollarSign    },
                    { type:'percent', label:'% of Tuition Fee', desc:'Auto-calculated as a percentage of each program\'s tuition fee',  icon:Percent       },
                  ].map(opt=>(
                    <button key={opt.type} type="button" onClick={()=>f('default_commission_type', opt.type)}
                      className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all
                        ${form.default_commission_type===opt.type ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-brand-300 bg-white'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${form.default_commission_type===opt.type?'bg-brand-600':'bg-slate-100'}`}>
                        <opt.icon className={`w-5 h-5 ${form.default_commission_type===opt.type?'text-white':'text-slate-500'}`}/>
                      </div>
                      <div className={`text-sm font-bold ${form.default_commission_type===opt.type?'text-brand-700':'text-slate-700'}`}>{opt.label}</div>
                      <div className="text-xs text-slate-500 leading-relaxed">{opt.desc}</div>
                      {form.default_commission_type===opt.type && <div className="self-end"><CheckCircle className="w-4 h-4 text-brand-600"/></div>}
                    </button>
                  ))}
                </div>

                {/* Input based on type */}
                {form.default_commission_type==='fixed' && (
                  <div>
                    <FL label="Fixed Commission Amount" hint="Applied per student enrollment">
                      <div className="flex gap-3">
                        <input type="number" step="0.01" min="0" className={inp} placeholder="e.g. 2800"
                          value={form.default_commission_amount} onChange={e=>f('default_commission_amount',e.target.value)}/>
                        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-4 text-sm text-slate-500 font-semibold shrink-0">USD</div>
                      </div>
                    </FL>
                  </div>
                )}

                {form.default_commission_type==='percent' && (
                  <div className="space-y-4">
                    <FL label="Commission Percentage" hint="Calculated from each program's own tuition fee">
                      <div className="flex gap-3 items-center">
                        <input type="number" step="0.1" min="0" max="100" className={inp} placeholder="e.g. 10"
                          value={form.default_commission_percent} onChange={e=>f('default_commission_percent',e.target.value)}/>
                        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-4 text-sm text-slate-500 font-semibold shrink-0">
                          <Percent className="w-3.5 h-3.5 mr-1"/>of tuition
                        </div>
                      </div>
                    </FL>
                    {/* Example calculation */}
                    {form.default_commission_percent && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Example Calculations</div>
                        <div className="space-y-1.5">
                          {[[20000,'Bachelor','USD'],[35000,'Master','CAD'],[50000,'PhD','GBP']].map(([tuition,level,currency])=>{
                            const pct = parseFloat(form.default_commission_percent)||0;
                            const comm = (tuition * pct / 100).toLocaleString();
                            return (
                              <div key={level} className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">{level} — {currency} {tuition.toLocaleString()} tuition</span>
                                <span className="font-bold text-emerald-700">→ {currency} {comm}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {form.default_commission_type==='text' && (
                  <FL label="Commission Description" hint="This text will appear on program cards and agent portals">
                    <input className={inp} placeholder="e.g. Up to £2,800 per enrollment · Commission varies by level"
                      value={form.default_commission_text} onChange={e=>f('default_commission_text',e.target.value)}/>
                  </FL>
                )}
              </div>

              {/* Quick actions */}
              {programs.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-amber-800 text-sm">You have {programs.length} program{programs.length!==1?'s':''} added</div>
                    <div className="text-xs text-amber-600 mt-0.5">Switch to the Programs tab to apply this default to all of them at once</div>
                  </div>
                  <button type="button" onClick={()=>setTab('programs')}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors">
                    <BookOpen className="w-3.5 h-3.5"/>Go to Programs
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PHOTOS */}
          {tab==='photos'&&<ImageUploader images={form.photos} onChange={photos=>f('photos',photos)} universityId={editing?.id}/>}

          {/* DETAILS */}
          {tab==='details'&&(
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <FL label="Avg. Processing Days"><input type="number" className={inp} placeholder="2" value={form.avg_processing_days} onChange={e=>f('avg_processing_days',e.target.value)}/></FL>
                <FL label="Application Fee Range"><input className={inp} placeholder="Free – $180 CAD" value={form.application_fee_range} onChange={e=>f('application_fee_range',e.target.value)}/></FL>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <FL label="Tuition Info (short)"><input className={inp} placeholder="$35,000 / year" value={form.tuition_info} onChange={e=>f('tuition_info',e.target.value)}/></FL>
                <FL label="Average Gross Tuition"><input className={inp} placeholder="CAD 35,000 / Year" value={form.avg_tuition} onChange={e=>f('avg_tuition',e.target.value)}/></FL>
              </div>
              <FL label="Cost of Living"><input className={inp} placeholder="CAD 18,000 / Year" value={form.cost_of_living} onChange={e=>f('cost_of_living',e.target.value)}/></FL>
              <FL label="Top Disciplines" hint="One per line → Name:percentage  (e.g.  Computer Science:85)">
                <textarea rows={5} className={inp+' resize-none font-mono text-xs'} placeholder={"Computer Science & IT:85\nBusiness & Economics:72"} value={form.disciplines} onChange={e=>f('disciplines',e.target.value)}/>
              </FL>
            </div>
          )}

          {/* FEATURES */}
          {tab==='features'&&(
            <div>
              <p className="text-sm text-slate-500 mb-4">Select features available at this university:</p>
              <div className="grid grid-cols-2 gap-3">
                {FEATURES_LIST.map(feat=>{ const Icon=FEATURE_ICONS[feat]||CheckCircle; const active=form.features.includes(feat); return (
                  <label key={feat} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${active?'border-brand-500 bg-brand-50':'border-slate-200 hover:border-brand-300 hover:bg-slate-50'}`}>
                    <input type="checkbox" checked={active} onChange={()=>toggleFeature(feat)} className="w-4 h-4 accent-brand-600 shrink-0"/>
                    <Icon className={`w-5 h-5 shrink-0 ${active?'text-brand-600':'text-slate-400'}`}/>
                    <span className="text-sm font-semibold text-slate-700">{feat}</span>
                    {active&&<CheckCircle className="ml-auto w-4 h-4 text-emerald-500 shrink-0"/>}
                  </label>
                ); })}
              </div>
            </div>
          )}

          {/* SCHOLARSHIPS */}
          {tab==='scholarships'&&<ScholarshipForm scholarships={scholarships} onChange={setScholarships}/>}

          {/* PROGRAMS */}
          {tab==='programs'&&<ProgramForm programs={programs} onChange={setPrograms} defaultCommission={defaultCommission}/>}

          {/* ABOUT */}
          {tab==='about'&&(<FL label="About / Description"><textarea rows={16} className={inp+' resize-none'} placeholder="Write a detailed description about this university…" value={form.description} onChange={e=>f('description',e.target.value)}/></FL>)}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80 shrink-0 rounded-b-2xl">
          <div className="flex items-center gap-1.5">
            {TABS.map(({id})=>(
              <button key={id} onClick={()=>setTab(id)}
                className={`rounded-full transition-all duration-200 ${tab===id?'w-6 h-2.5 bg-brand-600':'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'}`}/>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-white transition-all text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="px-8 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold transition-colors text-sm disabled:opacity-60 flex items-center gap-2 shadow-sm">
              {saving&&<Loader2 className="w-4 h-4 animate-spin"/>}
              {editing?'Save Changes':'Add University'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminUniversities() {
  const router = useRouter();
  const [unis,setUnis]     = useState([]);
  const [total,setTotal]   = useState(0);
  const [loading,setLoading] = useState(true);
  const [page,setPage]     = useState(1);
  const [search,setSearch] = useState('');
  const [statusFilter,setStatus] = useState('');
  const [view,setView]     = useState('grid');
  const [countries,setCountries] = useState([]);
  const [showModal,setShowModal] = useState(false);
  const [editing,setEditing]   = useState(null);
  const LIMIT = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit:LIMIT });
      if (search) p.set('search', search);
      if (statusFilter) p.set('status', statusFilter);
      const data = await fetch(`/api/universities?${p}`).then(r=>r.json());
      setUnis(data.universities||[]); setTotal(data.total||0);
    } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(()=>{load();},[load]);
  useEffect(()=>{fetch('/api/countries').then(r=>r.json()).then(d=>setCountries(d.countries||[]));},[]);

  async function openEdit(u) {
    const detail = await fetch(`/api/universities/${u.id}`).then(r=>r.json());
    setEditing(detail); setShowModal(true);
  }
  async function handleDelete(u) {
    if(!confirm(`Deactivate "${u.name}"?`))return;
    await apiCall(`/api/universities/${u.id}`,'DELETE'); load();
  }
  const pages = Math.ceil(total/LIMIT)||1;

  return (
    <AdminLayout title="Universities">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>Universities</h2>
          <p className="text-sm text-slate-500 mt-0.5">{loading?'…':`${total} institutions`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
            <button onClick={()=>setView('grid')} className={`p-2.5 rounded-lg transition-colors ${view==='grid'?'bg-brand-700 text-white shadow-sm':'text-slate-500 hover:text-slate-700'}`}><Grid3x3 className="w-4 h-4"/></button>
            <button onClick={()=>setView('list')} className={`p-2.5 rounded-lg transition-colors ${view==='list'?'bg-brand-700 text-white shadow-sm':'text-slate-500 hover:text-slate-700'}`}><List className="w-4 h-4"/></button>
          </div>
          <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors shadow-sm"><RefreshCw className="w-4 h-4"/></button>
          <button onClick={()=>{setEditing(null);setShowModal(true);}} className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-sm"><Plus className="w-4 h-4"/>Add University</button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search universities, countries, cities…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm"/>
        </div>
        <select value={statusFilter} onChange={e=>{setStatus(e.target.value);setPage(1);}}
          className="border border-slate-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-600 shadow-sm">
          <option value="">All Status</option>{['Partner','Active','Inactive'].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size="lg"/></div>
      : unis.length===0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4"><Building2 className="w-8 h-8 text-slate-400"/></div>
          <h3 className="font-bold text-slate-700 text-lg mb-1">No universities yet</h3>
          <p className="text-slate-400 text-sm mb-5">Add your first partner university to get started.</p>
          <button onClick={()=>{setEditing(null);setShowModal(true);}} className="flex items-center gap-2 bg-brand-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm"><Plus className="w-4 h-4"/>Add University</button>
        </div>
      ) : view==='grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-6">
          {unis.map(u=><UniCard key={u.id} u={u} onView={u=>router.push(`/admin/university/${u.id}`)} onEdit={openEdit} onDelete={handleDelete}/>)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-200">{['University','Location','Ranking','Commission','Programs','Status','Actions'].map(h=><th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {unis.map(u=>{
                const photos = safePhotos(u);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                          {photos[0] ? <img src={photos[0]} alt={u.name} className="w-full h-full object-cover"/>
                            : <div className="w-full h-full bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center text-white text-sm font-bold">{u.logo_initials||'U'}</div>}
                        </div>
                        <div>
                          <button onClick={()=>router.push(`/admin/university/${u.id}`)} className="text-sm font-bold text-slate-800 hover:text-brand-700 transition-colors">{u.name}</button>
                          {u.world_ranking&&<div className="text-xs text-slate-400 mt-0.5">Ranked #{u.world_ranking}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0"/>{[u.city,u.country].filter(Boolean).join(', ')||'—'}</div></td>
                    <td className="px-5 py-4"><span className="text-sm font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">#{u.world_ranking||'—'}</span></td>
                    <td className="px-5 py-4">
                      {u.default_commission_type === 'fixed'   ? <span className="text-sm font-bold text-emerald-700">${Number(u.default_commission_amount||0).toLocaleString()}</span>
                       : u.default_commission_type === 'percent' ? <span className="text-sm font-bold text-emerald-700">{u.default_commission_percent}% of tuition</span>
                       : <span className="text-sm text-slate-500">{u.default_commission_text||'—'}</span>}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">{u.program_count||0}</td>
                    <td className="px-5 py-4"><StatusBadge status={u.status}/></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>router.push(`/admin/university/${u.id}`)} className="p-2 rounded-xl hover:bg-brand-50 text-slate-400 hover:text-brand-600 border border-transparent hover:border-brand-200 transition-all"><Eye className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>openEdit(u)} className="p-2 rounded-xl hover:bg-brand-50 text-slate-400 hover:text-brand-600 border border-transparent hover:border-brand-200 transition-all"><Pencil className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>handleDelete(u)} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 border border-transparent hover:border-red-200 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading&&pages>1&&(
        <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
          <span className="text-slate-500">Showing <b className="text-slate-700">{((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)}</b> of <b className="text-slate-700">{total}</b></span>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white"><ChevronLeft className="w-4 h-4"/></button>
            {Array.from({length:Math.min(5,pages)},(_,i)=>{ const p=Math.max(1,Math.min(pages-4,page-2))+i; return <button key={p} onClick={()=>setPage(p)} className={`w-9 h-9 rounded-xl border text-sm font-semibold ${p===page?'bg-brand-700 text-white border-brand-700':'border-slate-200 hover:bg-slate-50 bg-white'}`}>{p}</button>; })}
            <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      )}

      <UniModal open={showModal} editing={editing} onClose={()=>setShowModal(false)} onSaved={load} countries={countries}/>
    </AdminLayout>
  );
}