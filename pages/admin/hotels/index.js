// pages/admin/hotels/index.js — Dormitory / Student Accommodation management
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import {
  Plus, Search, RefreshCw, Eye, Pencil, Trash2,
  MapPin, Loader2, CheckCircle, Home,
  TrendingUp, Star, ChevronDown
} from 'lucide-react';

const CARD_GRADIENTS = [
  'from-emerald-600 to-emerald-400',
  'from-sky-600 to-sky-400',
  'from-violet-600 to-violet-400',
  'from-amber-600 to-amber-400',
  'from-rose-600 to-rose-400',
  'from-teal-600 to-teal-400',
];

function DormCard({ hotel, index, onEdit, onDelete, onToggleStatus, onClick }) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer group"
      onClick={onClick}>

      {/* Image or gradient */}
      <div className="relative h-40 overflow-hidden">
        {hotel.primary_image ? (
          <img src={hotel.primary_image} alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Home className="w-12 h-12 text-white/40" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {hotel.is_featured && (
            <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">Featured</span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            hotel.status === 'active'   ? 'bg-emerald-500 text-white' :
            hotel.status === 'draft'    ? 'bg-amber-400 text-amber-900' :
                                          'bg-slate-500 text-white'
          }`}>
            {hotel.status === 'active' ? 'Active' : hotel.status === 'draft' ? 'Draft' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-3">
          <h3 className="font-bold text-slate-900 text-base leading-tight mb-1 group-hover:text-emerald-700 transition-colors">
            {hotel.name}
          </h3>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{[hotel.city, hotel.country].filter(Boolean).join(', ') || 'No location set'}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-2.5 text-center">
            <div className="text-base font-bold text-slate-800 leading-none mb-0.5">{hotel.room_count || 0}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Rooms</div>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-2.5 text-center">
            <div className="text-base font-bold text-emerald-700 leading-none mb-0.5 capitalize">{hotel.status}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Status</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => window.open(`/hotels/${hotel.slug}`, '_blank')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm shadow-emerald-100">
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          <button onClick={() => onEdit(hotel)}
            className="w-10 flex items-center justify-center rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onToggleStatus(hotel)}
            className={`w-10 flex items-center justify-center rounded-2xl border transition-all ${
              hotel.status === 'active'
                ? 'border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-400 hover:text-amber-600'
                : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
            title={hotel.status === 'active' ? 'Deactivate' : 'Activate'}>
            <span className={`w-2 h-2 rounded-full ${hotel.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </button>
          <button onClick={() => onDelete(hotel.id, hotel.name)}
            className="w-10 flex items-center justify-center rounded-2xl border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDormitoriesPage() {
  const router = useRouter();
  const [hotels,       setHotels]   = useState([]);
  const [loading,      setLoading]  = useState(true);
  const [search,       setSearch]   = useState('');
  const [statusFilter, setStatus]   = useState('');

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

  async function handleToggleStatus(hotel) {
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
    rooms:    hotels.reduce((s, h) => s + (h.room_count || 0), 0),
  };

  return (
    <AdminLayout title="Dormitories">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>Student Dormitories</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? '…' : `${stats.total} propert${stats.total !== 1 ? 'ies' : 'y'} · ${stats.active} active`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search dormitories, cities..."
              className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm w-52 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={load} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => router.push('/admin/hotels/new')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-200">
            <Plus className="w-4 h-4" /> Add Dormitory
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: Home,        label: 'Total',    value: stats.total,    shade: 'bg-emerald-50', text: 'text-emerald-700', ic: 'text-emerald-600' },
          { icon: CheckCircle, label: 'Active',   value: stats.active,   shade: 'bg-sky-50',     text: 'text-sky-700',     ic: 'text-sky-600'     },
          { icon: Star,        label: 'Featured', value: stats.featured, shade: 'bg-amber-50',   text: 'text-amber-700',   ic: 'text-amber-600'   },
          { icon: TrendingUp,  label: 'Rooms',    value: stats.rooms,    shade: 'bg-violet-50',  text: 'text-violet-700',  ic: 'text-violet-600'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-11 h-11 ${s.shade} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.ic}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-28">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-5">
            <Home className="w-9 h-9 opacity-30" />
          </div>
          <h3 className="text-lg font-bold text-slate-600 mb-1">No dormitories found</h3>
          <p className="text-sm mb-5">{search ? 'Try a different search' : 'Add your first student dormitory'}</p>
          {!search && (
            <button onClick={() => router.push('/admin/hotels/new')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-2xl text-sm">
              <Plus className="w-4 h-4" /> Add First Dormitory
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((hotel, i) => (
            <DormCard
              key={hotel.id}
              hotel={hotel}
              index={i}
              onClick={() => router.push(`/admin/hotels/${hotel.id}/edit`)}
              onEdit={h => router.push(`/admin/hotels/${h.id}/edit`)}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}