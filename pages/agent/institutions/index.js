// pages/agent/institutions/index.js
// University browser with photos — separate from the Programs page
// Does NOT touch pages/agent/universities.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import {
  Search, Building2, RefreshCw, Eye, X, ChevronLeft, ChevronRight,
  MapPin, BookOpen, Star, DollarSign, Loader2, CheckCircle, Globe,
  GraduationCap, Grid3x3, List
} from 'lucide-react';

const SEASON_COLORS = {
  Fall:   'bg-amber-50 border-amber-300 text-amber-700',
  Winter: 'bg-sky-50 border-sky-300 text-sky-700',
  Spring: 'bg-green-50 border-green-300 text-green-700',
  Summer: 'bg-orange-50 border-orange-300 text-orange-700',
};

function safeArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return []; }
}

// ── University Card with image ────────────────────────────────
function UniCard({ u, onView }) {
  const photos  = safeArr(u.photos);
  const cover   = photos[0];
  const intakes = u.intakes ? u.intakes.split(',').filter(Boolean) : [];

  return (
    <div onClick={() => onView(u)}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-300 transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer">

      {/* Cover image */}
      <div className={`relative h-40 overflow-hidden shrink-0 ${!cover ? 'bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500' : ''}`}>
        {cover
          ? <img src={cover} alt={u.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <Building2 className="w-14 h-14 text-white/20" />
            </div>
          )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Logo initials */}
        <div className="absolute top-3 left-3 w-11 h-11 bg-white rounded-xl flex items-center justify-center font-bold text-brand-700 text-base shadow-md border border-white/80">
          {u.logo_initials || u.name?.[0] || 'U'}
        </div>

        {/* Hover eye */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div className="p-2 rounded-xl bg-black/40 text-white backdrop-blur-sm shadow">
            <Eye className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Ranking badge */}
        {u.world_ranking && (
          <div className="absolute bottom-3 right-3 bg-white/95 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
            #{u.world_ranking}
          </div>
        )}

        {/* University name overlay */}
        <div className="absolute bottom-3 left-3 right-12">
          <div className="font-bold text-white text-sm leading-snug line-clamp-2 drop-shadow">
            {u.name}
          </div>
          {(u.city || u.country) && (
            <div className="flex items-center gap-1 text-white/70 text-xs mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              {[u.city, u.country].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
            <div className="text-sm font-bold text-brand-700">{u.program_count || 0}</div>
            <div className="flex items-center justify-center gap-0.5 mt-0.5">
              <BookOpen className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] text-slate-400">Programs</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
            <div className="text-xs font-bold text-slate-600 truncate pt-0.5">{u.institution_type || '—'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Type</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
            <div className="text-xs font-bold text-slate-600 truncate pt-0.5">{u.founded || '—'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Founded</div>
          </div>
        </div>

        {/* Tuition info */}
        {u.tuition_info && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium">{u.tuition_info}</span>
          </div>
        )}

        {/* Intakes */}
        {intakes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {intakes.slice(0, 3).map(intake => {
              const sk = ['Fall', 'Winter', 'Spring', 'Summer'].find(s => intake.startsWith(s));
              const color = sk ? SEASON_COLORS[sk] : 'bg-brand-50 border-brand-100 text-brand-600';
              return <span key={intake} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{intake}</span>;
            })}
            {intakes.length > 3 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">+{intakes.length - 3}</span>
            )}
          </div>
        )}

        {/* View button */}
        <button onClick={() => onView(u)}
          className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold transition-colors">
          <Eye className="w-3.5 h-3.5" /> View University
        </button>
      </div>
    </div>
  );
}

// ── List Row ──────────────────────────────────────────────────
function UniRow({ u, onView }) {
  const photos = safeArr(u.photos);
  const cover  = photos[0];
  const intakes = u.intakes ? u.intakes.split(',').filter(Boolean) : [];

  return (
    <tr onClick={() => onView(u)}
      className="hover:bg-slate-50/80 transition-colors group cursor-pointer border-b border-slate-100 last:border-0">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <div className="w-14 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200">
            {cover
              ? <img src={cover} alt={u.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center text-white text-xs font-bold">{u.logo_initials || 'U'}</div>}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 group-hover:text-brand-700 transition-colors">{u.name}</div>
            {u.world_ranking && <div className="text-xs text-slate-400">Ranked #{u.world_ranking}</div>}
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {[u.city, u.country].filter(Boolean).join(', ') || '—'}
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm font-semibold text-brand-700">{u.program_count || 0}</span>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1">
          {intakes.slice(0, 2).map(intake => {
            const sk = ['Fall', 'Winter', 'Spring', 'Summer'].find(s => intake.startsWith(s));
            const color = sk ? SEASON_COLORS[sk] : 'bg-brand-50 border-brand-100 text-brand-600';
            return <span key={intake} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{intake}</span>;
          })}
          {intakes.length > 2 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">+{intakes.length - 2}</span>}
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="text-xs font-medium text-slate-500">{u.institution_type || '—'}</span>
      </td>
      <td className="px-5 py-4">
        <button className="p-2 rounded-xl hover:bg-brand-50 text-slate-400 hover:text-brand-600 border border-transparent hover:border-brand-200 transition-all opacity-0 group-hover:opacity-100">
          <Eye className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AgentInstitutions() {
  const router = useRouter();
  const basePath = router.pathname.startsWith('/student') ? '/student' : '/agent';

  const [unis,         setUnis]         = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view,         setView]         = useState('grid');
  const LIMIT = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: LIMIT });
      if (search)       p.set('search', search);
      if (statusFilter) p.set('status', statusFilter);
      const data = await fetch(`/api/universities?${p}`).then(r => r.json());
      setUnis(data.universities || []);
      setTotal(data.total || 0);
    } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT) || 1;

  return (
    <AdminLayout title="Institutions">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>
            Institutions
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? '…' : `${total} institution${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Grid / List toggle */}
          <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
            <button onClick={() => setView('grid')}
              className={`p-2.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')}
              className={`p-2.5 rounded-lg transition-colors ${view === 'list' ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={load}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="Search by name, city or country…"
            className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm placeholder-slate-400" />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-600 shadow-sm">
          <option value="">All Status</option>
          {['Partner', 'Active', 'Inactive'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
        </div>
      ) : unis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg mb-1">No institutions found</h3>
          <p className="text-slate-400 text-sm">
            {search ? `No results for "${search}"` : 'No institutions available yet'}
          </p>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }}
              className="mt-4 flex items-center gap-1.5 text-brand-600 font-bold text-sm border border-brand-200 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors">
              <X className="w-3.5 h-3.5" /> Clear search
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-6">
          {unis.map(u => (
            <UniCard key={u.id} u={u} onView={u => router.push(`${basePath}/institution/${u.id}`)} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Institution', 'Location', 'Programs', 'Intakes', 'Type', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unis.map(u => (
                <UniRow key={u.id} u={u} onView={u => router.push(`${basePath}/institution/${u.id}`)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
          <span>Showing <b>{((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)}</b> of <b>{total}</b></span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const p = Math.max(1, Math.min(pages - 4, page - 2)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl border text-sm font-semibold ${p === page ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-200 hover:bg-slate-50 bg-white'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}