// pages/agent/applications/new.js — with permissions
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Spinner } from '../../../components/ui/index';
import {
  ArrowLeft, Search, CheckCircle, XCircle, AlertCircle, AlertTriangle,
  ChevronDown, ChevronUp, Plus, Trash2, X, Loader2, ArrowRight,
  Check, BookOpen, GraduationCap, FileText, Globe, DollarSign,
  Flag, Calendar, Clock, Info
} from 'lucide-react';
import { apiCall } from '../../../lib/useApi';
import usePermissions, { AccessDenied } from '../../../lib/usePermissions';

const PIPELINE_STEPS = [
  { key:'created',     label:'Application Created'   },
  { key:'started',     label:'Application Started'   },
  { key:'review',      label:'Under Review'          },
  { key:'submitting',  label:'Submitted to School'   },
  { key:'awaiting',    label:'Awaiting Decision'     },
  { key:'admission',   label:'Admission Processing'  },
  { key:'pre_arrival', label:'Pre-Arrival'           },
  { key:'arrival',     label:'Arrival'               },
];

const STEP_COLORS = {
  '':            'bg-slate-100 text-slate-500 border-slate-200',
  'created':     'bg-brand-50 text-brand-700 border-brand-200',
  'started':     'bg-sky-50 text-sky-700 border-sky-200',
  'review':      'bg-amber-50 text-amber-700 border-amber-200',
  'submitting':  'bg-blue-50 text-blue-700 border-blue-200',
  'awaiting':    'bg-purple-50 text-purple-700 border-purple-200',
  'admission':   'bg-emerald-50 text-emerald-700 border-emerald-200',
  'pre_arrival': 'bg-teal-50 text-teal-700 border-teal-200',
  'arrival':     'bg-green-50 text-green-700 border-green-200',
};

const WIZARD_STEPS = ['Program','Student','Eligibility','Intake','Prerequisites','Backups','Documents'];

function Stepper({ step }) {
  return (
    <div className="flex items-start overflow-x-auto pb-2 mb-6">
      {WIZARD_STEPS.map((label, i) => {
        const done = i < step, current = i === step;
        return (
          <div key={label} className="flex items-center shrink-0">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all z-10 relative
                ${done ? 'bg-emerald-600 border-emerald-600 text-white' : current ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-300 text-slate-400'}`}>
                {done ? <Check className="w-4 h-4" strokeWidth={3}/> : <span className="text-xs font-bold">{i+1}</span>}
              </div>
              <span className={`text-xs mt-1.5 font-semibold whitespace-nowrap text-center max-w-[72px]
                ${done ? 'text-emerald-600' : current ? 'text-brand-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={`h-0.5 w-8 lg:w-14 -mt-5 transition-colors shrink-0 ${i < step ? 'bg-emerald-500' : 'bg-slate-200'}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoCard({ program, student, intake }) {
  if (!program && !student) return null;
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 text-sm">
      <div className="space-y-1.5">
        {program && <>
          <div className="grid grid-cols-[90px_1fr]"><span className="font-bold text-slate-600">Program</span><span className="text-slate-700">{program.name}</span></div>
          <div className="grid grid-cols-[90px_1fr]"><span className="font-bold text-slate-600">School</span><span className="text-slate-700">{program.university_name}</span></div>
        </>}
        {student && <div className="grid grid-cols-[90px_1fr]"><span className="font-bold text-slate-600">Student</span><span className="text-slate-700">[{student.id}] {student.name} · {student.email}</span></div>}
        {intake  && <div className="grid grid-cols-[90px_1fr]"><span className="font-bold text-slate-600">Intake</span><span className="font-semibold text-brand-700">{intake}</span></div>}
      </div>
    </div>
  );
}

function Accordion({ index, title, badge, badgeColor, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl mb-2 overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-slate-800">{index}. {title}</span>
          {badge && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0"/> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0"/>}
      </button>
      {open && <div className="px-4 pb-4 pt-3 border-t border-slate-100 text-sm text-slate-700 leading-relaxed">{children}</div>}
    </div>
  );
}

function SearchDropdown({ items, value, onChange, placeholder, renderItem, renderSelected }) {
  const [q, setQ]       = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = items.filter(item => !q || JSON.stringify(item).toLowerCase().includes(q.toLowerCase()));
  const selected = value ? items.find(i => i.id === value) : null;
  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(o => !o)} className="flex items-center gap-2 w-full border-2 border-slate-200 hover:border-brand-400 rounded-xl px-3.5 py-3 cursor-pointer bg-white transition-colors">
        <Search className="w-4 h-4 text-slate-400 shrink-0"/>
        <input
          value={selected ? renderSelected(selected) : q}
          onChange={e => { setQ(e.target.value); onChange(null); setOpen(true); }}
          onClick={e => { e.stopPropagation(); setOpen(true); }}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400"/>
        {selected
          ? <button type="button" onClick={e => { e.stopPropagation(); onChange(null); setQ(''); }} className="p-0.5 hover:text-red-500 text-slate-400"><X className="w-4 h-4"/></button>
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0"/>
        }
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 bg-white border-2 border-slate-200 rounded-xl shadow-xl mt-1 max-h-64 overflow-y-auto">
          {filtered.length === 0
            ? <div className="px-4 py-4 text-sm text-slate-400 text-center">No results found</div>
            : filtered.map(item => (
                <button key={item.id} type="button" onClick={() => { onChange(item.id, item); setQ(''); setOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors border-b border-slate-100 last:border-0">
                  {renderItem(item)}
                </button>
              ))
          }
        </div>
      )}
    </div>
  );
}

function DocRow({ doc, index }) {
  const stepKey  = doc.application_step || '';
  const stepLabel = PIPELINE_STEPS.find(s => s.key === stepKey)?.label || 'All Steps';
  const color    = STEP_COLORS[stepKey] || STEP_COLORS[''];
  return (
    <div className="border border-slate-200 rounded-xl mb-2 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5 bg-white">
        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">{index}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">{doc.name}</span>
            {!doc.required && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Optional</span>}
            {doc.doc_type && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200">{doc.doc_type}</span>}
          </div>
          {doc.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.description}</p>}
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${color}`}>
          <Flag className="w-2.5 h-2.5"/>{stepLabel}
        </span>
      </div>
    </div>
  );
}

export default function NewApplicationPage() {
  const router = useRouter();
  const { program: queryProgram, student: queryStudent } = router.query;

  // ── PERMISSIONS ──────────────────────────────────────────────
  const { can, isEmployee, loading: permLoading } = usePermissions();

  const [step, setStep]                   = useState(0);
  const [programs, setPrograms]           = useState([]);
  const [students, setStudents]           = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fullProgram, setFullProgram]     = useState(null);
  const [loadingProg, setLoadingProg]     = useState(false);
  const [eligibility, setEligibility]     = useState(null);
  const [checkingElig, setCheckingElig]   = useState(false);
  const [selectedIntake, setSelectedIntake] = useState('');
  const [expandAll, setExpandAll]         = useState(true);
  const [backupPrograms, setBackupPrograms] = useState([]);
  const [backupSearch, setBackupSearch]   = useState('');
  const [showBackupSearch, setShowBackupSearch] = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');

  // Block page if employee can't add applications
  if (!permLoading && isEmployee && !can('add_applications')) {
    return (
      <AdminLayout title="New Application">
        <AccessDenied message="You don't have permission to create applications. Ask your agent to grant you access." />
      </AdminLayout>
    );
  }

  useEffect(() => {
    if (permLoading) return;
    Promise.all([
      fetch('/api/programs?limit=500').then(r => r.json()),
      // employee: only their assigned students; agent: all students
      isEmployee
        ? fetch('/api/agent-employee/students').then(r => r.json())
        : fetch('/api/students?limit=500').then(r => r.json()),
    ]).then(([pd, sd]) => {
      const progs = pd.programs || [];
      setPrograms(progs);
      const studs = (sd.students || []).map(s => ({
        id: s.id,
        name: s.name || s.full_name || `${s.first_name||''} ${s.last_name||''}`.trim() || 'Unknown',
        email: s.email,
        education_level: s.education_level,
        gpa: s.gpa,
        ielts_score: s.ielts_score,
      }));
      setStudents(studs);
      if (queryProgram) {
        const p = progs.find(x => String(x.id) === String(queryProgram));
        if (p) { handleSelectProgram(p.id, p, progs); setStep(1); }
      }
      if (queryStudent) {
        const s = studs.find(x => String(x.id) === String(queryStudent));
        if (s) setSelectedStudent(s);
      }
    });
  }, [queryProgram, queryStudent, permLoading, isEmployee]);

  async function handleSelectProgram(id, item, progList) {
    const prog = item || (progList || programs).find(p => p.id === id);
    setSelectedProgram(prog || null);
    setFullProgram(null);
    if (!id) return;
    setLoadingProg(true);
    try {
      const [detail, reqData] = await Promise.all([
        fetch(`/api/programs/${id}`).then(r => r.json()),
        fetch(`/api/programs/${id}/requirements`).then(r => r.json()).catch(() => ({ prerequisites:[], documents:[] })),
      ]);
      setFullProgram({ ...detail, _prereqs: reqData.prerequisites || [], _docs: reqData.documents || [] });
    } catch { setFullProgram(null); }
    finally { setLoadingProg(false); }
  }

  useEffect(() => {
    if (!selectedProgram || !selectedStudent) { setEligibility(null); return; }
    setCheckingElig(true);
    fetch(`/api/applications/check-eligibility?program_id=${selectedProgram.id}&student_id=${selectedStudent.id}`)
      .then(r => r.json()).then(d => { setEligibility(d); setCheckingElig(false); })
      .catch(() => setCheckingElig(false));
  }, [selectedProgram, selectedStudent]);

  const prog      = fullProgram || selectedProgram;
  const intakes   = prog?.available_intakes ? prog.available_intakes.split(',').filter(Boolean) : [];

  const prerequisites = (() => {
    if (fullProgram?._prereqs?.length) return fullProgram._prereqs;
    const raw = prog?.prerequisites;
    if (!raw) return [
      { title:'Country Specific GPA', body:'For applicants from Pakistan: minimum GPA 55% from a recognized academic institute.' },
      { title:'English Test Validity', body:'English test must be valid at the start date of the desired program.' },
      { title:'Overqualified Degree', body:"The program does not accept applicants already holding a master's degree in a related area." },
      { title:'Non-Standard Qualification', body:'Certain non-standard qualifications are NOT accepted for this program.' },
      { title:'Credibility Interview', body:'Some applicants may be required to attend a credibility interview.' },
    ];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return []; }
  })();

  const programDocs = (() => {
    if (fullProgram?._docs?.length) return fullProgram._docs;
    const raw = prog?.required_documents;
    if (!raw) return [
      { name:'Copy of Education Transcripts', doc_type:'Document', required:true, application_step:'started' },
      { name:'Copy of Education Certificate', doc_type:'Document', required:true, application_step:'started' },
      { name:'Passport Copy',                 doc_type:'',         required:true, application_step:'started' },
      { name:'English Language Proficiency',  doc_type:'',         required:true, application_step:'started' },
      { name:'Resume / CV',                   doc_type:'',         required:true, application_step:'started' },
      { name:'Hybrid Immigration History',    doc_type:'',         required:false, application_step:'review' },
      { name:'Study Gap Explanation',         doc_type:'',         required:false, application_step:'review' },
    ];
    if (Array.isArray(raw)) return raw.map(d => ({ ...d, doc_type: d.type||d.doc_type||'', required: d.required!==false }));
    try { return JSON.parse(raw).map(d => ({ ...d, doc_type: d.type||d.doc_type||'' })); } catch { return []; }
  })();

  const docsByStep = {};
  programDocs.forEach(d => {
    const key = d.application_step || '';
    if (!docsByStep[key]) docsByStep[key] = [];
    docsByStep[key].push(d);
  });
  const stepsWithDocs = Object.keys(docsByStep);

  const backupResults = programs.filter(p =>
    p.id !== selectedProgram?.id &&
    !backupPrograms.find(b => b.id === p.id) &&
    (!backupSearch || p.name?.toLowerCase().includes(backupSearch.toLowerCase()) || p.university_name?.toLowerCase().includes(backupSearch.toLowerCase()))
  ).slice(0, 20);

  function canNext() {
    if (step === 0) return !!selectedProgram;
    if (step === 1) return !!selectedStudent;
    if (step === 2) {
      if (!eligibility) return false;
      if (eligibility.status === 'not_eligible') return false;
      if (eligibility.status === 'already_applied') return false;
      return true;
    }
    if (step === 3) return intakes.length === 0 || !!selectedIntake;
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true); setError('');
    try {
      const result = await apiCall('/api/applications', 'POST', {
        student_id:      selectedStudent.id,
        program_id:      selectedProgram.id,
        university_id:   selectedProgram.university_id,
        intake:          selectedIntake || intakes[0] || null,
        backup_programs: backupPrograms.map(b => ({ id:b.id, name:b.name, university_name:b.university_name })),
      });
      router.push(`/agent/applications?success=${result.app_code}`);
    } catch(e) { setError(e.message || 'Failed to submit application'); }
    finally { setSubmitting(false); }
  }

  // rest of the JSX is identical to original — only the student list source changes
  return (
    <AdminLayout title="New Application">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
            <ArrowLeft className="w-4 h-4"/>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>New Application</h2>
            <p className="text-sm text-slate-500 mt-0.5">Step {step+1} of {WIZARD_STEPS.length}</p>
          </div>
        </div>

        <Stepper step={step}/>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6">
            {step >= 1 && <InfoCard program={selectedProgram} student={step>=2?selectedStudent:null} intake={step>=4?selectedIntake:null}/>}

            {step === 0 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Select Program</h3>
                <p className="text-sm text-slate-500 mb-4">Search and select the program for this application.</p>
                <SearchDropdown items={programs} value={selectedProgram?.id} placeholder="Search by program name, university…"
                  onChange={(id, item) => handleSelectProgram(id, item)}
                  renderSelected={p => `${p.name} — ${p.university_name}`}
                  renderItem={p => (
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{p.university_name}</span>
                        {p.level && <span className="text-[10px] bg-brand-50 text-brand-600 border border-brand-200 font-bold px-1.5 py-0.5 rounded-full">{p.level}</span>}
                        {p.currency && p.tuition_fee && <span className="text-xs text-slate-400">{p.currency} {Number(p.tuition_fee).toLocaleString()}</span>}
                      </div>
                    </div>
                  )}
                />
                {loadingProg && <div className="flex items-center gap-2 mt-4 text-brand-600 text-sm"><Loader2 className="w-4 h-4 animate-spin"/><span>Loading program details…</span></div>}
                {selectedProgram && !loadingProg && (
                  <div className="mt-4 p-4 bg-brand-50 border-2 border-brand-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-brand-700 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0">
                        {prog?.logo_initials || selectedProgram.university_name?.[0] || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-brand-800">{selectedProgram.name}</div>
                        <div className="text-sm text-brand-600 mt-0.5">{selectedProgram.university_name}</div>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-brand-700">
                          {selectedProgram.level && <span>📚 {selectedProgram.level}</span>}
                          {selectedProgram.currency && selectedProgram.tuition_fee && <span>💰 {selectedProgram.currency} {Number(selectedProgram.tuition_fee).toLocaleString()}</span>}
                          {selectedProgram.duration_text && <span>⏱ {selectedProgram.duration_text}</span>}
                          {selectedProgram.available_intakes && <span>📅 {selectedProgram.available_intakes.split(',')[0]}</span>}
                        </div>
                        {fullProgram && (
                          <div className="flex gap-3 mt-3 pt-2 border-t border-brand-200">
                            <span className="text-[11px] text-brand-600 font-semibold">📋 {prerequisites.length} prerequisite{prerequisites.length !== 1 ? 's' : ''}</span>
                            <span className="text-[11px] text-brand-600 font-semibold">📄 {programDocs.length} document{programDocs.length !== 1 ? 's' : ''} required</span>
                            <span className="text-[11px] text-brand-600 font-semibold">📅 {intakes.length} intake{intakes.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                      <CheckCircle className="w-5 h-5 text-brand-600 shrink-0"/>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Select Student</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {isEmployee ? 'Select from your assigned students.' : 'Select the student you want to create this application for.'}
                </p>
                <SearchDropdown items={students} value={selectedStudent?.id} placeholder="Search by name, ID or email…"
                  onChange={(id, item) => setSelectedStudent(item || null)}
                  renderSelected={s => `[${s.id}] ${s.name} · ${s.email}`}
                  renderItem={s => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(s.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">[{s.id}] {s.name}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </div>
                    </div>
                  )}
                />
                {selectedStudent && (
                  <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0">
                      {selectedStudent.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-emerald-800">[{selectedStudent.id}] {selectedStudent.name}</div>
                      <div className="text-sm text-emerald-600">{selectedStudent.email}</div>
                      <div className="flex gap-3 mt-1 text-xs text-emerald-700">
                        {selectedStudent.education_level && <span>🎓 {selectedStudent.education_level}</span>}
                        {selectedStudent.ielts_score && <span>📝 IELTS {selectedStudent.ielts_score}</span>}
                        {selectedStudent.gpa && <span>📊 GPA {selectedStudent.gpa}</span>}
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0"/>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Eligibility Check</h3>
                <p className="text-sm text-slate-500 mb-4">Checking if the student meets the program requirements.</p>
                {checkingElig ? (
                  <div className="flex items-center gap-3 py-8 justify-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-500"/>
                    <span className="text-sm">Checking eligibility…</span>
                  </div>
                ) : !eligibility ? (
                  <div className="text-center py-8 text-slate-400 text-sm">Select a student first</div>
                ) : (
                  <>
                    {eligibility.status === 'already_applied' && (
                      <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-red-700">
                          <AlertCircle className="w-4 h-4 shrink-0"/>
                          <span className="font-semibold">Student already has an application to this program.</span>
                        </div>
                        <button onClick={() => router.push('/agent/applications')} className="text-sm font-bold text-red-600 border border-red-200 rounded-xl px-3 py-1.5 hover:bg-red-100 transition-colors whitespace-nowrap ml-3">View application</button>
                      </div>
                    )}
                    {eligibility.status === 'not_eligible' && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                        <div className="flex items-start gap-2 mb-3">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5"/>
                          <span className="text-sm font-bold text-red-700">{eligibility.message}</span>
                        </div>
                        <ul className="space-y-1 text-sm text-red-600 ml-6 mb-3">
                          {eligibility.issues?.map((issue, i) => <li key={i} className="list-disc">{issue}</li>)}
                        </ul>
                        {can('edit_students') && (
                          <button onClick={() => router.push(`/agent/student/${selectedStudent?.id}`)} className="text-sm font-bold text-red-600 border border-red-200 rounded-xl px-4 py-2 hover:bg-red-100 transition-colors">
                            Update Student Profile
                          </button>
                        )}
                      </div>
                    )}
                    {eligibility.status === 'conditional' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0"/>
                          <div>
                            <p className="text-sm font-bold text-amber-700">{eligibility.message}</p>
                            <p className="text-xs text-amber-600 mt-0.5">Student may need additional documents. You can still proceed.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {eligibility.status === 'eligible' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5 text-emerald-600"/>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-700">Student is fully eligible for this program!</p>
                            <p className="text-xs text-emerald-600 mt-0.5">All requirements are met. You can proceed.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Select Intake</h3>
                <p className="text-sm text-slate-500 mb-4">Choose the academic intake for this application.</p>
                {intakes.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0"/>No intake dates defined. Application will proceed without an intake date.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {intakes.map((intake, i) => (
                      <button key={intake} type="button" onClick={() => setSelectedIntake(intake)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all text-left
                          ${selectedIntake === intake ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${i < 2 ? 'bg-emerald-500' : 'bg-amber-400'}`}/>
                          <span className="font-semibold text-slate-800">{intake}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${i < 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                            {i < 2 ? 'Open' : 'Likely open'}
                          </span>
                        </div>
                        {selectedIntake === intake && <CheckCircle className="w-5 h-5 text-brand-500"/>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Prerequisites</h3>
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/>
                  <p className="text-sm text-amber-700">Please review carefully. If the student does not meet these prerequisites the application may be cancelled.</p>
                </div>
                <div className="flex justify-end gap-2 mb-3">
                  <button onClick={() => setExpandAll(true)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">Expand all</button>
                  <button onClick={() => setExpandAll(false)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">Collapse all</button>
                </div>
                {prerequisites.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm border border-slate-200 rounded-xl">No prerequisites defined for this program.</div>
                ) : prerequisites.map((prereq, i) => (
                  <Accordion key={i} index={i+1} title={prereq.title} defaultOpen={expandAll}>
                    <p>{prereq.body || prereq.description || ''}</p>
                  </Accordion>
                ))}
              </div>
            )}

            {step === 5 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Backup Programs</h3>
                <p className="text-sm text-slate-600 mb-4">Add up to 10 backup programs in order of preference.</p>
                <p className="text-sm font-bold text-slate-700 mb-3">Backup Programs ({backupPrograms.length}/10)</p>
                {backupPrograms.length === 0 ? (
                  <div className="border border-slate-200 rounded-xl px-4 py-6 text-center text-sm text-slate-400 bg-slate-50 mb-4">No backup programs added yet.</div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {backupPrograms.map((bp, i) => (
                      <div key={bp.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-brand-200">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">{i+1}</div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{bp.name}</div>
                            <div className="text-xs text-slate-400">{bp.university_name}</div>
                          </div>
                        </div>
                        <button onClick={() => setBackupPrograms(b => b.filter((_, idx) => idx !== i))} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {backupPrograms.length < 10 && (
                  !showBackupSearch ? (
                    <button onClick={() => setShowBackupSearch(true)} className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                      <Plus className="w-4 h-4"/>Add Backup Program
                    </button>
                  ) : (
                    <div className="border-2 border-brand-200 rounded-2xl p-4 bg-brand-50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-brand-700">Search & Add Backup</p>
                        <button onClick={() => { setShowBackupSearch(false); setBackupSearch(''); }} className="p-1 hover:bg-brand-100 rounded-lg text-brand-500"><X className="w-4 h-4"/></button>
                      </div>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input value={backupSearch} onChange={e => setBackupSearch(e.target.value)} autoFocus placeholder="Search programs…"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"/>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {backupResults.length === 0
                          ? <p className="text-xs text-slate-400 text-center py-3">No programs found</p>
                          : backupResults.map(p => (
                              <button key={p.id} type="button" onClick={() => { setBackupPrograms(b => [...b, p]); setBackupSearch(''); }}
                                className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-brand-400 text-left">
                                <div>
                                  <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                                  <div className="text-xs text-slate-400 mt-0.5">{p.university_name} · {p.level}</div>
                                </div>
                                <Plus className="w-4 h-4 text-brand-500 shrink-0 ml-2"/>
                              </button>
                            ))
                        }
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {step === 6 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Required Documents</h3>
                <p className="text-sm text-slate-600 mb-4">Documents are shown at their assigned pipeline step. You don't need to upload them now.</p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-sm font-bold text-blue-700 mb-2">How document upload works</p>
                      <p className="text-xs text-blue-600 leading-relaxed">
                        Documents for each pipeline step will unlock as the application progresses. Upload all documents for a step, then click "Send for Review".
                      </p>
                    </div>
                  </div>
                </div>
                {programDocs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm border border-slate-200 rounded-xl">No documents configured for this program yet.</div>
                ) : stepsWithDocs.length > 0 ? (
                  <div className="space-y-4">
                    {docsByStep[''] && docsByStep[''].length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="w-3.5 h-3.5 text-slate-500"/>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Always Required</span>
                          <span className="text-xs text-slate-400">({docsByStep[''].length})</span>
                        </div>
                        {docsByStep[''].map((doc, i) => <DocRow key={i} doc={doc} index={i+1}/>)}
                      </div>
                    )}
                    {PIPELINE_STEPS.filter(s => docsByStep[s.key]?.length > 0).map(pipeStep => (
                      <div key={pipeStep.key}>
                        <div className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-xl border ${STEP_COLORS[pipeStep.key]}`}>
                          <Flag className="w-3.5 h-3.5 shrink-0"/>
                          <span className="text-xs font-bold uppercase tracking-wider">{pipeStep.label}</span>
                          <span className="text-xs opacity-70 ml-auto">({docsByStep[pipeStep.key].length} document{docsByStep[pipeStep.key].length !== 1 ? 's' : ''})</span>
                        </div>
                        {docsByStep[pipeStep.key].map((doc, i) => <DocRow key={i} doc={doc} index={i+1}/>)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>{programDocs.map((doc, i) => <DocRow key={i} doc={doc} index={i+1}/>)}</div>
                )}
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mt-4">
                    <AlertCircle className="w-4 h-4 shrink-0"/>{error}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
            <button onClick={() => router.back()} className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors">Cancel</button>
            <div className="flex gap-3">
              {step > 0 && (
                <button onClick={() => setStep(s => s-1)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors">
                  <ArrowLeft className="w-4 h-4"/>Previous
                </button>
              )}
              {step < WIZARD_STEPS.length - 1 ? (
                <button onClick={() => setStep(s => s+1)} disabled={!canNext()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  Next <ArrowRight className="w-4 h-4"/>
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting || !canNext()}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                  {submitting ? 'Creating…' : 'Create Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}