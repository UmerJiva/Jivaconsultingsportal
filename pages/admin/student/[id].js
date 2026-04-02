// pages/admin/student/[id].js — Admin student profile with multiple education
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Spinner } from '../../../components/ui/index';
import ApplicationWizard from '../../../components/ApplicationWizard';
import {
  ArrowLeft, Save, CheckCircle, AlertTriangle, User, MapPin,
  GraduationCap, FileText, Globe, Briefcase, Plus, BookOpen,
  Loader2, Phone, TrendingUp, ChevronDown, ChevronUp,
  Trash2, Pencil, X, Star, Award, Calendar, Upload, Info, AlertCircle
} from 'lucide-react';
import { apiCall } from '../../../lib/useApi';

const inp = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder-slate-300 transition-colors";
const sel = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 transition-colors";
const COUNTRIES = ['Pakistan','Canada','United Kingdom','United States','Australia','Germany','UAE','Turkey','Malaysia','Singapore','India','Bangladesh'];
const PROVINCES = { Pakistan:['Punjab','Sindh','KPK','Balochistan','Islamabad'], Canada:['Ontario','British Columbia','Alberta','Quebec'], 'United Kingdom':['England','Scotland','Wales','Northern Ireland'] };
const EDU_LEVELS = ['High School / O-Levels','A-Levels','Grade 10 (Pakistan)','Diploma','Certificate','Associate Degree','Bachelors (Pakistan)','Bachelors (Foreign)','Post-Graduate Diploma','Masters (Pakistan)','Masters (Foreign)','MPhil','PhD'];
const LEAD_STATUSES = ['New','Contacted','In Progress','Converted','Lost','On Hold'];
const REFERRAL_SOURCES = ['Website','Social Media','Referral','Agent','Email Campaign','Walk-in','Other'];
const SERVICES = ['Undergraduate','Postgraduate','PhD','English Language','Diploma','Certificate','Foundation','Short Courses'];
const EDU_GRADE_FIELDS = {
  'High School / O-Levels':      ['subjects','grades'],
  'A-Levels':                    ['subjects','grades','marks','percentage'],
  'Grade 10 (Pakistan)':         ['marks','percentage'],
  'Diploma':                     ['gpa','grade_scale'],
  'Certificate':                 ['gpa','grade_scale'],
  'Associate Degree':            ['gpa','grade_scale'],
  'Bachelors (Pakistan)':        ['gpa','grade_scale'],
  'Bachelors (Foreign)':         ['gpa','grade_scale'],
  'Post-Graduate Diploma':       ['gpa','grade_scale'],
  'Masters (Pakistan)':          ['gpa','grade_scale'],
  'Masters (Foreign)':           ['gpa','grade_scale'],
  'MPhil':                       ['gpa','grade_scale'],
  'PhD':                         ['gpa','grade_scale','thesis'],
};
const STATUS_COLORS = { 'Submitted':'bg-blue-50 text-blue-700 border-blue-200','Under Review':'bg-amber-50 text-amber-700 border-amber-200','Accepted':'bg-emerald-50 text-emerald-700 border-emerald-200','Rejected':'bg-red-50 text-red-600 border-red-200','Enrolled':'bg-green-50 text-green-700 border-green-200','Pending':'bg-slate-100 text-slate-600 border-slate-200','Conditional':'bg-purple-50 text-purple-700 border-purple-200','Offer Received':'bg-teal-50 text-teal-700 border-teal-200' };

function Section({ icon: Icon, title, badge, children, defaultOpen=true, action }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-brand-600"/></div>
          <span className="font-bold text-slate-800">{title}</span>
          {badge && <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3"/>Saved</span>}
        </div>
        <div className="flex items-center gap-2">
          {action && <div onClick={e=>e.stopPropagation()}>{action}</div>}
          {open ? <ChevronUp className="w-5 h-5 text-slate-400"/> : <ChevronDown className="w-5 h-5 text-slate-400"/>}
        </div>
      </button>
      {open && <div className="px-6 pb-6 pt-4 border-t border-slate-100">{children}</div>}
    </div>
  );
}

function FL({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}{required&&<span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

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

// ── Education card (read mode) ────────────────────────────────
function EduCard({ edu, onEdit, onDelete, onSetHighest }) {
  const levelColors = {
    'PhD':                   'bg-purple-600',
    'Masters (Foreign)':     'bg-blue-600',
    'Masters (Pakistan)':    'bg-blue-500',
    'MPhil':                 'bg-indigo-600',
    'Bachelors (Foreign)':   'bg-emerald-600',
    'Bachelors (Pakistan)':  'bg-emerald-500',
    'Post-Graduate Diploma': 'bg-teal-600',
    'Diploma':               'bg-amber-500',
    'A-Levels':              'bg-orange-500',
    'High School / O-Levels':'bg-slate-500',
  };
  const color = levelColors[edu.education_level] || 'bg-brand-600';

  return (
    <div className={`relative bg-white border-2 rounded-2xl overflow-hidden transition-all hover:shadow-md ${edu.is_highest ? 'border-amber-300' : 'border-slate-200'}`}>
      {/* Top color bar */}
      <div className={`h-1.5 w-full ${color}`}/>

      {/* Highest badge */}
      {edu.is_highest ? (
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full">
          <Star className="w-3 h-3 fill-amber-500 text-amber-500"/>Highest
        </div>
      ) : null}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
            <GraduationCap className="w-6 h-6 text-white"/>
          </div>
          <div className="flex-1 min-w-0">
            {/* Level badge */}
            <div className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white mb-2 ${color}`}>
              {edu.education_level}
            </div>
            {/* Degree / field */}
            <h4 className="font-bold text-slate-800 text-base leading-tight mb-0.5">
              {edu.degree_name || edu.institution_name}
            </h4>
            {edu.degree_name && (
              <p className="text-sm text-slate-500 font-medium">{edu.institution_name}</p>
            )}
            {edu.field_of_study && (
              <p className="text-xs text-slate-400 mt-0.5">{edu.field_of_study}</p>
            )}
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
              {edu.edu_country && (
                <span className="flex items-center gap-1"><Globe className="w-3 h-3"/>{edu.edu_country}</span>
              )}
              {(edu.start_year || edu.grad_year) && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3"/>
                  {edu.start_year && edu.grad_year ? `${edu.start_year} – ${edu.grad_year}` : edu.grad_year || edu.start_year}
                </span>
              )}
              {edu.gpa && (
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Award className="w-3 h-3"/>GPA: {edu.gpa} / {edu.grade_scale||'4.0'}
                </span>
              )}
              {edu.education_verified ? (
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle className="w-3 h-3"/>Verified
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          {!edu.is_highest && (
            <button onClick={()=>onSetHighest(edu.id)}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors">
              <Star className="w-3.5 h-3.5"/>Set as Highest
            </button>
          )}
          <button onClick={()=>onEdit(edu)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors ml-auto">
            <Pencil className="w-3.5 h-3.5"/>Edit
          </button>
          <button onClick={()=>onDelete(edu.id)}
            className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 transition-colors">
            <Trash2 className="w-3.5 h-3.5"/>Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Education form (add / edit) ───────────────────────────────
function EduForm({ edu, studentId, onSaved, onCancel }) {
  const EMPTY = { education_level:'', institution_name:'', edu_country:'', field_of_study:'', degree_name:'', grad_year:'', start_year:'', gpa:'', grade_scale:'4.0', is_highest:false, education_verified:false };
  const [form, setForm]   = useState(edu ? { ...edu } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function f(k,v) { setForm(p=>({...p,[k]:v})); }

  async function handleSave() {
    if (!form.education_level || !form.institution_name) {
      setError('Education level and institution name are required'); return;
    }
    setSaving(true); setError('');
    try {
      const method = edu ? 'PUT' : 'POST';
      const body   = edu ? { ...form, id: edu.id } : form;
      const r = await fetch(`/api/students/education?student_id=${studentId}`, {
        method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onSaved();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="bg-slate-50 border-2 border-brand-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-bold text-slate-800 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-brand-600"/>
          {edu ? 'Edit Education' : 'Add Education'}
        </h4>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"><X className="w-4 h-4"/></button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0"/>{error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FL label="Education Level" required>
          <select className={sel} value={form.education_level} onChange={e=>f('education_level',e.target.value)}>
            <option value="">Select level</option>
            {EDU_LEVELS.map(l=><option key={l}>{l}</option>)}
          </select>
        </FL>
        <FL label="Institution Name" required>
          <input className={inp} value={form.institution_name} onChange={e=>f('institution_name',e.target.value)} placeholder="University of Karachi"/>
        </FL>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FL label="Degree / Qualification Name">
          <input className={inp} value={form.degree_name} onChange={e=>f('degree_name',e.target.value)} placeholder="B.Sc Computer Science"/>
        </FL>
        <FL label="Field of Study">
          <input className={inp} value={form.field_of_study} onChange={e=>f('field_of_study',e.target.value)} placeholder="Computer Science"/>
        </FL>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FL label="Country of Study">
          <select className={sel} value={form.edu_country} onChange={e=>f('edu_country',e.target.value)}>
            <option value="">Select</option>
            {COUNTRIES.map(c=><option key={c}>{c}</option>)}
          </select>
        </FL>
        <FL label="Start Year">
          <input type="number" className={inp} value={form.start_year} onChange={e=>f('start_year',e.target.value)} placeholder="2019" min="1980" max="2030"/>
        </FL>
        <FL label="Graduation Year">
          <input type="number" className={inp} value={form.grad_year} onChange={e=>f('grad_year',e.target.value)} placeholder="2023" min="1980" max="2030"/>
        </FL>
      </div>

      {/* Dynamic grade fields based on education level */}
      {form.education_level && (
        <div className="border-2 border-brand-100 bg-brand-50/30 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-brand-600 uppercase tracking-wider">Grades for {form.education_level}</div>
          {(EDU_GRADE_FIELDS[form.education_level]||['gpa','grade_scale']).includes('gpa') && (
            <div className="grid grid-cols-2 gap-4">
              <FL label="GPA / Score"><input type="number" step="0.01" className={inp} value={form.gpa} onChange={e=>f('gpa',e.target.value)} placeholder="3.5" min="0" max="10"/></FL>
              <FL label="Grade Scale">
                <select className={sel} value={form.grade_scale} onChange={e=>f('grade_scale',e.target.value)}>
                  {['4.0','5.0','10.0','100%','CGPA','Distinction/Merit/Pass'].map(s=><option key={s}>{s}</option>)}
                </select>
              </FL>
            </div>
          )}
          {(EDU_GRADE_FIELDS[form.education_level]||[]).includes('marks') && (
            <div className="grid grid-cols-2 gap-4">
              <FL label="Total Marks Obtained"><input type="number" className={inp} value={form.marks||''} onChange={e=>f('marks',e.target.value)} placeholder="900"/></FL>
              <FL label="Percentage (%)"><input type="number" step="0.01" className={inp} value={form.percentage||''} onChange={e=>f('percentage',e.target.value)} placeholder="82.5" min="0" max="100"/></FL>
            </div>
          )}
          {(EDU_GRADE_FIELDS[form.education_level]||[]).includes('subjects') && (
            <div className="grid grid-cols-2 gap-4">
              <FL label="Subjects" hint="Comma separated"><input className={inp} value={form.subjects||''} onChange={e=>f('subjects',e.target.value)} placeholder="Physics, Chemistry, Math"/></FL>
              <FL label="Grades / Results" hint="Comma separated"><input className={inp} value={form.grades||''} onChange={e=>f('grades',e.target.value)} placeholder="A, B+, A*"/></FL>
            </div>
          )}
          {(EDU_GRADE_FIELDS[form.education_level]||[]).includes('thesis') && (
            <FL label="Thesis Title"><input className={inp} value={form.thesis||''} onChange={e=>f('thesis',e.target.value)} placeholder="Research thesis title"/></FL>
          )}
        </div>
      )}

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-5 pt-2">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.is_highest} onChange={e=>f('is_highest',e.target.checked)} className="w-4 h-4 accent-amber-500"/>
          <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500"/>Mark as Highest Qualification
          </span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.education_verified} onChange={e=>f('education_verified',e.target.checked)} className="w-4 h-4 accent-emerald-600"/>
          <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500"/>Documents Verified
          </span>
        </label>
      </div>

      {/* Save row */}
      <div className="flex gap-3 pt-2 border-t border-slate-200">
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 shadow-sm ml-auto">
          {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
          {saving ? 'Saving…' : edu ? 'Save Changes' : 'Add Education'}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AdminStudentProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState({});
  const [saved, setSaved]         = useState({});
  const [error, setError]         = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [countries, setCountries]   = useState([]);

  // Education
  const [educations, setEducations]   = useState([]);
  const [showEduForm, setShowEduForm] = useState(false);
  const [editingEdu, setEditingEdu]   = useState(null);
  const [eduLoading, setEduLoading]   = useState(false);

  const [personal,   setPersonal]   = useState({ first_name:'',middle_name:'',last_name:'',date_of_birth:'',gender:'',marital_status:'',native_language:'',other_language:'',country_id:'',passport_no:'',passport_expiry:'' });
  const [address,    setAddress]    = useState({ address_line:'',city:'',province:'',postal_code:'',address_country:'',phone:'' });
  const [tests,      setTests]      = useState({ language_status:'has_proof', english_exam_type:'', open_to_esl:false, ielts_score:'',ielts_date:'',ielts_l:'',ielts_r:'',ielts_w:'',ielts_s:'',toefl_score:'',pte_score:'',duolingo_score:'',sat_score:'',gre_score:'',has_gre:false,gre_date:'',gre_v_score:'',gre_v_rank:'',gre_q_score:'',gre_q_rank:'',gre_w_score:'',gre_w_rank:'',has_gmat:false,gmat_date:'',gmat_v_score:'',gmat_v_rank:'',gmat_q_score:'',gmat_q_rank:'',gmat_w_score:'',gmat_w_rank:'',gmat_total_score:'',gmat_total_rank:'' });
  const [background, setBackground] = useState({ refused_visa:'', study_permit_type:'', background_details:'' });
  const [contact,    setContact]    = useState({ different_name:'no', alt_first_name:'', alt_middle_name:'', alt_last_name:'' });
  const passportRef = useRef(null);
  const nameProofRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [passportFile, setPassportFile] = useState(null);
  const [visa,       setVisa]       = useState({ has_visa:false,visa_country:'',visa_type:'',visa_expiry:'',refused_visa:false,study_permit:'' });
  const [lead,       setLead]       = useState({ lead_status:'New',referral_source:'',recruiter_type:'Owner',notes:'',target_program:'',target_intake:'',services_of_interest:'',country_of_interest:'',status:'Active' });

  async function loadEducations() {
    if (!id) return;
    setEduLoading(true);
    try {
      const d = await fetch(`/api/students/education?student_id=${id}`).then(r=>r.json());
      setEducations(d.educations || []);
    } catch {}
    finally { setEduLoading(false); }
  }

  function load() {
    if (!id) return;
    setLoading(true);
    fetch(`/api/students/${id}`).then(r=>r.json()).then(d=>{
      setStudent(d);
      setPersonal({ first_name:d.first_name||d.name?.split(' ')[0]||'',middle_name:d.middle_name||'',last_name:d.last_name||d.name?.split(' ').slice(1).join(' ')||'',date_of_birth:d.date_of_birth?.split('T')[0]||'',gender:d.gender||'',marital_status:d.marital_status||'',native_language:d.native_language||'',other_language:d.other_language||'',country_id:d.country_id||'',passport_no:d.passport_no||'',passport_expiry:d.passport_expiry?.split('T')[0]||'' });
      setAddress({ address_line:d.address_line||'',city:d.city||'',province:d.province||'',postal_code:d.postal_code||'',address_country:d.address_country||'',phone:d.phone||'' });
      setTests({ language_status:d.language_status||'has_proof', english_exam_type:d.english_exam_type||'', open_to_esl:!!d.open_to_esl, ielts_score:d.ielts_score||'',ielts_date:d.ielts_date?.split('T')[0]||'',ielts_l:d.ielts_l||'',ielts_r:d.ielts_r||'',ielts_w:d.ielts_w||'',ielts_s:d.ielts_s||'',toefl_score:d.toefl_score||'',pte_score:d.pte_score||'',duolingo_score:d.duolingo_score||'',sat_score:d.sat_score||'',gre_score:d.gre_score||'',has_gre:!!d.has_gre,gre_date:d.gre_date?.split('T')[0]||'',gre_v_score:d.gre_v_score||'',gre_v_rank:d.gre_v_rank||'',gre_q_score:d.gre_q_score||'',gre_q_rank:d.gre_q_rank||'',gre_w_score:d.gre_w_score||'',gre_w_rank:d.gre_w_rank||'',has_gmat:!!d.has_gmat,gmat_date:d.gmat_date?.split('T')[0]||'',gmat_v_score:d.gmat_v_score||'',gmat_v_rank:d.gmat_v_rank||'',gmat_q_score:d.gmat_q_score||'',gmat_q_rank:d.gmat_q_rank||'',gmat_w_score:d.gmat_w_score||'',gmat_w_rank:d.gmat_w_rank||'',gmat_total_score:d.gmat_total_score||'',gmat_total_rank:d.gmat_total_rank||'' });

      setBackground({ refused_visa:d.refused_visa?'Yes':'No', study_permit_type:d.study_permit_type||'', background_details:d.background_details||'' });
      setContact({ different_name:d.different_name||'no', alt_first_name:d.alt_first_name||'', alt_middle_name:d.alt_middle_name||'', alt_last_name:d.alt_last_name||'' });

      setLead({ lead_status:d.lead_status||'New',referral_source:d.referral_source||'',recruiter_type:d.recruiter_type||'Owner',notes:d.notes||'',target_program:d.target_program||'',target_intake:d.target_intake||'',services_of_interest:d.services_of_interest||'',country_of_interest:d.country_of_interest||'',status:d.status||'Active' });
    }).finally(()=>setLoading(false));
  }

  useEffect(()=>{ load(); loadEducations(); },[id]);
  useEffect(()=>{ fetch('/api/countries').then(r=>r.json()).then(d=>setCountries(d.countries||[])); },[]);

  async function saveSection(section, data) {
    setSaving(s=>({...s,[section]:true})); setError('');
    try {
      await apiCall(`/api/students/${id}`,'PUT',{ ...personal,...address,...tests,...visa,...lead,...data });
      setSaved(s=>({...s,[section]:true})); load();
    } catch(e) { setError(e.message||'Save failed'); }
    finally { setSaving(s=>({...s,[section]:false})); }
  }

  async function handleDeleteEdu(eduId) {
    if (!confirm('Remove this education record?')) return;
    await fetch(`/api/students/education?student_id=${id}`, {
      method:'DELETE', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id: eduId })
    });
    loadEducations();
  }

  async function handleSetHighest(eduId) {
    const edu = educations.find(e=>e.id===eduId);
    if (!edu) return;
    await fetch(`/api/students/education?student_id=${id}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...edu, id: eduId, is_highest: true })
    });
    loadEducations();
  }

  const sp=(k,v)=>setPersonal(p=>({...p,[k]:v}));
  const sa=(k,v)=>setAddress(p=>({...p,[k]:v}));
  const st=(k,v)=>setTests(p=>({...p,[k]:v}));
  const sv=(k,v)=>setVisa(p=>({...p,[k]:v}));
  const sl=(k,v)=>setLead(p=>({...p,[k]:v}));
  const sbg=(k,v)=>setBackground(p=>({...p,[k]:v}));
  const sco=(k,v)=>setContact(p=>({...p,[k]:v}));

  // Passport AI autofill
  async function handlePassportScan(file) {
    if (!file) return;
    setPassportFile(file); setScanning(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:800, messages:[{ role:'user', content:[
            { type:'image', source:{ type:'base64', media_type:file.type||'image/jpeg', data:base64 } },
            { type:'text', text:'Extract passport details. Return ONLY JSON: {first_name, middle_name, last_name, date_of_birth (YYYY-MM-DD), passport_no, passport_expiry (YYYY-MM-DD), gender (Male/Female), nationality}. Empty string for missing fields.' }
          ]}] })
        });
        const data = await response.json();
        const parsed = JSON.parse((data.content?.[0]?.text||'{}').replace(/\`\`\`json|\`\`\`/g,'').trim());
        const mc = countries.find(c=>c.name.toLowerCase().includes((parsed.nationality||'').toLowerCase()));
        setPersonal(p=>({...p,
          first_name:parsed.first_name||p.first_name, middle_name:parsed.middle_name||p.middle_name,
          last_name:parsed.last_name||p.last_name, date_of_birth:parsed.date_of_birth||p.date_of_birth,
          passport_no:parsed.passport_no||p.passport_no, passport_expiry:parsed.passport_expiry||p.passport_expiry,
          gender:parsed.gender||p.gender, country_id:mc?.id||p.country_id,
        }));
      } catch { setError('Could not read passport. Please fill manually.'); }
      setScanning(false);
    };
    reader.readAsDataURL(file);
  }

  if (loading) return <AdminLayout title="Student Profile"><div className="flex justify-center py-20"><Spinner size="lg"/></div></AdminLayout>;
  if (!student) return <AdminLayout title="Student Profile"><div className="text-center py-20 text-slate-400">Student not found</div></AdminLayout>;

  const applications = student.applications||[];
  const fullName = [personal.first_name,personal.last_name].filter(Boolean).join(' ')||student.name||'Unknown';
  const initials = fullName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const highestEdu = educations.find(e=>e.is_highest) || educations[0];
  const checks = [personal.first_name,personal.last_name,personal.date_of_birth,personal.passport_no,address.phone,highestEdu?.education_level,highestEdu?.gpa,tests.ielts_score||tests.toefl_score];
  const pct = Math.round((checks.filter(Boolean).length/checks.length)*100);

  return (
    <AdminLayout title={`Student: ${fullName}`}>
      <div className="max-w-full">
        <div className="flex items-center justify-between mb-5">
          <button onClick={()=>router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors">
            <ArrowLeft className="w-4 h-4"/>Back to Students
          </button>
          <button onClick={()=>setWizardOpen(true)}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
            <Plus className="w-4 h-4"/>Create Application
          </button>
        </div>

        {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4"><AlertTriangle className="w-4 h-4 shrink-0"/>{error}</div>}

        <div className="flex gap-5">
          {/* Sidebar */}
          <div className="w-72 shrink-0">
            <div className="sticky top-4 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-brand-600 to-brand-400 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm">{initials}</div>
                  <div>
                    <div className="font-bold text-slate-800">{fullName}</div>
                    <div className="text-sm text-slate-500">{student.email}</div>
                    {address.phone && <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/>{address.phone}</div>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${lead.lead_status==='Converted'?'bg-emerald-50 text-emerald-700 border-emerald-200':lead.lead_status==='New'?'bg-sky-50 text-sky-700 border-sky-200':'bg-amber-50 text-amber-700 border-amber-200'}`}>{lead.lead_status}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${lead.status==='Active'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-slate-100 text-slate-500 border-slate-200'}`}>{lead.status}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-3 text-sm">Profile Completion</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${pct>=80?'bg-emerald-500':pct>=50?'bg-amber-500':'bg-red-400'}`} style={{width:`${pct}%`}}/>
                  </div>
                  <span className={`text-sm font-bold ${pct>=80?'text-emerald-600':pct>=50?'text-amber-600':'text-red-500'}`}>{pct}%</span>
                </div>
                <div className="space-y-2">
                  {[['Personal Info',!!personal.first_name&&!!personal.date_of_birth],['Passport',!!personal.passport_no],['Contact',!!address.phone],['Education',educations.length>0],['Test Scores',!!(tests.ielts_score||tests.toefl_score)],['Visa Info',visa.has_visa!==undefined]].map(([label,done])=>(
                    <div key={label} className="flex items-center gap-2 text-xs">
                      {done?<CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0"/>:<div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0"/>}
                      <span className={done?'text-slate-700':'text-slate-400'}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-brand-500"/>Applications</h3>
                  <span className="text-xs font-bold text-slate-500">{applications.length}</span>
                </div>
                {applications.length===0 ? <p className="text-xs text-slate-400">No applications yet.</p>
                  : <div className="space-y-2">{applications.slice(0,4).map(a=>(
                      <div key={a.id} className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-700 truncate">{a.program_name||'—'}</div>
                          <div className="text-[10px] text-slate-400 truncate">{a.university_name}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${STATUS_COLORS[a.status]||'bg-slate-100 text-slate-500 border-slate-200'}`}>{a.status}</span>
                      </div>
                    ))}</div>
                }
                <button onClick={()=>setWizardOpen(true)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border-2 border-brand-200 transition-colors">
                  <Plus className="w-3.5 h-3.5"/>New Application
                </button>
              </div>
            </div>
          </div>

          {/* Main sections */}
          <div className="flex-1 min-w-0">

            {/* PERSONAL */}
            <Section icon={User} title="Personal Information" badge={saved.personal}>
              {/* Passport autofill */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 mb-5 text-center hover:border-brand-300 transition-colors">
                <input ref={passportRef} type="file" className="hidden" accept="image/*,.pdf" onChange={e=>handlePassportScan(e.target.files[0])}/>
                {scanning ? (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="w-4 h-4 border-2 border-brand-600/30 border-t-brand-600 rounded-full animate-spin"/>
                    <span className="text-sm text-brand-600 font-semibold">Reading passport…</span>
                  </div>
                ) : passportFile ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-emerald-700 font-semibold"><CheckCircle className="w-4 h-4 text-emerald-500"/>{passportFile.name} — auto-filled</span>
                    <button onClick={()=>passportRef.current?.click()} className="text-xs text-brand-600 font-bold hover:underline">Change</button>
                  </div>
                ) : (
                  <button onClick={()=>passportRef.current?.click()} className="flex items-center gap-2 mx-auto border-2 border-brand-400 text-brand-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-brand-50 transition-colors">
                    <Upload className="w-4 h-4"/> Autofill with passport
                  </button>
                )}
              </div>
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
                <FL label="Other Language(s)" hint="Comma separated"><input className={inp} value={personal.other_language} onChange={e=>sp('other_language',e.target.value)} placeholder="English, Arabic…"/></FL>
                <FL label="Country of Citizenship">
                  <select className={sel} value={personal.country_id} onChange={e=>sp('country_id',e.target.value)}>
                    <option value="">Select</option>{countries.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                  </select>
                </FL>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <FL label="Passport Number" hint="Strongly recommended"><input className={inp} value={personal.passport_no} onChange={e=>sp('passport_no',e.target.value)} placeholder="AB1234567"/></FL>
                <FL label="Passport Expiry"><input type="date" className={inp} value={personal.passport_expiry} onChange={e=>sp('passport_expiry',e.target.value)}/></FL>
              </div>

              {/* Name discrepancy */}
              <div className="mt-5 border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Do any documents show a different name than passport?</p>
                <div className="flex gap-6 mb-3">
                  {['yes','no'].map(v=>(
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <div onClick={()=>sco('different_name',v)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer shrink-0 transition-all ${contact.different_name===v?'border-brand-600 bg-brand-600':'border-slate-300'}`}>
                        {contact.different_name===v&&<div className="w-2 h-2 rounded-full bg-white"/>}
                      </div>
                      <span className="text-sm text-slate-700 font-medium capitalize">{v==='yes'?'Yes':'No'}</span>
                    </label>
                  ))}
                </div>
                {contact.different_name==='yes' && (
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="grid grid-cols-3 gap-3">
                      <FL label="Alt First Name"><input className={inp} value={contact.alt_first_name} onChange={e=>sco('alt_first_name',e.target.value)} placeholder="First"/></FL>
                      <FL label="Alt Middle Name"><input className={inp} value={contact.alt_middle_name} onChange={e=>sco('alt_middle_name',e.target.value)} placeholder="Middle"/></FL>
                      <FL label="Alt Last Name"><input className={inp} value={contact.alt_last_name} onChange={e=>sco('alt_last_name',e.target.value)} placeholder="Last"/></FL>
                    </div>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center cursor-pointer hover:border-brand-300 transition-colors" onClick={()=>nameProofRef.current?.click()}>
                      <input ref={nameProofRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"/>
                      <p className="text-xs text-slate-400">Upload Proof of Name Change — <span className="text-brand-600 font-semibold">Browse Files</span></p>
                    </div>
                  </div>
                )}
              </div>
              <SaveBtn onClick={()=>saveSection('personal',{...personal,...contact})} saving={!!saving.personal}/>
            </Section>

            {/* ADDRESS */}
            <Section icon={MapPin} title="Address & Contact" badge={saved.address}>
              <FL label="Street Address"><input className={inp} value={address.address_line} onChange={e=>sa('address_line',e.target.value)} placeholder="House #12, Street 4"/></FL>
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

            {/* ── EDUCATION HISTORY (multi) ── */}
            <Section icon={GraduationCap} title={`Education History (${educations.length})`}
              action={
                <button onClick={()=>{ setShowEduForm(true); setEditingEdu(null); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl border border-brand-200 transition-colors">
                  <Plus className="w-3.5 h-3.5"/>Add Education
                </button>
              }>

              {eduLoading ? (
                <div className="flex justify-center py-8"><Spinner/></div>
              ) : (
                <div className="space-y-4">
                  {/* Existing education cards */}
                  {educations.map(edu => (
                    editingEdu?.id === edu.id ? (
                      <EduForm key={edu.id} edu={edu} studentId={id}
                        onSaved={()=>{ setEditingEdu(null); loadEducations(); }}
                        onCancel={()=>setEditingEdu(null)}/>
                    ) : (
                      <EduCard key={edu.id} edu={edu}
                        onEdit={e=>{ setEditingEdu(e); setShowEduForm(false); }}
                        onDelete={handleDeleteEdu}
                        onSetHighest={handleSetHighest}/>
                    )
                  ))}

                  {/* Add form */}
                  {showEduForm && !editingEdu && (
                    <EduForm studentId={id}
                      onSaved={()=>{ setShowEduForm(false); loadEducations(); }}
                      onCancel={()=>setShowEduForm(false)}/>
                  )}

                  {/* Empty state */}
                  {educations.length === 0 && !showEduForm && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                      <GraduationCap className="w-10 h-10 mb-2 opacity-40"/>
                      <p className="font-semibold text-slate-500 mb-1">No education records yet</p>
                      <p className="text-sm mb-3">Add at least one education record to improve eligibility</p>
                      <button onClick={()=>setShowEduForm(true)}
                        className="flex items-center gap-2 bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-sm">
                        <Plus className="w-4 h-4"/>Add First Education
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* TEST SCORES */}
            <Section icon={FileText} title="Test Scores" badge={saved.tests}>
              {/* Language status */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">English Language Proficiency</p>
                <div className="space-y-2.5">
                  {[{v:'has_proof',label:'I have or will have proof of language proficiency before I apply.'},
                    {v:'no_test_delayed',label:'I have not taken a language test and will only apply to programs allowing proof after acceptance.'},
                    {v:'exemption',label:'I believe my academic or nationality background may qualify me for an exemption.'},
                    {v:'no_plan',label:'I have not taken a language test, and do not plan to take one.'},
                  ].map(opt=>(
                    <label key={opt.v} className="flex items-start gap-2.5 cursor-pointer">
                      <div onClick={()=>st('language_status',opt.v)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer mt-0.5 shrink-0 transition-all ${tests.language_status===opt.v?'border-brand-600 bg-brand-600':'border-slate-300'}`}>
                        {tests.language_status===opt.v&&<div className="w-2 h-2 rounded-full bg-white"/>}
                      </div>
                      <span className="text-sm text-slate-700 leading-snug">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {tests.language_status==='no_test_delayed' && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 mt-3 text-xs text-blue-700">
                    <Info className="w-4 h-4 shrink-0 mt-0.5"/>
                    Note: Student can apply for conditional admission by enrolling in an ESL program.
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer mt-3">
                  <input type="checkbox" checked={tests.open_to_esl} onChange={e=>st('open_to_esl',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                  <span className="text-sm text-slate-700">Open to taking a language proficiency course before starting academic program.</span>
                </label>
                {tests.language_status==='has_proof' && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    <FL label="English Exam Type">
                      <select className={sel} value={tests.english_exam_type} onChange={e=>st('english_exam_type',e.target.value)}>
                        <option value="">Select exam</option>
                        {['IELTS','TOEFL','PTE','Duolingo','Cambridge (CAE/CPE)'].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </FL>
                    {tests.english_exam_type==='IELTS' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">IELTS</div>
                        <div className="grid grid-cols-2 gap-3">
                          <FL label="Overall Score"><input type="number" step="0.5" min="0" max="9" className={inp} value={tests.ielts_score} onChange={e=>st('ielts_score',e.target.value)} placeholder="7.0"/></FL>
                          <FL label="Test Date"><input type="date" className={inp} value={tests.ielts_date} onChange={e=>st('ielts_date',e.target.value)}/></FL>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[['Listening','ielts_l'],['Reading','ielts_r'],['Writing','ielts_w'],['Speaking','ielts_s']].map(([label,key])=>(
                            <FL key={key} label={label}><input type="number" step="0.5" min="0" max="9" className={inp} value={tests[key]} onChange={e=>st(key,e.target.value)} placeholder="7.0"/></FL>
                          ))}
                        </div>
                      </div>
                    )}
                    {tests.english_exam_type==='TOEFL' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">TOEFL iBT</div>
                        <FL label="Total Score"><input type="number" className={inp} value={tests.toefl_score} onChange={e=>st('toefl_score',e.target.value)} placeholder="100"/></FL>
                      </div>
                    )}
                    {tests.english_exam_type==='PTE' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">PTE Academic</div>
                        <FL label="Score"><input type="number" className={inp} value={tests.pte_score} onChange={e=>st('pte_score',e.target.value)} placeholder="65"/></FL>
                      </div>
                    )}
                    {tests.english_exam_type==='Duolingo' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duolingo</div>
                        <FL label="Score"><input type="number" className={inp} value={tests.duolingo_score} onChange={e=>st('duolingo_score',e.target.value)} placeholder="110"/></FL>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* GRE */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 mb-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={tests.has_gre} onChange={e=>st('has_gre',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                  <span className="text-sm font-semibold text-slate-700">Student has GRE exam scores</span>
                </label>
                {tests.has_gre && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    <FL label="GRE Exam Date"><input type="date" className={inp} value={tests.gre_date} onChange={e=>st('gre_date',e.target.value)}/></FL>
                    <table className="w-full text-sm">
                      <thead><tr><th className="text-left pb-1 text-xs text-slate-400"></th>{['Verbal','Quantitative','Writing'].map(c=><th key={c} className="pb-1 text-xs font-bold text-slate-600 text-center">{c}</th>)}</tr></thead>
                      <tbody>
                        {[['Score','gre_v_score','gre_q_score','gre_w_score'],['Rank','gre_v_rank','gre_q_rank','gre_w_rank']].map(([label,...keys])=>(
                          <tr key={label}><td className="pr-2 py-1 text-xs text-slate-500 font-semibold">{label}</td>
                            {keys.map(k=><td key={k} className="py-1 px-1"><input className={inp} value={tests[k]} onChange={e=>st(k,e.target.value)} placeholder="—"/></td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {/* GMAT */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={tests.has_gmat} onChange={e=>st('has_gmat',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                  <span className="text-sm font-semibold text-slate-700">Student has GMAT exam scores</span>
                </label>
                {tests.has_gmat && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    <FL label="GMAT Exam Date"><input type="date" className={inp} value={tests.gmat_date} onChange={e=>st('gmat_date',e.target.value)}/></FL>
                    <table className="w-full text-sm">
                      <thead><tr><th className="text-left pb-1 text-xs text-slate-400"></th>{['Verbal','Quantitative','Writing','Total'].map(c=><th key={c} className="pb-1 text-xs font-bold text-slate-600 text-center">{c}</th>)}</tr></thead>
                      <tbody>
                        {[['Score','gmat_v_score','gmat_q_score','gmat_w_score','gmat_total_score'],['Rank','gmat_v_rank','gmat_q_rank','gmat_w_rank','gmat_total_rank']].map(([label,...keys])=>(
                          <tr key={label}><td className="pr-2 py-1 text-xs text-slate-500 font-semibold">{label}</td>
                            {keys.map(k=><td key={k} className="py-1 px-1"><input className={inp} value={tests[k]} onChange={e=>st(k,e.target.value)} placeholder="—"/></td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <SaveBtn onClick={()=>saveSection('tests',tests)} saving={!!saving.tests}/>
            </Section>

            {/* BACKGROUND & VISA */}
            <Section icon={Globe} title="Background Information & Visa" badge={saved.visa}>
              <div className="space-y-4">
                {/* Visa refusal */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    Has the student been refused a visa from Canada, USA, UK, New Zealand, Australia or Ireland?
                  </p>
                  <div className="flex gap-6">
                    {['Yes','No'].map(v=>(
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <div onClick={()=>sbg('refused_visa',v)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer shrink-0 transition-all ${background.refused_visa===v?'border-brand-600 bg-brand-600':'border-slate-300'}`}>
                          {background.refused_visa===v&&<div className="w-2 h-2 rounded-full bg-white"/>}
                        </div>
                        <span className="text-sm text-slate-700 font-medium">{v}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Study permit */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <FL label="Does student have a valid Study Permit / Visa?">
                    <select className={sel} value={background.study_permit_type} onChange={e=>sbg('study_permit_type',e.target.value)}>
                      <option value=""></option>
                      <option value="Yes - Study Permit">Yes — Study Permit</option>
                      <option value="Yes - Visitor Visa">Yes — Visitor Visa</option>
                      <option value="Yes - Work Permit">Yes — Work Permit</option>
                      <option value="No">No</option>
                    </select>
                  </FL>
                </div>
                {/* Visa details */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input type="checkbox" checked={visa.has_visa} onChange={e=>sv('has_visa',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                    <span className="text-sm font-semibold text-slate-700">Student currently holds a valid visa</span>
                  </label>
                  {visa.has_visa && (
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200">
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
                </div>
                {/* Background details */}
                {(background.refused_visa==='Yes' || (background.study_permit_type && background.study_permit_type!=='No')) && (
                  <div>
                    <FL label="Please provide more details:">
                      <textarea rows={3} className={inp+' resize-none'} value={background.background_details} onChange={e=>sbg('background_details',e.target.value)} placeholder="Provide details about visa refusal or study permit…"/>
                    </FL>
                  </div>
                )}
              </div>
              <SaveBtn onClick={()=>saveSection('visa',{...visa,...background, refused_visa:background.refused_visa==='Yes'?1:0})} saving={!!saving.visa}/>
            </Section>

            {/* LEAD MANAGEMENT */}
            <Section icon={TrendingUp} title="Lead Management & Preferences" badge={saved.lead} defaultOpen={false}>
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
                <FL label="Services of Interest"><input className={inp} value={lead.services_of_interest} onChange={e=>sl('services_of_interest',e.target.value)} placeholder="Undergraduate, Postgraduate"/></FL>
              </div>
              <FL label="Notes"><textarea rows={4} className={inp+' resize-none'} value={lead.notes} onChange={e=>sl('notes',e.target.value)} placeholder="Notes about this student…"/></FL>
              <SaveBtn onClick={()=>saveSection('lead',lead)} saving={!!saving.lead}/>
            </Section>

            {/* APPLICATIONS TABLE */}
            {applications.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen className="w-4 h-4 text-brand-500"/>Applications ({applications.length})</h3>
                  <button onClick={()=>setWizardOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-colors border border-brand-200">
                    <Plus className="w-3.5 h-3.5"/>Add
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50">{['App Code','Program','School','Intake','Applied','Status'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody>
                      {applications.map(a=>(
                        <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer"
                          onClick={()=>router.push(`/admin/application/${a.id}`)}>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-brand-600">{a.app_code}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700 max-w-[160px] truncate">{a.program_name||'—'}</td>
                          <td className="px-4 py-3 text-xs text-slate-600 max-w-[130px] truncate">{a.flag} {a.university_name||'—'}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{a.intake||'—'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{a.applied_date?new Date(a.applied_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
                          <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[a.status]||'bg-slate-100 text-slate-500 border-slate-200'}`}>{a.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ApplicationWizard open={wizardOpen} onClose={()=>setWizardOpen(false)} program={null} userRole="admin"
        preselectedStudentId={student?.id} preselectedStudent={{ id:student?.id, name:fullName, email:student?.email }}/>
    </AdminLayout>
  );
}