// pages/agent/dormitories/index.js
// Browse all dormitories - agent view inside AdminLayout
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import {
  Search, MapPin, Home, RefreshCw, X, ChevronRight,
  Loader2, Building2, Plus
} from 'lucide-react';

function DormCard({ dorm, onApply, onView }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col">
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-slate-100 cursor-pointer" onClick={onView}>
        {dorm.primary_image ? (
          <img src={dorm.primary_image} alt={dorm.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-400">
            <Home className="w-12 h-12 text-white/30" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {dorm.is_featured == 1 && (
            <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              ⭐ Featured
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 onClick={onView}
          className="font-bold text-slate-900 text-sm leading-tight mb-1 group-hover:text-emerald-700 transition-colors cursor-pointer line-clamp-2">
          {dorm.name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{[dorm.city, dorm.country].filter(Boolean).join(', ') || 'Location not set'}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3 mt-auto">
          <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
            <div className="text-sm font-bold text-slate-800">{dorm.room_count || 0}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Rooms</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2 text-center border border-emerald-100">
            <div className="text-xs font-bold text-emerald-700 truncate pt-0.5">{dorm.city || '—'}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">City</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onView}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-colors">
            <Building2 className="w-3.5 h-3.5" /> View Details
          </button>
          <button onClick={onApply}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors">
            <Plus className="w-3.5 h-3.5" /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentDormitoriesPage() {
  const router  = useRouter();
  const isStudent = router.pathname.startsWith('/student/');
  const basePath  = isStudent ? '/student' : '/agent';

  const [dorms,        setDorms]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [searched,     setSearched]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch('/api/admin/hotels?status=active').then(r => r.json());
      let list = data.hotels || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(h =>
          h.name?.toLowerCase().includes(q) ||
          h.city?.toLowerCase().includes(q) ||
          h.country?.toLowerCase().includes(q)
        );
      }
      setDorms(list);
    } catch {
      setDorms([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, []);

  function handleSearch(e) {
    e?.preventDefault();
    setSearched(true);
    load();
  }

  function clearSearch() {
    setSearch('');
    setSearched(false);
    load();
  }

  return (
    <AdminLayout title="Browse Dormitories">
      {/* Hero banner */}
      <div className="bg-emerald-700 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative">
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Georgia,serif' }}>
            Student Dormitories
          </h1>
          <p className="text-emerald-100/80 text-sm mb-4">
            Browse all available student accommodation options
          </p>
          {/* Search */}
          <form onSubmit={handleSearch}>
            <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-lg max-w-xl">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, city or country..."
                  className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')}>
                    <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </div>
              <button type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-sm transition-colors">
                Search
              </button>
            </div>
          </form>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            {['Karachi', 'Lahore', 'UK', 'Malaysia', 'Turkey', 'Australia'].map(city => (
              <button key={city}
                onClick={() => { setSearch(city); setSearched(true); setTimeout(load, 0); }}
                className="text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3 py-1.5 rounded-full transition-colors">
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {searched && search ? `Results for "${search}"` : 'All Available Dormitories'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${dorms.length} propert${dorms.length !== 1 ? 'ies' : 'y'} found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(searched || search) && (
            <button onClick={clearSearch}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-3 py-2 rounded-xl transition-colors bg-white">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <button onClick={load}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors bg-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin mb-2 text-emerald-500" />
          <p className="text-sm">Loading dormitories…</p>
        </div>
      ) : dorms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Home className="w-8 h-8 opacity-30" />
          </div>
          <h3 className="text-base font-bold text-slate-600 mb-1">No dormitories found</h3>
          <p className="text-sm mb-4">
            {search ? `No results for "${search}"` : 'No dormitories available right now'}
          </p>
          {search && (
            <button onClick={clearSearch}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              <X className="w-4 h-4" /> Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {dorms.map(dorm => (
            <DormCard
              key={dorm.id}
              dorm={dorm}
              onView={() => router.push(`${basePath}/dormitories/${dorm.slug}`)}
              onApply={() => router.push(`${basePath}/dorm-applications/new?hotel=${dorm.id}`)}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}