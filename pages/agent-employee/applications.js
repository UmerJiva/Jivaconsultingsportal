// pages/agent-employee/applications.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';

const STATUS_COLORS = {
  'Submitted':         'bg-blue-50 text-blue-700 border-blue-100',
  'Under Review':      'bg-amber-50 text-amber-700 border-amber-100',
  'Accepted':          'bg-green-50 text-green-700 border-green-100',
  'Rejected':          'bg-red-50 text-red-600 border-red-100',
  'Conditional Offer': 'bg-purple-50 text-purple-700 border-purple-100',
  'Withdrawn':         'bg-slate-100 text-slate-500 border-slate-200',
};

export default function AgentEmployeeApplications() {
  const router = useRouter();
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchApps(); }, []);

  async function fetchApps() {
    setLoading(true);
    try {
      const r = await fetch('/api/agent-employee/applications');
      if (r.status === 401) { router.replace('/login'); return; }
      const d = await r.json();
      setApps(d.applications || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = apps.filter(a => {
    const matchSearch = !search ||
      a.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.program_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.university_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statuses = [...new Set(apps.map(a => a.status))];

  return (
    <AdminLayout title="Applications">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>
              Applications
            </h1>
            <p className="text-sm text-slate-500 mt-1">Applications for your assigned students</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-center">
            <div className="text-xl font-semibold text-blue-700">{apps.length}</div>
            <div className="text-xs text-blue-600">Total</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student, program, university..."
            className="flex-1 max-w-sm px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-400 transition-colors"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-400 bg-white">
            <option value="">All statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-500 font-medium">No applications found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Program</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">University</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Intake</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, i) => (
                  <tr key={app.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {(app.student_name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{app.student_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 max-w-[200px] truncate">{app.program_name || '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{app.university_name || '—'}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{app.intake || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
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
    </AdminLayout>
  );
}