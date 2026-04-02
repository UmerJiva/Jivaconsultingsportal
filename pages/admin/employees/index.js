// pages/admin/employees/index.js
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import useAdminPermissions, { AccessDenied } from '../../../lib/useAdminPermissions';

export default function AdminEmployeesPage() {
  const { isAdminEmployee, isCustom, loading: permLoading } = useAdminPermissions();

  const [employees, setEmployees] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', designation: '',
    assigned_agent_id: '',
    can_add_universities: false, can_add_programs: false,
    can_manage_applications: true, can_assign_tasks: true, can_chat_agent: true,
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const canAccess = !permLoading && !isAdminEmployee && !isCustom;

  useEffect(() => {
    if (canAccess) {
      fetchEmployees();
      fetchAgents();
    }
  }, [canAccess]);

  async function fetchEmployees() {
    setLoading(true);
    const r = await fetch('/api/admin-employees');
    const d = await r.json();
    setEmployees(d.employees || []);
    setLoading(false);
  }

  async function fetchAgents() {
    const r = await fetch('/api/agents?status=Active&limit=100');
    const d = await r.json();
    setAgents(d.agents || []);
  }

  function openAdd() {
    setEditing(null);
    setForm({
      name: '', email: '', password: '', phone: '', designation: '',
      assigned_agent_id: '',
      can_add_universities: false, can_add_programs: false,
      can_manage_applications: true, can_assign_tasks: true, can_chat_agent: true,
    });
    setShowModal(true);
  }

  function openEdit(emp) {
    setEditing(emp);
    setForm({
      name: emp.name, email: emp.email, password: '', phone: emp.phone || '',
      designation: emp.designation || '',
      assigned_agent_id: emp.assigned_agent_id || '',
      can_add_universities: !!emp.can_add_universities,
      can_add_programs: !!emp.can_add_programs,
      can_manage_applications: !!emp.can_manage_applications,
      can_assign_tasks: !!emp.can_assign_tasks,
      can_chat_agent: !!emp.can_chat_agent,
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.email) return alert('Name and email are required');
    if (!editing && !form.password) return alert('Password is required for new employees');
    setSaving(true);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/admin-employees/${editing.emp_id}` : '/api/admin-employees';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setSaving(false);
    if (r.ok) { setShowModal(false); fetchEmployees(); }
    else alert(d.error || 'Failed to save');
  }

  async function toggleActive(emp) {
    await fetch(`/api/admin-employees/${emp.emp_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: emp.is_active ? 0 : 1 }),
    });
    fetchEmployees();
  }

  // ── Block access for non-admin roles ─────────────────────────
  if (!permLoading && (isAdminEmployee || isCustom)) {
    return (
      <AdminLayout title="Admin Employees">
        <AccessDenied message="Only the main administrator can manage admin employees." />
      </AdminLayout>
    );
  }

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.agent_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const perms = [
    { key: 'can_add_universities',    label: 'Add universities' },
    { key: 'can_add_programs',        label: 'Add programs' },
    { key: 'can_manage_applications', label: 'Manage applications' },
    { key: 'can_assign_tasks',        label: 'Assign tasks' },
    { key: 'can_chat_agent',          label: 'Chat with agent' },
  ];

  const stats = {
    total:    employees.length,
    active:   employees.filter(e => e.is_active).length,
    assigned: employees.filter(e => e.assigned_agent_id).length,
  };

  return (
    <AdminLayout title="Admin Employees">
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>
              Admin Employees
            </h1>
            <p className="text-sm text-slate-500 mt-1">Staff who manage agents on your behalf</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}
          >
            <span className="text-lg leading-none">+</span> Add Employee
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Employees',   value: stats.total,    color: '#2563eb' },
            { label: 'Active',            value: stats.active,   color: '#059669' },
            { label: 'Assigned to Agent', value: stats.assigned, color: '#7c3aed' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: s.color }}>
                {s.value}
              </div>
              <span className="text-sm text-slate-600">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or assigned agent..."
            className="w-full max-w-sm px-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Loading employees...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No employees found. Add your first admin employee above.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Designation</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Assigned Agent</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Permissions</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => (
                  <tr key={emp.emp_id} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
                          {(emp.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{emp.name}</div>
                          <div className="text-xs text-slate-400">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{emp.designation || '—'}</td>
                    <td className="px-5 py-4">
                      {emp.agent_name ? (
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-100">
                          {emp.agent_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Not assigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {emp.can_manage_applications && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">Applications</span>}
                        {emp.can_assign_tasks        && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">Tasks</span>}
                        {emp.can_chat_agent          && <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">Chat</span>}
                        {emp.can_add_universities    && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">Universities</span>}
                        {emp.can_add_programs        && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">Programs</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        emp.is_active
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-green-500' : 'bg-slate-400'}`}/>
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(emp)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 font-medium transition-colors">
                          Edit
                        </button>
                        <button onClick={() => toggleActive(emp)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                            emp.is_active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-100'
                          }`}>
                          {emp.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>
                {editing ? 'Edit Employee' : 'Add Admin Employee'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Basic info — each field individually preserved from original */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400" placeholder="e.g. Bilal Ahmed"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    type="email" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400" placeholder="bilal@eduportal.com"/>
                </div>
                <div>
                  {/* RESTORED: conditional hint "(leave blank to keep)" when editing */}
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Password {editing ? '(leave blank to keep)' : '*'}
                  </label>
                  <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    type="password" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400" placeholder="••••••••"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400" placeholder="+92-300-..."/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Designation</label>
                  <input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400" placeholder="e.g. Case Manager, Counsellor"/>
                </div>
              </div>

              {/* Assign agent */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Assign to Agent</label>
                <select value={form.assigned_agent_id} onChange={e => setForm({ ...form, assigned_agent_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400">
                  <option value="">— Not assigned yet —</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">This employee will only see data for the assigned agent.</p>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Permissions</label>
                <div className="space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-200">
                  {perms.map(p => (
                    <label key={p.key} className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setForm({ ...form, [p.key]: !form[p.key] })}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                          form[p.key] ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                        }`}>
                        {form[p.key] && <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span className="text-sm text-slate-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={saving}
                className="px-5 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
                {saving ? 'Saving...' : (editing ? 'Save Changes' : 'Create Employee')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}