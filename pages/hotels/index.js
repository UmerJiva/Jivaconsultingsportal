// pages/hotels/index.js — Student Dormitory Search & Listing
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Search, MapPin, Home, Users, CheckCircle, ChevronRight,
  Loader2, Building2, Star, Phone, Mail, RefreshCw,
  GraduationCap, Shield, Wifi, BookOpen, X
} from 'lucide-react';

// ── Why cards data ────────────────────────────────────────────
const WHY_CARDS = [
  { icon: GraduationCap, title: 'Student-Focused',      sub: 'Accommodation tailored for students',       color: 'bg-emerald-50 text-emerald-600' },
  { icon: Shield,        title: 'Safe & Secure',         sub: 'CCTV, secure access & 24hr reception',     color: 'bg-sky-50 text-sky-600'          },
  { icon: Wifi,          title: 'Study-Friendly',        sub: 'High-speed WiFi & dedicated study rooms',   color: 'bg-violet-50 text-violet-600'    },
  { icon: BookOpen,      title: 'Near Universities',     sub: 'Close to top universities & campuses',      color: 'bg-amber-50 text-amber-600'      },
];

// ── Dormitory Card ────────────────────────────────────────────
function DormCard({ dorm, onClick }) {
  const availableRooms = (dorm.room_count || 0);
  const prices = [];
  // We don't have min/max from list API, just show room count

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {dorm.primary_image ? (
          <img
            src={dorm.primary_image}
            alt={dorm.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-400">
            <Home className="w-14 h-14 text-white/30" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {dorm.is_featured && (
            <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              ⭐ Featured
            </span>
          )}
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
            dorm.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
          }`}>
            {dorm.status === 'active' ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Name */}
        <h3 className="font-bold text-slate-900 text-base leading-tight mb-1.5 group-hover:text-emerald-700 transition-colors line-clamp-2">
          {dorm.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{[dorm.city, dorm.country].filter(Boolean).join(', ') || 'Location not set'}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4 mt-auto">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
            <div className="text-base font-bold text-slate-800 leading-none mb-0.5">{availableRooms}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Rooms</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
            <div className="text-xs font-bold text-emerald-700 leading-none mb-0.5 capitalize pt-1">{dorm.city || '—'}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">City</div>
          </div>
        </div>

        {/* CTA */}
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors shadow-sm shadow-emerald-100"
          onClick={onClick}>
          View Details <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function DormitoriesPage() {
  const router = useRouter();

  const [search,       setSearch]       = useState('');
  const [dorms,        setDorms]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');
  const [searched,     setSearched]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (statusFilter) p.set('status', statusFilter);
      const data = await fetch(`/api/admin/hotels?${p}`).then(r => r.json());
      // Filter by search term client-side
      let list = data.hotels || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(h =>
          h.name?.toLowerCase().includes(q) ||
          h.city?.toLowerCase().includes(q) ||
          h.country?.toLowerCase().includes(q) ||
          h.address?.toLowerCase().includes(q)
        );
      }
      setDorms(list);
    } catch {
      setDorms([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  // Initial load - show all active
  useEffect(() => { load(); }, [statusFilter]);

  function handleSearch(e) {
    e?.preventDefault();
    setSearched(true);
    load();
  }

  function clearSearch() {
    setSearch('');
    setSearched(false);
    setStatusFilter('active');
  }

  return (
    <>
      <Head>
        <title>Student Dormitories | EduPortal</title>
        <meta name="description" content="Find student accommodation and dormitories near top universities." />
      </Head>

      <div className="min-h-screen bg-slate-50">

        {/* ── HERO ── */}
        <div className="bg-emerald-700 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 opacity-30" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 py-14">
            {/* Label */}
            <div className="mb-3">
              <span className="inline-flex items-center gap-2 bg-emerald-600/60 border border-emerald-500/50 text-emerald-100 text-xs font-bold px-3 py-1.5 rounded-full tracking-wide uppercase">
                <Home className="w-3.5 h-3.5" /> Student Accommodation
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: 'Georgia,serif' }}>
              Find Your Perfect<br />
              <span className="text-emerald-300">Student Home</span>
            </h1>
            <p className="text-emerald-100/80 text-lg mb-8 max-w-xl">
              Safe, affordable, study-friendly dormitories near top universities.
            </p>

            {/* ── Search bar ── */}
            <form onSubmit={handleSearch}>
              <div className="flex items-stretch gap-2 bg-white rounded-2xl p-2 shadow-2xl">
                {/* Search input */}
                <div className="flex-1 flex items-center gap-3 px-3 min-w-0">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by city, country or dormitory name..."
                    className="flex-1 outline-none text-slate-800 placeholder-slate-400 text-sm font-medium bg-transparent min-w-0"
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch('')}>
                      <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="border-l border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white cursor-pointer font-medium"
                >
                  <option value="active">Available</option>
                  <option value="">All</option>
                  <option value="inactive">Inactive</option>
                </select>

                {/* Search button */}
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm flex items-center gap-2 shadow-sm shrink-0"
                >
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </form>

            {/* Quick filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['Karachi', 'Lahore', 'Islamabad', 'UK', 'Malaysia', 'Turkey'].map(city => (
                <button key={city}
                  onClick={() => { setSearch(city); setSearched(true); setTimeout(load, 0); }}
                  className="text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3 py-1.5 rounded-full transition-colors">
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── WHY CARDS ── */}
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {WHY_CARDS.map(card => (
              <div key={card.title} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color.split(' ')[0]}`}>
                  <card.icon className={`w-5 h-5 ${card.color.split(' ')[1]}`} />
                </div>
                <div className="font-bold text-slate-800 text-sm leading-snug mb-1">{card.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ── RESULTS ── */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>
                {searched && search ? `Results for "${search}"` : 'All Dormitories'}
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
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
              <p className="text-sm font-medium">Loading dormitories…</p>
            </div>
          ) : dorms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-5">
                <Home className="w-9 h-9 opacity-30" />
              </div>
              <h3 className="text-lg font-bold text-slate-600 mb-1">No dormitories found</h3>
              <p className="text-sm mb-5">
                {search ? `No results for "${search}" — try a different search` : 'No dormitories available right now'}
              </p>
              {search && (
                <button onClick={clearSearch}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
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
                  onClick={() => router.push(`/hotels/${dorm.slug}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}