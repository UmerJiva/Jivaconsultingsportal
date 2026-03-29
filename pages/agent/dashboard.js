// pages/agent/dashboard.js — Full redesign keeping ALL original sections
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import {
  Users, FileText, CheckCircle, XCircle, TrendingUp, TrendingDown,
  ExternalLink, MoreVertical, Phone, Mail, GraduationCap, ArrowRight,
  ChevronDown, Plus, BookOpen, DollarSign, MessageSquare,
  BarChart2, Activity, Star, Zap, Bell, CheckSquare,
  ArrowUpRight, ChevronRight, Calendar, Award, Clock,
  AlertCircle, Target, Shield
} from 'lucide-react';

// ── Bar chart (CSS) ───────────────────────────────────────────
function BarChart({ data, keys, colors, labels }) {
  if (!data?.length) return (
    <div className="flex flex-col items-center justify-center h-40 text-slate-300">
      <BarChart2 className="w-10 h-10 mb-2"/>
      <span className="text-sm">No data available</span>
    </div>
  );
  const max = Math.max(...data.flatMap(d => keys.map(k => Number(d[k]||0))), 1);
  return (
    <div className="relative">
      {/* Y-axis grid lines */}
      <div className="absolute left-0 right-0 top-0 bottom-7 flex flex-col justify-between pointer-events-none">
        {[max, Math.round(max*0.75), Math.round(max*0.5), Math.round(max*0.25), 0].map((v,i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 w-6 text-right shrink-0">{v}</span>
            <div className="flex-1 border-t border-slate-100"/>
          </div>
        ))}
      </div>
      {/* Bars */}
      <div className="ml-8 flex items-end gap-2 pb-7" style={{height:'160px'}}>
        {data.map((item, gi) => (
          <div key={gi} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex items-end gap-0.5" style={{height:'128px'}}>
              {keys.map((k, ki) => {
                const v = Number(item[k]||0);
                const h = max > 0 ? (v/max)*100 : 0;
                return (
                  <div key={ki} title={`${labels[ki]}: ${v}`}
                    className="flex-1 rounded-t-sm transition-all hover:opacity-75 cursor-default"
                    style={{height:`${h}%`, minHeight: v>0?'3px':'0', backgroundColor: colors[ki]}}/>
                );
              })}
            </div>
            <span className="text-[9px] text-slate-400 text-center truncate w-full px-0.5 mt-1">
              {(item.intake||item.month||'').replace('Fall','F').replace('Spring','Sp').replace('Winter','W').replace('Summer','Su').slice(0,8)}
            </span>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="ml-8 flex flex-wrap gap-3 mt-1">
        {keys.map((k,i) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{backgroundColor:colors[i]}}/>
            <span className="text-[10px] text-slate-500">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Line chart (SVG) with tooltip ────────────────────────────
function LineChart({ data, agentName }) {
  const [tooltip, setTooltip] = useState(null);
  if (!data?.length) return (
    <div className="flex flex-col items-center justify-center h-40 text-slate-300">
      <TrendingUp className="w-10 h-10 mb-2"/>
      <span className="text-sm">No data available</span>
    </div>
  );
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const counts = data.map(d => Number(d.count||0));
  const max = Math.max(...counts, 1);
  const W = 500, H = 140, PAD = 30;
  const pts = counts.map((v,i) => {
    const x = PAD + (i/(counts.length-1||1))*(W-PAD*2);
    const y = H - PAD - (v/max)*(H-PAD*2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{height:'160px'}}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0,0.25,0.5,0.75,1].map((v,i) => {
          const y = H - PAD - v*(H-PAD*2);
          return <line key={i} x1={PAD} x2={W-PAD} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1"/>;
        })}
        <polygon points={`${PAD},${H-PAD} ${pts} ${W-PAD},${H-PAD}`} fill="url(#lineGrad)"/>
        <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {counts.map((v,i) => {
          const x = PAD + (i/(counts.length-1||1))*(W-PAD*2);
          const y = H - PAD - (v/max)*(H-PAD*2);
          return (
            <circle key={i} cx={x} cy={y} r="4.5" fill="#2563eb" stroke="white" strokeWidth="2"
              className="cursor-pointer" style={{filter:'drop-shadow(0 1px 2px rgba(37,99,235,0.4))'}}
              onMouseEnter={()=>setTooltip({x,y,v,i})}
              onMouseLeave={()=>setTooltip(null)}/>
          );
        })}
        {tooltip && (
          <g>
            <rect x={tooltip.x-55} y={tooltip.y-50} width="110" height="40" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="1" style={{filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'}}/>
            <text x={tooltip.x} y={tooltip.y-33} textAnchor="middle" fontSize="10" fill="#2563eb" fontWeight="600">{agentName}</text>
            <text x={tooltip.x} y={tooltip.y-17} textAnchor="middle" fontSize="10" fill="#64748b">Students: {tooltip.v}</text>
          </g>
        )}
        {data.map((d,i) => {
          const x = PAD + (i/(data.length-1||1))*(W-PAD*2);
          const m = d.month ? parseInt(d.month.split('-')[1])-1 : i;
          return <text key={i} x={x} y={H-4} textAnchor="middle" fontSize="9" fill="#94a3b8">{months[m]||''}</text>;
        })}
      </svg>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-6 h-0.5 bg-blue-600 rounded"/>
        <span className="text-xs text-slate-500">{agentName}</span>
      </div>
    </div>
  );
}

// ── Task table row ────────────────────────────────────────────
function TaskRow({ label, data }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3 text-sm font-semibold text-slate-700 w-28">{label}</td>
      {['total','final_offers','visas','submitted'].map(k => (
        <td key={k} className="px-4 py-3 text-sm font-bold text-slate-800">{data?.[k]||0}</td>
      ))}
    </tr>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, iconColor, value, label, sub, subColor='text-slate-400', loading, onClick }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all ${onClick?'cursor-pointer':''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`}/>
        </div>
        <div className="flex-1 min-w-0">
          {loading
            ? <div className="h-7 w-16 bg-slate-100 rounded-lg animate-pulse mb-1"/>
            : <div className="text-2xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>{value}</div>
          }
          <div className="text-sm text-slate-500 truncate">{label}</div>
          {sub && <div className={`text-xs font-semibold mt-0.5 ${subColor}`}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────
function ChartCard({ icon: Icon, title, subtitle, children, filterSlot }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          {Icon && <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5"><Icon className="w-4 h-4 text-brand-600"/></div>}
          <div>
            <h3 className="font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {filterSlot}
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><MoreVertical className="w-4 h-4"/></button>
        </div>
      </div>
      {children}
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-brand-400 bg-white hover:border-slate-300 transition-colors">
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function AgentDashboard() {
  const router = useRouter();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser]       = useState(null);
  const [tasks, setTasks]     = useState({ total:0, high:0, medium:0, low:0 });
  const [activeIntake, setActiveIntake] = useState(0);
  const [chartYear, setChartYear]       = useState(String(new Date().getFullYear()));
  const [perfYear, setPerfYear]         = useState(String(new Date().getFullYear()));

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d=>setUser(d.user));
    fetch('/api/dashboard/agent-stats').then(r=>r.json()).then(d=>{ setData(d); setLoading(false); }).catch(()=>setLoading(false));
    fetch('/api/agent/tasks').then(r=>r.json()).then(d=>setTasks({ total:d.total||0, high:d.high||0, medium:d.medium||0, low:d.low||0 })).catch(()=>{});
  }, []);

  const stats     = data?.stats          || {};
  const intakes   = data?.intakeStats    || [];
  const monthly   = data?.monthlyStudents|| [];
  const recent    = data?.recentStudents || [];
  const agentName = user?.name || 'Agent';
  const firstName = agentName.split(' ')[0];

  const INTAKES  = intakes.map(i=>i.intake).filter(Boolean);
  const curIntake = intakes[activeIntake] || {};
  const currentYear = new Date().getFullYear();
  const YEARS = [currentYear, currentYear-1, currentYear-2].map(y=>({value:String(y),label:String(y)}));

  const barData  = intakes.slice(0,5).map(i=>({ intake:i.intake, submitted:Number(i.submitted||0), review:Number(i.review||0), accepted:Number(i.final_offers||0), rejected:Number(i.rejected||0) }));
  const lineData = monthly.filter(m=>m.month?.startsWith(perfYear));

  const totalApps  = Number(stats.total_apps||0);
  const acceptRate = totalApps>0 ? Math.round((Number(stats.accepted_apps||0)/totalApps)*100) : 0;

  const QUICK_LINKS = [
    { icon: BookOpen,    label:'TrainHub — free training',    href:'#' },
    { icon: Shield,      label:'Canadian visa calculator',     href:'#' },
    { icon: FileText,    label:'Signed agreement',             href:'#' },
    { icon: Award,       label:'EduPortal certificate',        href:'#' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="flex gap-5">

        {/* ── LEFT: main column ── */}
        <div className="flex-1 min-w-0">

          {/* Welcome + actions */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>
                Welcome, {firstName}! 👋
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">Here's your dashboard overview.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {tasks.high > 0 && (
                <button onClick={()=>router.push('/agent/tasks')}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-red-100 transition-colors">
                  <Bell className="w-4 h-4"/>{tasks.high} urgent task{tasks.high!==1?'s':''}
                </button>
              )}
              <Link href="/agent/students"
                className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                <Plus className="w-4 h-4"/>New service <ChevronDown className="w-3.5 h-3.5 text-slate-400"/>
              </Link>
              <Link href="/agent/students"
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                <Plus className="w-4 h-4"/>Add new student
              </Link>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard icon={FileText}     iconBg="bg-brand-50"   iconColor="text-brand-600"   value={loading?'…':stats.total_apps||0}      label="Applications"  sub={`${stats.submitted_apps||0} submitted`} subColor="text-blue-500"   loading={loading} onClick={()=>router.push('/agent/applications')}/>
            <StatCard icon={Users}        iconBg="bg-sky-50"     iconColor="text-sky-600"     value={loading?'…':stats.total_students||0}  label="Students"      sub={`${stats.active_students||0} active`}   subColor="text-emerald-600" loading={loading} onClick={()=>router.push('/agent/students')}/>
            <StatCard icon={CheckCircle}  iconBg="bg-emerald-50" iconColor="text-emerald-600" value={loading?'…':stats.accepted_apps||0}   label="Accepted"      sub={`${acceptRate}% rate`}                  subColor="text-emerald-600" loading={loading}/>
            <StatCard icon={XCircle}      iconBg="bg-red-50"     iconColor="text-red-500"     value={loading?'…':stats.rejected_apps||0}   label="Rejected"      loading={loading}/>
          </div>

          {/* ── Task management ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
            <div className="px-5 pt-5 pb-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-brand-600"/>
                  <h2 className="font-bold text-slate-800 text-base">Task management</h2>
                  {tasks.total > 0 && (
                    <div className="flex items-center gap-1.5 ml-2">
                      {tasks.high>0   && <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">{tasks.high} high</span>}
                      {tasks.medium>0 && <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">{tasks.medium} medium</span>}
                      {tasks.low>0    && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">{tasks.low} low</span>}
                    </div>
                  )}
                </div>
                <Link href="/agent/tasks" className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1">
                  My Tasks <ArrowRight className="w-3.5 h-3.5"/>
                </Link>
              </div>
              <p className="text-xs text-slate-400 mb-4">A list of important application requirements</p>

              {/* Intake tabs */}
              <div className="flex items-center gap-0.5 border-b border-slate-200 overflow-x-auto">
                {(INTAKES.length > 0 ? INTAKES : ['Winter 2026','Summer 2026','Fall 2026','Winter 2027']).map((intake, i) => (
                  <button key={intake} onClick={()=>setActiveIntake(i)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap
                      ${activeIntake===i ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    {intake}
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeIntake===i ? 'bg-brand-500' : 'bg-emerald-400'}`}/>
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-28"/>
                    {['Paid applications','Final offers','Visas','Promotions'].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <TaskRow label="Applications" data={curIntake}/>
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">Tasks</td>
                    {['submitted','final_offers','visas','review'].map(k=>(
                      <td key={k} className="px-4 py-3">
                        <div className="space-y-1">
                          {[['High','text-red-500','bg-red-50'],['Medium','text-amber-500','bg-amber-50'],['Low','text-slate-400','bg-slate-50']].map(([p,cls,bg])=>(
                            <div key={p} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${bg} mr-1`}>
                              <span className={`text-xs font-bold ${cls}`}>0</span>
                              <button className={`text-[10px] ${cls} hover:underline font-semibold`}>{p}</button>
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50">
              <Link href="/agent/tasks"
                className="flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold text-brand-600 hover:bg-brand-50 transition-colors">
                <CheckSquare className="w-4 h-4"/>See all tasks <ExternalLink className="w-3.5 h-3.5"/>
              </Link>
            </div>
          </div>

          {/* ── Business insights header ── */}
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-5 h-5 text-brand-600"/>
            <h2 className="font-bold text-slate-800 text-lg">Business insights</h2>
          </div>

          {/* Application processing times */}
          <ChartCard icon={Clock} title="Application processing times" subtitle="Number of applications by processing times"
            filterSlot={
              <div className="flex items-center gap-2">
                <FilterSelect value="All staff"    onChange={()=>{}} options={['All staff']}/>
                <FilterSelect value={chartYear}    onChange={setChartYear} options={YEARS}/>
                <FilterSelect value="All countries" onChange={()=>{}} options={['All countries']}/>
              </div>
            }>
            {loading ? <div className="flex justify-center py-10"><Spinner/></div>
              : <BarChart
                  data={barData.length ? barData : [{intake:'No data',submitted:0,review:0,accepted:0,rejected:0}]}
                  keys={['submitted','review','accepted','rejected']}
                  colors={['#1e3a8a','#3b82f6','#10b981','#ef4444']}
                  labels={['Avg days to complete req','Avg days for intake to open','Avg days for processing','Avg overall days']}
                />
            }
          </ChartCard>

          {/* Application statuses */}
          <ChartCard icon={Activity} title="Application statuses" subtitle="Number of applications by status and intake over time"
            filterSlot={
              <div className="flex items-center gap-2">
                <FilterSelect value="All staff"    onChange={()=>{}} options={['All staff']}/>
                <FilterSelect value={chartYear}    onChange={setChartYear} options={YEARS}/>
                <FilterSelect value="All countries" onChange={()=>{}} options={['All countries']}/>
              </div>
            }>
            {loading ? <div className="flex justify-center py-10"><Spinner/></div>
              : <BarChart
                  data={barData.length ? barData : [{intake:'No data',submitted:0,review:0,accepted:0}]}
                  keys={['submitted','accepted','review']}
                  colors={['#1e3a8a','#2563eb','#60a5fa']}
                  labels={['Paid','Accepted','Submitted']}
                />
            }
          </ChartCard>

          {/* Performance line chart */}
          <ChartCard icon={TrendingUp} title="Performance" subtitle="Number of students over time"
            filterSlot={
              <div className="flex items-center gap-2">
                <FilterSelect value="All staff" onChange={()=>{}} options={['All staff']}/>
                <FilterSelect value={perfYear}  onChange={setPerfYear} options={YEARS}/>
                <FilterSelect value="Students"  onChange={()=>{}} options={['Students','Applications']}/>
              </div>
            }>
            {loading ? <div className="flex justify-center py-10"><Spinner/></div>
              : <LineChart data={lineData.length ? lineData : [{month:`${perfYear}-01`,count:0}]} agentName={agentName}/>
            }
          </ChartCard>

          {/* Revenue generated */}
          <ChartCard icon={DollarSign} title="Revenue generated" subtitle="Total amount of revenue generated by month"
            filterSlot={
              <div className="flex items-center gap-2">
                <FilterSelect value={chartYear} onChange={setChartYear} options={YEARS}/>
                <FilterSelect value="USD"       onChange={()=>{}} options={['USD','GBP','AUD','EUR']}/>
              </div>
            }>
            {Number(stats.commission_total||0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                  <DollarSign className="w-7 h-7 text-slate-300"/>
                </div>
                <h3 className="font-bold text-slate-500 mb-1">No Data Available to Display</h3>
                <div className="mt-4 bg-slate-50 rounded-xl px-6 py-3 border border-slate-200">
                  <div className="text-xs text-slate-400 mb-1">Total:</div>
                  <div className="text-xl font-bold text-slate-700">$0.00 USD</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div>
                  <div className="text-xs text-emerald-600 font-semibold mb-0.5">Total Commission</div>
                  <div className="text-2xl font-bold text-emerald-700">${Number(stats.commission_total||0).toLocaleString()} <span className="text-sm font-semibold">USD</span></div>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600"/>
                </div>
              </div>
            )}
          </ChartCard>

        </div>

        {/* ── RIGHT sidebar ── */}
        <div className="w-72 shrink-0 space-y-4">

          {/* ELEVATE tier card */}
          <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-brand-300"/>
                <span className="text-brand-300 text-xs font-semibold uppercase tracking-wider">EduPortal</span>
              </div>
              <div className="text-white font-bold text-xl tracking-widest mb-4">ELEVATE</div>
              <div className="flex items-start gap-3">
                <div className="w-13 h-14 bg-gradient-to-b from-amber-400 to-amber-600 rounded-xl flex flex-col items-center justify-center shadow-lg px-3">
                  <Star className="w-5 h-5 text-white fill-white"/>
                  <span className="text-white text-[10px] font-bold mt-0.5">Gold</span>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">Hi, {firstName}!</p>
                  <p className="text-brand-200 text-xs mt-0.5">You're doing great!</p>
                  <p className="text-brand-300 text-xs mt-0.5">Gold tier — 72.5% commission</p>
                </div>
              </div>
            </div>
            <div className="bg-black/20 px-5 py-3.5">
              <p className="text-white text-xs font-bold mb-2">Your Progress So Far</p>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-brand-300">Unique ready-for-visa applicants</span>
                <span className="text-white font-bold">{stats.accepted_apps||0}</span>
              </div>
              <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all"
                  style={{width:`${Math.min(100,(Number(stats.accepted_apps||0))*10)}%`}}/>
              </div>
              <p className="text-brand-400 text-[10px] mt-1.5">
                {Math.max(0,10-(Number(stats.accepted_apps||0)))} visa applicants away from Platinum!
              </p>
            </div>
            <button className="w-full px-5 py-3 text-brand-300 hover:text-white text-sm font-semibold hover:bg-white/10 transition-colors border-t border-white/10 flex items-center justify-center gap-2">
              Explore Your Benefits <ArrowRight className="w-4 h-4"/>
            </button>
          </div>

          {/* Your balance */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500"/>Your balance
              </h3>
              <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none bg-white">
                <option>USD</option><option>GBP</option><option>AUD</option>
              </select>
            </div>
            <div className="space-y-2.5 mb-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Commissions</span>
                <span className="text-sm font-bold text-slate-800">${Number(stats.commission_total||0).toLocaleString()} USD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Credits</span>
                <span className="text-sm font-bold text-slate-800">$0.00 USD</span>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-3 py-2.5 rounded-xl text-sm transition-colors">
              <ArrowUpRight className="w-4 h-4"/>Request commission withdrawal
            </button>
          </div>

          {/* Stay informed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-0.5">Stay informed</h3>
            <p className="text-xs text-slate-400 mb-4">Documents, tools, and resources</p>
            <div className="space-y-1.5">
              {QUICK_LINKS.map(link => (
                <a key={link.label} href={link.href}
                  className="flex items-center gap-2.5 text-sm text-brand-600 hover:text-brand-800 hover:bg-brand-50 px-3 py-2 rounded-xl border border-transparent hover:border-brand-100 transition-all">
                  <link.icon className="w-4 h-4 shrink-0"/>
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Support services */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4">Your support services</h3>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 p-3 bg-brand-50 rounded-xl">
              <div className="w-10 h-10 bg-brand-700 rounded-xl flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-white"/>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Standard Support</div>
                <a href="mailto:help@eduportal.com" className="text-xs text-brand-600 hover:underline">help@eduportal.com</a>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { icon: MessageSquare, label:'Start live chat',          href:'#' },
                { icon: Phone,         label:'Chat on WhatsApp',         href:'#' },
                { icon: BookOpen,      label:'Assist — knowledge base',  href:'#' },
              ].map(item=>(
                <a key={item.label} href={item.href}
                  className="flex items-center gap-2.5 text-sm text-brand-600 hover:bg-brand-50 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-brand-200 transition-all">
                  <item.icon className="w-4 h-4 shrink-0"/>{item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Account manager */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4">Your account manager</h3>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 bg-brand-700 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow">
                AK
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Aliya Khan</div>
                <a href="mailto:aliya.khan@eduportal.com" className="text-xs text-brand-600 hover:underline block">aliya.khan@eduportal.com</a>
                <a href="tel:+923292777761" className="text-xs text-slate-500 hover:text-brand-600 block mt-0.5">+92-329-2777761</a>
              </div>
            </div>
          </div>

          {/* Recent students */}
          {recent.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-500"/>Recent Students
                </h3>
                <Link href="/agent/students" className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3"/>
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {recent.slice(0,5).map((s,i) => {
                  const initials = (s.name||'??').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                  const avatarColors = ['bg-brand-600','bg-amber-500','bg-purple-500','bg-emerald-500','bg-rose-500'];
                  return (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm ${avatarColors[i%5]}`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{s.name}</div>
                        <div className="text-xs text-slate-400 truncate">{s.university_name||s.target_program||'—'}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0
                        ${s.status==='Active'?'bg-emerald-50 text-emerald-600 border-emerald-200':
                          s.status==='Pending'?'bg-amber-50 text-amber-600 border-amber-200':
                          'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {s.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}