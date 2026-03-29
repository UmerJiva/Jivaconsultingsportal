// pages/admin/program/[id]/requirements.js
// Admin: set application requirements per program (eligibility, prereqs, documents, guidelines)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/layout/AdminLayout';
import { Spinner } from '../../../../components/ui/index';
import {
  ArrowLeft, Save, Plus, Trash2, CheckCircle, AlertCircle,
  Loader2, FileText, Shield, Info, ChevronDown, ChevronUp,
  AlertTriangle, Eye, Settings
} from 'lucide-react';
import { apiCall } from '../../../../lib/useApi';

const inp = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder-slate-300 transition-colors";
const sel = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 transition-colors";
const ta  = inp + " resize-none";
const EDU_LEVELS = ['High School','Grade 10 (Pakistan)','Diploma','Certificate','Bachelors (Pakistan)','Bachelors (Turkey)','Masters (Pakistan)','Masters (Turkey)','PhD'];
const DOC_TYPES  = ['Document','Certificate','Photo','Scan','Other'];

function FL({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, badge, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-brand-600"/>
          </div>
          <div>
            <div className="font-bold text-slate-800 flex items-center gap-2">
              {title}
              {badge > 0 && <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full">{badge}</span>}
            </div>
            {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
      </button>
      {open && <div className="px-6 pb-6 pt-3 border-t border-slate-100">{children}</div>}
    </div>
  );
}

export default function ProgramRequirements() {
  const router = useRouter();
  const { id } = router.query;
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  const [elig, setElig] = useState({ min_education_level:'', min_gpa:'', min_ielts:'', min_toefl:'', min_pte:'', min_duolingo:'', post_study_work_visa:false, commission_text:'', commission_breakdown:'' });
  const [guidelines, setGuidelines] = useState({ eligibility_guideline:'Please select a student to check their eligibility for this program.', intake_guideline:'Select the academic intake for this application.', prerequisites_guideline:'Please review the following carefully. If the student does not meet these prerequisites the application will be cancelled.', backups_guideline:'Choose up to 10 backup programs in order of preference.', documents_guideline:'Please carefully review the following. You will need these documents to complete the application.' });
  const [prerequisites, setPrerequisites] = useState([]);
  const [documents,     setDocuments]     = useState([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/programs/${id}`).then(r=>r.json()),
      fetch(`/api/programs/${id}/requirements`).then(r=>r.json()).catch(()=>({ requirements:{}, prerequisites:[], documents:[] })),
    ]).then(([prog, reqData]) => {
      setProgram(prog);
      const r = reqData.requirements || {};
      setElig({ min_education_level:r.min_education_level||prog.min_education_level||'', min_gpa:r.min_gpa||prog.min_gpa||'', min_ielts:r.min_ielts||prog.min_ielts||'', min_toefl:r.min_toefl||prog.min_toefl||'', min_pte:r.min_pte||prog.min_pte||'', min_duolingo:r.min_duolingo||'', post_study_work_visa:!!(r.post_study_work_visa||prog.post_study_work_visa), commission_text:r.commission_text||prog.commission_text||'', commission_breakdown:r.commission_breakdown||prog.commission_breakdown||'' });
      setGuidelines({ eligibility_guideline:r.eligibility_guideline||'Please select a student to check their eligibility for this program.', intake_guideline:r.intake_guideline||'Select the academic intake for this application.', prerequisites_guideline:r.prerequisites_guideline||'Please review the following carefully. If the student does not meet these prerequisites the application will be cancelled.', backups_guideline:r.backups_guideline||'Choose up to 10 backup programs in order of preference.', documents_guideline:r.documents_guideline||'Please carefully review the following. You will need these documents to complete the application.' });

      if (reqData.prerequisites?.length > 0) {
        setPrerequisites(reqData.prerequisites.map(p=>({ id:p.id, title:p.title, body:p.body||'' })));
      } else {
        const arr = (() => { if (!prog.prerequisites) return []; if (Array.isArray(prog.prerequisites)) return prog.prerequisites; try { return JSON.parse(prog.prerequisites); } catch { return []; } })();
        if (arr.length > 0) setPrerequisites(arr.map((p,i)=>({ id:i+1, title:p.title||'', body:p.body||'' })));
        else setPrerequisites([
          { id:1, title:'Country Specific GPA - Pakistan', body:"For applicants educated in Pakistan, this program requires: Bachelor's degree from Pakistan studied over 4-5 years or Bachelor of Law with minimum GPA 55% from a recognized academic institute." },
          { id:2, title:'English Test Validity', body:'The English test must be valid at the start date of the desired program.' },
          { id:3, title:'Overqualified Degree', body:"The program does not accept applicants already holding a master's degree in a related subject area." },
          { id:4, title:'Non-Standard Qualification', body:'Non-standard qualifications such as QUALIFI are NOT accepted for this program.' },
          { id:5, title:'Credibility Interview', body:'Some applicants may be required to attend a credibility interview before a decision is made.' },
        ]);
      }

      if (reqData.documents?.length > 0) {
        setDocuments(reqData.documents.map(d=>({ id:d.id, name:d.name, doc_type:d.doc_type||'', description:d.description||'', required:!!d.required })));
      } else {
        const arr = (() => { if (!prog.required_documents) return []; if (Array.isArray(prog.required_documents)) return prog.required_documents; try { return JSON.parse(prog.required_documents); } catch { return []; } })();
        if (arr.length > 0) setDocuments(arr.map((d,i)=>({ id:i+1, name:d.name||'', doc_type:d.type||'', description:'', required:true })));
        else setDocuments([
          { id:1, name:'Copy of Education Transcripts', doc_type:'Document', description:'Official transcripts from all attended institutions.', required:true },
          { id:2, name:'Copy of Education Certificate', doc_type:'Document', description:'Degree or diploma certificate.', required:true },
          { id:3, name:'Passport Copy', doc_type:'', description:'Clear copy of the biographical page of the passport.', required:true },
          { id:4, name:'English Language Proficiency Test', doc_type:'', description:'IELTS, TOEFL, PTE or equivalent results.', required:true },
          { id:5, name:'Resume', doc_type:'', description:'Up-to-date curriculum vitae.', required:true },
          { id:6, name:'Hybrid Immigration History', doc_type:'', description:'Immigration history documentation if applicable.', required:false },
          { id:7, name:'Study Gap Explanation', doc_type:'', description:'Letter explaining any gaps in education.', required:false },
        ]);
      }
    }).finally(()=>setLoading(false));
  }, [id]);

  const addPrereq   = () => setPrerequisites(p=>[...p,{id:Date.now(),title:'',body:''}]);
  const removePrereq = idx => setPrerequisites(p=>p.filter((_,i)=>i!==idx));
  const upPrereq    = (idx,k,v) => setPrerequisites(p=>{ const n=[...p]; n[idx]={...n[idx],[k]:v}; return n; });
  const movePrereq  = (idx,dir) => setPrerequisites(p=>{ const n=[...p],to=idx+dir; if(to<0||to>=n.length)return p; [n[idx],n[to]]=[n[to],n[idx]]; return n; });

  const addDoc    = () => setDocuments(d=>[...d,{id:Date.now(),name:'',doc_type:'',description:'',required:true}]);
  const removeDoc = idx => setDocuments(d=>d.filter((_,i)=>i!==idx));
  const upDoc     = (idx,k,v) => setDocuments(d=>{ const n=[...d]; n[idx]={...n[idx],[k]:v}; return n; });
  const moveDoc   = (idx,dir) => setDocuments(d=>{ const n=[...d],to=idx+dir; if(to<0||to>=n.length)return d; [n[idx],n[to]]=[n[to],n[idx]]; return n; });

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false);
    try {
      await apiCall(`/api/programs/${id}/requirements`, 'PUT', { ...elig, ...guidelines, prerequisites, documents });
      setSaved(true); setTimeout(()=>setSaved(false), 4000);
    } catch(e) { setError(e.message||'Save failed'); }
    finally { setSaving(false); }
  }

  if (loading) return <AdminLayout title="Application Requirements"><div className="flex justify-center py-20"><Spinner size="lg"/></div></AdminLayout>;
  if (!program||program.error) return <AdminLayout title="Requirements"><div className="text-center py-20 text-slate-400">Program not found</div></AdminLayout>;

  return (
    <AdminLayout title="Application Requirements">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <button onClick={()=>router.push(`/admin/program/${id}`)} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 mt-0.5 shrink-0 transition-colors">
              <ArrowLeft className="w-4 h-4"/>
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>Application Requirements</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                <button onClick={()=>router.push(`/admin/program/${id}`)} className="font-semibold text-brand-600 hover:underline">{program.name}</button>
                <span className="text-slate-400 mx-1.5">·</span>{program.university_name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>router.push(`/admin/program/${id}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors">
              <Eye className="w-4 h-4"/>View Program
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : saved ? <CheckCircle className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Requirements'}
            </button>
          </div>
        </div>

        {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
        {saved  && <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4"><CheckCircle className="w-4 h-4 shrink-0"/>All requirements saved successfully! These will appear during the application process.</div>}

        {/* ── ELIGIBILITY RULES ── */}
        <Section icon={Shield} title="Eligibility Rules" subtitle="Minimum requirements checked automatically when a student is selected">
          <div className="grid grid-cols-2 gap-4 mt-3 mb-4">
            <FL label="Minimum Education Level">
              <select className={sel} value={elig.min_education_level} onChange={e=>setElig(p=>({...p,min_education_level:e.target.value}))}>
                <option value="">No minimum</option>
                {EDU_LEVELS.map(l=><option key={l}>{l}</option>)}
              </select>
            </FL>
            <FL label="Minimum GPA (%)" hint="e.g. 55 = 55% minimum">
              <input type="number" step="0.01" min="0" max="100" className={inp} value={elig.min_gpa} onChange={e=>setElig(p=>({...p,min_gpa:e.target.value}))} placeholder="55.00"/>
            </FL>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[['min_ielts','Min. IELTS','6.0'],['min_toefl','Min. TOEFL','60'],['min_pte','Min. PTE','56'],['min_duolingo','Min. Duolingo','110']].map(([k,l,ph])=>(
              <FL key={k} label={l}>
                <input type="number" step="0.5" className={inp} value={elig[k]} onChange={e=>setElig(p=>({...p,[k]:e.target.value}))} placeholder={ph}/>
              </FL>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FL label="Commission Text" hint="Shown on program card e.g. Up to £2,800">
              <input className={inp} value={elig.commission_text} onChange={e=>setElig(p=>({...p,commission_text:e.target.value}))} placeholder="Up to £2,800 GBP"/>
            </FL>
            <FL label="Post-Study Work Visa">
              <select className={sel} value={elig.post_study_work_visa?'1':'0'} onChange={e=>setElig(p=>({...p,post_study_work_visa:e.target.value==='1'}))}>
                <option value="0">Not eligible</option>
                <option value="1">Eligible for Post-Study Work Visa</option>
              </select>
            </FL>
          </div>
          <FL label="Commission Breakdown" hint="Detailed text shown in the Commissions section of the application">
            <textarea rows={3} className={ta} value={elig.commission_breakdown} onChange={e=>setElig(p=>({...p,commission_breakdown:e.target.value}))} placeholder="The Commission structure is based on the school's confirmation of the student's successful full-time enrolment…"/>
          </FL>
        </Section>

        {/* ── STEP GUIDELINES ── */}
        <Section icon={Info} title="Step Guidelines" subtitle="Custom instructions shown on each step of the application wizard" defaultOpen={false}>
          <div className="space-y-4 mt-3">
            {[
              ['eligibility_guideline',   'Step 1 — Eligibility',     'Text above the student selector dropdown'],
              ['intake_guideline',        'Step 3 — Intakes',         'Instructions for selecting an intake date'],
              ['prerequisites_guideline', 'Step 4 — Prerequisites',   'Warning/instruction shown above the prerequisites list'],
              ['backups_guideline',       'Step 5 — Backup Programs', 'Instructions for choosing backup programs'],
              ['documents_guideline',     'Step 6 — Documents',       'Instructions above the required documents checklist'],
            ].map(([key, label, hint]) => (
              <FL key={key} label={label} hint={hint}>
                <textarea rows={2} className={ta} value={guidelines[key]} onChange={e=>setGuidelines(p=>({...p,[key]:e.target.value}))} placeholder={`Guideline for ${label}…`}/>
              </FL>
            ))}
          </div>
        </Section>

        {/* ── PREREQUISITES ── */}
        <Section icon={AlertTriangle} title="Prerequisites" subtitle="Requirements shown as numbered collapsible items on Step 4 of the application" badge={prerequisites.length}>
          <div className="flex items-center justify-between mt-3 mb-4">
            <p className="text-xs text-slate-500">Use ↑↓ to reorder. Each item appears as a collapsible accordion when applying.</p>
            <button onClick={addPrereq} className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors border border-brand-200">
              <Plus className="w-4 h-4"/>Add Prerequisite
            </button>
          </div>

          {prerequisites.length === 0
            ? <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center"><AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-2"/><p className="text-slate-400 text-sm">No prerequisites added.</p><button onClick={addPrereq} className="mt-3 text-brand-600 text-sm font-bold hover:underline">+ Add first prerequisite</button></div>
            : <div className="space-y-3">
                {prerequisites.map((prereq, idx) => (
                  <div key={prereq.id} className="border-2 border-slate-200 hover:border-brand-200 rounded-2xl p-4 transition-colors group">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button onClick={()=>movePrereq(idx,-1)} disabled={idx===0} className="p-0.5 hover:text-brand-600 text-slate-300 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>movePrereq(idx,1)} disabled={idx===prerequisites.length-1} className="p-0.5 hover:text-brand-600 text-slate-300 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5"/></button>
                      </div>
                      <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs shrink-0">{idx+1}</div>
                      <input className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                        value={prereq.title} onChange={e=>upPrereq(idx,'title',e.target.value)} placeholder="Prerequisite title e.g. Country Specific GPA - Pakistan"/>
                      <button onClick={()=>removePrereq(idx)} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                    <textarea rows={3} className={ta} value={prereq.body} onChange={e=>upPrereq(idx,'body',e.target.value)}
                      placeholder="Detailed description shown when this item is expanded during the application…"/>
                  </div>
                ))}
              </div>
          }
        </Section>

        {/* ── REQUIRED DOCUMENTS ── */}
        <Section icon={FileText} title="Required Documents" subtitle="Documents shown as numbered checklist on Step 6 of the application" badge={documents.length}>
          <div className="flex items-center justify-between mt-3 mb-4">
            <p className="text-xs text-slate-500">Use ↑↓ to reorder. "Required" items are mandatory; unchecked items are optional.</p>
            <button onClick={addDoc} className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors border border-brand-200">
              <Plus className="w-4 h-4"/>Add Document
            </button>
          </div>

          {documents.length === 0
            ? <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center"><FileText className="w-10 h-10 text-slate-300 mx-auto mb-2"/><p className="text-slate-400 text-sm">No documents added.</p><button onClick={addDoc} className="mt-3 text-brand-600 text-sm font-bold hover:underline">+ Add first document</button></div>
            : <div className="space-y-3">
                {documents.map((doc, idx) => (
                  <div key={doc.id} className="border-2 border-slate-200 hover:border-brand-200 rounded-2xl p-4 transition-colors">
                    {/* Row 1: controls + name + type badge + required toggle + delete */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button onClick={()=>moveDoc(idx,-1)} disabled={idx===0} className="p-0.5 hover:text-brand-600 text-slate-300 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>moveDoc(idx,1)} disabled={idx===documents.length-1} className="p-0.5 hover:text-brand-600 text-slate-300 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5"/></button>
                      </div>
                      <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">{idx+1}</div>
                      <input className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                        value={doc.name} onChange={e=>upDoc(idx,'name',e.target.value)} placeholder="Document name e.g. Copy of Education Transcripts"/>
                      {/* Type badge dropdown */}
                      <select className="border border-slate-200 rounded-xl text-xs px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white text-slate-600 w-28 shrink-0"
                        value={doc.doc_type} onChange={e=>upDoc(idx,'doc_type',e.target.value)}>
                        <option value="">No badge</option>
                        {DOC_TYPES.map(t=><option key={t}>{t}</option>)}
                      </select>
                      {/* Required toggle */}
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer whitespace-nowrap shrink-0">
                        <input type="checkbox" checked={doc.required} onChange={e=>upDoc(idx,'required',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                        Required
                      </label>
                      <button onClick={()=>removeDoc(idx)} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                    {/* Row 2: description */}
                    <textarea rows={2} className={ta} value={doc.description} onChange={e=>upDoc(idx,'description',e.target.value)}
                      placeholder="Description shown when expanded e.g. Official transcripts from all attended institutions, certified and stamped."/>
                  </div>
                ))}
              </div>
          }
        </Section>

        {/* Bottom save */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm sticky bottom-4">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{prerequisites.length}</span> prerequisites &nbsp;·&nbsp;
            <span className="font-semibold text-slate-700">{documents.length}</span> documents &nbsp;·&nbsp;
            <span className="font-semibold text-slate-700">{Object.values(elig).filter(Boolean).length}</span> eligibility rules set
          </p>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : saved ? <CheckCircle className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save All Requirements'}
          </button>
        </div>

      </div>
    </AdminLayout>
  );
}