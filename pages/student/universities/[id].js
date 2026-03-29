// pages/agent/university/[id].js — University detail page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Spinner } from '../../../components/ui/index';
import {
  MapPin, Globe, Calendar, Building2, Clock, DollarSign,
  ChevronDown, ChevronUp, ExternalLink, Heart, ArrowLeft,
  CheckCircle, XCircle, BookOpen, Award, Users
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

function FeatureRow({ name }) {
  const positive = !name.startsWith('No ');
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-700">{name}</span>
      <div className="flex items-center gap-2">
        {positive
          ? <CheckCircle className="w-5 h-5 text-emerald-500" />
          : <XCircle className="w-5 h-5 text-slate-300" />}
        <button className="text-slate-400 hover:text-slate-600"><ChevronDown className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function DisciplineBar({ name, pct }) {
  return (
    <div className="mb-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-sm text-slate-700 mb-1 leading-snug">{name}</div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-600 rounded-full" style={{width:`${pct}%`}} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UniversityDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [uni, setUni]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [progSearch, setProgSearch] = useState('');
  const [progLevel, setProgLevel]   = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/universities/${id}`).then(r=>r.json()).then(d=>{
      setUni(d); setLoading(false);
    }).catch(()=>setLoading(false));
  }, [id]);

  if (loading) return <AdminLayout title="University"><div className="flex justify-center py-20"><Spinner size="lg" /></div></AdminLayout>;
  if (!uni) return <AdminLayout title="University"><div className="text-center py-20 text-slate-400">University not found</div></AdminLayout>;

  const tabs = ['Overview','Features','Location','Scholarships','Programs'];
  const features     = Array.isArray(uni.features)     ? uni.features     : [];
  const disciplines  = Array.isArray(uni.disciplines)  ? uni.disciplines  : [];
  const progLevels   = Array.isArray(uni.program_levels)? uni.program_levels: [];
  const scholarships = uni.scholarships || [];
  const programs     = (uni.programs || []).filter(p => {
    const ms = !progSearch || p.name.toLowerCase().includes(progSearch.toLowerCase());
    const ml = !progLevel  || p.level === progLevel;
    return ms && ml;
  });

  // Fake gallery images using gradient placeholders
  const photos = [
    { bg:'from-brand-800 to-brand-600', label:'Campus' },
    { bg:'from-slate-700 to-slate-500', label:'International Students' },
    { bg:'from-teal-700 to-teal-500',   label:'Facilities' },
    { bg:'from-slate-600 to-slate-400', label:'Campus Building' },
  ];

  return (
    <AdminLayout title={uni.name}>
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Programs
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center text-2xl font-bold text-brand-700 shrink-0 shadow-sm">
              {uni.logo_initials || uni.name?.[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-800 mb-1" style={{fontFamily:'Georgia,serif'}}>{uni.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                {uni.flag && <span className="flex items-center gap-1"><span>{uni.flag}</span>{uni.city}, {uni.country}</span>}
                {uni.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{uni.address}</span>}
              </div>
            </div>
          </div>

          {/* Photo gallery */}
          <div className="grid grid-cols-3 gap-2 mb-0">
            <div className={`col-span-1 row-span-2 bg-gradient-to-br ${photos[0].bg} rounded-xl h-52 relative overflow-hidden`}>
              <div className="absolute inset-0 flex items-center justify-center text-white/20 text-6xl font-bold">🏛️</div>
              <button className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">View Photos</button>
            </div>
            <div className={`bg-gradient-to-br ${photos[1].bg} rounded-xl h-24 overflow-hidden flex items-center justify-center text-white/30 text-4xl`}>🌍</div>
            <div className={`bg-gradient-to-br ${photos[2].bg} rounded-xl h-24 overflow-hidden flex items-center justify-center text-white/30 text-4xl`}>🏢</div>
            <div className={`bg-gradient-to-br ${photos[3].bg} rounded-xl h-24 overflow-hidden flex items-center justify-center text-white/30 text-4xl`}>📚</div>
            <div className="bg-slate-100 rounded-xl h-24 flex items-center justify-center text-slate-400 text-xs">+ More photos</div>
          </div>
        </div>

        {/* Tabs + content */}
        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            {/* Tab nav */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4">
              <div className="flex border-b border-slate-200 px-2">
                {tabs.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors -mb-px
                      ${activeTab===tab.toLowerCase() ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    {tab}
                    {tab === 'Programs' && <span className="ml-1.5 bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded-full">{uni.programs?.length||0}</span>}
                    {tab === 'Scholarships' && scholarships.length > 0 && <span className="ml-1.5 bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded-full">{scholarships.length}</span>}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* ── OVERVIEW ── */}
                {activeTab === 'overview' && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Building2 className="w-4 h-4 text-slate-600" /></div>
                      <h2 className="text-lg font-bold text-slate-800">About</h2>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-slate-700 text-sm leading-relaxed mb-3">{uni.description || 'No description available.'}</p>
                    </div>

                    {features.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">📋</div>
                          <h2 className="text-lg font-bold text-slate-800">Features</h2>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl px-5">
                          {features.map(f => <FeatureRow key={f} name={f} />)}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">*Information listed is subject to change without notice.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── FEATURES ── */}
                {activeTab === 'features' && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><span>📋</span> Features</h2>
                    <div className="bg-white border border-slate-200 rounded-xl px-5 mb-4">
                      {features.length > 0
                        ? features.map(f => <FeatureRow key={f} name={f} />)
                        : <p className="text-slate-400 text-sm py-4">No features listed.</p>
                      }
                    </div>
                    <p className="text-xs text-slate-400">*Information listed is subject to change without notice and should not be construed as a commitment by EduPortal.</p>

                    {/* Location section */}
                    <div className="mt-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><span>📍</span> Location</h2>
                      <div className="bg-slate-100 rounded-xl h-52 flex items-center justify-center text-slate-400 border border-slate-200">
                        <div className="text-center">
                          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">{uni.address || `${uni.city}, ${uni.country}`}</p>
                          {uni.latitude && <p className="text-xs mt-1 text-brand-500">Map: {uni.latitude}, {uni.longitude}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── LOCATION ── */}
                {activeTab === 'location' && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5"/>Location</h2>
                    <div className="bg-slate-100 rounded-xl h-64 flex items-center justify-center text-slate-400 border border-slate-200 mb-4">
                      <div className="text-center">
                        <MapPin className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="font-semibold text-slate-600">{uni.city}, {uni.country}</p>
                        <p className="text-sm mt-1">{uni.address}</p>
                        {uni.latitude && <p className="text-xs mt-2 text-brand-500 font-mono">{uni.latitude}°, {uni.longitude}°</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SCHOLARSHIPS ── */}
                {activeTab === 'scholarships' && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span>💰</span> Scholarships
                      <span className="bg-slate-100 text-slate-600 text-sm px-2 py-0.5 rounded-full">{scholarships.length}</span>
                    </h2>
                    {scholarships.length === 0
                      ? <p className="text-slate-400 text-sm">No scholarships available for this university.</p>
                      : <div className="grid sm:grid-cols-2 gap-4">
                          {scholarships.map(s => (
                            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                              <h3 className="font-bold text-slate-800 mb-0.5">{s.name}</h3>
                              <p className="text-xs text-slate-500 mb-3">{uni.name}</p>
                              <div className="space-y-2 mb-3">
                                {[['Amount',s.amount_text||'—'],['Auto applied',s.auto_applied?'Yes':'No'],['Eligible nationalities',s.eligible_nationalities||'All'],['Eligible program levels',s.eligible_levels||'All']].map(([k,v])=>(
                                  <div key={k}>
                                    <div className="text-xs font-bold text-slate-700">{k}</div>
                                    <div className="text-sm text-slate-600 truncate">{v}</div>
                                  </div>
                                ))}
                              </div>
                              <button className="text-sm text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1">
                                Learn more <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                )}

                {/* ── PROGRAMS ── */}
                {activeTab === 'programs' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" /> Programs
                        <span className="bg-slate-100 text-slate-600 text-sm px-2 py-0.5 rounded-full">{programs.length}</span>
                      </h2>
                      <div className="flex items-center gap-2">
                        <input value={progSearch} onChange={e=>setProgSearch(e.target.value)} placeholder="Search programs…"
                          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-48 bg-white" />
                        <select value={progLevel} onChange={e=>setProgLevel(e.target.value)}
                          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                          <option value="">All Levels</option>
                          {['Bachelor','Master','PhD','Diploma','Certificate'].map(l=><option key={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {programs.length === 0
                        ? <p className="text-slate-400 text-sm">No programs found.</p>
                        : programs.map(p => (
                            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-sm transition-all">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-lg shrink-0">🎓</div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-slate-800">{p.name}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">{uni.name}</div>
                                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                                    <span><span className="text-slate-400">Earliest intake:</span> <b>{(p.available_intakes||'').split(',')[0]||'—'}</b></span>
                                    <span><span className="text-slate-400">Gross tuition:</span> <b>{p.currency} {Number(p.tuition_fee||0).toLocaleString()}</b></span>
                                    <span><span className="text-slate-400">Application fee:</span> <b>{p.application_fee==0?'Free':`${p.app_fee_currency} ${p.application_fee}`}</b></span>
                                    {p.commission_text && <span><span className="text-slate-400">Commission:</span> <b>{p.commission_text}</b></span>}
                                  </div>
                                  {/* Tags */}
                                  {p.tags && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {p.tags.split(',').slice(0,4).map(t=>(
                                        <span key={t} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TAG_COLORS[t]||'bg-slate-50 text-slate-500 border-slate-200'}`}>{t}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button className="flex items-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold px-4 py-2 rounded-xl text-sm transition-colors border border-brand-200 shrink-0">
                                  Create application <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="w-64 shrink-0 space-y-4">
            {/* Institution Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-3">Institution Details</h3>
              <div className="space-y-2.5">
                {[
                  ['Founded', uni.founded||'—'],
                  ['School ID', uni.id],
                  ['Institution type', uni.institution_type||'Public'],
                  ['World ranking', uni.world_ranking ? `#${uni.world_ranking}` : '—'],
                ].map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                    <span className="text-sm text-slate-500">{k}</span>
                    <span className="text-sm font-semibold text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost & Duration */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-3">Cost and Duration</h3>
              <div className="space-y-3">
                {[
                  ['💰', uni.application_fee_range||'Free', 'Application fee'],
                  ['📅', '1 year', 'Average graduate program'],
                  ['📅', '3 years', 'Average undergraduate program'],
                  ['🏠', uni.cost_of_living||'—', 'Cost of living'],
                  ['🎓', uni.avg_tuition||uni.tuition_info||'—', 'Average Gross tuition'],
                ].map(([icon,v,label]) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="text-base mt-0.5">{icon}</span>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{v}</div>
                      <div className="text-xs text-slate-400">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Processing Time */}
            {uni.avg_processing_days && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Application Processing Time
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⏱️</span>
                  <div>
                    <div className="font-bold text-slate-800">{uni.avg_processing_days} day{uni.avg_processing_days!==1?'s':''}</div>
                    <div className="text-xs text-slate-400">Average school decision time</div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Disciplines */}
            {disciplines.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-3">Top Disciplines</h3>
                {disciplines.map(d => (
                  <DisciplineBar key={d.name} name={d.name} pct={d.pct||50} />
                ))}
              </div>
            )}

            {/* Program Levels */}
            {progLevels.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-3">Program Levels</h3>
                <div className="relative flex items-center justify-center py-2">
                  {/* Simple donut representation */}
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                      {progLevels.map((l,i) => {
                        const pct = 100/progLevels.length;
                        const offset = i * pct;
                        const colors = ['#1e40af','#3b82f6','#60a5fa','#93c5fd','#bfdbfe'];
                        return (
                          <circle key={l} cx="18" cy="18" r="15.9" fill="transparent"
                            stroke={colors[i%colors.length]} strokeWidth="3.2"
                            strokeDasharray={`${pct} ${100-pct}`}
                            strokeDashoffset={-offset} />
                        );
                      })}
                    </svg>
                  </div>
                  <div className="ml-3 space-y-1">
                    {progLevels.map((l,i) => {
                      const colors = ['text-blue-800','text-blue-600','text-blue-400','text-blue-300','text-blue-200'];
                      return (
                        <div key={l} className="flex items-center gap-1.5 text-xs">
                          <div className={`w-2.5 h-2.5 rounded-sm ${['bg-blue-800','bg-blue-600','bg-blue-400','bg-blue-300','bg-blue-200'][i%5]}`} />
                          <span className="text-slate-600">{l}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}