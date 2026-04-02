// pages/agent-employee/students.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';

export default function AgentEmployeeStudents() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => { fetchStudents(); }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const r = await fetch('/api/agent-employee/students');
      if (r.status === 401) { router.replace('/login'); return; }
      const d = await r.json();
      setStudents(d.students || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const appStatusColor = count => count > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500';

  return (
    <AdminLayout title="My Students">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>
              My Students
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Students assigned to you by your agent
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-center">
            <div className="text-xl font-semibold text-emerald-700">{students.length}</div>
            <div className="text-xs text-emerald-600">Assigned</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full max-w-sm px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Loading students...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="text-4xl mb-3">👨‍🎓</div>
            <p className="text-slate-500 font-medium">
              {search ? 'No students match your search' : 'No students assigned yet'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {!search && 'Your agent will assign students to you'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Country</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">GPA</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">IELTS</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Applications</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Docs Pending</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {(s.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{s.name}</div>
                          <div className="text-xs text-slate-400">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{s.country_name || '—'}</td>
                    <td className="px-5 py-4">
                      {s.gpa ? (
                        <span className="font-medium text-slate-700">{s.gpa}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {s.ielts_score ? (
                        <span className="font-medium text-slate-700">{s.ielts_score}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${appStatusColor(s.app_count)}`}>
                        {s.app_count || 0} apps
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {s.docs_pending > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                          {s.docs_pending} pending
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}