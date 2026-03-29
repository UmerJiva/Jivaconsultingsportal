// pages/agent/universities.js  (Programs search page — same for agent & student)
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import { Search, Filter, Heart, ExternalLink, ChevronLeft, ChevronRight, CheckCircle, Zap, X } from 'lucide-react';

const TAG_COLORS = {
  'High Job Demand':      'bg-teal-50 text-teal-700 border-teal-200',
  'Scholarships Available':'bg-green-50 text-green-700 border-green-200',
  'No Visa Cap':          'bg-blue-50 text-blue-700 border-blue-200',
  'Loans':                'bg-purple-50 text-purple-700 border-purple-200',
  'Prime':                'bg-sky-50 text-sky-700 border-sky-200',
  'Incentivized':         'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Popular':              'bg-pink-50 text-pink-700 border-pink-200',
  'Fast Acceptance':      'bg-amber-50 text-amber-700 border-amber-200',
};

function ProgramCard({ prog, onApply }) {
  const router = useRouter();
  const tags = (prog.tags||'').split(',').filter(Boolean);
  const intakes = (prog.available_intakes||'').split(',').filter(Boolean);
  const fee = prog.tuition_fee ? `${prog.currency} ${Number(prog.tuition_fee).toLocaleString()}` : 'Contact';
  const appFee = prog.application_fee == 0 ? 'Free' : `${prog.app_fee_currency} ${prog.application_fee}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative flex flex-col">
      {/* Top badge */}
      {(prog.instant_offer || prog.instant_submission) && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-xs font-bold shadow-md z-10
          ${prog.instant_offer ? 'bg-teal-500' : 'bg-brand-600'}`}>
          {prog.instant_offer ? 'Instant Offer' : 'Instant Submission'}
        </div>
      )}

      <div className="p-5 pt-6 flex-1">
        {/* University */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 bg-brand-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
            {prog.logo_initials || prog.university_name?.[0] || 'U'}
          </div>
          <button onClick={() => router.push(`/student/university/${prog.university_id}`)}
            className="text-sm font-semibold text-brand-600 hover:underline text-left">
            {prog.university_name}
          </button>
        </div>

        {/* Program name */}
        <div className="text-xs text-slate-500 mb-1">{prog.level}</div>
        <h3 className="font-bold text-slate-800 text-base leading-snug mb-3 hover:text-brand-700 cursor-pointer"
          onClick={() => router.push(`/student/university/${prog.university_id}`)}>
          {prog.name}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0,5).map(tag => (
            <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              {tag}
            </span>
          ))}
        </div>

        {/* Details */}
        <div className="space-y-2 border-t border-slate-100 pt-3 mb-3">
          {[
            ['Location', prog.location_text || prog.country || '—'],
            ['Campus city', prog.campus_city || '—'],
            [`Tuition (1st year)`, fee],
            ['Application fee', appFee],
            ['Duration', prog.duration_text || (prog.duration_years ? `${prog.duration_years} years` : '—')],
          ].map(([k,v]) => (
            <div key={k} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{k}</span>
              <span className="font-medium text-slate-800 text-right">{v}</span>
            </div>
          ))}
        </div>

        {/* Success chance */}
        <div className="flex items-center justify-between text-sm py-2 border-t border-slate-100">
          <span className="text-slate-500">Success chance</span>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${prog.success_chance==='High'?'bg-emerald-500':prog.success_chance==='Medium'?'bg-amber-500':'bg-red-500'}`} />
            <span className="font-semibold text-slate-800">{prog.success_chance||'High'}</span>
            <button className="text-xs text-brand-500 hover:underline ml-1">see details</button>
          </div>
        </div>

        {/* Intakes */}
        {intakes.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-1.5">Available intakes</div>
            <div className="flex gap-2 flex-wrap">
              {intakes.map(i => (
                <span key={i} className="text-xs font-semibold text-slate-700">{i}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center gap-2 p-4 pt-0">
        <button onClick={() => onApply(prog)}
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-brand-50 text-brand-600 font-semibold py-2.5 rounded-xl border-2 border-brand-200 hover:border-brand-400 transition-all text-sm">
          Create application <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button className="p-2.5 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500 transition-all">
          <Heart className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AgentPrograms() {
  const router = useRouter();
  const [programs, setPrograms] = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [level, setLevel]       = useState('');
  const [country, setCountry]   = useState('');
  const [sort, setSort]         = useState('ranking');
  const [showFilters, setShowFilters] = useState(false);
  const [countries, setCountries] = useState([]);
  const LIMIT = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: LIMIT, search, level, country, sort });
      for (const [k,v] of [...p.entries()]) { if (!v) p.delete(k); }
      const data = await fetch(`/api/programs?${p}`).then(r=>r.json());
      setPrograms(data.programs||[]);
      setTotal(data.total||0);
      setPages(data.pages||1);
    } finally { setLoading(false); }
  }, [page, search, level, country, sort]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/countries').then(r=>r.json()).then(d=>setCountries(d.countries||[]));
  }, []);

  function handleApply(prog) {
    router.push(`/student/university/${prog.university_id}?apply=${prog.id}`);
  }

  const LEVELS = ['Bachelor','Master','PhD','Diploma','Certificate'];

  return (
    <AdminLayout title="Programs">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>Programs</h2>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? '…' : `${total} programs available`}</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search programs, universities, locations…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
        </div>
        <button onClick={() => setShowFilters(f=>!f)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all
            ${showFilters ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
          <Filter className="w-4 h-4" /> Filters
        </button>
        <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-600">
          <option value="ranking">Best Match</option>
          <option value="tuition_asc">Tuition: Low to High</option>
          <option value="tuition_desc">Tuition: High to Low</option>
          <option value="name">Program Name</option>
        </select>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Filter Programs</h3>
            <button onClick={() => { setLevel(''); setCountry(''); setPage(1); }}
              className="text-xs text-red-500 font-semibold flex items-center gap-1"><X className="w-3 h-3" />Clear</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Program Level</label>
              <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}
                className="w-full border border-slate-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="">All Levels</option>
                {LEVELS.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Country</label>
              <select value={country} onChange={e => { setCountry(e.target.value); setPage(1); }}
                className="w-full border border-slate-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="">All Countries</option>
                {countries.map(c=><option key={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {/* Level filter pills */}
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Level Filter</div>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map(l => (
                <button key={l} onClick={() => { setLevel(l===level?'':l); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                    ${level===l ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-200 text-slate-600 hover:border-brand-400 bg-white'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Programs grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-3">🎓</div>
          <h3 className="font-bold text-slate-700 mb-1">No programs found</h3>
          <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
          {programs.map(prog => (
            <ProgramCard key={prog.id} prog={prog} onApply={handleApply} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Showing {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)} of {total}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page<=1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({length:Math.min(5,pages)},(_,i)=>{ const p=Math.max(1,Math.min(pages-4,page-2))+i; return (
              <button key={p} onClick={()=>setPage(p)} className={`w-9 h-9 rounded-xl border text-sm font-semibold transition-colors ${p===page?'bg-brand-700 text-white border-brand-700':'border-slate-200 hover:bg-slate-50 bg-white'}`}>{p}</button>
            ); })}
            <button onClick={() => setPage(p=>Math.min(pages,p+1))} disabled={page>=pages}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}