// pages/agent/dorm-applications/index.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import {
  Plus, RefreshCw, Search, X, Eye, Home, Clock,
  CheckCircle, XCircle, ChevronLeft, ChevronRight,
  Inbox, MapPin, FileText, Users
} from 'lucide-react';

const STATUS_CFG = {
  'Submitted':    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  'Under Review': { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  'Approved':     { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Rejected':     { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     dot: 'bg-red-500'     },
  'Cancelled':    { bg: 'bg-slate-100',  text: 'text-slate-500',   border: 'border-slate-200',   dot: 'bg-slate-400'   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG['Submitted'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {status || 'Submitted'}
    </span>
  );
}

function StatBox({ icon: Icon, label, value, color, onClick }) {
  const colors = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: 'text-blue-500'    },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: 'text-amber-500'   },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     icon: 'text-red-500'     },
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   icon: 'text-slate-500'   },
  };
  const c = colors[color] || colors.slate;
  return (
    <div onClick={onClick}
      className={`${c.bg} rounded-2xl p-4 flex items-center gap-3 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}>
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div>
        <div className={`text-xl font-bold ${c.text}`}>{value}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  );
}

export default function AgentDormApplications() {
  const router = useRouter();
  const isStudent = router.pathname.startsWith('/student/');

  const [apps,         setApps]         = useState([]);
  const [total,        setTotal]        = useState(0);
  const [pages,        setPages]        = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: LIMIT });
      if (search)       p.set('search', search);
      if (statusFilter) p.set('status', statusFilter);
      const data = await fetch(`/api/dorm-applications?${p}`).then(r => r.json());
      setApps(data.applications || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const counts = apps.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
  const basePath = isStudent ? '/student' : '/agent';

  return (
    <AdminLayout title="Dorm Applications">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dormitory Applications</h2>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? 'Loading…' : `${total} total applications`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => router.push(`${basePath}/dorm-applications/new`)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-emerald-100 text-sm">
            <Plus className="w-4 h-4" /> New Application
          </button>
        </div>
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <StatBox icon={FileText}    label="Total"        value={total}                        color="slate"   onClick={() => { setStatusFilter(''); setPage(1); }} />
        <StatBox icon={Clock}       label="Submitted"    value={counts['Submitted'] || 0}     color="blue"    onClick={() => { setStatusFilter('Submitted'); setPage(1); }} />
        <StatBox icon={Users}       label="Under Review" value={counts['Under Review'] || 0}  color="amber"   onClick={() => { setStatusFilter('Under Review'); setPage(1); }} />
        <StatBox icon={CheckCircle} label="Approved"     value={counts['Approved'] || 0}      color="emerald" onClick={() => { setStatusFilter('Approved'); setPage(1); }} />
        <StatBox icon={XCircle}     label="Rejected"     value={counts['Rejected'] || 0}      color="red"     onClick={() => { setStatusFilter('Rejected'); setPage(1); }} />
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={e => e.key === 'Enter' && load()}
              placeholder="Search by student or dormitory…"
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium placeholder-slate-400" />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-[150px]">
            <option value="">All Statuses</option>
            {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
              className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-700 px-3 py-2.5 rounded-xl hover:bg-red-50 border border-red-200 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50">
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">App ID</th>
                {!isStudent && <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>}
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Dormitory</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Room</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Move-in</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Docs</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="py-20 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin" /><span className="text-sm">Loading…</span>
                  </div>
                </td></tr>
              ) : apps.length === 0 ? (
                <tr><td colSpan={8} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <Inbox className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-semibold text-slate-500">No applications found</p>
                    <button onClick={() => router.push(`${basePath}/dorm-applications/new`)}
                      className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition-colors">
                      <Plus className="w-4 h-4" /> Apply for Dormitory
                    </button>
                  </div>
                </td></tr>
              ) : apps.map(a => (
                <tr key={a.id}
                  onClick={() => router.push(`${basePath}/dorm-applications/${a.id}`)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-bold text-emerald-700">{a.app_code}</span>
                  </td>
                  {!isStudent && (
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(a.student_name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 leading-tight">{a.student_name}</div>
                          <div className="text-xs text-slate-400">{a.student_email}</div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-slate-800 leading-tight">{a.hotel_name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{[a.city, a.country].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-600">{a.room_name || <span className="text-slate-300">—</span>}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-600">
                      {a.move_in_date
                        ? new Date(a.move_in_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : <span className="text-slate-300">—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-bold text-emerald-700">{a.doc_approved || 0}</span>
                      <span className="text-slate-400">/{a.doc_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <button onClick={() => router.push(`${basePath}/dorm-applications/${a.id}`)}
                      className="p-2 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && apps.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            Showing <span className="font-bold text-slate-700">{apps.length}</span> of <span className="font-bold text-slate-700">{total}</span> applications
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">Page {page} of {pages}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(1)} disabled={page <= 1}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white text-xs font-bold text-slate-600">First</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
            <button onClick={() => setPage(pages)} disabled={page >= pages}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white text-xs font-bold text-slate-600">Last</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}