// pages/agent/applications.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import ApplicationWizard from '../../components/ApplicationWizard';
import {
  Plus, Filter, RefreshCw, ChevronLeft, ChevronRight, Search,
  X, ChevronDown, Eye, FileText, CheckCircle, Clock, XCircle,
  Users, Calendar, MoreHorizontal, Award, TrendingUp, Inbox
} from 'lucide-react';
import usePermissions, { AccessDenied } from '../../lib/usePermissions';

const STATUS_CFG = {
  'Submitted':        { bg:'bg-blue-50',    text:'text-blue-700',    border:'border-blue-200',    dot:'bg-blue-500'    },
  'Under Review':     { bg:'bg-amber-50',   text:'text-amber-700',   border:'border-amber-200',   dot:'bg-amber-500'   },
  'Accepted':         { bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200', dot:'bg-emerald-500' },
  'Offer Received':   { bg:'bg-teal-50',    text:'text-teal-700',    border:'border-teal-200',    dot:'bg-teal-500'    },
  'Conditional Offer':{ bg:'bg-purple-50',  text:'text-purple-700',  border:'border-purple-200',  dot:'bg-purple-500'  },
  'Rejected':         { bg:'bg-red-50',     text:'text-red-600',     border:'border-red-200',     dot:'bg-red-500'     },
  'Enrolled':         { bg:'bg-green-50',   text:'text-green-700',   border:'border-green-200',   dot:'bg-green-500'   },
  'Withdrawn':        { bg:'bg-slate-100',  text:'text-slate-500',   border:'border-slate-200',   dot:'bg-slate-400'   },
  'Pending':          { bg:'bg-slate-100',  text:'text-slate-600',   border:'border-slate-200',   dot:'bg-slate-400'   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG['Pending'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`}/>
      {status || 'Pending'}
    </span>
  );
}

function StatBox({ icon: Icon, label, value, color, onClick }) {
  const colors = {
    blue:    { bg:'bg-blue-50',    text:'text-blue-700',    icon:'text-blue-500'    },
    amber:   { bg:'bg-amber-50',   text:'text-amber-700',   icon:'text-amber-500'   },
    emerald: { bg:'bg-emerald-50', text:'text-emerald-700', icon:'text-emerald-500' },
    red:     { bg:'bg-red-50',     text:'text-red-700',     icon:'text-red-500'     },
    purple:  { bg:'bg-purple-50',  text:'text-purple-700',  icon:'text-purple-500'  },
    slate:   { bg:'bg-slate-50',   text:'text-slate-700',   icon:'text-slate-500'   },
  };
  const c = colors[color] || colors.slate;
  return (
    <div onClick={onClick} className={`${c.bg} rounded-2xl p-4 flex items-center gap-3 ${onClick?'cursor-pointer hover:opacity-80 transition-opacity':''}`}>
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
        <Icon className={`w-5 h-5 ${c.icon}`}/>
      </div>
      <div>
        <div className={`text-xl font-bold ${c.text}`}>{value}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  );
}

function DropFilter({ label, value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={e=>onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-slate-300 transition-colors cursor-pointer min-w-[140px]">
        <option value="">{label}</option>
        {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"/>
    </div>
  );
}

const STATUSES = ['Submitted','Under Review','Accepted','Offer Received','Conditional Offer','Rejected','Enrolled','Withdrawn'];

export default function AgentApplications() {
  const router = useRouter();

  // ── PERMISSIONS ──────────────────────────────────────────────
  const { can, isEmployee, loading: permLoading } = usePermissions();

  const [apps, setApps]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [intakeFilter, setIntake] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [wizardOpen, setWizardOpen]   = useState(false);
  const [selected, setSelected]       = useState(new Set());
  const searchRef = useRef(null);
  const LIMIT = 20;

  const [colFilters, setColFilters] = useState({
    app_id:'', student_id:'', first_name:'', last_name:'',
    program:'', school:'', payment_from:'', payment_to:'',
    start_from:'', start_to:''
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // agent_employee: fetch only their assigned students' applications
      let url;
      if (isEmployee) {
        url = '/api/agent-employee/applications';
      } else {
        const p = new URLSearchParams({ page, limit:LIMIT });
        if (search)       p.set('search', search);
        if (statusFilter) p.set('status', statusFilter);
        if (intakeFilter) p.set('intake', intakeFilter);
        url = `/api/applications?${p}`;
      }
      const data = await fetch(url).then(r=>r.json());
      setApps(data.applications||[]);
      setTotal(data.total||(data.applications||[]).length||0);
      setPages(data.pages||1);
      setSelected(new Set());
    } finally { setLoading(false); }
  }, [page, search, statusFilter, intakeFilter, isEmployee]);

  useEffect(()=>{ if (!permLoading) load(); },[load, permLoading]);

  // Block page if employee has no view_applications permission
  if (!permLoading && isEmployee && !can('view_applications')) {
    return (
      <AdminLayout title="Applications">
        <AccessDenied message="You don't have permission to view applications. Ask your agent to grant you access." />
      </AdminLayout>
    );
  }

  function setCol(k,v) { setColFilters(f=>({...f,[k]:v})); }

  function clearAll() {
    setSearch(''); setStatus(''); setIntake('');
    setColFilters({ app_id:'',student_id:'',first_name:'',last_name:'',program:'',school:'',payment_from:'',payment_to:'',start_from:'',start_to:'' });
    setPage(1);
  }

  const filtered = apps.filter(a => {
    const cf = colFilters;
    if (cf.app_id     && !String(a.app_code||'').toLowerCase().includes(cf.app_id.toLowerCase())) return false;
    if (cf.student_id && !String(a.student_id||'').includes(cf.student_id)) return false;
    if (cf.first_name && !a.first_name?.toLowerCase().includes(cf.first_name.toLowerCase())) return false;
    if (cf.last_name  && !a.last_name?.toLowerCase().includes(cf.last_name.toLowerCase()))  return false;
    if (cf.program    && !a.program_name?.toLowerCase().includes(cf.program.toLowerCase())) return false;
    if (cf.school     && !a.university_name?.toLowerCase().includes(cf.school.toLowerCase())) return false;
    if (cf.payment_from && a.payment_date && a.payment_date < cf.payment_from) return false;
    if (cf.payment_to  && a.payment_date && a.payment_date > cf.payment_to)   return false;
    if (cf.start_from  && a.intake && (a.intake+'-01') < cf.start_from) return false;
    if (cf.start_to    && a.intake && (a.intake+'-01') > cf.start_to)   return false;
    return true;
  });

  const counts = apps.reduce((acc,a) => { acc[a.status]=(acc[a.status]||0)+1; return acc; }, {});
  const hasActiveFilters = search||statusFilter||intakeFilter||Object.values(colFilters).some(Boolean);

  function toggleSelectAll() {
    if (selected.size===filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a=>a.id)));
  }
  function toggleSelect(id) {
    const s = new Set(selected);
    s.has(id)?s.delete(id):s.add(id);
    setSelected(s);
  }

  function viewApp(a) { router.push(`/agent/application/${a.id}`); }
  function viewStudent(a) { router.push(`/agent/student/${a.student_id}`); }

  const inp = "w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white placeholder-slate-300 font-medium";
  const dat = "w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white text-slate-600";

  return (
    <AdminLayout title="Applications">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Applications</h2>
          <p className="text-sm text-slate-500 mt-1">
            {loading?'Loading…':`${total} total applications`}
            {hasActiveFilters&&<span className="ml-2 text-brand-600 font-semibold">· Filtered</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors">
            <RefreshCw className="w-4 h-4"/>
          </button>

          {/* Column filters — hide for employees */}
          {!isEmployee && (
            <button onClick={()=>setShowFilters(f=>!f)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors
                ${showFilters?'bg-brand-600 border-brand-600 text-white':'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
              <Filter className="w-4 h-4"/>Column Filters
              {Object.values(colFilters).some(Boolean)&&<span className="bg-white/30 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{Object.values(colFilters).filter(Boolean).length}</span>}
            </button>
          )}

          {/* New Application — only if can_add_applications */}
          {can('add_applications') && (
            <button onClick={()=>router.push('/agent/applications/new')}
              className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
              <Plus className="w-4 h-4"/>New Application
            </button>
          )}
        </div>
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <StatBox icon={FileText}    label="Total"        value={total}                    color="slate"   onClick={()=>{ setStatus(''); setPage(1); }}/>
        <StatBox icon={Clock}       label="Submitted"    value={counts['Submitted']||0}   color="blue"    onClick={()=>{ setStatus('Submitted'); setPage(1); }}/>
        <StatBox icon={TrendingUp}  label="Under Review" value={counts['Under Review']||0} color="amber"  onClick={()=>{ setStatus('Under Review'); setPage(1); }}/>
        <StatBox icon={CheckCircle} label="Accepted"     value={counts['Accepted']||0}    color="emerald" onClick={()=>{ setStatus('Accepted'); setPage(1); }}/>
        <StatBox icon={Award}       label="Enrolled"     value={counts['Enrolled']||0}    color="purple"  onClick={()=>{ setStatus('Enrolled'); setPage(1); }}/>
        <StatBox icon={XCircle}     label="Rejected"     value={counts['Rejected']||0}    color="red"     onClick={()=>{ setStatus('Rejected'); setPage(1); }}/>
      </div>

      {/* Search + filters bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input ref={searchRef} value={search}
              onChange={e=>{ setSearch(e.target.value); setPage(1); }}
              onKeyDown={e=>e.key==='Enter'&&load()}
              placeholder="Search by student, university, program, app ID…"
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium placeholder-slate-400"/>
            {search&&(
              <button onClick={()=>{ setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4"/>
              </button>
            )}
          </div>
          <DropFilter label="All Statuses" value={statusFilter} onChange={v=>{ setStatus(v); setPage(1); }}
            options={STATUSES.map(s=>({value:s,label:s}))}/>
          {hasActiveFilters&&(
            <button onClick={clearAll} className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-700 px-3 py-2.5 rounded-xl hover:bg-red-50 border border-red-200 transition-colors">
              <X className="w-3.5 h-3.5"/>Clear all
            </button>
          )}
          {selected.size>0&&(
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl">{selected.size} selected</span>
              <button className="text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-xl border border-brand-200 transition-colors">Export</button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50">
                <th className="px-4 py-4 w-10">
                  <input type="checkbox" checked={filtered.length>0&&selected.size===filtered.length} onChange={toggleSelectAll}
                    className="w-4 h-4 accent-brand-600 rounded cursor-pointer"/>
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">App ID</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-56">Program</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-48">University</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Intake</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Applied</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>

              {/* Column filter row — hidden for employees */}
              {showFilters && !isEmployee &&(
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <td className="px-4 py-2"/>
                  <td className="px-2 py-2 min-w-[110px]">
                    <input className={inp} value={colFilters.app_id} onChange={e=>setCol('app_id',e.target.value)} placeholder="Filter App ID"/>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1">
                      <input className={inp} value={colFilters.first_name} onChange={e=>setCol('first_name',e.target.value)} placeholder="First"/>
                      <input className={inp} value={colFilters.last_name}  onChange={e=>setCol('last_name',e.target.value)}  placeholder="Last"/>
                    </div>
                  </td>
                  <td className="px-2 py-2"><input className={inp} value={colFilters.program} onChange={e=>setCol('program',e.target.value)} placeholder="Filter program"/></td>
                  <td className="px-2 py-2"><input className={inp} value={colFilters.school} onChange={e=>setCol('school',e.target.value)} placeholder="Filter school"/></td>
                  <td className="px-2 py-2">
                    <div className="space-y-1">
                      <input type="date" className={dat} value={colFilters.start_from} onChange={e=>setCol('start_from',e.target.value)}/>
                      <input type="date" className={dat} value={colFilters.start_to}   onChange={e=>setCol('start_to',e.target.value)}/>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="space-y-1">
                      <input type="date" className={dat} value={colFilters.payment_from} onChange={e=>setCol('payment_from',e.target.value)}/>
                      <input type="date" className={dat} value={colFilters.payment_to}   onChange={e=>setCol('payment_to',e.target.value)}/>
                    </div>
                  </td>
                  <td className="px-2 py-2"/>
                  <td className="px-2 py-2">
                    {Object.values(colFilters).some(Boolean)&&(
                      <button onClick={()=>setColFilters({app_id:'',student_id:'',first_name:'',last_name:'',program:'',school:'',payment_from:'',payment_to:'',start_from:'',start_to:''})}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1">
                        <X className="w-3 h-3"/>Clear
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading?(
                <tr><td colSpan={9} className="py-20 text-center"><Spinner size="lg"/></td></tr>
              ):filtered.length===0?(
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Inbox className="w-8 h-8 opacity-50"/>
                      </div>
                      <p className="font-semibold text-slate-500">No applications found</p>
                      <p className="text-sm">{isEmployee ? 'No applications for your assigned students yet' : 'Try adjusting your filters or create a new application'}</p>
                      {can('add_applications') && (
                        <button onClick={()=>router.push('/agent/applications/new')}
                          className="mt-1 flex items-center gap-2 bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
                          <Plus className="w-4 h-4"/>New Application
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ):filtered.map(a=>{
                const isSelected = selected.has(a.id);
                const studentName = a.first_name&&a.last_name ? `${a.first_name} ${a.last_name}` : a.student_name||'—';
                const initials = (a.first_name?a.first_name[0]:'?').toUpperCase() + (a.last_name?a.last_name[0]:'').toUpperCase();
                return (
                  <tr key={a.id}
                    onClick={()=>viewApp(a)}
                    className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${isSelected?'bg-brand-50':''}`}>

                    <td className="px-4 py-4" onClick={e=>e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={()=>toggleSelect(a.id)}
                        className="w-4 h-4 accent-brand-600 rounded cursor-pointer"/>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm font-bold text-brand-600">{a.app_code}</span>
                    </td>
                    <td className="px-4 py-4" onClick={e=>e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-400 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                          {initials}
                        </div>
                        <div>
                          {/* View student — only if can_view_students */}
                          {can('view_students') ? (
                            <button onClick={()=>viewStudent(a)}
                              className="font-semibold text-sm text-slate-800 hover:text-brand-700 transition-colors leading-tight block">
                              {studentName}
                            </button>
                          ) : (
                            <span className="font-semibold text-sm text-slate-800">{studentName}</span>
                          )}
                          <div className="text-xs text-slate-400 mt-0.5">ID #{a.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {a.program_name?(
                        <div>
                          <span className="text-sm font-semibold text-slate-800 line-clamp-2 max-w-[200px] leading-snug block">{a.program_name}</span>
                          {a.level&&<span className="text-xs text-slate-400 mt-0.5 block">{a.level}</span>}
                        </div>
                      ):<span className="text-slate-400 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-base">{a.flag||'🏫'}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-800 line-clamp-2 max-w-[150px] leading-snug">{a.university_name||'—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {a.intake?(
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
                          <span className="text-sm font-semibold text-slate-700">{a.intake}</span>
                        </div>
                      ):<span className="text-slate-400 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600 font-medium">
                        {a.applied_date?new Date(a.applied_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}
                      </span>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={a.status}/></td>
                    <td className="px-4 py-4" onClick={e=>e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* View app — always */}
                        <button onClick={()=>viewApp(a)} title="View application"
                          className="p-2 rounded-lg hover:bg-brand-50 hover:text-brand-600 text-slate-400 transition-colors">
                          <Eye className="w-4 h-4"/>
                        </button>
                        {/* View student — only if can_view_students */}
                        {can('view_students') && (
                          <button onClick={()=>viewStudent(a)} title="View student profile"
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <Users className="w-4 h-4"/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading&&filtered.length>0&&(
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <span className="font-bold text-slate-700">{filtered.length}</span> of <span className="font-bold text-slate-700">{total}</span> applications</span>
            {selected.size>0&&<span className="font-bold text-brand-600">{selected.size} selected</span>}
          </div>
        )}
      </div>

      {/* Pagination — hide for employees */}
      {!loading && pages>1 && !isEmployee && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">
            Page {page} of {pages} · {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)} of {total}
          </span>
          <div className="flex items-center gap-1.5">
            <button onClick={()=>setPage(1)} disabled={page<=1} className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white text-xs font-bold text-slate-600">First</button>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-600"/>
            </button>
            {Array.from({length:Math.min(5,pages)},(_,i)=>{
              const p=Math.max(1,Math.min(pages-4,page-2))+i;
              return <button key={p} onClick={()=>setPage(p)}
                className={`w-10 h-10 rounded-xl border text-sm font-bold transition-all ${p===page?'bg-brand-700 text-white border-brand-700 shadow-sm':'border-slate-200 hover:bg-slate-50 bg-white text-slate-700'}`}>{p}</button>;
            })}
            <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-600"/>
            </button>
            <button onClick={()=>setPage(pages)} disabled={page>=pages} className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white text-xs font-bold text-slate-600">Last</button>
          </div>
        </div>
      )}

      <ApplicationWizard open={wizardOpen} onClose={()=>setWizardOpen(false)} program={null} userRole="agent"/>
    </AdminLayout>
  );
}