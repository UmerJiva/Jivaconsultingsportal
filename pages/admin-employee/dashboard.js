// pages/admin-employee/dashboard.js
// This is the landing page for admin_employee role
// They only see their assigned agent's world

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminEmployeeDashboard() {
  const router = useRouter();
  const [user, setUser]     = useState(null);
  const [stats, setStats]   = useState(null);
  const [tasks, setTasks]   = useState([]);
  const [apps, setApps]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [meRes, statsRes, tasksRes, appsRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/admin-employee/stats'),
      fetch('/api/admin-employee/tasks'),
      fetch('/api/admin-employee/applications?limit=5'),
    ]);
    if (!meRes.ok) { router.push('/'); return; }
    const me = await meRes.json();
    if (me.role !== 'admin_employee') { router.push('/'); return; }
    setUser(me);
    if (statsRes.ok)  setStats((await statsRes.json()).stats);
    if (tasksRes.ok)  setTasks((await tasksRes.json()).tasks?.slice(0, 5) || []);
    if (appsRes.ok)   setApps((await appsRes.json()).applications || []);
    setLoading(false);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const nav = [
    { label: 'Dashboard',     href: '/admin-employee/dashboard', icon: '◈' },
    { label: 'My Agent',      href: '/admin-employee/agent',     icon: '◉' },
    { label: 'Students',      href: '/admin-employee/students',  icon: '◎' },
    { label: 'Applications',  href: '/admin-employee/applications', icon: '◧' },
    { label: 'Tasks',         href: '/admin-employee/tasks',     icon: '◫' },
    { label: 'Chat',          href: '/admin-employee/chat',      icon: '◈', show: user?.permissions?.canChatAgent },
    ...(user?.permissions?.canAddUniversities
      ? [{ label: 'Universities', href: '/admin-employee/universities', icon: '◻' }]
      : []),
    ...(user?.permissions?.canAddPrograms
      ? [{ label: 'Programs', href: '/admin-employee/programs', icon: '◼' }]
      : []),
  ].filter(n => n.show !== false);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-400 text-sm">Loading your workspace...</div>
    </div>
  );

  const statusColors = {
    'Pending':     'bg-amber-50 text-amber-700 border-amber-100',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-100',
    'Done':        'bg-green-50 text-green-700 border-green-100',
    'Cancelled':   'bg-slate-100 text-slate-500 border-slate-200',
  };

  const appStatusColors = {
    'Submitted':   'bg-blue-50 text-blue-700',
    'Under Review':'bg-amber-50 text-amber-700',
    'Accepted':    'bg-green-50 text-green-700',
    'Rejected':    'bg-red-50 text-red-600',
  };

  return (
    <div className="min-h-screen flex bg-slate-50" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@500&display=swap');`}</style>

      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">EduPortal</div>
          <div className="font-semibold text-slate-800 text-sm" style={{ fontFamily: 'Playfair Display,serif' }}>
            Staff Portal
          </div>
        </div>

        {/* User card */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
              {(user?.name || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{user?.name}</div>
              <div className="text-xs text-slate-400 truncate">{user?.designation || 'Admin Employee'}</div>
            </div>
          </div>
          {user?.agentName && (
            <div className="mt-2.5 flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"/>
              <span className="text-xs text-blue-700 truncate">Agent: {user.agentName}</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {nav.map(n => {
            const active = typeof window !== 'undefined' && window.location.pathname === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}>
                <span className="text-base w-5 text-center">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <span className="text-base w-5 text-center">⎋</span> Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-2xl font-semibold text-slate-800" style={{ fontFamily: 'Playfair Display,serif' }}>
              Good day, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {user?.agentName
                ? `You're managing ${user.agentName}'s account`
                : 'No agent assigned yet — contact admin'}
            </p>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
              {[
                { label: 'Total Students',   value: stats.totalStudents   || 0, bg: '#eff6ff', color: '#1d4ed8' },
                { label: 'Applications',     value: stats.totalApps       || 0, bg: '#f0fdf4', color: '#15803d' },
                { label: 'Open Tasks',       value: stats.openTasks       || 0, bg: '#fffbeb', color: '#b45309' },
                { label: 'Pending Reviews',  value: stats.pendingReviews  || 0, bg: '#fdf4ff', color: '#7e22ce' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="text-2xl font-semibold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800 text-sm">My Tasks</h2>
                <Link href="/admin-employee/tasks" className="text-xs text-blue-600 hover:underline">View all</Link>
              </div>
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No tasks yet</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                      <div className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium border whitespace-nowrap ${statusColors[t.status]}`}>
                        {t.status}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">{t.title}</div>
                        {t.due_date && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            Due {new Date(t.due_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>
                      <div className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        t.priority === 'Urgent' ? 'bg-red-50 text-red-600' :
                        t.priority === 'High'   ? 'bg-orange-50 text-orange-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>{t.priority}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Applications */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800 text-sm">Recent Applications</h2>
                <Link href="/admin-employee/applications" className="text-xs text-blue-600 hover:underline">View all</Link>
              </div>
              {apps.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No applications yet</p>
              ) : (
                <div className="space-y-3">
                  {apps.map(app => (
                    <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                        {(app.student_name || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 truncate">{app.student_name}</div>
                        <div className="text-xs text-slate-400 truncate">{app.program_name} · {app.university_name}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${appStatusColors[app.status] || 'bg-slate-100 text-slate-500'}`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Agent info card */}
          {user?.agentName && (
            <div className="mt-5 bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
                  {user.agentName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{user.agentName}</div>
                  <div className="text-sm text-slate-500">Your assigned agent</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/admin-employee/agent"
                  className="px-4 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 rounded-lg font-medium transition-colors">
                  View Details
                </Link>
                {user.permissions?.canChatAgent && (
                  <Link href="/admin-employee/chat"
                    className="px-4 py-2 text-sm bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-medium transition-colors">
                    Chat
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}