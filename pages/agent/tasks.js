// pages/agent/tasks.js — Agent tasks page (ApplyBoard style)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import { RefreshCw, X, Filter, ChevronDown, Info, Eye } from 'lucide-react';

const TYPE_CONFIG = {
  profile_incomplete: { label:'Profile Incomplete', bg:'bg-[#6b7db3]',    icon:'👤' },
  missing_test_score: { label:'Test Score Missing',  bg:'bg-[#b36b6b]',    icon:'📝' },
  passport_expiring:  { label:'Passport Expiring',   bg:'bg-[#b3936b]',    icon:'🛂' },
  intake_missing:     { label:'App Requirement',     bg:'bg-[#6b7db3]',    icon:'📅' },
  follow_up:          { label:'Follow Up',           bg:'bg-[#7db36b]',    icon:'⏰' },
  conditional_offer:  { label:'Conditional Offer',   bg:'bg-[#9b6bb3]',    icon:'⚡' },
  offer_received:     { label:'Offer Received',      bg:'bg-[#6bb38d]',    icon:'🎉' },
  no_application:     { label:'No Application',      bg:'bg-[#8b8b8b]',    icon:'📋' },
};

const PRIORITY_COLORS = {
  high:   { badge:'bg-red-100 text-red-600 border-red-200',    label:'High priority'   },
  medium: { badge:'bg-purple-100 text-purple-600 border-purple-200', label:'Due date coming soon' },
  low:    { badge:'bg-slate-100 text-slate-500 border-slate-200',   label:'Low priority'    },
};

function TaskCard({ task, onDismiss }) {
  const router = useRouter();
  const cfg  = TYPE_CONFIG[task.type]  || TYPE_CONFIG.follow_up;
  const pcfg = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col">
      {/* Card header — colored banner like screenshot */}
      <div className={`${cfg.bg} p-4 relative overflow-hidden`}>
        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 bottom-0 w-24 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="white">
            <rect x="10" y="10" width="30" height="5" rx="2"/>
            <rect x="10" y="22" width="50" height="5" rx="2"/>
            <rect x="10" y="34" width="40" height="5" rx="2"/>
            <rect x="10" y="46" width="35" height="5" rx="2"/>
            <rect x="10" y="58" width="45" height="5" rx="2"/>
            <rect x="10" y="70" width="30" height="5" rx="2"/>
          </svg>
        </div>
        <div className="relative z-10">
          <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">{cfg.label}</p>
          <p className="text-white text-sm font-bold mt-0.5 opacity-0 select-none">—</p>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Due date / priority badge */}
        <div className="flex items-center gap-1.5 mb-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${pcfg.badge}`}>
            {pcfg.label}
          </span>
        </div>

        {/* Task title — the specific missing item, clickable */}
        <button
          onClick={()=>{ if(task.action_url) router.push(task.action_url); }}
          className="text-brand-600 font-bold text-sm hover:text-brand-800 hover:underline text-left leading-snug mb-3">
          {task.title}
        </button>

        {/* Meta details grid */}
        <div className="space-y-1.5 mt-auto">
          {task.intake && (
            <div className="flex text-xs">
              <span className="text-slate-400 w-20 shrink-0">Intake:</span>
              <span className="text-slate-700 font-medium">{task.intake}</span>
            </div>
          )}
          {task.app_code && (
            <div className="flex text-xs">
              <span className="text-slate-400 w-20 shrink-0">App ID:</span>
              <span className="text-brand-600 font-bold">#{task.app_code}</span>
            </div>
          )}
          {task.student_name && (
            <div className="flex text-xs">
              <span className="text-slate-400 w-20 shrink-0">Student:</span>
              <span className="text-slate-700 font-medium truncate">{task.student_name}</span>
            </div>
          )}
          {task.university_name && (
            <div className="flex text-xs">
              <span className="text-slate-400 w-20 shrink-0">School:</span>
              <span className="text-slate-700 font-medium truncate">{task.university_name}</span>
            </div>
          )}
          {task.description && !task.app_code && (
            <div className="flex text-xs">
              <span className="text-slate-400 w-20 shrink-0">Details:</span>
              <span className="text-slate-600 truncate">{task.description.split(':')[1]?.trim() || task.description}</span>
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <button onClick={()=>{ if(task.action_url) router.push(task.action_url); }}
            className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors">
            <Eye className="w-3.5 h-3.5"/>{task.action_label||'View'}
          </button>
          <button onClick={()=>onDismiss(task)}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
            <X className="w-3 h-3"/>Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// Dropdown filter
function DropFilter({ label, options, value, onChange }) {
  return (
    <div className="relative">
      <select value={value} onChange={e=>onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer hover:border-slate-300 transition-colors">
        <option value="">{label}</option>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"/>
    </div>
  );
}

export default function AgentTasks() {
  const [data, setData]       = useState({ tasks:[], total:0, high:0, medium:0, low:0 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter]   = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [studentFilter, setStudentFilter]   = useState('');
  const [showOverdue, setShowOverdue]       = useState(true);

  async function load() {
    setLoading(true);
    try {
      const d = await fetch('/api/agent/tasks').then(r=>r.json());
      setData(d);
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  async function handleDismiss(task) {
    await fetch('/api/agent/tasks', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ type:task.type, student_id:task.student_id, application_id:task.application_id, action:'dismiss' }),
    });
    load();
  }

  // All tasks from API
  const allTasks = data.tasks || [];

  // Build filter options from actual tasks
  const studentOptions = [...new Map(allTasks.filter(t=>t.student_name).map(t=>[t.student_id,{ value:String(t.student_id), label:t.student_name }])).values()];
  const typeOptions    = [...new Set(allTasks.map(t=>t.type))].map(t=>({ value:t, label:TYPE_CONFIG[t]?.label||t }));

  // Apply filters
  const filtered = allTasks.filter(t => {
    if (typeFilter     && t.type !== typeFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (studentFilter  && String(t.student_id) !== studentFilter) return false;
    return true;
  });

  // Group by type for display
  const types = [...new Set(filtered.map(t=>t.type))];

  const pending   = filtered.filter(t=>t.priority!=='low').length;
  const uncompleted = filtered.length;

  return (
    <AdminLayout title="My Tasks">
      <div className="max-w-full">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">My tasks</h2>
            <p className="text-slate-500 text-sm mt-1">
              You have <span className="font-bold text-slate-700">{uncompleted}</span> uncompleted tasks
            </p>
          </div>
          <button onClick={load}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors">
            <RefreshCw className="w-4 h-4"/>
          </button>
        </div>

        {/* ── Filter bar (like screenshot) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <DropFilter label="Task type"   value={typeFilter}     onChange={setTypeFilter}     options={typeOptions}/>
            <DropFilter label="Priority"    value={priorityFilter} onChange={setPriorityFilter}
              options={[{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]}/>
            <DropFilter label="Student"     value={studentFilter}  onChange={setStudentFilter}  options={studentOptions}/>
            {(typeFilter||priorityFilter||studentFilter) && (
              <button onClick={()=>{ setTypeFilter(''); setPriorityFilter(''); setStudentFilter(''); }}
                className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors border border-red-200">
                <X className="w-3.5 h-3.5"/>Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Summary bar ── */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-600">
            Showing <span className="font-bold text-slate-800">{filtered.length}</span> out of <span className="font-bold">{allTasks.length}</span> uncompleted tasks
          </p>
          <div className="flex items-center gap-3">
            {/* Priority pills */}
            <div className="flex items-center gap-2">
              {[
                { label:`${data.high} High`,   color:'bg-red-100 text-red-700 border-red-200',       f:'high'   },
                { label:`${data.medium} Medium`,color:'bg-purple-100 text-purple-700 border-purple-200', f:'medium' },
                { label:`${data.low} Low`,      color:'bg-slate-100 text-slate-600 border-slate-200', f:'low'    },
              ].map(p=>(
                <button key={p.f} onClick={()=>setPriorityFilter(v=>v===p.f?'':p.f)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${priorityFilter===p.f?'ring-2 ring-offset-1 ring-brand-400':''} ${p.color}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Task grid ── */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg"/></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center shadow-sm">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="font-bold text-slate-700 text-lg mb-2">All caught up!</h3>
            <p className="text-slate-400 text-sm">No pending tasks right now. Great work!</p>
          </div>
        ) : (
          /* ── Group tasks by type, show as sections ── */
          types.map(type => {
            const group = filtered.filter(t=>t.type===type);
            const cfg   = TYPE_CONFIG[type] || TYPE_CONFIG.follow_up;
            return (
              <div key={type} className="mb-8">
                {/* Section header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{cfg.icon}</span>
                  <h3 className="font-bold text-slate-800 text-base">{cfg.label}</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full ml-1">{group.length}</span>
                  <div className="flex-1 h-px bg-slate-200 ml-2"/>
                </div>
                {/* Card grid — 4 columns like screenshot */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.map(task=>(
                    <TaskCard key={task.id} task={task} onDismiss={handleDismiss}/>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-slate-400 text-center mt-4">
            Tasks refresh automatically. Dismissed tasks won't reappear until the issue is fixed and you refresh.
          </p>
        )}
      </div>
    </AdminLayout>
  );
}