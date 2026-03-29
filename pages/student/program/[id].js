// pages/student/program/[id].js — Program detail page
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Spinner } from '../../../components/ui/index';
import {
  ArrowLeft, Heart, ExternalLink, X, ChevronDown, ChevronUp,
  CheckCircle, XCircle, MapPin, Clock, DollarSign, Calendar,
  GraduationCap, BookOpen, Award, Globe, Building2, Users,
  TrendingUp, BarChart2, Zap, Image as ImageIcon, AlertCircle,
  Briefcase, Info, Home
} from 'lucide-react';

// ── Tag colors ────────────────────────────────────────────────
const TAG_COLORS = {
  'Instant Submission':    'bg-emerald-50 text-emerald-700 border-emerald-300',
  'Instant Offer':         'bg-teal-50 text-teal-700 border-teal-300',
  'High Job Demand':       'bg-teal-50 text-teal-700 border-teal-200',
  'Scholarships Available':'bg-green-50 text-green-700 border-green-200',
  'No Visa Cap':           'bg-blue-50 text-blue-700 border-blue-200',
  'Loans':                 'bg-purple-50 text-purple-700 border-purple-200',
  'Prime':                 'bg-sky-50 text-sky-700 border-sky-200',
  'Incentivized':          'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Popular':               'bg-pink-50 text-pink-700 border-pink-200',
  'Fast Acceptance':       'bg-amber-50 text-amber-700 border-amber-200',
};

const TAG_ICONS = {
  'Instant Submission': Zap,
  'Instant Offer': Zap,
  'High Job Demand': TrendingUp,
  'Scholarships Available': Award,
  'No Visa Cap': Globe,
  'Loans': DollarSign,
  'Prime': BarChart2,
  'Incentivized': Award,
  'Popular': Users,
  'Fast Acceptance': CheckCircle,
};

// ── Lightbox gallery ──────────────────────────────────────────
function Gallery({ photos, show, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  useEffect(()=>{ setCurrent(startIndex); }, [startIndex]);
  if (!show || !photos.length) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"><X className="w-6 h-6"/></button>
      <div className="relative max-w-5xl w-full" onClick={e=>e.stopPropagation()}>
        <img src={photos[current]} alt={`Photo ${current+1}`} className="w-full max-h-[80vh] object-contain rounded-2xl"/>
        <div className="flex justify-center gap-2 mt-3">
          {photos.map((_,i)=><button key={i} onClick={()=>setCurrent(i)} className={`w-2 h-2 rounded-full transition-all ${i===current?'bg-white w-5':'bg-white/40'}`}/>)}
        </div>
        {photos.length > 1 && <>
          <button onClick={()=>setCurrent(c=>(c-1+photos.length)%photos.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors text-xl">‹</button>
          <button onClick={()=>setCurrent(c=>(c+1)%photos.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors text-xl">›</button>
        </>}
      </div>
    </div>
  );
}

// ── Collapsible section ───────────────────────────────────────
function Collapsible({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-4">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
        <span className="font-bold text-slate-800">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────
function SectionHead({ id, Icon, title }) {
  return (
    <div id={id} className="flex items-center gap-3 mb-5 scroll-mt-24">
      <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-600"/>
      </div>
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    </div>
  );
}

// ── Score card ────────────────────────────────────────────────
function ScoreCard({ label, value, sub }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-bold text-slate-800">{value ?? '—'}</div>
      {sub && <div className="text-xs text-brand-600 mt-1 font-medium">{sub}</div>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function ProgramDetail() {
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
  const [applying, setApplying] = useState(false);

  const TABS = ['overview','admission_requirements','scholarships','similar_programs'];
  const TAB_LABELS = { overview:'Overview', admission_requirements:'Admission Requirements', scholarships:'Scholarships', similar_programs:'Similar Programs' };

  useEffect(()=>{
    if (!id) return;
    fetch(`/api/programs/${id}`).then(r=>r.json()).then(d=>{ setProg(d); setLoading(false); }).catch(()=>setLoading(false));
  }, [id]);

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

  if (loading) return <AdminLayout title="Program"><div className="flex justify-center py-20"><Spinner size="lg"/></div></AdminLayout>;
  if (!prog || prog.error) return <AdminLayout title="Program"><div className="text-center py-20 text-slate-400 text-lg">Program not found</div></AdminLayout>;

  const tags = (prog.tags||'').split(',').filter(Boolean);
  const photos = prog.photos || [];
  const intakes = (prog.available_intakes||'').split(',').filter(Boolean);
  const scholarships = prog.scholarships || [];
  const similar = prog.similar || [];

  const fee = prog.tuition_fee ? `${prog.currency} ${Number(prog.tuition_fee).toLocaleString()}` : '—';
  const appFee = prog.application_fee == 0 ? 'Free' : `${prog.app_fee_currency} ${prog.application_fee}`;

  // Generate intake rows with Open/Likely open status
  const intakeRows = intakes.map((intake, i) => ({
    intake,
    status: i < 2 ? 'Open' : 'Likely open',
  }));

  return (
    <AdminLayout title={prog.name}>
      <div className="max-w-full">

        {/* ── Back button ── */}
        <button onClick={()=>router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4"/>Back to Programs
        </button>

        {/* ── Header: University breadcrumb + Program title + tags ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
          {/* University breadcrumb */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center font-bold text-brand-700 text-base shadow-sm overflow-hidden shrink-0">
              {photos[0]
                ? <img src={photos[0]} alt={prog.university_name} className="w-full h-full object-cover"/>
                : prog.logo_initials||prog.university_name?.[0]||'U'
              }
            </div>
            <div>
              <button onClick={()=>router.push(`/student/university/${prog.university_id}`)}
                className="text-brand-600 hover:text-brand-800 font-semibold text-sm hover:underline">
                {prog.university_name}
              </button>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                {prog.flag&&<span>{prog.flag}</span>}
                {[prog.campus_city, prog.country].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>

          {/* Program title */}
          <h1 className="text-2xl font-bold text-slate-800 mb-3" style={{fontFamily:'Georgia,serif'}}>
            {prog.name}
          </h1>

          {/* Program ID + Tags row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
              #{prog.id}
            </span>
            {prog.instant_submission && (
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-300">
                <CheckCircle className="w-3 h-3"/>Instant Submission
              </span>
            )}
            {prog.instant_offer && (
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border bg-teal-50 text-teal-700 border-teal-300">
                <Zap className="w-3 h-3"/>Instant Offer
              </span>
            )}
            {tags.map(tag => {
              const Icon = TAG_ICONS[tag] || CheckCircle;
              return (
                <span key={tag} className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${TAG_COLORS[tag]||'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  <Icon className="w-3 h-3"/>{tag}
                </span>
              );
            })}
          </div>

          {/* Photo gallery mosaic */}
          {photos.length > 0 && (
            <div className="mt-5">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 row-span-2 relative rounded-xl overflow-hidden h-52 cursor-pointer group"
                  onClick={()=>setLightbox({show:true,index:0})}>
                  <img src={photos[0]} alt="Campus" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  <button onClick={e=>{e.stopPropagation();setLightbox({show:true,index:0});}}
                    className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5"/>View Photos {photos.length>1&&`(${photos.length})`}
                  </button>
                </div>
                {[1,2].map(idx=>(
                  <div key={idx} onClick={()=>photos[idx]&&setLightbox({show:true,index:idx})}
                    className="relative rounded-xl overflow-hidden h-24 cursor-pointer group bg-slate-100">
                    {photos[idx]
                      ? <img src={photos[idx]} alt={`Photo ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                      : <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300"/>
                    }
                  </div>
                ))}
                {[3,4].map(idx=>(
                  <div key={idx} onClick={()=>photos[idx]&&setLightbox({show:true,index:idx})}
                    className="relative rounded-xl overflow-hidden h-24 cursor-pointer group bg-slate-100">
                    {photos[idx]
                      ? <img src={photos[idx]} alt={`Photo ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                      : idx===4&&photos.length>5
                        ? <div className="w-full h-full bg-black/60 flex items-center justify-center text-white font-bold text-sm">+{photos.length-4}</div>
                        : <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300"/>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky tab bar ── */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm mb-0">
          <div className="flex overflow-x-auto">
            {TABS.map(tab=>(
              <button key={tab} onClick={()=>scrollTo(tab)}
                className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap -mb-px
                  ${activeTab===tab?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Two column layout ── */}
        <div className="flex gap-6 mt-6">

          {/* ── Left: main content ── */}
          <div className="flex-1 min-w-0">

            {/* ── OVERVIEW / PROGRAM SUMMARY ── */}
            <div id="overview" className="scroll-mt-20 mb-8">
              <SectionHead id="overview_head" Icon={Building2} title="Program Summary"/>

              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <p className="text-sm font-bold text-slate-700 mb-3">Program Description</p>
                <div className={`text-sm text-slate-700 leading-relaxed ${!showMoreDesc?'line-clamp-6':''}`}>
                  {prog.description || `${prog.name} is an internationally recognized program at ${prog.university_name}. This program provides students with the knowledge and skills required to excel in their chosen field of study.`}
                </div>
                {(prog.description||'').length > 400 && (
                  <button onClick={()=>setShowMoreDesc(p=>!p)} className="flex items-center gap-1 text-brand-600 font-semibold text-sm mt-3 hover:text-brand-800 transition-colors">
                    {showMoreDesc ? <><ChevronUp className="w-4 h-4"/>Show Less</> : <><ChevronDown className="w-4 h-4"/>Show More</>}
                  </button>
                )}
              </div>
            </div>

            {/* ── ADMISSION REQUIREMENTS ── */}
            <div id="admission_requirements" className="scroll-mt-20 mb-8">
              <SectionHead id="admission_head" Icon={BarChart2} title="Admission Requirements"/>
              <p className="text-sm text-slate-500 mb-4">May vary depending on student nationality and education background.</p>

              {/* Academic background */}
              <div className="mb-5">
                <h3 className="text-base font-bold text-slate-700 mb-3">Academic Background</h3>
                <div className="grid grid-cols-2 gap-4">
                  <ScoreCard label="Minimum Level of Education Completed" value={prog.min_education_level||'4-Year Bachelor\'s Degree'}/>
                  <div className="border border-slate-200 rounded-xl p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Minimum GPA</div>
                      <button className="text-xs text-brand-600 hover:underline font-medium">Convert grades</button>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{prog.min_gpa ? `${prog.min_gpa}%` : '—'}</div>
                  </div>
                </div>
              </div>

              {/* Language test scores */}
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-700 mb-3">Minimum Language Test Scores</h3>
                <div className="grid grid-cols-3 gap-4">
                  <ScoreCard label="IELTS" value={prog.min_ielts||'—'}/>
                  <ScoreCard label="TOEFL" value={prog.min_toefl||'—'}/>
                  <ScoreCard label="PTE" value={prog.min_pte||'—'}/>
                </div>
              </div>

              {/* Language test note */}
              <Collapsible title="This program requires valid language test results" defaultOpen={false}>
                <p className="text-sm text-slate-600 mt-3">
                  Applicants interested in applying for direct admission, but are yet to complete an acceptable language test, can do so, but must provide valid results before receiving a final offer letter.
                </p>
              </Collapsible>

              <p className="text-xs text-slate-400 mt-3">
                The program requirements above should only be used as a guide and do not guarantee admission into the program.
              </p>
            </div>

            {/* ── SCHOLARSHIPS ── */}
            <div id="scholarships" className="scroll-mt-20 mb-8">
              <SectionHead id="scholarships_head" Icon={Award} title="Scholarships"/>
              {scholarships.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                  <Award className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
                  <p className="text-slate-500 text-sm">No scholarships available for this program yet.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {scholarships.map(s=>(
                    <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm hover:border-brand-200 transition-all">
                      <h3 className="font-bold text-slate-800 mb-0.5">{s.name}</h3>
                      <p className="text-xs text-slate-500 mb-4">{prog.university_name} — All campuses</p>
                      <div className="space-y-2.5">
                        {[
                          ['Amount', s.amount_text||'—'],
                          ['Auto applied', s.auto_applied?'Yes':'No'],
                          ['Eligible nationalities', s.eligible_nationalities||'All nationalities'],
                          ['Eligible program levels', s.eligible_levels||'All program levels'],
                        ].map(([k,v])=>(
                          <div key={k}>
                            <div className="text-xs font-bold text-slate-700">{k}</div>
                            <div className="text-sm text-slate-600 leading-snug line-clamp-2">{v}</div>
                          </div>
                        ))}
                      </div>
                      <button className="flex items-center gap-1 text-brand-600 font-semibold text-sm mt-4 hover:text-brand-800 transition-colors">
                        Learn more <ExternalLink className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── SIMILAR PROGRAMS ── */}
            <div id="similar_programs" className="scroll-mt-20 mb-8">
              <SectionHead id="similar_head" Icon={BookOpen} title="Similar Programs"/>
              {similar.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
                  <p className="text-slate-500 text-sm">No similar programs found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {similar.map(p=>{
                    const pIntakes = (p.available_intakes||'').split(',').filter(Boolean);
                    return (
                      <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <button onClick={()=>router.push(`/student/program/${p.id}`)}
                              className="font-bold text-slate-800 text-base hover:text-brand-700 transition-colors text-left">
                              {p.name}
                            </button>
                            <p className="text-xs text-slate-500 mt-0.5">{p.university_name}</p>
                            <div className="grid grid-cols-4 gap-3 mt-3">
                              {[
                                ['Earliest intake', pIntakes[0]||'—'],
                                ['Deadline',        pIntakes[0]||'—'],
                                ['Gross tuition',   p.tuition_fee ? `${p.currency} ${Number(p.tuition_fee).toLocaleString()}` : '—'],
                                ['Application fee', p.application_fee==0 ? 'Free' : `${p.currency} ${p.application_fee}`],
                              ].map(([k,v])=>(
                                <div key={k} className="text-xs">
                                  <div className="text-slate-400">{k}</div>
                                  <div className="font-semibold text-slate-700 mt-0.5">{v}</div>
                                </div>
                              ))}
                            </div>
                            {p.commission_text && (
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                <span className="text-slate-400">Commission</span>
                                <span className="font-bold text-slate-700">{p.commission_text}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={()=>router.push(`/student/program/${p.id}`)}
                              className="flex items-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors border-2 border-brand-200 hover:border-brand-400">
                              Create application <ExternalLink className="w-3.5 h-3.5"/>
                            </button>
                            <button className="p-2.5 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500 transition-all">
                              <Heart className="w-4 h-4"/>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ── Right sidebar ── */}
          <div className="w-72 shrink-0">
            <div className="sticky top-20 space-y-4">

              {/* Create application + wishlist */}
              <div className="flex gap-2">
                <button disabled={applying} onClick={()=>setApplying(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm border-2 border-brand-600">
                  Create application <ExternalLink className="w-4 h-4"/>
                </button>
                <button onClick={()=>setLiked(l=>!l)}
                  className={`p-3 rounded-xl border-2 transition-all ${liked?'bg-red-50 border-red-300 text-red-500':'border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-400'}`}>
                  <Heart className={`w-5 h-5 ${liked?'fill-red-500':''}`}/>
                </button>
              </div>

              {/* Program info card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="divide-y divide-slate-100 space-y-0">
                  {[
                    [GraduationCap, prog.level ? `${prog.level}'s Degree` : prog.level,  'Program Level'],
                    [Calendar,      prog.duration_text || '—',                            'Program Length'],
                    [Home,          prog.cost_of_living || '—',                           'Cost of Living'],
                    [DollarSign,    fee,                                                   'Gross Tuition'],
                    [DollarSign,    appFee,                                                'Application Fee'],
                  ].map(([Icon, v, label])=>(
                    <div key={label} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-4.5 h-4.5 text-slate-500"/>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{v}</div>
                        <div className="text-xs text-slate-400">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Other fees section */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-sm font-bold text-slate-700 mb-2">Other Fees</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Approx. CAS Deposit (one time)</span>
                    <span className="font-bold text-slate-800">
                      {prog.currency} {prog.tuition_fee ? (Number(prog.tuition_fee)*0.47).toLocaleString(undefined,{maximumFractionDigits:2}) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Program Intakes */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4"/>Program Intakes</h3>
                {intakeRows.length === 0 ? (
                  <p className="text-slate-400 text-sm">No intakes available.</p>
                ) : (
                  <div className="space-y-2">
                    {intakeRows.map(({ intake, status }, i)=>(
                      <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status==='Open'?'bg-emerald-100 text-emerald-700':'bg-amber-50 text-amber-600'}`}>
                            {status}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400"/>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{intake}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Post-Study Work Visa */}
              {prog.post_study_work_visa && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <button onClick={()=>setShowPostStudy(o=>!o)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                    <span className="font-bold text-slate-800">Post-Study Work Visa</span>
                    {showPostStudy ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                  </button>
                  {showPostStudy && (
                    <div className="px-5 pb-5 border-t border-slate-100">
                      <p className="text-sm text-emerald-700 font-semibold mt-3 mb-2">This program is eligible for Post-Study Work Visa.</p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Post-Study Work Visa will be open to all students on Tier 4 visas who are accepted onto a course in the 2020 intake or later. Once you have successfully completed a course of study at the undergraduate level or above at an approved Higher Education Provider you would be able to stay and work for a maximum of two years.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Commissions */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button onClick={()=>setShowCommission(o=>!o)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                  <span className="font-bold text-slate-800">Commissions</span>
                  {showCommission ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                </button>
                {showCommission && (
                  <div className="px-5 pb-5 border-t border-slate-100">
                    <div className="mt-4 flex justify-center mb-4">
                      <span className="bg-emerald-100 text-emerald-700 font-bold px-5 py-2 rounded-full text-sm">
                        {prog.commission_text || 'Contact for commission details'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Commission Breakdown</p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {prog.commission_breakdown || 'The Commission structure agreement is based on the respective school\'s confirmation of the student\'s successful full-time enrolment as long as they have passed the determined withdrawal date, are in good standing with the school and have no outstanding balance.'}
                    </p>
                    <button onClick={()=>setShowDisclaimer(d=>!d)} className="flex items-center gap-1 text-xs text-brand-600 font-semibold mt-3 hover:underline">
                      <Info className="w-3 h-3"/>DISCLAIMER {showDisclaimer ? '▲' : '▼'}
                    </button>
                    {showDisclaimer && (
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        This is a high-level estimate of what may be receivable upon a school confirming successful full-time enrollment. Actual commission received is based on a final determination resulting from the school's agreement and may be impacted by ESL/ACD, Nationality, volume of credits/courses, Transfer Policy (if any), agent changes, and the term and/or program.
                      </p>
                    )}
                    <button className="text-xs text-brand-600 font-semibold hover:underline mt-2 block">Go to school commissions table →</button>
                  </div>
                )}
              </div>

              {/* EduPortal Services */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button onClick={()=>setShowServices(o=>!o)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                  <span className="font-bold text-slate-800">EduPortal Services</span>
                  {showServices ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                </button>
                {showServices && (
                  <div className="border-t border-slate-100">
                    <div className="h-32 bg-gradient-to-br from-brand-800 via-brand-600 to-purple-600 flex items-center justify-center">
                      <div className="text-center text-white">
                        <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-80"/>
                        <div className="font-bold text-xl">EduPortal</div>
                        <div className="text-brand-200 text-xs mt-0.5">Premium Services</div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="font-bold text-slate-800 mb-1">EduPortal Premium</div>
                      <p className="text-xs text-slate-500">Get all the essentials you need to study abroad through EduPortal's partner services.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Gallery photos={photos} show={lightbox.show} startIndex={lightbox.index} onClose={()=>setLightbox({show:false,index:0})}/>
    </AdminLayout>
  );
}