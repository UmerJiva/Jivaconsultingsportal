// pages/admin/agents.js — Professional redesign
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import {
  UserPlus, Search, RefreshCw, Eye, Pencil, Trash2,
  Mail, Phone, MapPin, Users, Building2, X, ChevronLeft,
  ChevronRight, CheckCircle, AlertCircle, Loader2,
  TrendingUp, Star, Award, DollarSign, ChevronDown,
  MoreHorizontal, Globe, Shield
} from 'lucide-react';
import { apiCall } from '../../lib/useApi';

const TIER_CFG = {
  Platinum: { label:'💎 Platinum', bg:'bg-sky-100',    text:'text-sky-800'    },
  Gold:     { label:'🥇 Gold',     bg:'bg-amber-100',  text:'text-amber-800'  },
  Silver:   { label:'🥈 Silver',   bg:'bg-slate-200',  text:'text-slate-700'  },
  Bronze:   { label:'🥉 Bronze',   bg:'bg-orange-100', text:'text-orange-800' },
};

const STATUS_CFG = {
  Active:   { dot:'bg-emerald-500', badge:'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Inactive: { dot:'bg-red-500',     badge:'bg-red-50 text-red-600 border-red-200'             },
  Pending:  { dot:'bg-amber-500',   badge:'bg-amber-50 text-amber-700 border-amber-200'       },
};

const AVATAR_GRADIENTS = [
  'from-brand-600 to-brand-400',
  'from-violet-600 to-violet-400',
  'from-emerald-600 to-emerald-400',
  'from-amber-600 to-amber-400',
  'from-rose-600 to-rose-400',
  'from-sky-600 to-sky-400',
];

const inp = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white placeholder-slate-300 transition-colors";
const sel = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-700 transition-colors";

function FL({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────
function AgentModal({ open, editing, onClose, onSaved, countries }) {
  const EMPTY = { name:'', email:'', password:'', phone:'', city:'', country_id:'', status:'Active', company_name:'', tier:'Bronze', commission_rate:72.5 };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (open) {
      setForm(editing ? {
        name: editing.name||'', email: editing.email||'', phone: editing.phone||'',
        city: editing.city||'', country_id: editing.country_id||'',
        status: editing.status||'Active', company_name: editing.company_name||'',
        tier: editing.tier||'Bronze', commission_rate: editing.commission_rate||72.5,
      } : EMPTY);
      setError('');
    }
  }, [open, editing]);

  function f(k,v) { setForm(p=>({...p,[k]:v})); }

  async function handleSave() {
    if (!form.name || (!editing && !form.email)) { setError('Name and email are required'); return; }
    setSaving(true); setError('');
    try {
      if (editing) await apiCall(`/api/agents/${editing.id}`, 'PUT', form);
      else await apiCall('/api/agents', 'POST', { ...form, password: form.password || 'Agent@123' });
      onSaved(); onClose();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]" onClick={e=>e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Agent' : 'Add New Agent'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{editing ? 'Update agent details' : 'Create a new agent account'}</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-4 h-4"/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0"/>{error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FL label="Full Name" required><input className={inp} value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Full name"/></FL>
            <FL label="Company Name"><input className={inp} value={form.company_name} onChange={e=>f('company_name',e.target.value)} placeholder="Company Ltd."/></FL>
          </div>

          {!editing && (
            <div className="grid grid-cols-2 gap-4">
              <FL label="Email" required><input type="email" className={inp} value={form.email} onChange={e=>f('email',e.target.value)} placeholder="agent@email.com"/></FL>
              <FL label="Password" hint="Default: Agent@123"><input className={inp} value={form.password} onChange={e=>f('password',e.target.value)} placeholder="Leave blank for default"/></FL>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FL label="Phone"><input className={inp} value={form.phone} onChange={e=>f('phone',e.target.value)} placeholder="+92 300 1234567"/></FL>
            <FL label="City"><input className={inp} value={form.city} onChange={e=>f('city',e.target.value)} placeholder="City"/></FL>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FL label="Country">
              <select className={sel} value={form.country_id} onChange={e=>f('country_id',e.target.value)}>
                <option value="">Select country</option>
                {countries.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
              </select>
            </FL>
            <FL label="Status">
              <select className={sel} value={form.status} onChange={e=>f('status',e.target.value)}>
                {['Active','Inactive','Pending'].map(s=><option key={s}>{s}</option>)}
              </select>
            </FL>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FL label="Tier">
              <select className={sel} value={form.tier} onChange={e=>f('tier',e.target.value)}>
                {['Bronze','Silver','Gold','Platinum'].map(t=><option key={t}>{t}</option>)}
              </select>
            </FL>
            <FL label="Commission Rate (%)">
              <input type="number" step="0.1" className={inp} value={form.commission_rate} onChange={e=>f('commission_rate',e.target.value)} placeholder="72.5"/>
            </FL>
          </div>
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50 shrink-0 rounded-b-3xl">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors shadow-sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin"/>}
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Agent Card ────────────────────────────────────────────────
function AgentCard({ agent, index, onEdit, onDelete, onClick }) {
  const initials  = (agent.name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const gradient  = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const statusCfg = STATUS_CFG[agent.status] || STATUS_CFG.Pending;
  const tierCfg   = TIER_CFG[agent.tier] || null;
  const commission = Number(agent.commission_total||0);

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col"
      onClick={onClick}>

      {/* Top accent bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`}/>

      <div className="p-6 flex-1 flex flex-col">
        {/* Header row — avatar + badges */}
        <div className="flex items-start justify-between mb-4">
          {/* Avatar */}
          <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-black/10 shrink-0`}>
            {initials}
          </div>

          {/* Right badges */}
          <div className="flex flex-col items-end gap-1.5">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusCfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}/>
              {agent.status}
            </span>
            {tierCfg && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierCfg.bg} ${tierCfg.text}`}>
                {tierCfg.label}
              </span>
            )}
          </div>
        </div>

        {/* Name + company */}
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-base leading-tight mb-0.5">{agent.name}</h3>
          {agent.company_name && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3 h-3 shrink-0"/>{agent.company_name}
            </p>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <Mail className="w-3.5 h-3.5 text-slate-300 shrink-0"/>
            <span className="truncate">{agent.email}</span>
          </div>
          {agent.phone && (
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0"/>
              <span>{agent.phone}</span>
            </div>
          )}
          {(agent.city || agent.country) && (
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0"/>
              <span>{[agent.city, agent.country].filter(Boolean).join(', ')} {agent.flag}</span>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-5 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-3 text-center">
            <div className="text-lg font-bold text-slate-800 leading-none mb-1">{agent.total_students||0}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Students</div>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3 text-center">
            <div className="text-lg font-bold text-emerald-700 leading-none mb-1">{agent.active_students||0}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Active</div>
          </div>
          <div className="bg-amber-50 rounded-2xl p-3 text-center">
            <div className="text-sm font-bold text-amber-700 leading-none mb-1">${commission>=1000?`${(commission/1000).toFixed(1)}k`:commission.toLocaleString()}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Earned</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2" onClick={e=>e.stopPropagation()}>
          <button onClick={onClick}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm shadow-emerald-200">
            <Eye className="w-3.5 h-3.5"/>View Profile
          </button>
          <button onClick={e=>{e.stopPropagation();onEdit(agent);}}
            className="w-10 flex items-center justify-center rounded-2xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-all">
            <Pencil className="w-3.5 h-3.5"/>
          </button>
          <button onClick={e=>{e.stopPropagation();onDelete(agent);}}
            className="w-10 flex items-center justify-center rounded-2xl border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
            <Trash2 className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatus] = useState('');
  const [page, setPage]       = useState(1);
  const [countries, setCountries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const LIMIT = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit:LIMIT, offset:(page-1)*LIMIT, search, status:statusFilter });
      const data = await fetch(`/api/agents?${p}`).then(r=>r.json());
      setAgents(data.agents||[]);
      setTotal(data.total||0);
      setPages(Math.ceil((data.total||0)/LIMIT)||1);
    } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ fetch('/api/countries').then(r=>r.json()).then(d=>setCountries(d.countries||[])); },[]);

  async function handleDelete(agent) {
    if (!confirm(`Deactivate "${agent.name}"?`)) return;
    await apiCall(`/api/agents/${agent.id}`, 'DELETE');
    load();
  }

  // Derived stats from current page
  const activeCount  = agents.filter(a=>a.status==='Active').length;
  const totalStudents= agents.reduce((s,a)=>s+Number(a.total_students||0),0);
  const totalCommission = agents.reduce((s,a)=>s+Number(a.commission_total||0),0);

  return (
    <AdminLayout title="Agents">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Agents</h2>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? 'Loading…' : `${total} agent${total!==1?'s':''} · ${activeCount} active`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
              placeholder="Search agents…"
              className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white w-56 font-medium placeholder-slate-300 transition-all focus:w-72 shadow-sm"/>
          </div>
          {/* Status */}
          <div className="relative">
            <select value={statusFilter} onChange={e=>{setStatus(e.target.value);setPage(1);}}
              className="appearance-none pl-4 pr-9 py-2.5 border border-slate-200 rounded-2xl text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer">
              <option value="">All Status</option>
              {['Active','Inactive','Pending'].map(s=><option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"/>
          </div>
          {/* Refresh */}
          <button onClick={load} className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4"/>
          </button>
          {/* Add agent */}
          <button onClick={()=>{ setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-2xl text-sm transition-colors shadow-md shadow-emerald-200">
            <UserPlus className="w-4 h-4"/>Add Agent
          </button>
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { icon:Users,      label:'Total Agents',     value:total,            sub:'Registered',        bg:'bg-brand-600',   shade:'bg-brand-50',   text:'text-brand-700'   },
          { icon:CheckCircle,label:'Active Agents',    value:activeCount,      sub:'Currently active',  bg:'bg-emerald-600', shade:'bg-emerald-50', text:'text-emerald-700' },
          { icon:TrendingUp, label:'Total Students',   value:totalStudents,    sub:'Across all agents', bg:'bg-violet-600',  shade:'bg-violet-50',  text:'text-violet-700'  },
          { icon:DollarSign, label:'Total Commission', value:`$${totalCommission>=1000?`${(totalCommission/1000).toFixed(1)}k`:totalCommission.toLocaleString()}`, sub:'Earned by agents', bg:'bg-amber-500', shade:'bg-amber-50', text:'text-amber-700' },
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${s.shade} rounded-2xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-6 h-6 ${s.text}`}/>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none mb-1">{s.value}</div>
              <div className="text-xs text-slate-400 font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Agent grid ── */}
      {loading ? (
        <div className="flex justify-center py-28"><Spinner size="lg"/></div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-slate-200 border-dashed">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-5">
            <Users className="w-9 h-9 text-slate-300"/>
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No agents found</h3>
          <p className="text-slate-400 text-sm mb-5">{search ? 'Try a different search term' : 'Add your first agent to get started'}</p>
          {!search && (
            <button onClick={()=>setShowModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-2xl text-sm transition-colors">
              <UserPlus className="w-4 h-4"/>Add First Agent
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-7">
          {agents.map((agent, i) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              index={i}
              onClick={() => router.push(`/admin/agent/${agent.id}`)}
              onEdit={a => { setEditing(a); setShowModal(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700">{((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)}</span> of <span className="font-bold text-slate-700">{total}</span> agents
          </span>
          <div className="flex items-center gap-1.5">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}
              className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 bg-white transition-colors shadow-sm">
              <ChevronLeft className="w-4 h-4 text-slate-600"/>
            </button>
            {Array.from({length:Math.min(5,pages)},(_,i)=>{
              const p = Math.max(1,Math.min(pages-4,page-2))+i;
              return (
                <button key={p} onClick={()=>setPage(p)}
                  className={`w-10 h-10 rounded-2xl border text-sm font-bold transition-all shadow-sm
                    ${p===page ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 hover:bg-slate-50 bg-white text-slate-700'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages}
              className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 bg-white transition-colors shadow-sm">
              <ChevronRight className="w-4 h-4 text-slate-600"/>
            </button>
          </div>
        </div>
      )}

      <AgentModal
        open={showModal}
        editing={editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSaved={load}
        countries={countries}
      />
    </AdminLayout>
  );
}