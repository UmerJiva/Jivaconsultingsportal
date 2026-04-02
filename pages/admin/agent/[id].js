// pages/admin/agent/[id].js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Spinner } from '../../../components/ui/index';
import {
  ArrowLeft, Save, CheckCircle, AlertTriangle, Loader2, Mail,
  Phone, MapPin, Users, FileText, Building2, Globe, Award,
  MessageSquare, Send, X, Pencil, Shield, Calendar,
  TrendingUp, BookOpen, DollarSign, ChevronDown, ChevronUp,
  ExternalLink, Plus, Check, AlertCircle
} from 'lucide-react';
import { apiCall } from '../../../lib/useApi';
import useAdminPermissions from '../../../lib/useAdminPermissions';

const inp = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder-slate-300";
const sel = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700";

const STATUS_COLORS = {
  'Submitted':   'bg-blue-50 text-blue-700 border-blue-200',
  'Under Review':'bg-amber-50 text-amber-700 border-amber-200',
  'Accepted':    'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Rejected':    'bg-red-50 text-red-600 border-red-200',
  'Enrolled':    'bg-green-50 text-green-700 border-green-200',
  'Pending':     'bg-slate-100 text-slate-600 border-slate-200',
};

function FL({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Section({ icon: Icon, title, children, defaultOpen=true, color='brand' }) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = { brand:'bg-brand-50 text-brand-600', emerald:'bg-emerald-50 text-emerald-600', amber:'bg-amber-50 text-amber-600', purple:'bg-purple-50 text-purple-600', slate:'bg-slate-100 text-slate-600' };
  const cc = colors[color]||colors.brand;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${cc} rounded-xl flex items-center justify-center shrink-0`}><Icon className="w-4 h-4"/></div>
          <span className="font-bold text-slate-800">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
      </button>
      {open && <div className="px-6 pb-5 pt-3 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// ── Live Chat Component ───────────────────────────────────────
function LiveChat({ agentId, agentName }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage]   = useState('');
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const bottomRef = useRef(null);

  async function loadMessages() {
    if (!agentId) return;
    try {
      const d = await fetch(`/api/chat/${agentId}`).then(r=>r.json());
      setMessages(d.messages||[]);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { if (agentId) { setLoading(true); loadMessages(); } }, [agentId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);
  useEffect(() => {
    if (!agentId) return;
    const t = setInterval(loadMessages, 5000);
    return () => clearInterval(t);
  }, [agentId]);

  async function handleSend() {
    if (!message.trim() || !agentId) return;
    setSending(true);
    const text = message.trim();
    setMessage('');
    try {
      await fetch(`/api/chat/${agentId}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: text }),
      });
      await loadMessages();
    } catch {}
    finally { setSending(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{height:'500px'}}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-brand-700 shrink-0">
        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-white"/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm">Live Chat — {agentName}</div>
          <div className="text-brand-200 text-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>Online
          </div>
        </div>
        <button onClick={loadMessages} className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors" title="Refresh">
          <Loader2 className="w-3.5 h-3.5"/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400"/></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30"/>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Send a message to start the conversation</p>
          </div>
        ) : messages.map((msg, i) => {
          const isAdmin = msg.sender_role === 'admin';
          const date    = new Date(msg.created_at);
          const showDate = i===0 || new Date(messages[i-1].created_at).toDateString() !== date.toDateString();
          return (
            <div key={msg.id||i}>
              {showDate && (
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-slate-200"/>
                  <span className="text-[9px] text-slate-400 font-semibold">{date.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>
                  <div className="flex-1 h-px bg-slate-200"/>
                </div>
              )}
              <div className={`flex gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isAdmin ? 'bg-brand-600' : 'bg-slate-500'}`}>
                  {(msg.sender_name||'?')[0].toUpperCase()}
                </div>
                <div className={`max-w-[72%] flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className={`text-[10px] text-slate-400 mb-1 ${isAdmin ? 'text-right' : ''}`}>
                    {msg.sender_name} · {date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
                  </div>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isAdmin ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'}`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      <div className="px-4 py-3 border-t border-slate-200 bg-white shrink-0">
        <div className="flex gap-2">
          <input value={message} onChange={e=>setMessage(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();} }}
            placeholder="Type a message to this agent… (Enter to send)"
            className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"/>
          <button onClick={handleSend} disabled={sending||!message.trim()}
            className="px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 font-bold text-sm">
            {sending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
            Send
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">Enter to send · Auto-refreshes every 5 seconds</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AdminAgentDetail() {
  const router = useRouter();
  const { id } = router.query;

  // ── PERMISSIONS ──────────────────────────────────────────────
  const { can } = useAdminPermissions();

  const [agent, setAgent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [countries, setCountries] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const [form, setForm] = useState({
    name:'', phone:'', city:'', country_id:'', status:'Active', commission_total:'',
    company_name:'', company_website:'', license_no:'', recruiter_type:'Owner',
    agreement_date:'', agreement_status:'Pending',
    certificate_no:'', certificate_date:'', notes:'',
  });

  function load() {
    if (!id) return;
    setLoading(true);
    fetch(`/api/agents/${id}`).then(r=>r.json()).then(d=>{
      setAgent(d);
      setForm({
        name: d.name||'', phone: d.phone||'', city: d.city||'', country_id: d.country_id||'', status: d.status||'Active',
        commission_total: d.commission_total||'', company_name: d.company_name||'',
        company_website: d.company_website||'', license_no: d.license_no||'', recruiter_type: d.recruiter_type||'Owner',
        agreement_date: d.agreement_date?.split('T')[0]||'', agreement_status: d.agreement_status||'Pending',
        certificate_no: d.certificate_no||'', certificate_date: d.certificate_date?.split('T')[0]||'', notes: d.notes||'',
      });
    }).finally(()=>setLoading(false));
  }

  useEffect(()=>{ load(); },[id]);
  useEffect(()=>{ fetch('/api/countries').then(r=>r.json()).then(d=>setCountries(d.countries||[])); },[]);

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false);
    try { await apiCall(`/api/agents/${id}`, 'PUT', form); setSaved(true); setTimeout(()=>setSaved(false),3000); load(); }
    catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  if (loading) return <AdminLayout title="Agent"><div className="flex justify-center py-20"><Spinner size="lg"/></div></AdminLayout>;
  if (!agent||agent.error) return <AdminLayout title="Agent"><div className="text-center py-20 text-slate-400">Agent not found</div></AdminLayout>;

  const stats = agent.stats || {};
  const students = agent.students || [];
  const applications = agent.applications || [];
  const initials = agent.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?';
  const acceptRate = Number(stats.total_apps)>0 ? Math.round((Number(stats.accepted_apps||0)/Number(stats.total_apps))*100) : 0;

  // ── PERMISSION GATE: Only show Edit Profile tab if can edit agents ──
  const TABS = [
    { key:'overview',  label:'Overview'      },
    ...(can('agents', 'edit') ? [{ key:'edit', label:'Edit Profile' }] : []),
    { key:'students',  label:`Students (${students.length})`         },
    { key:'apps',      label:`Applications (${applications.length})` },
    ...(can('chat', 'view') ? [{ key:'chat', label:'Live Chat' }] : []),
  ];

  return (
    <AdminLayout title={agent.name}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={()=>router.push('/admin/agents')} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
              <ArrowLeft className="w-4 h-4"/>
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>{agent.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{agent.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full border ${
              agent.status==='Active'?'bg-emerald-50 text-emerald-700 border-emerald-200':
              agent.status==='Inactive'?'bg-red-50 text-red-600 border-red-200':
              'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {agent.status}
            </span>
          </div>
        </div>

        {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}

        <div className="flex gap-5">

          {/* LEFT SIDEBAR */}
          <div className="w-72 shrink-0">
            <div className="sticky top-4 space-y-4">

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-16 bg-gradient-to-r from-brand-700 to-brand-500"/>
                <div className="px-5 pb-5 -mt-8">
                  <div className="w-16 h-16 bg-brand-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-white mb-3">
                    {initials}
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{agent.name}</h3>
                  {agent.company_name && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3"/>{agent.company_name}</p>}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0"/><span className="truncate">{agent.email}</span></div>
                    {agent.phone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0"/>{agent.phone}</div>}
                    {(agent.city||agent.country) && <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0"/>{[agent.city, agent.flag ? `${agent.flag} ${agent.country}` : agent.country].filter(Boolean).join(', ')}</div>}
                    {agent.company_website && <div className="flex items-center gap-2 text-xs text-slate-500"><Globe className="w-3.5 h-3.5 text-slate-400 shrink-0"/><a href={agent.company_website} target="_blank" className="text-brand-600 hover:underline truncate">{agent.company_website}</a></div>}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-500"/>Performance</h3>
                <div className="space-y-3">
                  {[
                    { label:'Total Students', value:stats.total_students||0,  color:'text-slate-800'   },
                    { label:'Active',          value:stats.active_students||0, color:'text-emerald-600' },
                    { label:'Applications',    value:stats.total_apps||0,      color:'text-slate-800'   },
                    { label:'Accepted',        value:stats.accepted_apps||0,   color:'text-emerald-600' },
                    { label:'Enrolled',        value:stats.enrolled||0,        color:'text-brand-600'   },
                    { label:'Accept Rate',     value:`${acceptRate}%`,         color:'text-emerald-600' },
                    { label:'Commission',      value:`$${Number(agent.commission_total||0).toLocaleString()}`, color:'text-emerald-700' },
                  ].map(s=>(
                    <div key={s.label} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-slate-400">{s.label}</span>
                      <span className={`font-bold ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500"/>Documents</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <div className="text-xs">
                      <div className="font-semibold text-slate-700">Agreement</div>
                      {agent.agreement_date && <div className="text-slate-400">{new Date(agent.agreement_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</div>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${agent.agreement_status==='Signed'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>
                      {agent.agreement_status||'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <div className="text-xs">
                      <div className="font-semibold text-slate-700">Certificate</div>
                      {agent.certificate_no && <div className="text-slate-400">#{agent.certificate_no}</div>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${agent.certificate_no?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>
                      {agent.certificate_no ? 'Issued' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── PERMISSION GATE: Chat button — only if can('chat','view') ── */}
              {can('chat', 'view') && (
                <button onClick={()=>setActiveTab('chat')}
                  className="w-full flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-sm">
                  <MessageSquare className="w-4 h-4"/>Chat with Agent
                </button>
              )}
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 min-w-0">

            {/* Tab bar */}
            <div className="flex gap-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-1 mb-5 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab===tab.key?'bg-brand-700 text-white shadow-sm':'text-slate-600 hover:bg-slate-100'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon:Users,       label:'Students',     value:stats.total_students||0,  bg:'bg-brand-50',   color:'text-brand-600'   },
                    { icon:FileText,    label:'Applications', value:stats.total_apps||0,       bg:'bg-amber-50',   color:'text-amber-600'   },
                    { icon:CheckCircle, label:'Accepted',     value:stats.accepted_apps||0,    bg:'bg-emerald-50', color:'text-emerald-600' },
                    { icon:DollarSign,  label:'Commission',   value:`$${Number(agent.commission_total||0).toLocaleString()}`, bg:'bg-purple-50', color:'text-purple-600' },
                  ].map(s=>(
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
                      <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}><s.icon className={`w-5 h-5 ${s.color}`}/></div>
                      <div className="text-xl font-bold text-slate-800">{s.value}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users className="w-4 h-4 text-brand-500"/>Recent Students</h3>
                    <button onClick={()=>setActiveTab('students')} className="text-xs font-bold text-brand-600 hover:underline">View all</button>
                  </div>
                  {students.slice(0,5).map((s,i)=>{
                    const name = s.first_name ? `${s.first_name} ${s.last_name||''}`.trim() : s.name;
                    return (
                      <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">{name[0]?.toUpperCase()||'?'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{name}</div>
                          <div className="text-xs text-slate-400">{s.email}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400">{s.app_count||0} apps</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.status==='Active'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-slate-100 text-slate-500 border-slate-200'}`}>{s.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {agent.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wider">Admin Notes</div>
                    <p className="text-sm text-amber-800">{agent.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* EDIT PROFILE — only rendered if can('agents','edit') */}
            {activeTab === 'edit' && can('agents', 'edit') && (
              <div>
                {saved && <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4"><CheckCircle className="w-4 h-4"/>Profile saved successfully!</div>}

                <Section icon={Building2} title="Company Information" color="brand">
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <FL label="Agent Full Name"><input className={inp} value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Agent Name"/></FL>
                    <FL label="Company Name"><input className={inp} value={form.company_name} onChange={e=>f('company_name',e.target.value)} placeholder="Company Ltd."/></FL>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FL label="Company Website"><input className={inp} value={form.company_website} onChange={e=>f('company_website',e.target.value)} placeholder="https://company.com"/></FL>
                    <FL label="License Number"><input className={inp} value={form.license_no} onChange={e=>f('license_no',e.target.value)} placeholder="LIC-12345"/></FL>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FL label="Phone"><input className={inp} value={form.phone} onChange={e=>f('phone',e.target.value)} placeholder="+92 300 1234567"/></FL>
                    <FL label="City"><input className={inp} value={form.city} onChange={e=>f('city',e.target.value)} placeholder="Karachi"/></FL>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
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
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FL label="Recruiter Type">
                      <select className={sel} value={form.recruiter_type} onChange={e=>f('recruiter_type',e.target.value)}>
                        {['Owner','Staff','Partner','Sub-agent'].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </FL>
                    <FL label="Commission Total (USD)"><input type="number" className={inp} value={form.commission_total} onChange={e=>f('commission_total',e.target.value)} placeholder="0"/></FL>
                  </div>
                </Section>

                <Section icon={Award} title="Agreement & Certificate" color="amber" defaultOpen={true}>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <FL label="Agreement Date"><input type="date" className={inp} value={form.agreement_date} onChange={e=>f('agreement_date',e.target.value)}/></FL>
                    <FL label="Agreement Status">
                      <select className={sel} value={form.agreement_status} onChange={e=>f('agreement_status',e.target.value)}>
                        {['Pending','Signed','Expired'].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </FL>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FL label="Certificate Number"><input className={inp} value={form.certificate_no} onChange={e=>f('certificate_no',e.target.value)} placeholder="CERT-2024-001"/></FL>
                    <FL label="Certificate Issue Date"><input type="date" className={inp} value={form.certificate_date} onChange={e=>f('certificate_date',e.target.value)}/></FL>
                  </div>
                </Section>

                <Section icon={FileText} title="Admin Notes" color="slate" defaultOpen={false}>
                  <textarea rows={4} className={inp+' resize-none mt-2'} value={form.notes} onChange={e=>f('notes',e.target.value)} placeholder="Internal notes about this agent…"/>
                </Section>

                {/* ── PERMISSION GATE: Save button ── */}
                <div className="flex justify-end">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : saved ? <Check className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
                    {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* STUDENTS */}
            {activeTab === 'students' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Students ({students.length})</h3>
                </div>
                {students.length===0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Users className="w-10 h-10 mb-2 opacity-40"/><p className="text-sm">No students yet</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100 bg-slate-50">{['Student','Email','Education','GPA','IELTS','Apps','Status'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                      <tbody>
                        {students.map((s,i)=>{
                          const name = s.first_name ? `${s.first_name} ${s.last_name||''}`.trim() : s.name;
                          return (
                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">{name[0]?.toUpperCase()||'?'}</div><span className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">{name}</span></div></td>
                              <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[150px]">{s.email}</td>
                              <td className="px-4 py-3 text-xs text-slate-600">{s.education_level||'—'}</td>
                              <td className="px-4 py-3 text-xs font-semibold text-slate-700">{s.gpa||'—'}</td>
                              <td className="px-4 py-3 text-xs font-semibold text-slate-700">{s.ielts_score||'—'}</td>
                              <td className="px-4 py-3 text-xs text-slate-600">{s.app_count||0}</td>
                              <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.status==='Active'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-slate-100 text-slate-500 border-slate-200'}`}>{s.status}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* APPLICATIONS */}
            {activeTab === 'apps' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Applications ({applications.length})</h3>
                </div>
                {applications.length===0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400"><FileText className="w-10 h-10 mb-2 opacity-40"/><p className="text-sm">No applications yet</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100 bg-slate-50">{['App Code','Program','School','Intake','Date','Status'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                      <tbody>
                        {applications.map(a=>(
                          <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs font-bold text-brand-600">{a.app_code}</td>
                            <td className="px-4 py-3 text-xs font-semibold text-slate-700 max-w-[160px] truncate">{a.program_name||'—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">{a.flag} {a.university_name||'—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">{a.intake||'—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">{a.applied_date?new Date(a.applied_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
                            <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[a.status]||'bg-slate-100 text-slate-500 border-slate-200'}`}>{a.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* LIVE CHAT — only rendered if can('chat','view') */}
            {activeTab === 'chat' && can('chat', 'view') && (
              <LiveChat agentId={parseInt(id)} agentName={agent.name}/>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}