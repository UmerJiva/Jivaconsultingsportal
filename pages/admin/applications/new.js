// pages/admin/applications/new.js — Full application creation form page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Spinner } from '../../../components/ui/index';
import {
  ArrowLeft, Search, CheckCircle, XCircle, AlertCircle, AlertTriangle,
  ChevronDown, ChevronUp, Plus, Trash2, X, Loader2, ArrowRight, ArrowLeft as Back,
  Check, BookOpen, GraduationCap, Building2, Users, FileText, Globe
} from 'lucide-react';
import { apiCall } from '../../../lib/useApi';

// ── Step progress bar ─────────────────────────────────────────
const STEP_LABELS = ['Select Program', 'Select Student', 'Eligibility', 'Intakes', 'Prerequisites', 'Backups', 'Documents'];

function Stepper({ step }) {
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2 mb-6">
      {STEP_LABELS.map((label, i) => {
        const done = i < step, current = i === step;
        return (
          <div key={label} className="flex items-center shrink-0">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all z-10 relative
                ${done    ? 'bg-emerald-600 border-emerald-600 text-white'
                : current ? 'bg-brand-600 border-brand-600 text-white'
                :            'bg-white border-slate-300 text-slate-400'}`}>
                {done ? <Check className="w-4 h-4" strokeWidth={3}/> : <span className="text-xs font-bold">{i+1}</span>}
              </div>
              <span className={`text-xs mt-1.5 font-semibold whitespace-nowrap text-center max-w-[80px]
                ${done ? 'text-emerald-600' : current ? 'text-brand-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length-1 && (
              <div className={`h-0.5 w-10 lg:w-16 -mt-5 transition-colors shrink-0 ${i < step ? 'bg-emerald-500' : 'bg-slate-200'}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Summary info card ─────────────────────────────────────────
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
        {intake && <div className="grid grid-cols-[90px_1fr]"><span className="font-bold text-slate-600">Intake</span><span className="text-slate-700 font-semibold">{intake}</span></div>}
      </div>
    </div>
  );
}

// ── Collapsible accordion ─────────────────────────────────────
function Accordion({ index, title, badge, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl mb-2 overflow-hidden">
      <button type="button" onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">{index}. {title}</span>
          {badge && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0"/> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0"/>}
      </button>
      {open && <div className="px-4 pb-4 pt-3 border-t border-slate-100 text-sm text-slate-700 leading-relaxed">{children}</div>}
    </div>
  );
}

// ── Searchable dropdown ───────────────────────────────────────
function SearchDropdown({ items, value, onChange, placeholder, renderItem, renderSelected }) {
  const [q, setQ]       = useState('');
  const [open, setOpen] = useState(false);
  const ref = require('react').useRef(null);
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = items.filter(item => !q || JSON.stringify(item).toLowerCase().includes(q.toLowerCase()));
  const selected = value ? items.find(i => i.id === value) : null;
  return (
    <div ref={ref} className="relative">
      <div onClick={()=>setOpen(o=>!o)} className="flex items-center gap-2 w-full border-2 border-slate-200 hover:border-brand-400 rounded-xl px-3.5 py-3 cursor-pointer bg-white transition-colors">
        <Search className="w-4 h-4 text-slate-400 shrink-0"/>
        <input
          value={selected ? renderSelected(selected) : q}
          onChange={e=>{ setQ(e.target.value); onChange(null); setOpen(true); }}
          onClick={e=>{ e.stopPropagation(); setOpen(true); }}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400"/>
        {selected
          ? <button type="button" onClick={e=>{e.stopPropagation();onChange(null);setQ('');}} className="p-0.5 hover:text-red-500 text-slate-400"><X className="w-4 h-4"/></button>
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0"/>
        }
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 bg-white border-2 border-slate-200 rounded-xl shadow-xl mt-1 max-h-64 overflow-y-auto">
          {filtered.length === 0
            ? <div className="px-4 py-4 text-sm text-slate-400 text-center">No results found</div>
            : filtered.map(item => (
                <button key={item.id} type="button" onClick={()=>{ onChange(item.id, item); setQ(''); setOpen(false); }}
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

// ── Main page ─────────────────────────────────────────────────
export default function NewApplicationPage() {
  const router = useRouter();
  const { program: queryProgram, student: queryStudent } = router.query;

  const [step, setStep]             = useState(0);
  const [programs, setPrograms]     = useState([]);
  const [students, setStudents]     = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [eligibility, setEligibility]         = useState(null);
  const [checkingElig, setCheckingElig]       = useState(false);
  const [selectedIntake, setSelectedIntake]   = useState('');
  const [expandAll, setExpandAll]             = useState(true);
  const [backupPrograms, setBackupPrograms]   = useState([]);
  const [backupSearch, setBackupSearch]       = useState('');
  const [showBackupSearch, setShowBackupSearch] = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const [error, setError]                     = useState('');

  useEffect(() => {
    // Load all programs and students
    Promise.all([
      fetch('/api/programs?limit=200').then(r=>r.json()),
      fetch('/api/students?limit=500').then(r=>r.json()),
    ]).then(([pd, sd]) => {
      const progs = pd.programs||[];
      setPrograms(progs);
      const studs = (sd.students||[]).map(s=>({
        id: s.id,
        name: s.full_name || `${s.first_name||''} ${s.last_name||''}`.trim() || s.name || 'Unknown',
        email: s.email,
        education_level: s.education_level,
        gpa: s.gpa,
        ielts_score: s.ielts_score,
      }));
      setStudents(studs);

      // Pre-select from query params
      if (queryProgram) {
        const p = progs.find(x => String(x.id)===String(queryProgram));
        if (p) { setSelectedProgram(p); setStep(1); }
      }
      if (queryStudent) {
        const s = studs.find(x => String(x.id)===String(queryStudent));
        if (s) { setSelectedStudent(s); }
      }
    });
  }, [queryProgram, queryStudent]);

  // Check eligibility when both program and student selected
  useEffect(() => {
    if (!selectedProgram || !selectedStudent) { setEligibility(null); return; }
    setCheckingElig(true);
    fetch(`/api/applications/check-eligibility?program_id=${selectedProgram.id}&student_id=${selectedStudent.id}`)
      .then(r=>r.json()).then(d=>{ setEligibility(d); setCheckingElig(false); })
      .catch(()=>setCheckingElig(false));
  }, [selectedProgram, selectedStudent]);

  const intakes = selectedProgram?.available_intakes
    ? selectedProgram.available_intakes.split(',').filter(Boolean)
    : [];

  const prerequisites = selectedProgram?.prerequisites
    ? (Array.isArray(selectedProgram.prerequisites) ? selectedProgram.prerequisites : (() => { try { return JSON.parse(selectedProgram.prerequisites); } catch { return []; } })())
    : [
        { title:'Country Specific GPA', body:'For applicants from Pakistan: minimum GPA 55% from a recognized academic institute.' },
        { title:'English Test Validity', body:'English test must be valid at the start date of the desired program.' },
        { title:'Overqualified Degree', body:'The program does not accept applicants already holding a master\'s degree in a related area.' },
        { title:'Non-Standard Qualification', body:'Certain non-standard qualifications are NOT accepted for this program.' },
        { title:'Credibility Interview', body:'Some applicants may be required to attend a credibility interview.' },
      ];

  const requiredDocs = selectedProgram?.required_documents
    ? (Array.isArray(selectedProgram.required_documents) ? selectedProgram.required_documents : (() => { try { return JSON.parse(selectedProgram.required_documents); } catch { return []; } })())
    : [
        { name:'Copy of Education Transcripts', type:'Document' },
        { name:'Copy of Education Certificate', type:'Document' },
        { name:'Passport Copy', type:'' },
        { name:'English Language Proficiency Test', type:'' },
        { name:'Resume', type:'' },
        { name:'Hybrid Immigration History', type:'' },
        { name:'Study Gap Explanation', type:'' },
      ];

  // Backup program search results (exclude already selected main + backups)
  const backupResults = programs.filter(p =>
    p.id !== selectedProgram?.id &&
    !backupPrograms.find(b=>b.id===p.id) &&
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
        student_id: selectedStudent.id,
        program_id: selectedProgram.id,
        university_id: selectedProgram.university_id,
        intake: selectedIntake || intakes[0] || null,
        backup_programs: backupPrograms.map(b=>({ id:b.id, name:b.name, university_name:b.university_name })),
      });
      router.push(`/admin/applications?success=${result.app_code}`);
    } catch(e) {
      setError(e.message || 'Failed to submit application');
    } finally { setSubmitting(false); }
  }

  return (
    <AdminLayout title="New Application">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={()=>router.back()} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
            <ArrowLeft className="w-4 h-4"/>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>New Application</h2>
            <p className="text-sm text-slate-500 mt-0.5">Step {step+1} of {STEP_LABELS.length}</p>
          </div>
        </div>

        {/* Stepper */}
        <Stepper step={step}/>

        {/* Card body */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6">

            {/* Info card from step 1+ */}
            {step >= 1 && <InfoCard program={selectedProgram} student={step>=2?selectedStudent:null} intake={step>=4?selectedIntake:null}/>}

            {/* ── STEP 0: SELECT PROGRAM ── */}
            {step === 0 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Select Program</h3>
                <p className="text-sm text-slate-500 mb-4">Search and select the program this application is for.</p>
                <SearchDropdown
                  items={programs}
                  value={selectedProgram?.id}
                  placeholder="Search by program name, university…"
                  onChange={(id, item) => setSelectedProgram(item||null)}
                  renderSelected={p=>`${p.name} — ${p.university_name}`}
                  renderItem={p=>(
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
                {selectedProgram && (
                  <div className="mt-4 p-4 bg-brand-50 border-2 border-brand-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-brand-700 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0">
                        {selectedProgram.logo_initials||selectedProgram.university_name?.[0]||'U'}
                      </div>
                      <div>
                        <div className="font-bold text-brand-800">{selectedProgram.name}</div>
                        <div className="text-sm text-brand-600 mt-0.5">{selectedProgram.university_name}</div>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-brand-700">
                          {selectedProgram.level && <span>📚 {selectedProgram.level}</span>}
                          {selectedProgram.currency && selectedProgram.tuition_fee && <span>💰 {selectedProgram.currency} {Number(selectedProgram.tuition_fee).toLocaleString()}</span>}
                          {selectedProgram.duration_text && <span>⏱ {selectedProgram.duration_text}</span>}
                          {selectedProgram.available_intakes && <span>📅 {selectedProgram.available_intakes.split(',')[0]}</span>}
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-brand-600 shrink-0 ml-auto"/>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 1: SELECT STUDENT ── */}
            {step === 1 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Select Student</h3>
                <p className="text-sm text-slate-500 mb-4">Select the student you want to apply for this program.</p>
                <SearchDropdown
                  items={students}
                  value={selectedStudent?.id}
                  placeholder="Search student by name, ID or email…"
                  onChange={(id, item) => setSelectedStudent(item||null)}
                  renderSelected={s=>`[${s.id}] ${s.name} · ${s.email}`}
                  renderItem={s=>(
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(s.name||'?')[0].toUpperCase()}
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

            {/* ── STEP 2: ELIGIBILITY CHECK ── */}
            {step === 2 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Eligibility Check</h3>
                <p className="text-sm text-slate-500 mb-4">Checking if the student meets the program requirements.</p>
                {checkingElig ? (
                  <div className="flex items-center gap-3 py-6 justify-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-500"/>
                    <span className="text-sm">Checking eligibility…</span>
                  </div>
                ) : !eligibility ? (
                  <div className="text-center py-6 text-slate-400 text-sm">Select a student first</div>
                ) : (
                  <div>
                    {/* Already applied */}
                    {eligibility.status === 'already_applied' && (
                      <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-red-700">
                          <AlertCircle className="w-4 h-4 shrink-0"/>
                          <span className="font-semibold">Student already has an application to this program.</span>
                        </div>
                        <button onClick={()=>router.push('/admin/applications')} className="text-sm font-bold text-red-600 border border-red-200 rounded-xl px-3 py-1.5 hover:bg-red-100 transition-colors whitespace-nowrap ml-3">
                          View application
                        </button>
                      </div>
                    )}

                    {/* Not eligible */}
                    {eligibility.status === 'not_eligible' && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-3">
                              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5"/>
                              <span className="text-sm font-bold text-red-700">{eligibility.message}</span>
                            </div>
                            <ul className="space-y-1 text-sm text-red-600 ml-6">
                              {eligibility.issues?.map((issue,i)=><li key={i} className="list-disc">{issue}</li>)}
                            </ul>
                            <p className="text-xs text-red-400 mt-3">Update the student's profile data to fix these issues before applying.</p>
                          </div>
                          <button onClick={()=>router.push(`/admin/student/${selectedStudent?.id}`)} className="text-sm font-bold text-red-600 border border-red-200 rounded-xl px-3 py-1.5 hover:bg-red-100 transition-colors whitespace-nowrap shrink-0">
                            Update Profile
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Conditionally eligible */}
                    {eligibility.status === 'conditional' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0"/>
                          <div>
                            <p className="text-sm font-bold text-emerald-700">{eligibility.message}</p>
                            <p className="text-xs text-emerald-600 mt-0.5">Student may still be required to provide additional documents.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fully eligible */}
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
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: SELECT INTAKE ── */}
            {step === 3 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Select Intake</h3>
                <p className="text-sm text-slate-500 mb-4">Choose the academic intake for this application.</p>
                {intakes.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0"/>No intake dates defined for this program. The application will proceed without an intake date.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {intakes.map((intake, i) => (
                      <button key={intake} type="button" onClick={()=>setSelectedIntake(intake)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all text-left
                          ${selectedIntake===intake ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${i < 2 ? 'bg-emerald-500' : 'bg-amber-400'}`}/>
                          <span className="font-semibold text-slate-800">{intake}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${i < 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                            {i < 2 ? 'Open' : 'Likely open'}
                          </span>
                        </div>
                        {selectedIntake===intake && <CheckCircle className="w-5 h-5 text-brand-500"/>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: PREREQUISITES ── */}
            {step === 4 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Prerequisites</h3>
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/>
                  <p className="text-sm text-amber-700">Please review the following carefully. If the student does not meet these prerequisites the application will be cancelled.</p>
                </div>
                <div className="flex justify-end gap-2 mb-3">
                  <button onClick={()=>setExpandAll(true)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">Expand all</button>
                  <button onClick={()=>setExpandAll(false)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">Collapse all</button>
                </div>
                {prerequisites.map((prereq, i) => (
                  <Accordion key={i} index={i+1} title={prereq.title} defaultOpen={expandAll}>
                    <div dangerouslySetInnerHTML={{__html: (prereq.body||'').replace(/Pakistan/g,'<mark class="bg-yellow-200 rounded px-0.5">Pakistan</mark>')}}/>
                  </Accordion>
                ))}
              </div>
            )}

            {/* ── STEP 5: BACKUP PROGRAMS ── */}
            {step === 5 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Backup Programs</h3>
                <p className="text-sm text-slate-600 mb-1">Choose up to 10 backup programs in order of preference. These will be considered if the main program is not available.</p>
                <p className="text-sm font-bold text-slate-700 mb-4">Backup Programs ({backupPrograms.length}/10)</p>

                {backupPrograms.length === 0 ? (
                  <div className="border border-slate-200 rounded-xl px-4 py-6 text-center text-sm text-slate-400 bg-slate-50 mb-4">
                    No backup programs added yet. Search and add programs below.
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {backupPrograms.map((bp, i) => (
                      <div key={bp.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-brand-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">{i+1}</div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{bp.name}</div>
                            <div className="text-xs text-slate-400">{bp.university_name}</div>
                          </div>
                        </div>
                        <button onClick={()=>setBackupPrograms(b=>b.filter((_,idx)=>idx!==i))}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {backupPrograms.length < 10 && (
                  <div>
                    {!showBackupSearch ? (
                      <button onClick={()=>setShowBackupSearch(true)}
                        className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                        <Plus className="w-4 h-4"/>Add Backup Program
                      </button>
                    ) : (
                      <div className="border-2 border-brand-200 rounded-2xl p-4 bg-brand-50">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-bold text-brand-700">Search & Add Backup Program</p>
                          <button onClick={()=>{ setShowBackupSearch(false); setBackupSearch(''); }} className="p-1 hover:bg-brand-100 rounded-lg text-brand-500"><X className="w-4 h-4"/></button>
                        </div>
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                          <input value={backupSearch} onChange={e=>setBackupSearch(e.target.value)} autoFocus
                            placeholder="Search programs to add as backup…"
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"/>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {backupResults.length === 0
                            ? <p className="text-xs text-slate-400 text-center py-3">No programs found</p>
                            : backupResults.map(p=>(
                                <button key={p.id} type="button"
                                  onClick={()=>{ setBackupPrograms(b=>[...b,p]); setBackupSearch(''); }}
                                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-brand-400 hover:bg-white transition-all text-left">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">{p.university_name} · {p.level} · {p.currency} {p.tuition_fee?Number(p.tuition_fee).toLocaleString():'—'}</div>
                                  </div>
                                  <Plus className="w-4 h-4 text-brand-500 shrink-0 ml-2"/>
                                </button>
                              ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 6: DOCUMENTS / WHAT TO EXPECT ── */}
            {step === 6 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Documents Required</h3>
                <p className="text-sm text-slate-600 mb-4">Review the following documents required to successfully complete this application.</p>
                <div className="flex justify-end gap-2 mb-3">
                  <button onClick={()=>setExpandAll(true)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">Expand all</button>
                  <button onClick={()=>setExpandAll(false)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">Collapse all</button>
                </div>
                {requiredDocs.map((doc, i) => (
                  <Accordion key={i} index={i+1} title={doc.name} badge={doc.type||null} defaultOpen={expandAll}>
                    <p className="text-sm text-slate-600">Upload a clear copy of your {doc.name.toLowerCase()}. Ensure the document is valid and legible.</p>
                  </Accordion>
                ))}
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mt-4">
                    <AlertCircle className="w-4 h-4 shrink-0"/>{error}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
            <button onClick={()=>router.back()} className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors">
              Cancel
            </button>
            <div className="flex gap-3">
              {step > 0 && (
                <button onClick={()=>setStep(s=>s-1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors">
                  <Back className="w-4 h-4"/>Previous
                </button>
              )}
              {step < STEP_LABELS.length - 1 ? (
                <button onClick={()=>setStep(s=>s+1)} disabled={!canNext()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  Next <ArrowRight className="w-4 h-4"/>
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting || !canNext()}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                  Create Application
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}