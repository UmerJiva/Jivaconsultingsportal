// pages/admin/dashboard.js — Full admin dashboard with charts & insights
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import {
  Users, Building2, UserCheck, FileText, CheckCircle, Clock,
  XCircle, TrendingUp, TrendingDown, ArrowRight, MoreVertical,
  GraduationCap, DollarSign, Activity, Target, Award, Star,
  BarChart2, ChevronRight, Plus, AlertCircle, Calendar,
  BookOpen, Globe, Zap, RefreshCw
} from 'lucide-react';

// ── SVG Sparkline ─────────────────────────────────────────────
function Sparkline({ data = [], color = '#2563eb', height = 40 }) {
  if (!data.length) return null;
  const vals = data.map(d => Number(d.count || 0));
  const max = Math.max(...vals, 1);
  const W = 120, H = height, P = 4;
  const pts = vals.map((v, i) => {
    const x = P + (i / (vals.length - 1 || 1)) * (W - P * 2);
    const y = H - P - (v / max) * (H - P * 2);
    return `${x},${y}`;
  }).join(' ');
  const fill = `${P},${H - P} ${pts} ${W - P},${H - P}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`sg${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#sg${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Donut chart (SVG) ─────────────────────────────────────────
function DonutChart({ data, colors, size = 140 }) {
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + Number(d.count || 0), 0) || 1;
  const r = 52, cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map((d, i) => {
    const pct = Number(d.count || 0) / total;
    const dash = pct * circumference;
    const gap  = circumference - dash;
    const slice = { dash, gap, offset, color: colors[i % colors.length] };
    offset += dash;
    return slice;
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="18" />
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="18"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`} />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1e293b">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#94a3b8">TOTAL</text>
    </svg>
  );
}

// ── Bar chart ─────────────────────────────────────────────────
function BarChart({ data = [], color = '#2563eb', height = 80 }) {
  if (!data.length) return <div className="flex items-center justify-center text-slate-300 text-xs" style={{ height }}>No data</div>;
  const max = Math.max(...data.map(d => Number(d.count || 0)), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const h = (Number(d.count || 0) / max) * 100;
        const mo = (d.month || '').slice(5);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-[9px] text-slate-500 font-semibold">{d.count}</div>
            <div className="w-full rounded-t-md transition-all hover:opacity-80"
              style={{ height: `${Math.max(h, 4)}%`, backgroundColor: color, minHeight: d.count > 0 ? 4 : 0 }} />
            <div className="text-[9px] text-slate-400">{mo}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub, subColor = 'text-slate-400', spark, sparkColor, onClick, loading }) {
  return (
    <div onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      {loading
        ? <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse mb-1" />
        : <div className="text-2xl font-bold text-slate-800 mb-0.5" style={{ fontFamily: 'Georgia,serif' }}>{value}</div>
      }
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      {sub && <div className={`text-xs font-semibold ${subColor}`}>{sub}</div>}
      {spark && <div className="mt-2"><Sparkline data={spark} color={sparkColor || '#2563eb'} height={36} /></div>}
    </div>
  );
}

// ── Section title ─────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, href, hrefLabel = 'View all' }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-brand-600" />
        <h2 className="font-bold text-slate-800">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800">
          {hrefLabel} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

const STATUS_COLORS = {
  'Submitted':       'bg-blue-50 text-blue-700 border-blue-200',
  'Under Review':    'bg-amber-50 text-amber-700 border-amber-200',
  'Accepted':        'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Offer Received':  'bg-teal-50 text-teal-700 border-teal-200',
  'Rejected':        'bg-red-50 text-red-600 border-red-200',
  'Enrolled':        'bg-green-50 text-green-700 border-green-200',
  'Conditional Offer':'bg-purple-50 text-purple-700 border-purple-200',
  'Withdrawn':       'bg-slate-100 text-slate-500 border-slate-200',
};

const DONUT_COLORS = ['#2563eb','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#f97316'];
const LEAD_COLORS  = { New:'bg-sky-100 text-sky-700', Contacted:'bg-amber-100 text-amber-700', 'In Progress':'bg-brand-100 text-brand-700', Converted:'bg-emerald-100 text-emerald-700', Lost:'bg-red-100 text-red-600' };
const TIER_ICON    = { Platinum:'💎', Gold:'🥇', Silver:'🥈', Bronze:'🥉' };

// ── Main Page ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime]       = useState('');

  function load() {
    setLoading(true);
    fetch('/api/dashboard/stats')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setData(d); setLoading(false); })
      .catch(() => {
        // If stats API fails (403/500), use fallback data so dashboard still works
        setData({
          students:{total:0,active:0}, universities:{total:0}, agents:{total:0,active:0},
          applications:{total:0,accepted:0,pending:0,rejected:0,submitted:0,enrolled:0,conditional:0},
          recentApps:[], topAgents:[], monthlyApps:[], monthlyStudents:[],
          appsByStatus:[], topUniversities:[], leadStatusBreakdown:[],
        });
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
    // Live clock
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, []);

  const s   = data?.students     || {};
  const u   = data?.universities || {};
  const ag  = data?.agents       || {};
  const ap  = data?.applications || {};
  const monthlyApps      = data?.monthlyApps      || [];
  const monthlyStudents  = data?.monthlyStudents  || [];
  const appsByStatus     = data?.appsByStatus     || [];
  const topUniversities  = data?.topUniversities  || [];
  const leadBreakdown    = data?.leadStatusBreakdown || [];
  const recentApps       = data?.recentApps       || [];
  const topAgents        = data?.topAgents        || [];

  const totalApps  = Number(ap.total || 0);
  const acceptRate = totalApps > 0 ? Math.round((Number(ap.accepted || 0) / totalApps) * 100) : 0;
  const today      = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

  return (
    <AdminLayout title="Dashboard">

      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage:'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize:'28px 28px' }} />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
          <BarChart2 className="w-40 h-40 text-white" />
        </div>
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-brand-200 text-sm mb-1">{today}</p>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia,serif' }}>Admin Dashboard</h2>
            <p className="text-brand-200 text-sm">Full portal overview — {loading ? '…' : `${s.total || 0} students · ${ap.total || 0} applications`}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-mono font-bold tracking-wide">{time}</div>
            <div className="text-brand-300 text-xs mt-1">Live</div>
            <button onClick={load} className="mt-2 flex items-center gap-1.5 text-brand-300 hover:text-white text-xs font-semibold transition-colors">
              <RefreshCw className="w-3 h-3" />Refresh
            </button>
          </div>
        </div>
        {/* Quick action pills */}
        <div className="flex flex-wrap gap-2 mt-5 relative">
          {[
            { label:'Add Student',    href:'/admin/students',     icon: Plus },
            { label:'New Application',href:'/admin/applications/new', icon: FileText },
            { label:'Add University', href:'/admin/universities',  icon: Building2 },
            { label:'Add Agent',      href:'/admin/agents',       icon: UserCheck },
          ].map(item => (
            <Link key={item.label} href={item.href}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all">
              <item.icon className="w-3.5 h-3.5" />{item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Top 4 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard icon={Users}     iconBg="bg-brand-50"   iconColor="text-brand-600"
          label="Total Students"  value={loading ? '…' : s.total || 0}
          sub={`${s.active || 0} active`} subColor="text-emerald-600"
          spark={monthlyStudents} sparkColor="#2563eb" loading={loading}
          onClick={() => router.push('/admin/students')} />
        <StatCard icon={Building2} iconBg="bg-amber-50"   iconColor="text-amber-600"
          label="Universities"    value={loading ? '…' : u.total || 0}
          sub="Partner institutions" loading={loading}
          onClick={() => router.push('/admin/universities')} />
        <StatCard icon={UserCheck} iconBg="bg-emerald-50" iconColor="text-emerald-600"
          label="Active Agents"   value={loading ? '…' : ag.active || 0}
          sub={`${ag.total || 0} total`} subColor="text-slate-400" loading={loading}
          onClick={() => router.push('/admin/agents')} />
        <StatCard icon={FileText}  iconBg="bg-purple-50"  iconColor="text-purple-600"
          label="Applications"    value={loading ? '…' : ap.total || 0}
          sub={`${acceptRate}% acceptance rate`} subColor="text-emerald-600"
          spark={monthlyApps} sparkColor="#8b5cf6" loading={loading}
          onClick={() => router.push('/admin/applications')} />
      </div>

      {/* ── Application status pills row ── */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { icon:FileText,    label:'Submitted',   value:ap.submitted  ||0, bg:'bg-blue-50',   text:'text-blue-700',   border:'border-blue-200'   },
          { icon:Clock,       label:'Under Review', value:ap.pending    ||0, bg:'bg-amber-50',  text:'text-amber-700',  border:'border-amber-200'  },
          { icon:CheckCircle, label:'Accepted',     value:ap.accepted   ||0, bg:'bg-emerald-50',text:'text-emerald-700',border:'border-emerald-200' },
          { icon:XCircle,     label:'Rejected',     value:ap.rejected   ||0, bg:'bg-red-50',    text:'text-red-600',    border:'border-red-200'    },
          { icon:Award,       label:'Enrolled',     value:ap.enrolled   ||0, bg:'bg-green-50',  text:'text-green-700',  border:'border-green-200'  },
          { icon:Target,      label:'Conditional',  value:ap.conditional||0, bg:'bg-purple-50', text:'text-purple-700', border:'border-purple-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 flex flex-col items-center text-center`}>
            <s.icon className={`w-5 h-5 ${s.text} mb-2`} />
            <div className={`text-xl font-bold ${s.text}`}>{loading ? '…' : s.value}</div>
            <div className={`text-[10px] font-semibold mt-0.5 ${s.text} opacity-80`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main 3-column grid ── */}
      <div className="grid grid-cols-12 gap-5 mb-5">

        {/* ── LEFT col (8) ── */}
        <div className="col-span-8 space-y-5">

          {/* Monthly trend - dual bar chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <SectionTitle icon={BarChart2} title="Monthly Trends" />
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Applications</p>
                  <span className="text-xs font-bold text-purple-600">{ap.total || 0} total</span>
                </div>
                {loading ? <div className="h-20 bg-slate-50 rounded-xl animate-pulse"/> : <BarChart data={monthlyApps} color="#8b5cf6" height={90} />}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Students</p>
                  <span className="text-xs font-bold text-brand-600">{s.total || 0} total</span>
                </div>
                {loading ? <div className="h-20 bg-slate-50 rounded-xl animate-pulse"/> : <BarChart data={monthlyStudents} color="#2563eb" height={90} />}
              </div>
            </div>
          </div>

          {/* Application status donut + breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <SectionTitle icon={Activity} title="Application Pipeline" href="/admin/applications" />
            <div className="flex items-center gap-6">
              {/* Donut */}
              <div className="shrink-0">
                {loading
                  ? <div className="w-36 h-36 rounded-full bg-slate-100 animate-pulse"/>
                  : <DonutChart data={appsByStatus} colors={DONUT_COLORS} size={140} />
                }
              </div>
              {/* Legend + bars */}
              <div className="flex-1 space-y-2">
                {loading
                  ? [1,2,3,4].map(i=><div key={i} className="h-6 bg-slate-100 rounded-lg animate-pulse"/>)
                  : appsByStatus.map((d, i) => {
                      const total = appsByStatus.reduce((s,x)=>s+Number(x.count||0),0)||1;
                      const pct   = Math.round((Number(d.count||0)/total)*100);
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{backgroundColor:DONUT_COLORS[i%DONUT_COLORS.length]}}/>
                              <span className="font-medium text-slate-700">{d.status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{d.count}</span>
                              <span className="text-slate-400 w-8 text-right">{pct}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{width:`${pct}%`, backgroundColor:DONUT_COLORS[i%DONUT_COLORS.length]}}/>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            </div>
          </div>

          {/* Recent applications */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600"/>
                <h2 className="font-bold text-slate-800">Recent Applications</h2>
              </div>
              <Link href="/admin/applications" className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800">
                View all <ArrowRight className="w-3.5 h-3.5"/>
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : recentApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText className="w-10 h-10 mb-2 opacity-40"/>
                <p className="text-sm">No applications yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['App Code','Student','University','Applied','Status'].map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentApps.map((app, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer"
                        onClick={() => router.push('/admin/applications')}>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-brand-600">{app.app_code}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                              {(app.student_name||'?').split(' ').map(n=>n[0]).join('').slice(0,2)}
                            </div>
                            <span className="font-semibold text-slate-800 truncate max-w-[120px]">{app.student_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[140px]">{app.flag} {app.university_name}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{app.applied_date ? new Date(app.applied_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[app.status]||'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT col (4) ── */}
        <div className="col-span-4 space-y-4">

          {/* Acceptance rate ring */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-500"/>Acceptance Rate
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12"/>
                  <circle cx="50" cy="50" r="40" fill="none"
                    stroke={acceptRate >= 70 ? '#10b981' : acceptRate >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="12"
                    strokeDasharray={`${(acceptRate / 100) * 251} 251`}
                    strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xl font-bold text-slate-800">{acceptRate}%</div>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {[
                  {label:'Accepted', value:ap.accepted||0, color:'bg-emerald-500'},
                  {label:'Pending',  value:Number(ap.pending||0)+Number(ap.submitted||0), color:'bg-amber-500'},
                  {label:'Rejected', value:ap.rejected||0, color:'bg-red-500'},
                ].map(r=>(
                  <div key={r.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${r.color}`}/><span className="text-slate-600">{r.label}</span></div>
                    <span className="font-bold text-slate-800">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top universities */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <SectionTitle icon={Building2} title="Top Universities" href="/admin/universities"/>
            {loading
              ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse"/>)}</div>
              : topUniversities.length === 0
                ? <p className="text-xs text-slate-400 text-center py-4">No data</p>
                : <div className="space-y-2">
                    {topUniversities.map((u, i) => {
                      const maxCount = Math.max(...topUniversities.map(x=>x.app_count||0), 1);
                      const pct = Math.round(((u.app_count||0)/maxCount)*100);
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-base shrink-0">{u.flag||'🏫'}</span>
                              <span className="font-medium text-slate-700 truncate">{u.name}</span>
                            </div>
                            <span className="font-bold text-slate-800 shrink-0 ml-2">{u.app_count}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full">
                            <div className="h-full bg-brand-500 rounded-full" style={{width:`${pct}%`}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
            }
          </div>

          {/* Lead status breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <SectionTitle icon={Users} title="Lead Pipeline" href="/admin/students"/>
            {loading
              ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-7 bg-slate-100 rounded-lg animate-pulse"/>)}</div>
              : <div className="space-y-2">
                  {leadBreakdown.map((l,i)=>(
                    <div key={i} className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LEAD_COLORS[l.lead_status]||'bg-slate-100 text-slate-600'}`}>
                        {l.lead_status}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-400 rounded-full"
                            style={{width:`${Math.round((l.count/leadBreakdown.reduce((s,x)=>s+Number(x.count),0)||1)*100)}%`}}/>
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-6 text-right">{l.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Top Agents */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500"/>
                <h2 className="font-bold text-slate-800">Top Agents</h2>
              </div>
              <Link href="/admin/agents" className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800">
                All <ChevronRight className="w-3.5 h-3.5"/>
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-6"><Spinner size="sm"/></div>
            ) : topAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400"><UserCheck className="w-8 h-8 mb-2 opacity-40"/><p className="text-sm">No agents yet</p></div>
            ) : (
              <div className="divide-y divide-slate-50">
                {topAgents.map((a, i) => {
                  const initials = (a.name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                  const colors   = ['bg-brand-600','bg-amber-500','bg-purple-500','bg-emerald-500','bg-rose-500'];
                  return (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={()=>router.push('/admin/agents')}>
                      <div className="w-5 text-xs font-bold text-slate-400 shrink-0">#{i+1}</div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${colors[i%5]}`}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{a.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {a.student_count} students {a.tier && `· ${TIER_ICON[a.tier]||''} ${a.tier}`}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-emerald-600 shrink-0">${Number(a.commission_total||0).toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Bottom quick links ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon:Users,      label:'Manage Students',   sub:'View all students',    href:'/admin/students',     bg:'bg-brand-50',   text:'text-brand-700',   border:'border-brand-200'   },
          { icon:FileText,   label:'Applications',      sub:'Review & approve',     href:'/admin/applications', bg:'bg-purple-50',  text:'text-purple-700',  border:'border-purple-200'  },
          { icon:Building2,  label:'Universities',      sub:'Partner institutions', href:'/admin/universities', bg:'bg-amber-50',   text:'text-amber-700',   border:'border-amber-200'   },
          { icon:UserCheck,  label:'Agents',            sub:'Manage your agents',   href:'/admin/agents',       bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200' },
        ].map(item=>(
          <Link key={item.label} href={item.href}
            className={`${item.bg} border-2 ${item.border} rounded-2xl p-4 hover:shadow-md transition-all group`}>
            <item.icon className={`w-6 h-6 ${item.text} mb-3`}/>
            <div className={`font-bold text-sm ${item.text}`}>{item.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
            <div className={`flex items-center gap-1 text-xs font-bold ${item.text} mt-3 opacity-0 group-hover:opacity-100 transition-opacity`}>
              Open <ArrowRight className="w-3.5 h-3.5"/>
            </div>
          </Link>
        ))}
      </div>

    </AdminLayout>
  );
}