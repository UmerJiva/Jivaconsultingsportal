// pages/agent-employee/dashboard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../components/layout/AdminLayout';

export default function AgentEmployeeDashboard() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [students, setStudents] = useState([]);
  const [apps, setApps]         = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) { router.replace('/login'); return; }
      const data = await meRes.json();
      // your /api/auth/me returns { user: {...} }
      const me = data.user || data;
      if (me.role !== 'agent_employee') { router.replace('/login'); return; }
      setUser(me);

      const [stuRes, appRes] = await Promise.all([
        fetch('/api/agent-employee/students'),
        fetch('/api/agent-employee/applications?limit=5'),
      ]);
      if (stuRes.ok) setStudents((await stuRes.json()).students || []);
      if (appRes.ok) setApps((await appRes.json()).applications || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const appStatusColors = {
    'Submitted':    'bg-blue-50 text-blue-700',
    'Under Review': 'bg-amber-50 text-amber-700',
    'Accepted':     'bg-green-50 text-green-700',
    'Rejected':     'bg-red-50 text-red-600',
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-400 text-sm">Loading your workspace...</div>
    </div>
  );

  return (
    <AdminLayout title="Dashboard">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>
            Welcome, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {students.length > 0
              ? `You're managing ${students.length} student${students.length > 1 ? 's' : ''}`
              : 'No students assigned yet — your agent will assign students to you'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
          {[
            { label: 'My Students',   value: students.length,                                    color: '#059669' },
            { label: 'Applications',  value: apps.length,                                        color: '#2563eb' },
            { label: 'Accepted',      value: apps.filter(a => a.status === 'Accepted').length,   color: '#7c3aed' },
            { label: 'Pending Docs',  value: students.filter(s => s.docs_pending).length,        color: '#b45309' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-2xl font-semibold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Students + Recent apps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

          {/* My students */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 text-sm">My Students</h2>
              <Link href="/agent-employee/students" className="text-xs text-emerald-600 hover:underline">View all</Link>
            </div>
            {students.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No students assigned yet</p>
            ) : (
              <div className="space-y-2">
                {students.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {(s.name || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 truncate">{s.name}</div>
                      <div className="text-xs text-slate-400 truncate">{s.email}</div>
                    </div>
                    <div className="text-xs text-slate-400">{s.app_count || 0} apps</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent applications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 text-sm">Recent Applications</h2>
              <Link href="/agent-employee/applications" className="text-xs text-emerald-600 hover:underline">View all</Link>
            </div>
            {apps.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No applications yet</p>
            ) : (
              <div className="space-y-2">
                {apps.map(app => (
                  <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 truncate">{app.student_name}</div>
                      <div className="text-xs text-slate-400 truncate">{app.program_name}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${appStatusColors[app.status] || 'bg-slate-100 text-slate-500'}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat shortcut */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="font-semibold text-white">Chat with {user?.agentName || 'your agent'}</div>
            <div className="text-sm text-emerald-200 mt-0.5">Ask questions or get guidance on student cases</div>
          </div>
          <Link href="/agent-employee/chat"
            className="px-4 py-2 bg-white text-emerald-800 text-sm font-semibold rounded-lg hover:bg-emerald-50 transition-colors">
            Open Chat
          </Link>
        </div>

      </div>
    </AdminLayout>
  );
}