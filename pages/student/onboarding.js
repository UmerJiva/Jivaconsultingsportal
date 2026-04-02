// pages/student/onboarding.js — Student preference wizard (premium UI)
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft, X, Check, Search, ChevronDown, ChevronUp,
  Loader2, Sparkles, CheckCircle, Globe2, GraduationCap,
  BookOpen, DollarSign, Calendar, MapPin
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const POPULAR_MONTHS = ['September','January'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR+1, CURRENT_YEAR+2];

function generateStartDates() {
  const now = new Date();
  const result = {};
  YEARS.forEach(yr => {
    result[yr] = MONTHS.filter(m => new Date(yr, MONTHS.indexOf(m), 1) >= now);
  });
  return result;
}

// Step metadata
const STEPS_META = [
  { label:'Preferences', title:'Which countries do you want to study in?',           icon:Globe2,        color:'from-blue-600 to-cyan-500',     bg:'from-blue-50 to-cyan-50'   },
  { label:'Preferences', title:'Which levels of education are you applying for?',    icon:GraduationCap, color:'from-violet-600 to-purple-500',  bg:'from-violet-50 to-purple-50' },
  { label:'Preferences', title:'What would you like to study?',                       icon:BookOpen,      color:'from-sky-600 to-blue-500',       bg:'from-sky-50 to-blue-50'    },
  { label:'Preferences', title:"What's your estimated yearly tuition budget?",       icon:DollarSign,    color:'from-emerald-600 to-teal-500',   bg:'from-emerald-50 to-teal-50' },
  { label:'Preferences', title:'When do you want to start your studies?',            icon:Calendar,      color:'from-amber-500 to-orange-500',   bg:'from-amber-50 to-orange-50' },
  { label:'Background',  title:'What is your nationality?',                           icon:MapPin,        color:'from-rose-600 to-pink-500',      bg:'from-rose-50 to-pink-50'   },
];

const TOTAL_STEPS = STEPS_META.length;

// Subtle SVG world map pattern for background
const WORLD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" opacity="0.06">
  <path d="M200,150 Q220,130 250,140 Q280,130 300,150 Q290,170 260,175 Q230,170 200,150Z" fill="currentColor"/>
  <path d="M100,200 Q150,180 200,190 Q220,210 190,230 Q150,240 110,220Z" fill="currentColor"/>
  <path d="M350,100 Q400,80 450,90 Q480,110 460,140 Q420,150 380,130Z" fill="currentColor"/>
  <path d="M500,120 Q560,100 620,115 Q660,135 640,165 Q590,180 540,160Z" fill="currentColor"/>
  <path d="M700,80 Q780,60 840,80 Q880,105 850,140 Q800,155 750,135 Q710,115 700,80Z" fill="currentColor"/>
  <path d="M300,250 Q380,240 420,270 Q440,300 400,320 Q350,330 310,300Z" fill="currentColor"/>
  <path d="M480,200 Q540,185 580,210 Q600,240 570,260 Q520,270 490,240Z" fill="currentColor"/>
  <path d="M650,170 Q720,155 770,180 Q800,210 770,240 Q720,250 680,220Z" fill="currentColor"/>
  <path d="M850,150 Q920,130 970,155 Q1000,180 970,210 Q920,220 880,195Z" fill="currentColor"/>
  <path d="M1050,120 Q1110,100 1160,130 Q1180,155 1150,175 Q1100,185 1060,160Z" fill="currentColor"/>
  <path d="M150,350 Q200,330 250,345 Q280,370 250,395 Q200,405 160,380Z" fill="currentColor"/>
  <path d="M400,380 Q460,360 510,380 Q540,405 510,430 Q460,440 420,415Z" fill="currentColor"/>
  <path d="M600,330 Q660,310 720,335 Q760,360 730,390 Q670,400 630,370Z" fill="currentColor"/>
  <path d="M850,300 Q910,285 960,305 Q990,330 960,355 Q910,365 870,340Z" fill="currentColor"/>
  <path d="M1100,280 Q1150,260 1190,285 Q1200,310 1170,330 Q1130,340 1105,315Z" fill="currentColor"/>
</svg>`;

export default function StudentOnboarding() {
  const router = useRouter();
  const [step, setStep]         = useState(0);
  const [options, setOptions]   = useState({});
  const [countries, setCountries] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone]         = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);

  const [studyCountries, setStudyCountries] = useState([]);
  const [eduLevels, setEduLevels]           = useState([]);
  const [fields, setFields]                 = useState([]);
  const [budget, setBudget]                 = useState('');
  const [startDates, setStartDates]         = useState([]);
  const [nationality, setNationality]       = useState('');
  const [natQuery, setNatQuery]             = useState('');
  const [natOpen, setNatOpen]               = useState(false);
  const natRef = useRef(null);
  const startDateMap = generateStartDates();
  const meta = STEPS_META[step] || STEPS_META[0];
  const pct = Math.round((step / TOTAL_STEPS) * 100);

  useEffect(() => {
    fetch('/api/preferences').then(r => r.json()).then(d => {
      const grouped = {};
      (d.options || []).forEach(o => {
        if (!grouped[o.question_key]) grouped[o.question_key] = [];
        grouped[o.question_key].push(o);
      });
      setOptions(grouped);
    });
    fetch('/api/countries').then(r => r.json()).then(d => setCountries(d.countries || []));
  }, []);

  useEffect(() => {
    function h(e) { if (natRef.current && !natRef.current.contains(e.target)) setNatOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function toggleArr(setArr, val) {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  function selectAllYear(yr) {
    const yearDates = startDateMap[yr].map(m => `${m} ${yr}`);
    const allSel = yearDates.every(d => startDates.includes(d));
    setStartDates(prev => allSel ? prev.filter(d => !yearDates.includes(d)) : [...new Set([...prev, ...yearDates])]);
  }

  const ANALYZE_STEPS = ['Matching countries & levels','Filtering by field of study','Checking available intakes','Calculating best matches'];

  async function finish() {
    setAnalyzing(true);
    setAnalyzeStep(0);
    try {
      await fetch('/api/preferences', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_countries:studyCountries, edu_levels:eduLevels, fields_of_study:fields, budget, start_dates:startDates, nationality_id:countries.find(c=>c.name===nationality)?.id||null, completed:1 })
      });
      for (let i = 0; i < ANALYZE_STEPS.length; i++) {
        await new Promise(r => setTimeout(r, 550));
        setAnalyzeStep(i + 1);
      }
      await new Promise(r => setTimeout(r, 600));
      setDone(true);
      await new Promise(r => setTimeout(r, 900));
      const params = new URLSearchParams();
      if (studyCountries.length) params.set('countries', studyCountries.join(','));
      if (eduLevels.length) params.set('levels', eduLevels.join(','));
      if (fields.length) params.set('fields', fields.join(','));
      if (budget) params.set('budget', budget);
      if (startDates.length) params.set('intakes', startDates.join(','));
      router.push(`/student/programs?${params.toString()}`);
    } catch { setAnalyzing(false); }
  }

  const countryOpts = options['study_countries'] || [];
  const levelOpts   = options['edu_levels'] || [];
  const fieldOpts   = options['fields_of_study'] || [];
  const budgetOpts  = options['budget'] || [];
  const filteredNat = natQuery ? countries.filter(c => c.name.toLowerCase().includes(natQuery.toLowerCase())) : countries;
  const popularDates = YEARS.flatMap(yr => POPULAR_MONTHS.filter(m => startDateMap[yr]?.includes(m)).map(m=>`${m} ${yr}`)).slice(0,4);

  // ── Analyzing / Done ──────────────────────────────────────────
  if (analyzing || done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{background:'linear-gradient(135deg,#1e1b4b 0%,#312e81 30%,#1e40af 60%,#0369a1 100%)'}}>
        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"/>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1s'}}/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl"/>
        </div>
        <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-10 text-center border border-white/20">
          {done ? (
            <>
              <div className="w-24 h-24 bg-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-400/30">
                <CheckCircle className="w-12 h-12 text-emerald-400"/>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">All done!</h2>
              <p className="text-blue-200 text-sm">Taking you to your matched programs…</p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-white/20">
                <Sparkles className="w-12 h-12 text-yellow-300 animate-pulse"/>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Analysing your preferences…</h2>
              <p className="text-blue-200 text-sm mb-8">Finding programs that match your goals</p>
              <div className="space-y-3 text-left">
                {ANALYZE_STEPS.map((t, i) => (
                  <div key={t} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${i < analyzeStep ? 'bg-white/15' : 'opacity-40'}`}>
                    {i < analyzeStep
                      ? <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-white" strokeWidth={3}/></div>
                      : i === analyzeStep
                        ? <Loader2 className="w-6 h-6 text-yellow-300 animate-spin shrink-0"/>
                        : <div className="w-6 h-6 rounded-full border-2 border-white/30 shrink-0"/>
                    }
                    <span className={`text-sm font-medium ${i < analyzeStep ? 'text-emerald-300' : 'text-white/70'}`}>{t}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{background:'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)'}}>

      {/* ── LEFT PANEL: Decorative ── */}
      <div className={`hidden lg:flex lg:w-2/5 xl:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br ${meta.color}`}>
        {/* World map SVG */}
        <div className="absolute inset-0 text-white" dangerouslySetInnerHTML={{__html:WORLD_SVG}}/>
        {/* Large blurred circle */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"/>
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"/>

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <GraduationCap className="w-6 h-6 text-white"/>
            </div>
            <span className="text-white font-bold text-lg" style={{fontFamily:'Georgia,serif'}}>EduPortal</span>
          </div>
        </div>

        {/* Middle: Step illustration */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-12">
          <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 border border-white/30 shadow-xl">
            <meta.icon className="w-14 h-14 text-white"/>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-3 leading-snug">{meta.title}</h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              {step === 0 && "Tell us where you'd like to study and we'll show you the best programs available in those countries."}
              {step === 1 && "We'll match you with programs at exactly the right academic level for your goals."}
              {step === 2 && "Pick the subjects you're passionate about to discover programs tailored to your interests."}
              {step === 3 && "Set your budget so we only show programs that are financially accessible for you."}
              {step === 4 && "Choose when you want to begin your studies so we can show available intakes."}
              {step === 5 && "Your nationality helps us show relevant visa requirements and scholarship eligibility."}
            </p>
          </div>
        </div>

        {/* Bottom: Step indicators */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            {STEPS_META.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${i === step ? 'w-8 h-2.5 bg-white' : i < step ? 'w-2.5 h-2.5 bg-white/60' : 'w-2.5 h-2.5 bg-white/25'}`}/>
            ))}
          </div>
          <p className="text-white/50 text-xs mt-2">Step {step+1} of {TOTAL_STEPS}</p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Form ── */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-900 lg:bg-white">

        {/* Mobile header (only visible on mobile) */}
        <div className="lg:hidden bg-slate-900 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            {step > 0
              ? <button onClick={() => setStep(s => s-1)} className="p-2 rounded-full bg-white/10 text-white transition-colors"><ArrowLeft className="w-4 h-4"/></button>
              : <div className="w-8"/>
            }
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">{meta.label}</span>
            <button onClick={() => router.push('/student/dashboard')} className="p-2 rounded-full bg-white/10 text-white/60 transition-colors"><X className="w-4 h-4"/></button>
          </div>
          {/* Mobile progress */}
          <div className="flex items-center gap-2 mb-1">
            {STEPS_META.map((_, i) => (
              <div key={i} className={`rounded-full transition-all ${i === step ? 'flex-1 h-1.5 bg-white' : i < step ? 'w-6 h-1.5 bg-white/60' : 'w-6 h-1.5 bg-white/20'}`}/>
            ))}
          </div>
          <p className="text-white/40 text-[11px]">{pct}% complete</p>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:flex items-center justify-between px-10 py-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {step > 0
              ? <button onClick={() => setStep(s => s-1)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"><ArrowLeft className="w-4 h-4"/></button>
              : <div className="w-10"/>
            }
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{meta.label}</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{width:`${pct}%`}}/>
                </div>
                <span className="text-xs font-bold text-slate-500">{pct}%</span>
              </div>
            </div>
          </div>
          <button onClick={() => router.push('/student/dashboard')} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-5 h-5"/></button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto px-6 lg:px-8 py-8 lg:py-10">

            {/* ── STEP 0: COUNTRIES ── */}
            {step === 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white lg:text-slate-800 mb-6">{meta.title}</h2>
                <div className="grid grid-cols-1 gap-2">
                  {countryOpts.map(o => (
                    <StyledCheck key={o.option_value} label={o.option_label}
                      checked={studyCountries.includes(o.option_value)}
                      onChange={() => toggleArr(setStudyCountries, o.option_value)}/>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 1: EDUCATION LEVELS ── */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-white lg:text-slate-800 mb-6">{meta.title}</h2>
                <div className="grid grid-cols-1 gap-2">
                  {levelOpts.map(o => (
                    <StyledCheck key={o.option_value} label={o.option_label}
                      checked={eduLevels.includes(o.option_value)}
                      onChange={() => toggleArr(setEduLevels, o.option_value)}/>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 2: FIELDS ── */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-white lg:text-slate-800 mb-2">{meta.title}</h2>
                <p className="text-slate-400 lg:text-slate-500 text-sm mb-4">Search programs</p>
                <FieldsDropdown options={fieldOpts} selected={fields} onToggle={v => toggleArr(setFields, v)}/>
              </div>
            )}

            {/* ── STEP 3: BUDGET ── */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-white lg:text-slate-800 mb-6">{meta.title}</h2>
                <div className="grid grid-cols-1 gap-2.5">
                  {budgetOpts.map(o => (
                    <StyledRadio key={o.option_value} label={o.option_label}
                      checked={budget === o.option_value}
                      onChange={() => setBudget(o.option_value)}/>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: START DATES ── */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-white lg:text-slate-800 mb-5">{meta.title}</h2>
                {popularDates.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Popular</p>
                    <div className="flex flex-wrap gap-2">
                      {popularDates.map(d => (
                        <button key={d} onClick={() => setStartDates(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev,d])}
                          className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all
                            ${startDates.includes(d) ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25' : 'border-slate-300 text-slate-600 hover:border-blue-400 bg-white'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {YEARS.map(yr => <YearSection key={yr} year={yr} months={startDateMap[yr]||[]} selected={startDates} onToggle={d => setStartDates(p => p.includes(d)?p.filter(x=>x!==d):[...p,d])} onSelectAll={()=>selectAllYear(yr)}/>)}
                </div>
              </div>
            )}

            {/* ── STEP 5: NATIONALITY ── */}
            {step === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-white lg:text-slate-800 mb-5">{meta.title}</h2>
                <div ref={natRef} className="relative">
                  <div className={`flex items-center gap-3 border-2 rounded-2xl px-4 py-3.5 transition-all bg-white shadow-sm ${natOpen ? 'border-blue-500 shadow-blue-100' : 'border-slate-200 hover:border-slate-300'}`}>
                    <Search className="w-4 h-4 text-slate-400 shrink-0"/>
                    <input value={nationality && !natOpen ? nationality : natQuery}
                      onChange={e => { setNatQuery(e.target.value); setNationality(''); }}
                      onFocus={() => setNatOpen(true)}
                      placeholder="Type a country…"
                      className="flex-1 text-sm outline-none text-slate-700 placeholder-slate-400 bg-transparent"/>
                    <button onClick={() => setNatOpen(o => !o)} className="text-slate-400">
                      {natOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                    </button>
                  </div>
                  {natOpen && (
                    <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto">
                      {!natQuery && (
                        <>
                          <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Popular</div>
                          {['Pakistan','India','Bangladesh','Nigeria','Iran'].map(name => {
                            const c = countries.find(x => x.name === name);
                            if (!c) return null;
                            return (
                              <button key={c.id} onClick={() => { setNationality(c.name); setNatQuery(''); setNatOpen(false); }}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm flex items-center gap-2.5 border-b border-slate-50 font-medium text-slate-700 transition-colors">
                                <span className="text-base">{c.flag}</span>{c.name}
                              </button>
                            );
                          })}
                          <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100">All Countries</div>
                        </>
                      )}
                      {filteredNat.map(c => (
                        <button key={c.id} onClick={() => { setNationality(c.name); setNatQuery(''); setNatOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm flex items-center gap-2.5 border-b border-slate-50 transition-colors
                            ${nationality===c.name?'bg-blue-50 text-blue-700 font-semibold':'text-slate-700'}`}>
                          <span className="text-base">{c.flag}</span>{c.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {nationality && !natOpen && (
                    <div className="mt-3 flex items-center gap-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0"/>
                      <span>{countries.find(c=>c.name===nationality)?.flag}</span> {nationality}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-6 lg:px-10 py-5 border-t border-slate-800 lg:border-slate-100 bg-slate-900 lg:bg-white">
          <div className="max-w-md mx-auto flex gap-3">
            <button onClick={() => { if (step < TOTAL_STEPS-1) setStep(s=>s+1); else finish(); }}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg
                bg-gradient-to-r ${meta.color} text-white hover:opacity-90 hover:shadow-xl active:scale-95`}>
              {step === TOTAL_STEPS-1 ? 'Find My Programs →' : 'Next →'}
            </button>
            <button onClick={() => { if (step < TOTAL_STEPS-1) setStep(s=>s+1); else finish(); }}
              className="px-6 py-3.5 rounded-2xl border border-slate-700 lg:border-slate-200 text-slate-400 lg:text-slate-500 font-semibold text-sm hover:bg-slate-800 lg:hover:bg-slate-50 transition-colors">
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styled checkbox card ──────────────────────────────────────
function StyledCheck({ label, checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all
        ${checked
          ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100'
          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}>
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all
        ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3}/>}
      </div>
      <span className={`text-sm font-medium ${checked ? 'text-blue-800 font-semibold' : 'text-slate-700'}`}>{label}</span>
    </button>
  );
}

// ── Styled radio card ─────────────────────────────────────────
function StyledRadio({ label, checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 text-left transition-all
        ${checked
          ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-100'
          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
        ${checked ? 'border-emerald-500' : 'border-slate-300'}`}>
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>}
      </div>
      <span className={`text-sm font-medium ${checked ? 'text-emerald-800 font-semibold' : 'text-slate-700'}`}>{label}</span>
    </button>
  );
}

// ── Fields multi-select dropdown ──────────────────────────────
function FieldsDropdown({ options, selected, onToggle }) {
  const [open, setOpen] = useState(true);
  const [q, setQ]       = useState('');
  const filtered = q ? options.filter(o => o.option_label.toLowerCase().includes(q.toLowerCase())) : options;
  return (
    <div className="border-2 border-blue-500 rounded-2xl overflow-hidden bg-white shadow-sm shadow-blue-100">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
        <span className="text-slate-600 text-sm font-medium">
          {selected.length ? selected.slice(0,2).join(', ') + (selected.length > 2 ? ` +${selected.length-2} more` : '') : 'Select programs…'}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
      </button>
      {open && (
        <>
          <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-slate-400"/>
              <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                placeholder="Search fields of study…"
                className="flex-1 text-sm outline-none text-slate-700 placeholder-slate-400 bg-transparent"/>
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map(o => (
              <button key={o.option_value} type="button" onClick={() => onToggle(o.option_value)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0
                  ${selected.includes(o.option_value) ? 'bg-blue-50/60' : ''}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all
                  ${selected.includes(o.option_value) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                  {selected.includes(o.option_value) && <Check className="w-3 h-3 text-white" strokeWidth={3}/>}
                </div>
                <span className={`text-sm ${selected.includes(o.option_value) ? 'text-blue-700 font-semibold' : 'text-slate-700'}`}>{o.option_label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Year section ──────────────────────────────────────────────
function YearSection({ year, months, selected, onToggle, onSelectAll }) {
  const [open, setOpen] = useState(year === CURRENT_YEAR);
  const yearDates = months.map(m => `${m} ${year}`);
  const allSel = yearDates.length > 0 && yearDates.every(d => selected.includes(d));
  const selCount = yearDates.filter(d => selected.includes(d)).length;
  return (
    <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800">{year}</span>
          {selCount > 0 && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selCount} selected</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <button onClick={onSelectAll} className="text-xs font-bold text-blue-600 hover:text-blue-800 mt-3 mb-3 block transition-colors">
            {allSel ? '✕ Deselect All' : '✓ Select All'}
          </button>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {months.map(m => {
              const d = `${m} ${year}`;
              const checked = selected.includes(d);
              return (
                <button key={d} onClick={() => onToggle(d)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-left
                    ${checked ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                    {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3}/>}
                  </div>
                  {m.slice(0,3)} {year}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}