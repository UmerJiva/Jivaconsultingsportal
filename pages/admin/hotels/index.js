// pages/admin/hotels/index.js — Hotel management inside EduPortal admin
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import {
  Plus, Search, RefreshCw, Eye, Pencil, Trash2, Hotel,
  MapPin, Star, ChevronLeft, ChevronRight, Loader2,
  CheckCircle, Building2, Globe, TrendingUp
} from 'lucide-react';

function ScoreBadge({ score }) {
  if (!score) return <span className="text-slate-300 text-xs">—</span>;
  const color = score >= 9 ? 'bg-emerald-600' : score >= 8 ? 'bg-emerald-500' : score >= 7 ? 'bg-brand-600' : 'bg-amber-500';
  return (
    <span className={`${color} text-white font-bold text-xs px-2 py-0.5 rounded-lg`}>
      {Number(score).toFixed(1)}
    </span>
  );
}

export default function AdminHotelsPage() {
  const router = useRouter();
  const [hotels, setHotels]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (statusFilter) p.set('status', statusFilter);
      const data = await fetch(`/api/admin/hotels?${p}`).then(r => r.json());
      setHotels(data.hotels || []);
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/hotels/${id}`, { method: 'DELETE' });
    load();
  }

  async function toggleStatus(hotel) {
    const next = hotel.status === 'active' ? 'inactive' : 'active';
    await fetch(`/api/admin/hotels/${hotel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  const filtered = hotels.filter(h =>
    !search ||
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.city?.toLowerCase().includes(search.toLowerCase()) ||
    h.country?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:    hotels.length,
    active:   hotels.filter(h => h.status === 'active').length,
    featured: hotels.filter(h => h.is_featured).length,
    avgScore: hotels.length ? (hotels.reduce((s, h) => s + Number(h.review_score || 0), 0) / hotels.length).toFixed(1) : '—',
  };

  return (
    <AdminLayout title="Hotels">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>Hotels</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? '…' : `${stats.total} propert${stats.total !== 1 ? 'ies' : 'y'} · ${stats.active} active`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search hotels, cities..."
              className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm w-52 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
          <select value={statusFilter} onChange={e => { setStatus(e.target.value); }}
            className="py-2.5 px-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
          <button onClick={load} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => router.push('/admin/hotels/new')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-200">
            <Plus className="w-4 h-4" /> Add Hotel
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { icon: Hotel,      label: 'Total Properties', value: stats.total,    bg: 'bg-emerald-50', text: 'text-emerald-700', icon_color: 'text-emerald-600' },
          { icon: CheckCircle,label: 'Active',           value: stats.active,   bg: 'bg-sky-50',     text: 'text-sky-700',     icon_color: 'text-sky-600'     },
          { icon: Star,       label: 'Featured',         value: stats.featured, bg: 'bg-amber-50',   text: 'text-amber-700',   icon_color: 'text-amber-600'   },
          { icon: TrendingUp, label: 'Avg Score',        value: stats.avgScore, bg: 'bg-violet-50',  text: 'text-violet-700',  icon_color: 'text-violet-600'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.icon_color}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Hotel className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-semibold text-slate-500 mb-1">No hotels found</p>
            <p className="text-sm mb-4">{search ? 'Try a different search' : 'Add your first property to get started'}</p>
            {!search && (
              <button onClick={() => router.push('/admin/hotels/new')}
                className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
                <Plus className="w-4 h-4" /> Add Hotel
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Property</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Stars</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Rooms</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((hotel, i) => (
                  <tr key={hotel.id}
                    className={`border-b border-slate-100 hover:bg-emerald-50/30 transition-colors ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>

                    {/* Property */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          {hotel.primary_image ? (
                            <img src={hotel.primary_image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Building2 className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 leading-tight">{hotel.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{hotel.address || 'No address'}</div>
                          {hotel.is_featured ? (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded mt-0.5 inline-block">Featured</span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{hotel.city}{hotel.country ? `, ${hotel.country}` : ''}</span>
                      </div>
                    </td>

                    {/* Stars */}
                    <td className="px-4 py-4">
                      <div className="flex gap-0.5">
                        {Array.from({ length: hotel.star_rating || 0 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        ))}
                        {Array.from({ length: 5 - (hotel.star_rating || 0) }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-slate-200 fill-slate-200" />
                        ))}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <ScoreBadge score={hotel.review_score} />
                        <span className="text-xs text-slate-400">{hotel.review_label || ''}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{hotel.review_count || 0} reviews</div>
                    </td>

                    {/* Rooms */}
                    <td className="px-4 py-4 text-slate-600 font-medium">
                      {hotel.room_count || 0}
                      <span className="text-xs text-slate-400 font-normal ml-1">type{hotel.room_count !== 1 ? 's' : ''}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <button onClick={() => toggleStatus(hotel)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                          hotel.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : hotel.status === 'draft'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          hotel.status === 'active' ? 'bg-emerald-500' : hotel.status === 'draft' ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                        {hotel.status === 'active' ? 'Active' : hotel.status === 'draft' ? 'Draft' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => window.open(`/hotels/${hotel.slug}`, '_blank')}
                          title="View live page"
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => router.push(`/admin/hotels/${hotel.id}/edit`)}
                          title="Edit hotel"
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(hotel.id, hotel.name)}
                          title="Delete hotel"
                          className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}