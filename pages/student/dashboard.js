// pages/student/dashboard.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { ChevronDown, ChevronUp, ArrowRight, CheckCircle, Lock } from 'lucide-react';

const PROGRESS_STEPS = [
  { id:1, label:'Complete profile', emoji:'📋' },
  { id:2, label:'Start applying',   emoji:'✏️'  },
  { id:3, label:'Review & submit',  emoji:'🔍' },
  { id:4, label:'Get your results', emoji:'💻' },
  { id:5, label:'Apply for visa',   emoji:'🛂' },
  { id:6, label:'Enrol & settle',   emoji:'🎓' },
];

function Section({ title, defaultOpen=false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4 shadow-sm">
      <button onClick={() => setOpen(o=>!o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
        <span className="font-bold text-slate-800 text-base">{title}</span>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      {open && <div className="px-6 pb-6 border-t border-slate-100 pt-4">{children}</div>}
    </div>
  );
}

export default function StudentDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const currentStep         = 1;

  useEffect(() => {
    fetch('/api/dashboard/stats').then(r=>r.json()).then(setData).finally(()=>setLoading(false));
  }, []);

  const profile = data?.profile || {};
  const apps    = data?.apps    || [];

  const filled = [profile.name, profile.phone, profile.country_name, profile.gpa, profile.ielts_score, profile.target_program].filter(Boolean).length;
  const completePct = Math.round((filled / 6) * 100);

  const CHECKLIST = [
    { label:'Personal Information', href:'/student/profile?section=personal',  done: !!profile.name },
    { label:'Address Details',      href:'/student/profile?section=address',   done: !!profile.phone },
    { label:'Education History',    href:'/student/profile?section=education', done: !!profile.gpa },
    { label:'Test Scores',          href:'/student/profile?section=tests',     done: !!profile.ielts_score },
    { label:'Visa & Study Permit',  href:'/student/profile?section=visa',      done: false },
  ];

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="text-5xl select-none">🗺️</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>My Progress</h1>
            <p className="text-slate-500 text-sm mt-0.5">Hi {profile.name?.split(' ')[0] || 'there'}, track your journey to studying abroad</p>
          </div>
        </div>

        {/* Progress tracker */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="relative">
            <div className="absolute top-7 left-8 right-8 h-0.5 bg-slate-200 z-0" />
            <div className="absolute top-7 left-8 h-0.5 bg-brand-500 z-0 transition-all duration-700"
              style={{width:`${((currentStep-1)/(PROGRESS_STEPS.length-1))*86}%`}} />
            <div className="relative z-10 grid grid-cols-6 gap-1">
              {PROGRESS_STEPS.map(step => {
                const done   = step.id < currentStep;
                const active = step.id === currentStep;
                const locked = step.id > currentStep;
                return (
                  <div key={step.id} className="flex flex-col items-center gap-1.5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all
                      ${done   ? 'bg-brand-50 border-brand-400' : ''}
                      ${active ? 'bg-brand-600 border-brand-600 shadow-lg shadow-brand-200' : ''}
                      ${locked ? 'bg-slate-50 border-slate-200' : ''}`}>
                      {done
                        ? <CheckCircle className="w-6 h-6 text-brand-500" />
                        : <span className={locked ? 'grayscale opacity-40' : ''}>{step.emoji}</span>}
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight px-1
                      ${active ? 'text-brand-700' : locked ? 'text-slate-400' : 'text-slate-600'}`}>
                      {step.label}
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                      ${done ? 'bg-brand-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {step.id}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Before Applying */}
        <Section title="Before Applying" defaultOpen={true}>
          <p className="text-slate-500 text-sm mb-5">Complete your profile before starting your application.</p>

          {/* Progress bar */}
          <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Profile Completion</span>
              <span className="text-sm font-bold text-brand-600">{completePct}%</span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
                style={{width:`${completePct}%`}} />
            </div>
            {completePct < 100 && <p className="text-xs text-slate-400 mt-2">Complete all sections to unlock your applications</p>}
          </div>

          {/* Checklist */}
          <div className="space-y-2 mb-6">
            {CHECKLIST.map(item => (
              <Link key={item.label} href={item.href}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                  ${item.done ? 'bg-brand-500 border-brand-500' : 'border-slate-300 group-hover:border-brand-400'}`}>
                  {item.done && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm font-medium flex-1 ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {item.label}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
              </Link>
            ))}
          </div>

          <Link href="/student/profile"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-7 py-3 rounded-xl transition-colors shadow-sm">
            Complete Profile <ArrowRight className="w-4 h-4" />
          </Link>
        </Section>

        {/* Start Applying */}
        <Section title="Start Applying" defaultOpen={false}>
          <p className="text-slate-500 text-sm mb-5">Find programs and submit your applications.</p>
          <div className="mb-4">
            <Link href="/student/onboarding"
              className="inline-flex items-center gap-2 border-2 border-brand-500 text-brand-600 hover:bg-brand-50 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
              Find A Program <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {['Finalize Your Application','Review and Submission','Get Result','Finalize Visa & Admission','Ready to Enroll','Enrollment Confirmed'].map(label => (
              <div key={label} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-sm font-medium">
                <Lock className="w-4 h-4 shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </Section>

        {/* Review & Submit */}
        <Section title="Review & Submit">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <Lock className="w-5 h-5 text-slate-400 shrink-0" />
            <p className="text-sm text-slate-500">Complete your profile and submit an application first.</p>
          </div>
        </Section>

        {/* Get Your Results */}
        <Section title="Get Your Results">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <Lock className="w-5 h-5 text-slate-400 shrink-0" />
            <p className="text-sm text-slate-500">This section unlocks once your application is submitted.</p>
          </div>
        </Section>

        {/* My Applications */}
        {apps.length > 0 && (
          <Section title={`My Applications (${apps.length})`} defaultOpen={true}>
            <div className="space-y-3">
              {apps.map((app,i) => {
                const colors = {
                  'Offer Received':'bg-blue-50 text-blue-700 border-blue-200',
                  'Accepted':'bg-emerald-50 text-emerald-700 border-emerald-200',
                  'Under Review':'bg-amber-50 text-amber-700 border-amber-200',
                  'Conditional':'bg-purple-50 text-purple-700 border-purple-200',
                  'Rejected':'bg-red-50 text-red-600 border-red-200',
                };
                const cls = colors[app.status] || 'bg-slate-50 text-slate-600 border-slate-200';
                return (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-brand-200 hover:bg-brand-50/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {app.university_name?.[0]||'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 text-sm truncate">{app.university_name}</div>
                      <div className="text-xs text-slate-500 truncate">{app.program_name||'—'} · {app.intake||'—'}</div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border shrink-0 ${cls}`}>{app.status}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

      </div>
    </StudentLayout>
  );
}