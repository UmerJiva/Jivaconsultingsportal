// pages/agent/institution/[id].js
// Exact copy of pages/admin/university/[id].js with only 3 changes:
// 1. Back button → /agent/institutions  (instead of /admin/universities)
// 2. "View Program" button → Apply button → /agent/applications/new?program=X
// 3. "Requirements" button → removed entirely

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Spinner } from '../../../components/ui/index';
import {
  MapPin, Clock, BookOpen, ArrowLeft, CheckCircle, XCircle,
  ExternalLink, Heart, ChevronDown, ChevronUp, Building2,
  GraduationCap, DollarSign, Calendar, Globe, Award,
  Briefcase, Home, Users, TrendingUp, Image as ImageIcon, X,
  Plus
} from 'lucide-react';

const TAG_COLORS = {
  'High Job Demand':'bg-teal-50 text-teal-700 border-teal-200',
  'Scholarships Available':'bg-green-50 text-green-700 border-green-200',
  'No Visa Cap':'bg-blue-50 text-blue-700 border-blue-200',
  'Loans':'bg-purple-50 text-purple-700 border-purple-200',
  'Prime':'bg-sky-50 text-sky-700 border-sky-200',
  'Incentivized':'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Popular':'bg-pink-50 text-pink-700 border-pink-200',
  'Fast Acceptance':'bg-amber-50 text-amber-700 border-amber-200',
};

const FEATURE_ICONS = {
  'Post Graduation Permit': GraduationCap,
  'Co-op/Internship Participation': Briefcase,
  'Work While Studying': TrendingUp,
  'Conditional Offer Letter': CheckCircle,
  'Accommodations': Home,
  'Scholarships Available': Award,
  'On-campus Housing': Building2,
  'Career Services': Users,
};

function Section({ id, Icon, title, badge, children }) {
  return (
    <div id={id} className="scroll-mt-20 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-slate-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        {badge != null && badge > 0 && (
          <span className="bg-slate-100 text-slate-600 text-sm font-semibold px-2.5 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Gallery({ photos, show, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  useEffect(() => { setCurrent(startIndex); }, [startIndex]);
  if (!show || !photos.length) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"><X className="w-6 h-6"/></button>
      <div className="relative max-w-4xl w-full" onClick={e=>e.stopPropagation()}>
        <img src={photos[current]} alt={`Photo ${current+1}`} className="w-full max-h-[80vh] object-contain rounded-xl" />
        <div className="flex justify-center gap-2 mt-3">
          {photos.map((_,i)=>(
            <button key={i} onClick={()=>setCurrent(i)} className={`w-2 h-2 rounded-full transition-all ${i===current?'bg-white':'bg-white/40'}`}/>
          ))}
        </div>
        {photos.length>1&&<>
          <button onClick={()=>setCurrent(c=>(c-1+photos.length)%photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">‹</button>
          <button onClick={()=>setCurrent(c=>(c+1)%photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">›</button>
        </>}
      </div>
    </div>
  );
}

export default function AgentUniversityDetail() {
  const router = useRouter();
  const { id } = router.query;
  const basePath = router.pathname.startsWith('/student') ? '/student' : '/agent';
  const [uni, setUni]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [progSearch, setProgSearch] = useState('');
  const [progLevel, setProgLevel] = useState('');
  const [expandedAbout, setExpandedAbout] = useState(false);
  const [lightbox, setLightbox] = useState({ show:false, index:0 });

  const TABS = ['overview','features','location','scholarships','programs'];

  useEffect(() => {
    if (!id) return;
    fetch(`/api/universities/${id}`).then(r=>r.json()).then(d=>{ setUni(d); setLoading(false); }).catch(()=>setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!uni) return;
    const handler = () => {
      for (const tab of [...TABS].reverse()) {
        const el = document.getElementById(tab);
        if (el && el.getBoundingClientRect().top <= 100) { setActiveTab(tab); break; }
      }
    };
    window.addEventListener('scroll', handler, { passive:true });
    return () => window.removeEventListener('scroll', handler);
  }, [uni]);

  function scrollTo(tab) {
    const el = document.getElementById(tab);
    if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top:y, behavior:'smooth' }); }
    setActiveTab(tab);
  }

  if (loading) return <AdminLayout title="University"><div className="flex justify-center py-20"><Spinner size="lg"/></div></AdminLayout>;
  if (!uni)    return <AdminLayout title="University"><div className="text-center py-20 text-slate-400">University not found</div></AdminLayout>;

  const safeArr = (val) => { if(!val)return[]; if(Array.isArray(val))return val; try{return JSON.parse(val);}catch{return[];} };
  const features    = safeArr(uni.features);
  const disciplines = safeArr(uni.disciplines);
  const progLevels  = safeArr(uni.program_levels);
  const photos      = safeArr(uni.photos);
  const scholarships = uni.scholarships || [];
  const allPrograms  = uni.programs    || [];
  const programs = allPrograms.filter(p => {
    const ms = !progSearch || p.name.toLowerCase().includes(progSearch.toLowerCase());
    const ml = !progLevel  || p.level === progLevel;
    return ms && ml;
  });

  const gridPhotos = photos.slice(0, 5);
  const placeholders = ['from-brand-800 to-brand-600','from-slate-700 to-slate-500','from-teal-700 to-teal-500','from-slate-600 to-slate-400','from-brand-600 to-brand-400'];

  return (
    <AdminLayout title={uni.name}>
      <div className="max-w-full">

        {/* ── CHANGE 1: back goes to institutions ── */}
        <button onClick={()=>router.push(`${basePath}/institutions`)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4"/>Back to Institutions
        </button>

        {/* ── Header ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-0">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center font-bold text-brand-700 text-xl shrink-0 shadow-sm overflow-hidden">
              {photos[0]
                ? <img src={photos[0]} alt={uni.name} className="w-full h-full object-cover"/>
                : (uni.logo_initials || uni.name?.[0])
              }
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1" style={{fontFamily:'Georgia,serif'}}>{uni.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                {uni.flag&&<span className="flex items-center gap-1.5">{uni.flag} {uni.city}{uni.city&&uni.country?', ':''}{uni.country}</span>}
                {uni.address&&<span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0"/>{uni.address}</span>}
                {uni.website&&<a href={`https://${uni.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-600 hover:underline"><Globe className="w-3.5 h-3.5"/>{uni.website}</a>}
              </div>
            </div>
          </div>

          {/* Photo mosaic */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 row-span-2 relative rounded-xl overflow-hidden h-52 cursor-pointer group"
              onClick={()=>photos.length>0&&setLightbox({show:true,index:0})}>
              {gridPhotos[0]
                ? <img src={gridPhotos[0]} alt="Campus" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                : <div className={`w-full h-full bg-gradient-to-br ${placeholders[0]} flex items-center justify-center`}><Building2 className="w-10 h-10 text-white/30"/></div>
              }
              <button
                onClick={e=>{e.stopPropagation(); setLightbox({show:true,index:0});}}
                className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5"/>View Photos {photos.length>0&&`(${photos.length})`}
              </button>
            </div>
            {[1,2].map(idx=>(
              <div key={idx} className="relative rounded-xl overflow-hidden h-24 cursor-pointer group"
                onClick={()=>photos.length>idx&&setLightbox({show:true,index:idx})}>
                {gridPhotos[idx]
                  ? <img src={gridPhotos[idx]} alt={`Photo ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  : <div className={`w-full h-full bg-gradient-to-br ${placeholders[idx]} flex items-center justify-center`}><Globe className="w-6 h-6 text-white/30"/></div>
                }
              </div>
            ))}
            {[3,4].map(idx=>(
              <div key={idx} className="relative rounded-xl overflow-hidden h-24 cursor-pointer group"
                onClick={()=>photos.length>idx&&setLightbox({show:true,index:idx})}>
                {gridPhotos[idx]
                  ? <img src={gridPhotos[idx]} alt={`Photo ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  : idx===4 && photos.length>5
                    ? <div className="w-full h-full bg-black/60 flex items-center justify-center text-white font-bold">+{photos.length-4} more</div>
                    : <div className={`w-full h-full bg-gradient-to-br ${placeholders[idx]} flex items-center justify-center`}><BookOpen className="w-6 h-6 text-white/30"/></div>
                }
              </div>
            ))}
          </div>
        </div>

        {/* ── Sticky tabs ── */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex overflow-x-auto">
            {TABS.map(tab=>(
              <button key={tab} onClick={()=>scrollTo(tab)}
                className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap capitalize -mb-px
                  ${activeTab===tab?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {tab}
                {tab==='scholarships'&&scholarships.length>0&&<span className="ml-1.5 bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded-full">{scholarships.length}</span>}
                {tab==='programs'&&allPrograms.length>0&&<span className="ml-1.5 bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded-full">{allPrograms.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content + sidebar ── */}
        <div className="flex gap-6 mt-6">
          <div className="flex-1 min-w-0">

            {/* OVERVIEW */}
            <Section id="overview" Icon={Building2} title="About">
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className={`text-slate-700 text-sm leading-relaxed ${!expandedAbout?'line-clamp-6':''}`}>
                  {uni.description||'No description available for this university.'}
                </div>
                {uni.description&&uni.description.length>400&&(
                  <button onClick={()=>setExpandedAbout(e=>!e)} className="flex items-center gap-1 text-brand-600 font-semibold text-sm mt-3 hover:text-brand-800 transition-colors">
                    {expandedAbout?<><ChevronUp className="w-4 h-4"/>Show Less</>:<><ChevronDown className="w-4 h-4"/>Show More</>}
                  </button>
                )}
              </div>
            </Section>

            {/* FEATURES */}
            <Section id="features" Icon={CheckCircle} title="Features">
              {features.length===0
                ? <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-400 text-sm">No features listed for this university.</div>
                : <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    {features.map((feat,i)=>{
                      const Icon = FEATURE_ICONS[feat] || CheckCircle;
                      return (
                        <div key={feat} className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors ${i<features.length-1?'border-b border-slate-100':''}`}>
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-slate-500 shrink-0"/>
                            <span className="text-sm font-medium text-slate-700">{feat}</span>
                          </div>
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0"/>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between px-6 py-4 opacity-40 border-t border-slate-100">
                      <div className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-slate-400"/><span className="text-sm font-medium text-slate-500">Conditional Offer Letter</span></div>
                      <XCircle className="w-5 h-5 text-slate-300"/>
                    </div>
                  </div>
              }
              <p className="text-xs text-slate-400 mt-2">*Information listed is subject to change without notice.</p>
            </Section>

            {/* LOCATION */}
            <Section id="location" Icon={MapPin} title="Location">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="flex border-b border-slate-200 px-2">
                  <button className="px-5 py-3 text-sm font-semibold text-brand-700 border-b-2 border-brand-600 -mb-px">Map</button>
                  <button className="px-5 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700">Streetview</button>
                </div>
                <div className="h-64 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <MapPin className="w-10 h-10 mx-auto mb-2 text-brand-400"/>
                    <p className="font-semibold text-slate-700">{uni.city}, {uni.country}</p>
                    <p className="text-sm mt-0.5">{uni.address}</p>
                    {uni.latitude&&<p className="text-xs mt-1 text-brand-500 font-mono">{uni.latitude}°N, {uni.longitude}°E</p>}
                  </div>
                </div>
              </div>
            </Section>

            {/* SCHOLARSHIPS */}
            <Section id="scholarships" Icon={Award} title="Scholarships" badge={scholarships.length}>
              {scholarships.length===0
                ? <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                    <Award className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
                    <p className="text-slate-500 text-sm">No scholarships listed for this university yet.</p>
                  </div>
                : <div className="grid sm:grid-cols-2 gap-4">
                    {scholarships.map(s=>(
                      <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm hover:border-brand-200 transition-all">
                        <h3 className="font-bold text-slate-800 mb-0.5">{s.name}</h3>
                        <p className="text-xs text-slate-500 mb-4">{uni.name}</p>
                        <div className="space-y-2.5">
                          {[['Amount',s.amount_text||'—'],['Auto applied',s.auto_applied?'Yes':'No'],['Eligible nationalities',s.eligible_nationalities||'All nationalities'],['Eligible program levels',s.eligible_levels||'All program levels']].map(([k,v])=>(
                            <div key={k}><div className="text-xs font-bold text-slate-700">{k}</div><div className="text-sm text-slate-600 leading-snug">{v}</div></div>
                          ))}
                        </div>
                        <button className="flex items-center gap-1 text-brand-600 font-semibold text-sm mt-4 hover:text-brand-800 transition-colors">
                          Learn more <ExternalLink className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    ))}
                  </div>
              }
            </Section>

            {/* PROGRAMS */}
            <Section id="programs" Icon={BookOpen} title="Programs" badge={allPrograms.length}>
              <div className="flex flex-wrap gap-3 mb-4">
                <input value={progSearch} onChange={e=>setProgSearch(e.target.value)} placeholder="Search programs…"
                  className="flex-1 min-w-48 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"/>
                <select value={progLevel} onChange={e=>setProgLevel(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-600">
                  <option value="">All Levels</option>
                  {['Bachelor','Master','PhD','Diploma','Certificate'].map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
              {programs.length===0
                ? <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
                    <p className="text-slate-400 text-sm">{allPrograms.length===0?'No programs found for this university.':'No programs match your filter.'}</p>
                  </div>
                : <div className="space-y-3">
                    {programs.map(p=>{
                      const tags = (p.tags||'').split(',').filter(Boolean);
                      const intakes = (p.available_intakes||'').split(',').filter(Boolean);
                      return (
                        <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-sm transition-all">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                              <GraduationCap className="w-6 h-6 text-brand-600"/>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-500 mb-0.5">{p.level}</div>
                              <h3 className="font-bold text-slate-800 text-base mb-2">{p.name}</h3>
                              {tags.length>0&&(
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                  {tags.slice(0,5).map(t=><span key={t} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TAG_COLORS[t]||'bg-slate-50 text-slate-500 border-slate-200'}`}>{t}</span>)}
                                </div>
                              )}
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                                {[
                                  ['Earliest intake',intakes[0]||'—'],
                                  ['Gross tuition',p.tuition_fee?`${p.currency} ${Number(p.tuition_fee).toLocaleString()}`:'—'],
                                  ['Application fee',p.application_fee==0?'Free':`${p.app_fee_currency} ${p.application_fee}`],
                                  ['Commission',p.commission_text||'—'],
                                ].map(([k,v])=>(
                                  <div key={k} className="bg-slate-50 rounded-xl p-3">
                                    <div className="text-xs text-slate-400 mb-0.5">{k}</div>
                                    <div className="text-sm font-bold text-slate-800">{v}</div>
                                  </div>
                                ))}
                              </div>
                              {intakes.length>0&&(
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-slate-500">Available intakes:</span>
                                  {intakes.map(i=><span key={i} className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">{i}</span>)}
                                </div>
                              )}
                            </div>

                            {/* ── CHANGE 2 & 3: single Apply button, Requirements removed ── */}
                            <div className="flex items-center shrink-0">
                              <button onClick={()=>router.push(`${basePath}/applications/new?program=${p.id}`)}
                                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                                <Plus className="w-3.5 h-3.5"/> Apply
                              </button>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </Section>
          </div>

          {/* ── Right sidebar (identical to admin) ── */}
          <div className="w-72 shrink-0">
            <div className="sticky top-24 space-y-4">

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-3">Institution Details</h3>
                <div className="divide-y divide-slate-100">
                  {[['Founded',uni.founded||'—'],['School ID',uni.id],['Institution type',uni.institution_type||'Public'],['World ranking',uni.world_ranking?`#${uni.world_ranking}`:'—']].map(([k,v])=>(
                    <div key={k} className="flex items-center justify-between py-2.5">
                      <span className="text-sm text-slate-500">{k}</span>
                      <span className="text-sm font-semibold text-slate-800">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-4">Cost and Duration</h3>
                <div className="space-y-3.5">
                  {[
                    [DollarSign, uni.application_fee_range||'Free', 'Application fee'],
                    [Calendar,  '1 year',                         'Average graduate program'],
                    [Calendar,  '3 years',                        'Average undergraduate program'],
                    [Home,      uni.cost_of_living||'—',          'Cost of living'],
                    [GraduationCap, uni.avg_tuition||uni.tuition_info||'—', 'Average Gross tuition'],
                  ].map(([Icon,v,label])=>(
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-slate-500"/>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{v}</div>
                        <div className="text-xs text-slate-400">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {uni.avg_processing_days&&(
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4"/>Application Processing Time</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-brand-600"/></div>
                    <div>
                      <div className="font-bold text-slate-800">{uni.avg_processing_days} day{uni.avg_processing_days!=1?'s':''}</div>
                      <div className="text-xs text-slate-400">Average school decision time</div>
                    </div>
                  </div>
                </div>
              )}

              {disciplines.length>0&&(
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 mb-4">Top Disciplines</h3>
                  <div className="space-y-3">
                    {disciplines.map(d=>(
                      <div key={d.name}>
                        <div className="text-sm text-slate-700 mb-1 leading-snug">{d.name}</div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-600 rounded-full" style={{width:`${d.pct||50}%`}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {progLevels.length>0&&(
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 mb-4">Program Levels</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                        {progLevels.map((l,i)=>{ const pct=100/progLevels.length; const offset=i*pct; const colors=['#1e40af','#3b82f6','#60a5fa','#93c5fd','#bfdbfe']; return <circle key={l} cx="18" cy="18" r="15.9" fill="transparent" stroke={colors[i%5]} strokeWidth="3.5" strokeDasharray={`${pct} ${100-pct}`} strokeDashoffset={-offset}/>; })}
                      </svg>
                    </div>
                    <div className="space-y-1.5">
                      {progLevels.map((l,i)=>(
                        <div key={l} className="flex items-center gap-1.5 text-xs">
                          <div className={`w-2.5 h-2.5 rounded-sm shrink-0 ${['bg-blue-800','bg-blue-600','bg-blue-400','bg-blue-300','bg-blue-200'][i%5]}`}/>
                          <span className="text-slate-600">{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <Gallery photos={photos} show={lightbox.show} startIndex={lightbox.index} onClose={()=>setLightbox({show:false,index:0})}/>
    </AdminLayout>
  );
}