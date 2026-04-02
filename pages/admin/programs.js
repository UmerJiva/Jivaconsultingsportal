// pages/admin/programs.js — Admin programs listing
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import {
  Search, Filter, ChevronLeft, ChevronRight, X,
  Eye, Settings, RefreshCw, BookOpen, Plus, AlertCircle
} from 'lucide-react';

const TAG_COLORS = {
  'High Job Demand':       'bg-teal-50 text-teal-700 border-teal-200',
  'Scholarships Available':'bg-green-50 text-green-700 border-green-200',
  'No Visa Cap':           'bg-blue-50 text-blue-700 border-blue-200',
  'Loans':                 'bg-purple-50 text-purple-700 border-purple-200',
  'Prime':                 'bg-sky-50 text-sky-700 border-sky-200',
  'Incentivized':          'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Popular':               'bg-pink-50 text-pink-700 border-pink-200',
  'Fast Acceptance':       'bg-amber-50 text-amber-700 border-amber-200',
  'Instant Submission':    'bg-brand-50 text-brand-700 border-brand-200',
  'Instant Offer':         'bg-teal-50 text-teal-600 border-teal-200',
};

function ProgramCard({ prog }) {
  const router  = useRouter();
  const tags    = (prog.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
  const intakes = (prog.available_intakes||'').split(',').map(i=>i.trim()).filter(Boolean);
  const fee     = prog.tuition_fee ? `${prog.currency||''} ${Number(prog.tuition_fee).toLocaleString()}`.trim() : 'Contact';
  const appFee  = Number(prog.application_fee) === 0 ? 'Free' : `${prog.app_fee_currency||''} ${prog.application_fee}`.trim();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-200 transition-all relative flex flex-col">
      {(prog.instant_offer || prog.instant_submission) && (
        <div className="absolute -top-3 left-4 flex gap-1.5 z-10">
          {prog.instant_submission && <span className="px-2.5 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full shadow-sm">Instant Submission</span>}
          {prog.instant_offer      && <span className="px-2.5 py-0.5 bg-teal-500 text-white text-[10px] font-bold rounded-full shadow-sm">Instant Offer</span>}
        </div>
      )}
      <div className="p-5 pt-6 flex-1">
        {/* University */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-700 to-brand-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            {prog.logo_initials || prog.university_name?.[0] || 'U'}
          </div>
          <button onClick={()=>router.push(`/admin/university/${prog.university_id}`)}
            className="text-sm font-semibold text-brand-600 hover:underline text-left line-clamp-1">
            {prog.university_name}
          </button>
        </div>
        {/* Level + Name */}
        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">{prog.level}</div>
        <h3 className="font-bold text-slate-800 text-[15px] leading-snug mb-3 hover:text-brand-700 cursor-pointer line-clamp-2"
          onClick={()=>router.push(`/admin/program/${prog.id}`)}>
          {prog.name}
        </h3>
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0,3).map(tag=>(
              <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TAG_COLORS[tag]||'bg-slate-50 text-slate-500 border-slate-200'}`}>{tag}</span>
            ))}
            {tags.length > 3 && <span className="text-[10px] text-slate-400 font-semibold self-center">+{tags.length-3}</span>}
          </div>
        )}
        {/* Details */}
        <div className="space-y-1.5 border-t border-slate-100 pt-3 text-sm">
          {[
            ['Location',         `${prog.campus_city||''} ${prog.country ? `· ${prog.country}` : ''}`.trim() || '—'],
            ['Tuition (1st yr)', fee],
            ['Application fee',  appFee],
            ['Duration',         prog.duration_text || (prog.duration_years ? `${prog.duration_years} yrs` : '—')],
          ].map(([k,v])=>(
            <div key={k} className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">{k}</span>
              <span className="font-semibold text-slate-800 text-xs text-right">{v}</span>
            </div>
          ))}
        </div>
        {/* Success chance */}
        <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100 mt-2">
          <span className="text-slate-500">Success chance</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${prog.success_chance==='High'?'bg-emerald-500':prog.success_chance==='Medium'?'bg-amber-500':'bg-red-500'}`}/>
            <span className="font-bold text-slate-700">{prog.success_chance||'High'}</span>
          </div>
        </div>
        {/* Intakes */}
        {intakes.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Available Intakes</div>
            <div className="flex gap-1.5 flex-wrap">
              {intakes.slice(0,3).map(i=>(
                <span key={i} className="text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded-full">{i}</span>
              ))}
              {intakes.length > 3 && <span className="text-[10px] text-slate-400 self-center">+{intakes.length-3}</span>}
            </div>
          </div>
        )}
      </div>
      {/* Actions */}
      <div className="flex items-center gap-2 p-4 pt-0">
        <button onClick={()=>router.push(`/admin/program/${prog.id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 text-slate-600 hover:text-brand-700 text-xs font-bold transition-all">
          <Eye className="w-3.5 h-3.5"/>View
        </button>
        <button onClick={()=>router.push(`/admin/program/${prog.id}/requirements`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-amber-600 text-xs font-bold transition-all">
          <Settings className="w-3.5 h-3.5"/>Requirements
        </button>
      </div>
    </div>
  );
}

export default function AdminPrograms() {
  const router = useRouter();
  const [programs, setPrograms] = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [level, setLevel]       = useState('');
  const [country, setCountry]   = useState('');
  const [sort, setSort]         = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [countries, setCountries]     = useState([]);
  const LIMIT = 12;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams({ page, limit: LIMIT, sort });
      if (search)  p.set('search',  search);
      if (level)   p.set('level',   level);
      if (country) p.set('country', country);

      const res  = await fetch(`/api/programs?${p}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load programs');
        setPrograms([]); setTotal(0); setPages(1);
        return;
      }
      setPrograms(data.programs || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch(e) {
      setError(e.message);
      setPrograms([]); setTotal(0); setPages(1);
    } finally { setLoading(false); }
  }, [page, search, level, country, sort]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/countries').then(r=>r.json()).then(d=>setCountries(d.countries||[])).catch(()=>{});
  }, []);

  const LEVELS = ['Bachelor','Master','PhD','Diploma','Certificate'];

  return (
    <AdminLayout title="Programs">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>Programs</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : error ? 'Error loading' : `${total.toLocaleString()} programs across all universities`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4"/>
          </button>
          <button onClick={()=>router.push('/admin/universities')}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
            <Plus className="w-4 h-4"/>Add via Universities
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-5">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0"/>
          <div>
            <div className="font-bold text-red-700 text-sm">Failed to load programs</div>
            <div className="text-red-600 text-xs mt-0.5 font-mono">{error}</div>
          </div>
          <button onClick={load} className="ml-auto text-xs font-bold text-red-600 hover:text-red-800 border border-red-200 px-3 py-1.5 rounded-xl">Retry</button>
        </div>
      )}

      {/* Search + filters bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}
            placeholder="Search programs, universities, cities…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm"/>
        </div>
        <button onClick={()=>setShowFilters(f=>!f)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${showFilters?'bg-brand-50 border-brand-300 text-brand-700':'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
          <Filter className="w-4 h-4"/>Filters
          {(level||country) && <span className="w-2 h-2 rounded-full bg-brand-600"/>}
        </button>
        <select value={sort} onChange={e=>{ setSort(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-600 shadow-sm">
          <option value="name">Name A–Z</option>
          <option value="ranking">Best Match</option>
          <option value="tuition_asc">Tuition: Low → High</option>
          <option value="tuition_desc">Tuition: High → Low</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Filter Programs</h3>
            <button onClick={()=>{ setLevel(''); setCountry(''); setPage(1); }}
              className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:text-red-700">
              <X className="w-3 h-3"/>Clear filters
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Level</label>
              <select value={level} onChange={e=>{ setLevel(e.target.value); setPage(1); }}
                className="w-full border border-slate-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="">All Levels</option>
                {LEVELS.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Country</label>
              <select value={country} onChange={e=>{ setCountry(e.target.value); setPage(1); }}
                className="w-full border border-slate-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="">All Countries</option>
                {countries.map(c=><option key={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {/* Level quick pills */}
          <div className="flex flex-wrap gap-2">
            {LEVELS.map(l=>(
              <button key={l} onClick={()=>{ setLevel(l===level?'':l); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${level===l?'bg-brand-700 text-white border-brand-700':'border-slate-200 text-slate-600 hover:border-brand-400 bg-white'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg"/></div>
      ) : programs.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-slate-300"/>
          </div>
          <h3 className="font-bold text-slate-600 mb-1 text-lg">No programs found</h3>
          <p className="text-slate-400 text-sm mb-4 text-center max-w-xs">
            {search || level || country ? 'Try adjusting your filters.' : 'Add programs by going to a university and clicking "+ Add Program".'}
          </p>
          {!(search||level||country) && (
            <button onClick={()=>router.push('/admin/universities')}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              <Plus className="w-4 h-4"/>Go to Universities
            </button>
          )}
        </div>
      ) : !error && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-6">
            {programs.map(prog=><ProgramCard key={prog.id} prog={prog}/>)}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span className="text-slate-500">Showing {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)} of {total.toLocaleString()}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white transition-colors">
                  <ChevronLeft className="w-4 h-4"/>
                </button>
                {Array.from({length:Math.min(5,pages)},(_,i)=>{
                  const p = Math.max(1,Math.min(pages-4,page-2))+i;
                  return (
                    <button key={p} onClick={()=>setPage(p)}
                      className={`w-9 h-9 rounded-xl border text-sm font-bold transition-colors ${p===page?'bg-brand-700 text-white border-brand-700':'border-slate-200 hover:bg-slate-50 bg-white'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white transition-colors">
                  <ChevronRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}