// pages/admin/applications.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import {
  Plus, Filter, RefreshCw, ChevronLeft, ChevronRight,
  X, Eye, Pencil, Trash2, Search, ArrowUpRight
} from 'lucide-react';
import { apiCall } from '../../lib/useApi';

const STATUS_COLORS = {
  'Submitted':        'bg-blue-50 text-blue-700 border-blue-200',
  'Under Review':     'bg-amber-50 text-amber-700 border-amber-200',
  'Accepted':         'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Offer Received':   'bg-teal-50 text-teal-700 border-teal-200',
  'Conditional':      'bg-purple-50 text-purple-700 border-purple-200',
  'Conditional Offer':'bg-purple-50 text-purple-700 border-purple-200',
  'Rejected':         'bg-red-50 text-red-600 border-red-200',
  'Enrolled':         'bg-green-50 text-green-700 border-green-200',
  'Withdrawn':        'bg-slate-100 text-slate-500 border-slate-200',
  'Deferred':         'bg-orange-50 text-orange-700 border-orange-200',
  'Pending':          'bg-slate-100 text-slate-600 border-slate-200',
};

const ALL_STATUSES = [
  'Submitted','Under Review','Conditional Offer','Accepted',
  'Offer Received','Enrolled','Rejected','Withdrawn','Deferred'
];

function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {status || 'Pending'}
    </span>
  );
}

function StatusModal({ open, app, onClose, onSaved }) {
  const [status, setSt] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (app) setSt(app.status || 'Submitted'); }, [app]);
  async function save() {
    setSaving(true);
    try { await apiCall(`/api/applications/${app.id}`, 'PUT', { status }); onSaved(); onClose(); }
    finally { setSaving(false); }
  }
  if (!open || !app) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-xl w-80 p-6" onClick={e=>e.stopPropagation()}>
        <h3 className="font-bold text-slate-800 mb-1">Update Status</h3>
        <p className="text-xs text-slate-500 mb-4">App #{app.app_code} · {app.student_name}</p>
        <select value={status} onChange={e=>setSt(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white mb-4">
          {ALL_STATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand-700 text-white font-bold text-sm disabled:opacity-60">
            {saving ? 'Saving…' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminApplications() {
  const router = useRouter();
  const [apps, setApps]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({ app_id:'', student_id:'', first_name:'', last_name:'', program:'', school:'' });
  const [statusModal, setStatusModal] = useState({ open:false, app:null });
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: LIMIT });
      if (statusFilter) p.set('status', statusFilter);
      const data = await fetch(`/api/applications?${p}`).then(r=>r.json());
      setApps(data.applications||[]);
      setTotal(data.total||0);
      setPages(data.pages||1);
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(()=>{ load(); }, [load]);

  function setF(k,v) { setFilters(f=>({...f,[k]:v})); }

  const filtered = apps.filter(a => {
    if (filters.app_id     && !String(a.app_code||'').includes(filters.app_id)) return false;
    if (filters.student_id && !String(a.student_id||'').includes(filters.student_id)) return false;
    if (filters.first_name && !a.first_name?.toLowerCase().includes(filters.first_name.toLowerCase())) return false;
    if (filters.last_name  && !a.last_name?.toLowerCase().includes(filters.last_name.toLowerCase()))  return false;
    if (filters.program    && !a.program_name?.toLowerCase().includes(filters.program.toLowerCase())) return false;
    if (filters.school     && !a.university_name?.toLowerCase().includes(filters.school.toLowerCase())) return false;
    if (searchVal && !`${a.student_name} ${a.program_name} ${a.university_name} ${a.app_code}`.toLowerCase().includes(searchVal.toLowerCase())) return false;
    return true;
  });

  async function handleWithdraw(a) {
    if (!confirm(`Withdraw application #${a.app_code}?`)) return;
    await apiCall(`/api/applications/${a.id}`, 'PUT', { status: 'Withdrawn' });
    load();
  }

  const inputCls = "w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white placeholder-slate-300";

  return (
    <AdminLayout title="Applications">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>Applications</h2>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? '…' : `${total} total applications`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input value={searchVal} onChange={e=>setSearchVal(e.target.value)} placeholder="Search…"
              className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white w-52"/>
          </div>
          <select value={statusFilter} onChange={e=>{ setStatusFilter(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-600">
            <option value="">All Status</option>
            {ALL_STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
          <button onClick={()=>setShowFilters(f=>!f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors
              ${showFilters?'bg-brand-50 border-brand-300 text-brand-700':'bg-white border-slate-200 text-slate-600'}`}>
            <Filter className="w-4 h-4"/>Filters
          </button>
          <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors">
            <RefreshCw className="w-4 h-4"/>
          </button>
          <button onClick={()=>router.push('/admin/applications/new')}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
            <Plus className="w-4 h-4"/>New Application
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-24">ACTIONS</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">PAYMENT DATE</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">APP ID</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">STUDENT ID</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">APPLY DATE</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">FIRST NAME</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">LAST NAME</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[200px]">PROGRAM</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[180px]">SCHOOL</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">START DATE</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">STATUS</th>
              </tr>

              {/* Per-column filters */}
              {showFilters && (
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <td className="px-2 py-2"/>
                  <td className="px-2 py-2 min-w-[130px]">
                    <input type="date" className={inputCls}/>
                    <input type="date" className={inputCls+' mt-1'}/>
                  </td>
                  <td className="px-2 py-2"><input className={inputCls} value={filters.app_id}     onChange={e=>setF('app_id',e.target.value)}     placeholder="App ID"/></td>
                  <td className="px-2 py-2"><input className={inputCls} value={filters.student_id} onChange={e=>setF('student_id',e.target.value)} placeholder="Student ID"/></td>
                  <td className="px-2 py-2"/>
                  <td className="px-2 py-2"><input className={inputCls} value={filters.first_name} onChange={e=>setF('first_name',e.target.value)} placeholder="First name"/></td>
                  <td className="px-2 py-2"><input className={inputCls} value={filters.last_name}  onChange={e=>setF('last_name',e.target.value)}  placeholder="Last name"/></td>
                  <td className="px-2 py-2"><input className={inputCls} value={filters.program}    onChange={e=>setF('program',e.target.value)}    placeholder="Program"/></td>
                  <td className="px-2 py-2"><input className={inputCls} value={filters.school}     onChange={e=>setF('school',e.target.value)}     placeholder="School"/></td>
                  <td className="px-2 py-2 min-w-[130px]">
                    <input type="date" className={inputCls}/>
                    <input type="date" className={inputCls+' mt-1'}/>
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={()=>setFilters({app_id:'',student_id:'',first_name:'',last_name:'',program:'',school:''})}
                      className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:text-red-700">
                      <X className="w-3 h-3"/>Clear
                    </button>
                  </td>
                </tr>
              )}
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="py-16 text-center"><Spinner size="lg"/></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="py-16 text-center text-slate-400 text-sm">No applications found</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id}
                  className="border-b border-slate-50 hover:bg-brand-50/30 transition-colors cursor-pointer group"
                  onClick={()=>router.push(`/admin/application/${a.id}`)}>

                  {/* Actions — stop propagation so buttons work independently */}
                  <td className="px-3 py-3" onClick={e=>e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={()=>router.push(`/admin/application/${a.id}`)}
                        title="View & Review"
                        className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 transition-colors">
                        <Eye className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={()=>setStatusModal({open:true,app:a})}
                        title="Update status"
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={()=>handleWithdraw(a)}
                        title="Withdraw"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-xs text-slate-500">
                    {a.payment_date ? new Date(a.payment_date).toLocaleDateString('en-CA') : '—'}
                  </td>

                  {/* App ID — clickable, highlighted */}
                  <td className="px-3 py-3" onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>router.push(`/admin/application/${a.id}`)}
                      className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline">
                      {a.app_code}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </button>
                  </td>

                  {/* Student ID */}
                  <td className="px-3 py-3" onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>router.push(`/admin/student/${a.student_id}`)}
                      className="text-xs font-bold text-brand-600 hover:underline">
                      {a.student_id}
                    </button>
                  </td>

                  <td className="px-3 py-3 text-xs text-slate-600">
                    {a.applied_date ? new Date(a.applied_date).toLocaleDateString('en-CA') : '—'}
                  </td>
                  <td className="px-3 py-3 text-xs font-semibold text-slate-800">{a.first_name||'—'}</td>
                  <td className="px-3 py-3 text-xs text-slate-700">{a.last_name||'—'}</td>

                  {/* Program */}
                  <td className="px-3 py-3" onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>a.program_id && router.push(`/admin/program/${a.program_id}`)}
                      className="text-xs font-semibold text-brand-600 hover:underline text-left line-clamp-2 max-w-[200px]">
                      {a.program_name||'—'}
                    </button>
                  </td>

                  {/* School */}
                  <td className="px-3 py-3" onClick={e=>e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      {a.flag && <span className="text-sm shrink-0">{a.flag}</span>}
                      <button onClick={()=>a.university_id && router.push(`/admin/university/${a.university_id}`)}
                        className="text-xs font-semibold text-brand-600 hover:underline text-left line-clamp-2 max-w-[160px]">
                        {a.university_name||'—'}
                      </button>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-xs text-slate-600">{a.intake||'—'}</td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    <StatusBadge status={a.status}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>Showing {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)} of {total}</span>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white">
              <ChevronLeft className="w-4 h-4"/>
            </button>
            {Array.from({length:Math.min(5,pages)},(_,i)=>{
              const p = Math.max(1,Math.min(pages-4,page-2))+i;
              return (
                <button key={p} onClick={()=>setPage(p)}
                  className={`w-9 h-9 rounded-xl border text-sm font-semibold
                    ${p===page?'bg-brand-700 text-white border-brand-700':'border-slate-200 hover:bg-slate-50 bg-white'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white">
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}

      <StatusModal
        open={statusModal.open}
        app={statusModal.app}
        onClose={()=>setStatusModal({open:false,app:null})}
        onSaved={load}
      />
    </AdminLayout>
  );
}