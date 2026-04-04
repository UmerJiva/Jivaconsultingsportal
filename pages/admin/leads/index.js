// pages/admin/leads/index.js
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import {
  Search, RefreshCw, Trash2, ChevronDown, Loader2,
  Mail, Phone, Globe, BookOpen, MessageSquare,
  User, Calendar, TrendingUp, CheckCircle,
  Clock, X, Eye, UserCheck, StickyNote
} from 'lucide-react';

const STATUS_CFG = {
  new:         { label: 'New',         dot: 'bg-sky-500',     badge: 'bg-sky-50 text-sky-700 border-sky-200'         },
  contacted:   { label: 'Contacted',   dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200'       },
  in_progress: { label: 'In Progress', dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200'    },
  converted:   { label: 'Converted',   dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  lost:        { label: 'Lost',        dot: 'bg-red-400',     badge: 'bg-red-50 text-red-600 border-red-200'          },
};

function StatusBadge({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CFG[status] || STATUS_CFG.new;

  return (
    <div className="relative">
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cfg.badge} cursor-pointer hover:opacity-80 transition-opacity`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-20 min-w-[150px] py-1" onClick={e => e.stopPropagation()}>
          {Object.entries(STATUS_CFG).map(([key, s]) => (
            <button key={key} onClick={() => { onChange(key); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors ${status === key ? 'text-emerald-600' : 'text-slate-700'}`}>
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              {s.label}
              {status === key && <CheckCircle className="w-3 h-3 ml-auto text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Detail drawer
function LeadDrawer({ lead, onClose, onUpdate, onDelete }) {
  const [notes, setNotes] = useState(lead?.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setNotes(lead?.notes || ''); }, [lead]);

  async function saveNotes() {
    setSaving(true);
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    onUpdate();
  }

  if (!lead) return null;

  const cfg = STATUS_CFG[lead.status] || STATUS_CFG.new;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white h-full w-full max-w-md flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{lead.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Lead #{lead.id} · {new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3">
            <StatusBadge status={lead.status} onChange={async s => {
              await fetch(`/api/admin/leads/${lead.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s }) });
              onUpdate();
            }} />
            <span className="text-xs text-slate-400">Click to change status</span>
          </div>

          {/* Contact info */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact Details</div>
            {[
              { icon: Mail,     label: 'Email',       value: lead.email,          href: `mailto:${lead.email}` },
              { icon: Phone,    label: 'Phone',        value: lead.phone,          href: `tel:${lead.phone}` },
              { icon: Globe,    label: 'Destination',  value: lead.destination,    href: null },
              { icon: BookOpen, label: 'Field',        value: lead.field_of_study, href: null },
            ].filter(r => r.value).map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</div>
                  {href ? (
                    <a href={href} className="text-sm font-semibold text-emerald-600 hover:underline">{value}</a>
                  ) : (
                    <div className="text-sm font-semibold text-slate-800">{value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Message */}
          {lead.message && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{lead.message}</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5" /> Internal Notes
            </div>
            <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-300" />
            <button onClick={saveNotes} disabled={saving}
              className="mt-2 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              {saving ? 'Saving…' : 'Save Notes'}
            </button>
          </div>

          {/* Meta */}
          <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-100">
            <div>Source: <span className="font-semibold text-slate-600">{lead.source || 'website'}</span></div>
            <div>IP: <span className="font-semibold text-slate-600">{lead.ip_address || '—'}</span></div>
            <div>Submitted: <span className="font-semibold text-slate-600">{new Date(lead.created_at).toLocaleString('en-GB')}</span></div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
          <a href={`mailto:${lead.email}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors">
            <Mail className="w-4 h-4" /> Reply by Email
          </a>
          <button onClick={() => { if (confirm(`Delete lead from ${lead.name}?`)) { onDelete(lead.id); onClose(); } }}
            className="p-2.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLeadsPage() {
  const [leads,       setLeads]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [statusFilter, setStatus]     = useState('');
  const [selected,    setSelected]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: 100 });
      if (statusFilter) p.set('status', statusFilter);
      if (search)       p.set('search', search);
      const data = await fetch(`/api/admin/leads?${p}`).then(r => r.json());
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(id, status) {
    await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function handleDelete(id) {
    await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' });
    load();
  }

  const stats = {
    total:       leads.length,
    new:         leads.filter(l => l.status === 'new').length,
    converted:   leads.filter(l => l.status === 'converted').length,
    in_progress: leads.filter(l => l.status === 'in_progress').length,
  };

  return (
    <AdminLayout title="Leads">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>Leads</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Enquiries from the Jiva Consulting website
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, phone..."
              className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
              <option value="">All Status</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={load} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { icon: User,       label: 'Total Leads',  value: stats.total,       shade: 'bg-slate-50',    text: 'text-slate-700',    ic: 'text-slate-500'    },
          { icon: Clock,      label: 'New',          value: stats.new,         shade: 'bg-sky-50',      text: 'text-sky-700',      ic: 'text-sky-600'      },
          { icon: TrendingUp, label: 'In Progress',  value: stats.in_progress, shade: 'bg-amber-50',   text: 'text-amber-700',    ic: 'text-amber-600'    },
          { icon: CheckCircle,label: 'Converted',    value: stats.converted,   shade: 'bg-emerald-50', text: 'text-emerald-700',  ic: 'text-emerald-600'  },
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-slate-400">
            <User className="w-12 h-12 opacity-20 mb-3" />
            <p className="font-semibold text-slate-500">No leads yet</p>
            <p className="text-sm mt-1">Enquiries from your website will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Name','Contact','Interest','Message','Status','Date',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr key={lead.id}
                    onClick={() => setSelected(lead)}
                    className={`border-b border-slate-100 hover:bg-emerald-50/30 cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>

                    {/* Name */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
                          {lead.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{lead.name}</div>
                          <div className="text-xs text-slate-400">#{lead.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-4">
                      <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()}
                        className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mb-0.5">
                        <Mail className="w-3 h-3" />{lead.email}
                      </a>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
                          className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{lead.phone}
                        </a>
                      )}
                    </td>

                    {/* Interest */}
                    <td className="px-4 py-4">
                      {lead.destination && (
                        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-0.5">
                          <Globe className="w-3 h-3 text-slate-400" />{lead.destination}
                        </div>
                      )}
                      {lead.field_of_study && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-slate-400" />{lead.field_of_study}
                        </div>
                      )}
                    </td>

                    {/* Message */}
                    <td className="px-4 py-4 max-w-[180px]">
                      <p className="text-xs text-slate-500 truncate">{lead.message || '—'}</p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <StatusBadge status={lead.status} onChange={s => handleStatusChange(lead.id, s)} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(lead)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm(`Delete lead from ${lead.name}?`)) handleDelete(lead.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
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

        {!loading && leads.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            Showing <span className="font-bold text-slate-700">{leads.length}</span> of <span className="font-bold text-slate-700">{total}</span> leads
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <LeadDrawer
          lead={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => { load(); setSelected(l => leads.find(x => x.id === l?.id) || null); }}
          onDelete={handleDelete}
        />
      )}
    </AdminLayout>
  );
}