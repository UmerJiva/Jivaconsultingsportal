// components/ApplicationWizard.js
// Multi-step "New Application" wizard modal
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  X, Search, CheckCircle, XCircle, AlertTriangle, ChevronDown,
  ChevronUp, Plus, Trash2, AlertCircle, Loader2, ExternalLink,
  FileText, File, Calendar, ArrowRight, ArrowLeft, Check
} from 'lucide-react';
import { apiCall } from '../lib/useApi';

// ── Step names vary depending on program ────────────────────
const STEPS = ['Eligibility','Intakes','Prerequisites','Backups','What to Expect'];

// ── Progress stepper ────────────────────────────────────────
function Stepper({ step, total, labels }) {
  return (
    <div className="flex items-start justify-center gap-0 mb-6 px-2">
      {labels.map((label, i) => {
        const done    = i < step;
        const current = i === step;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 relative
                ${done    ? 'bg-emerald-600 border-emerald-600 text-white'
                : current ? 'bg-brand-600 border-brand-600 text-white'
                :            'bg-white border-slate-300 text-slate-400'}`}>
                {done
                  ? <Check className="w-4 h-4" strokeWidth={3}/>
                  : current
                    ? <ArrowRight className="w-3.5 h-3.5"/>
                    : <span className="w-2 h-2 rounded-full bg-slate-300"/>
                }
              </div>
              <span className={`text-xs mt-1.5 font-semibold whitespace-nowrap
                ${done ? 'text-emerald-600' : current ? 'text-brand-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`h-0.5 w-12 lg:w-20 -mt-4 transition-colors ${i < step ? 'bg-emerald-500' : 'bg-slate-200'}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Program/School/Student/Intake summary card ───────────────
function SummaryCard({ program, student, intake }) {
  const deadline = intake ? (() => {
    try {
      const d = new Date(intake + '-01');
      d.setDate(2);
      return d.toLocaleDateString('en-GB',{ year:'numeric', month:'short', day:'2-digit' }).replace(/ /g,' ');
    } catch { return null; }
  })() : null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-sm">
      <div className="space-y-1.5">
        <div className="grid grid-cols-[80px_1fr]">
          <span className="font-bold text-slate-700">Program</span>
          <span className="text-slate-700">{program?.name || '—'}</span>
        </div>
        <div className="grid grid-cols-[80px_1fr]">
          <span className="font-bold text-slate-700">School</span>
          <span className="text-slate-700">{program?.university_name || '—'}</span>
        </div>
        {student && (
          <div className="grid grid-cols-[80px_1fr]">
            <span className="font-bold text-slate-700">Student</span>
            <span className="text-slate-700">[{student.id}] {student.name} {student.email}</span>
          </div>
        )}
        {intake && (
          <>
            <div className="grid grid-cols-[80px_1fr_80px_1fr]">
              <span className="font-bold text-slate-700">Intake</span>
              <span className="text-slate-700">{intake}</span>
              {deadline && <><span className="font-bold text-slate-700">Deadline</span><span className="text-slate-700 flex items-center gap-1">{deadline} <AlertCircle className="w-3.5 h-3.5 text-slate-400"/></span></>}
            </div>
            <div className="flex items-center gap-1 text-amber-600 text-xs mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0"/>
              <span className="font-semibold">Important Intake Details</span>
              <button className="text-brand-600 hover:underline ml-1">Learn more</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Student searchable dropdown ──────────────────────────────
function StudentSearch({ students, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = students.filter(s =>
    !query || s.name?.toLowerCase().includes(query.toLowerCase()) ||
    s.email?.toLowerCase().includes(query.toLowerCase()) ||
    String(s.id).includes(query)
  );

  const selected = value ? students.find(s => s.id === value) : null;

  function select(s) { onChange(s.id, s); setQuery(''); setOpen(false); }
  function clear() { onChange(null, null); setQuery(''); }

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(o=>!o)}
        className="flex items-center gap-2 w-full border border-slate-300 rounded-xl px-3.5 py-2.5 cursor-pointer bg-white hover:border-brand-400 transition-colors">
        <Search className="w-4 h-4 text-slate-400 shrink-0"/>
        <input value={selected ? `[${selected.id}] ${selected.name} ${selected.email}` : query}
          onChange={e => { setQuery(e.target.value); onChange(null, null); setOpen(true); }}
          onClick={e => { e.stopPropagation(); setOpen(true); }}
          placeholder="Search student by name, ID or email…"
          className="flex-1 text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400"/>
        {selected
          ? <button type="button" onClick={e=>{e.stopPropagation();clear();}} className="p-0.5 hover:text-red-500 text-slate-400"><X className="w-4 h-4"/></button>
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0"/>
        }
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-52 overflow-y-auto">
          {filtered.length === 0
            ? <div className="px-4 py-3 text-sm text-slate-400 text-center">No students found</div>
            : filtered.map(s => (
                <button key={s.id} type="button" onClick={()=>select(s)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 text-left transition-colors">
                  <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(s.name||'?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800">[{s.id}] {s.name}</div>
                    <div className="text-xs text-slate-400 truncate">{s.email}</div>
                  </div>
                </button>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ── Collapsible accordion ────────────────────────────────────
function Accordion({ index, title, children, badge, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl mb-2 overflow-hidden">
      <button type="button" onClick={()=>setOpen(o=>!o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">{index}. {title}</span>
          {badge && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0"/> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0"/>}
      </button>
      {open && <div className="px-4 pb-4 border-t border-slate-100 pt-3 text-sm text-slate-700 leading-relaxed">{children}</div>}
    </div>
  );
}

// ── Backup Programs Step ─────────────────────────────────────
function BackupStep({ backupPrograms, setBackupPrograms, mainProgramId }) {
  const [search, setSearch]           = useState('');
  const [results, setResults]         = useState([]);
  const [searching, setSearching]     = useState(false);
  const [showSearch, setShowSearch]   = useState(false);
  const searchRef = useRef(null);

  // Load programs on search input
  useEffect(() => {
    if (!showSearch) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const q = new URLSearchParams({ limit: 20 });
        if (search) q.set('search', search);
        const data = await fetch(`/api/programs?${q}`).then(r=>r.json());
        // Exclude main program + already added backups
        const already = new Set([mainProgramId, ...backupPrograms.map(b=>b.id)]);
        setResults((data.programs||[]).filter(p => !already.has(p.id)));
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, showSearch, backupPrograms, mainProgramId]);

  // Load initial results when search opens
  useEffect(() => {
    if (showSearch) setSearch('');
  }, [showSearch]);

  function addBackup(prog) {
    setBackupPrograms(b => [...b, { id: prog.id, name: prog.name, university_name: prog.university_name, level: prog.level }]);
    setSearch('');
  }

  return (
    <div>
      <p className="text-sm text-slate-600 mb-1">Choose up to 10 backup programs in order of preference. These will be considered if your main program is not available.</p>
      <p className="text-sm font-bold text-slate-800 mb-3">Backup Programs ({backupPrograms.length}/10)</p>

      {/* Added backups list */}
      {backupPrograms.length === 0 ? (
        <div className="border border-slate-200 rounded-xl px-4 py-6 text-center text-sm text-slate-400 bg-slate-50 mb-3">
          No backup programs added yet. Search and add programs below.
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          {backupPrograms.map((bp, i) => (
            <div key={bp.id||i} className="flex items-center justify-between bg-white border border-slate-200 hover:border-brand-200 rounded-xl px-4 py-3 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs shrink-0">{i+1}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{bp.name}</div>
                  {bp.university_name && <div className="text-xs text-slate-400">{bp.university_name}{bp.level ? ` · ${bp.level}` : ''}</div>}
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

      {/* Search panel */}
      {backupPrograms.length < 10 && (
        !showSearch ? (
          <button onClick={()=>setShowSearch(true)}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
            <Plus className="w-4 h-4"/>Add Backup Program
          </button>
        ) : (
          <div className="border-2 border-brand-200 rounded-2xl bg-brand-50 overflow-hidden">
            {/* Search header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-100">
              <p className="text-sm font-bold text-brand-700">Search Programs</p>
              <button onClick={()=>setShowSearch(false)} className="p-1 rounded-lg hover:bg-brand-100 text-brand-500 transition-colors">
                <X className="w-4 h-4"/>
              </button>
            </div>
            {/* Search input */}
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input
                  ref={searchRef}
                  autoFocus
                  value={search}
                  onChange={e=>setSearch(e.target.value)}
                  placeholder="Search by program name or university…"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>
            {/* Results */}
            <div className="px-4 pb-4 max-h-56 overflow-y-auto space-y-2">
              {searching ? (
                <div className="flex items-center justify-center py-4 text-slate-400 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin"/>Searching…
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-sm">
                  {search ? 'No programs found' : 'Type to search programs'}
                </div>
              ) : results.map(p => (
                <button key={p.id} type="button" onClick={()=>{ addBackup(p); setShowSearch(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl transition-all text-left group">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{p.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {p.university_name}
                      {p.level && <span className="ml-2 text-brand-600 font-medium">{p.level}</span>}
                      {p.tuition_fee && <span className="ml-2">{p.currency} {Number(p.tuition_fee).toLocaleString()}</span>}
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-brand-500 shrink-0 ml-2 group-hover:scale-110 transition-transform"/>
                </button>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ── Main Wizard ──────────────────────────────────────────────
export default function ApplicationWizard({ open, onClose, program, userRole, currentUserId, preselectedStudentId, preselectedStudent }) {
  const router = useRouter();
  const [step, setStep]         = useState(0);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudent, setSelectedStudent]       = useState(null);
  const [eligibility, setEligibility]               = useState(null);
  const [checkingElig, setCheckingElig]             = useState(false);
  const [selectedIntake, setSelectedIntake]         = useState('');
  const [expandAll, setExpandAll]                   = useState(true);
  const [backupPrograms, setBackupPrograms]         = useState([]);
  const [submitting, setSubmitting]                 = useState(false);
  const [done, setDone]                             = useState(null);
  const [error, setError]                           = useState('');

  const intakes = program?.available_intakes ? program.available_intakes.split(',').filter(Boolean) : [];

  const prerequisites = program?.prerequisites
    ? (Array.isArray(program.prerequisites) ? program.prerequisites : (() => { try { return JSON.parse(program.prerequisites); } catch { return []; } })())
    : [
        { title:'Country Specific GPA - Pakistan', body:'For applicants educated in Pakistan, this program requires: Bachelor\'s degree from Pakistan studied over 4-5 years or Bachelor of Law with minimum Grade Point Average (GPA) 55% from a recognized academic institute.' },
        { title:'English Test Validity', body:'The English test must be valid at the start date of the desired program.' },
        { title:'Overqualified Degree', body:'The program does not accept applicants already holding a master\'s degree in a related subject area.' },
        { title:'Non-Standard Qualification', body:'If a program requires post-secondary qualification, the non-standard qualification mentioned below are NOT accepted: QUALIFI - qualifications awarded by Ofqual Recognized Awarding Organization.' },
        { title:'Credibility Interview', body:'Some applicants may be required to attend a credibility interview before a decision is made on their application.' },
      ];

  const requiredDocs = program?.required_documents
    ? (Array.isArray(program.required_documents) ? program.required_documents : (() => { try { return JSON.parse(program.required_documents); } catch { return []; } })())
    : [
        { name:'Copy of Education Transcripts', type:'Document' },
        { name:'Copy of Education Certificate', type:'Document' },
        { name:'Passport Copy', type:'' },
        { name:'English Language Proficiency Test', type:'' },
        { name:'Resume', type:'' },
        { name:'Hybrid Immigration History', type:'' },
        { name:'Study Gap Explanation', type:'' },
      ];

  // Step labels — only show Intakes if there are multiple intakes
  const STEP_LABELS = intakes.length > 1
    ? ['Eligibility','Intakes','Prerequisites','Backups','What to Expect']
    : ['Eligibility','Prerequisites','Backups','What to Expect'];

  const totalSteps = STEP_LABELS.length;

  // Map logical step to UI step index
  const hasIntakesStep = intakes.length > 1;

  // Logical steps: 0=Eligibility,1=Intakes(optional),2=Prerequisites,3=Backups,4=WhatToExpect
  function nextStep() { setStep(s => Math.min(s+1, totalSteps-1)); setError(''); }
  function prevStep() { setStep(s => Math.max(s-1, 0)); setError(''); }

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(0); setSelectedStudentId(null); setSelectedStudent(null);
      setEligibility(null); setSelectedIntake(''); setBackupPrograms([]);
      setDone(null); setError('');
      // If student role — auto-select self
      if (preselectedStudentId) { setSelectedStudentId(preselectedStudentId); setSelectedStudent(preselectedStudent); } else if (userRole === 'student' && currentUserId) {
        setSelectedStudentId(currentUserId);
      }
    }
  }, [open]);

  // Load students for agent/admin
  useEffect(() => {
    if (!open || userRole === 'student') return;
    fetch('/api/students?limit=200').then(r=>r.json()).then(d => {
      setStudents((d.students||[]).map(s => ({
        id: s.id,
        name: s.full_name || `${s.first_name||''} ${s.last_name||''}`.trim() || 'Unknown',
        email: s.email,
      })));
    }).catch(() => {});
  }, [open, userRole]);

  // Check eligibility when student changes
  useEffect(() => {
    if (!selectedStudentId || !program?.id) { setEligibility(null); return; }
    setCheckingElig(true); setEligibility(null);
    fetch(`/api/applications/check-eligibility?program_id=${program.id}&student_id=${selectedStudentId}`)
      .then(r=>r.json()).then(d => { setEligibility(d); setCheckingElig(false); })
      .catch(() => { setCheckingElig(false); });
  }, [selectedStudentId, program?.id]);

  async function handleSubmit() {
    setSubmitting(true); setError('');
    try {
      const result = await apiCall('/api/applications', 'POST', {
        student_id: selectedStudentId,
        program_id: program.id,
        university_id: program.university_id,
        intake: selectedIntake || intakes[0] || null,
        backup_programs: backupPrograms,
      });
      setDone(result);
    } catch(e) {
      setError(e.message || 'Failed to submit application');
    } finally { setSubmitting(false); }
  }

  function canProceed() {
    if (step === 0) {
      if (!selectedStudentId) return false;
      if (!eligibility) return false;
      if (eligibility.status === 'not_eligible') return false;
      if (eligibility.status === 'already_applied') return false;
      return true;
    }
    if (hasIntakesStep && step === 1) return !!selectedIntake;
    return true;
  }

  if (!open) return null;

  // ── Success screen ──
  if (done) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center" onClick={e=>e.stopPropagation()}>
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9 text-emerald-600"/>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Application Submitted!</h2>
        <p className="text-slate-500 text-sm mb-1">Application ID: <span className="font-bold text-brand-600">#{done.app_code}</span></p>
        <p className="text-slate-500 text-sm mb-6">Your application has been successfully submitted and is now under review.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">Close</button>
          <button onClick={()=>{ onClose(); router.push('/agent/applications'); }}
            className="flex-1 py-2.5 rounded-xl bg-brand-700 text-white font-bold text-sm hover:bg-brand-800 transition-colors flex items-center justify-center gap-2">
            View Applications <ExternalLink className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{maxHeight:'90vh'}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">New Application</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-5 h-5"/></button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Stepper */}
          <Stepper step={step} total={totalSteps} labels={STEP_LABELS}/>

          {/* Summary card (visible from step 1 onward) */}
          {step > 0 && (
            <SummaryCard program={program} student={selectedStudent} intake={hasIntakesStep && step > 1 ? selectedIntake : (intakes[0]||null)}/>
          )}

          {/* ── STEP 0: ELIGIBILITY ── */}
          {step === 0 && (
            <div>
              {/* Program info card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-sm space-y-1.5">
                <div className="grid grid-cols-[80px_1fr]">
                  <span className="font-bold text-slate-700">Program</span>
                  <span className="text-slate-700">{program?.name}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr]">
                  <span className="font-bold text-slate-700">School</span>
                  <span className="text-slate-700">{program?.university_name}</span>
                </div>
              </div>

              <p className="text-sm font-semibold text-slate-700 mb-2">
                Please select a student to check their eligibility for this program:
              </p>

              {userRole === 'student' ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600">
                  Checking your eligibility…
                </div>
              ) : (
                <StudentSearch
                  students={students}
                  value={selectedStudentId}
                  onChange={(id, s) => { setSelectedStudentId(id); setSelectedStudent(s); }}
                />
              )}

              {/* Eligibility result */}
              <div className="mt-4">
                {checkingElig && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-500"/>Checking eligibility…
                  </div>
                )}

                {/* Already applied */}
                {eligibility?.status === 'already_applied' && (
                  <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 shrink-0"/>
                      Student already has an application to this program.
                    </div>
                    <button onClick={()=>router.push(`/agent/applications`)}
                      className="text-sm font-bold text-red-600 hover:text-red-800 whitespace-nowrap ml-3">
                      Open application
                    </button>
                  </div>
                )}

                {/* Not eligible */}
                {eligibility?.status === 'not_eligible' && (
                  <div className="flex items-start justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 gap-3">
                    <div className="flex-1">
                      <div className="flex items-start gap-2 text-sm text-red-700 font-semibold mb-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>
                        {eligibility.message}
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-600 ml-1">
                        {eligibility.issues?.map((issue,i) => <li key={i}>{issue}</li>)}
                      </ul>
                      <p className="text-xs text-red-500 mt-2">If this information is incorrect, please update the student's profile data in order to apply.</p>
                    </div>
                    <button className="text-sm font-bold text-red-600 hover:text-red-800 whitespace-nowrap border border-red-200 rounded-xl px-3 py-1.5 hover:bg-red-100 transition-colors shrink-0">
                      Update profile data
                    </button>
                  </div>
                )}

                {/* Conditional */}
                {eligibility?.status === 'conditional' && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0"/>
                    <span className="text-sm text-emerald-700 font-semibold">{eligibility.message}</span>
                  </div>
                )}

                {/* Fully eligible */}
                {eligibility?.status === 'eligible' && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0"/>
                    <span className="text-sm text-emerald-700 font-semibold">Student is eligible for this program.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 1: INTAKES (if multiple) ── */}
          {hasIntakesStep && step === 1 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Select the academic intake:</p>
              <select value={selectedIntake} onChange={e=>setSelectedIntake(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700">
                <option value="">Select</option>
                {intakes.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              {!selectedIntake && <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/>Please select an intake to continue.</p>}
            </div>
          )}

          {/* ── PREREQUISITES STEP ── */}
          {step === (hasIntakesStep ? 2 : 1) && (
            <div>
              {/* Warning banner */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/>
                <p className="text-sm text-amber-700">Please review the following carefully. If the student does not meet these prerequisites the application will be cancelled.</p>
              </div>
              <div className="flex justify-end gap-2 mb-3">
                <button onClick={()=>setExpandAll(true)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">Expand all</button>
                <button onClick={()=>setExpandAll(false)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">Collapse all</button>
              </div>
              {prerequisites.map((prereq, i) => (
                <Accordion key={i} index={i+1} title={prereq.title} defaultOpen={expandAll}>
                  <div dangerouslySetInnerHTML={{__html: prereq.body?.replace(/Pakistan/g,'<mark class="bg-yellow-200 rounded px-0.5">Pakistan</mark>') || prereq.body}}/>
                  {prereq.body && <button className="text-xs text-brand-600 mt-2 hover:underline">*… See more</button>}
                </Accordion>
              ))}
            </div>
          )}

          {/* ── BACKUPS STEP ── */}
          {step === (hasIntakesStep ? 3 : 2) && (
            <BackupStep
              backupPrograms={backupPrograms}
              setBackupPrograms={setBackupPrograms}
              mainProgramId={program?.id}
            />
          )}

          {/* ── WHAT TO EXPECT STEP ── */}
          {step === (hasIntakesStep ? 4 : 3) && (
            <div>
              <p className="text-sm text-slate-600 mb-4">Please carefully review the following. You will need to meet these requirements to successfully submit the application.</p>
              <div className="flex justify-end gap-2 mb-3">
                <button onClick={()=>setExpandAll(true)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">Expand all</button>
                <button onClick={()=>setExpandAll(false)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">Collapse all</button>
              </div>
              {requiredDocs.map((doc, i) => (
                <Accordion key={i} index={i+1} title={doc.name} badge={doc.type||null} defaultOpen={expandAll}>
                  <p className="text-sm text-slate-600">Upload a clear copy of your {doc.name.toLowerCase()}. Ensure the document is valid and readable.</p>
                </Accordion>
              ))}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mt-3">
                  <AlertCircle className="w-4 h-4 shrink-0"/>{error}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0 rounded-b-2xl gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors">Cancel</button>
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors">
                <ArrowLeft className="w-4 h-4"/>Previous
              </button>
            )}
            {step < totalSteps - 1 ? (
              <button onClick={nextStep} disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Next <ArrowRight className="w-4 h-4"/>
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-60">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                Create application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}