// pages/admin/roles.js
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  Shield, Plus, Trash2, Edit2, Users, Check, X,
  Eye, FilePen, PlusCircle, Lock
} from 'lucide-react';

// All modules that can have permissions assigned
const MODULES = [
  { key: 'students',      label: 'Students'      },
  { key: 'applications',  label: 'Applications'  },
  { key: 'universities',  label: 'Universities'  },
  { key: 'programs',      label: 'Programs'      },
  { key: 'agents',        label: 'Agents'        },
  { key: 'invoices',      label: 'Invoices'      },
  { key: 'reports',       label: 'Reports'       },
  { key: 'questions',     label: 'Questions'     },
];

const ACTIONS = [
  { key: 'view',   label: 'View',   icon: Eye        },
  { key: 'create', label: 'Create', icon: PlusCircle },
  { key: 'edit',   label: 'Edit',   icon: FilePen    },
  { key: 'delete', label: 'Delete', icon: Trash2     },
];

const COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f97316','#eab308','#22c55e','#14b8a6',
  '#3b82f6','#06b6d4','#64748b','#1e3a5f',
];

const EMPTY_FORM = {
  name: '', description: '', color: '#6366f1', icon: 'Shield',
  permissions: {},
};

export default function RolesPage() {
  const [roles, setRoles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [tab, setTab]           = useState('roles'); // 'roles' | 'users'
  const [roleUsers, setRoleUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  useEffect(() => { fetchRoles(); }, []);

  async function fetchRoles() {
    setLoading(true);
    try {
      const r = await fetch('/api/roles');
      const d = await r.json();
      setRoles(d.roles || []);
    } catch { setRoles([]); }
    setLoading(false);
  }

  async function fetchRoleUsers(roleId) {
    setUsersLoading(true);
    setSelectedRoleId(roleId);
    try {
      const r = await fetch(`/api/roles/users?role_id=${roleId}`);
      const d = await r.json();
      setRoleUsers(d.users || []);
    } catch { setRoleUsers([]); }
    setUsersLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(role) {
    setEditing(role);
    setForm({
      name:        role.name,
      description: role.description || '',
      color:       role.color || '#6366f1',
      icon:        role.icon  || 'Shield',
      permissions: role.permissions || {},
    });
    setShowModal(true);
  }

  // Toggle a single action for a module
  function togglePerm(module, action) {
    setForm(f => {
      const current = f.permissions[module] || [];
      const next = current.includes(action)
        ? current.filter(a => a !== action)
        : [...current, action];
      return { ...f, permissions: { ...f.permissions, [module]: next } };
    });
  }

  // Toggle all actions for a module
  function toggleModule(module) {
    setForm(f => {
      const current = f.permissions[module] || [];
      const allKeys = ACTIONS.map(a => a.key);
      const allOn   = allKeys.every(a => current.includes(a));
      return {
        ...f,
        permissions: {
          ...f.permissions,
          [module]: allOn ? [] : [...allKeys],
        },
      };
    });
  }

  async function handleSave() {
    if (!form.name.trim()) return alert('Role name is required');
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url    = editing ? `/api/roles/${editing.id}` : '/api/roles';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { alert(d.error || 'Failed to save'); }
      else { setShowModal(false); fetchRoles(); }
    } catch (e) { alert('Network error'); }
    setSaving(false);
  }

  async function handleDelete(role) {
    if (!confirm(`Delete role "${role.name}"? Users with this role will become inactive.`)) return;
    setDeleting(role.id);
    await fetch(`/api/roles/${role.id}`, { method: 'DELETE' });
    setDeleting(null);
    fetchRoles();
  }

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  return (
    <AdminLayout title="Roles & Permissions">
      <div className="max-w-6xl mx-auto p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>
              Roles & Permissions
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Create custom staff roles with fine-grained module access
            </p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
            <Plus className="w-4 h-4" /> New Role
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
          {[
            { key: 'roles', label: 'Roles' },
            { key: 'users', label: 'Staff Users' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'roles' ? (
          /* ── Roles grid ── */
          loading ? (
            <div className="text-center py-20 text-slate-400 text-sm">Loading roles...</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No custom roles yet</p>
              <p className="text-sm text-slate-400 mt-1">Create a role to give staff members specific access</p>
              <button onClick={openAdd}
                className="mt-4 px-5 py-2 text-sm text-white rounded-xl font-medium"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
                Create first role
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {roles.map(role => {
                const permModules = Object.entries(role.permissions || {})
                  .filter(([, v]) => v?.length > 0);
                return (
                  <div key={role.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Color bar */}
                    <div className="h-1.5 w-full" style={{ background: role.color || '#6366f1' }} />

                    <div className="p-5">
                      {/* Role header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                            style={{ background: role.color || '#6366f1' }}>
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{role.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{role.slug}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs font-semibold text-slate-600">{role.user_count || 0}</span>
                        </div>
                      </div>

                      {/* Description */}
                      {role.description && (
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">{role.description}</p>
                      )}

                      {/* Permissions summary */}
                      <div className="space-y-1.5 mb-5">
                        {permModules.length === 0 ? (
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" /> No permissions assigned
                          </p>
                        ) : permModules.map(([mod, actions]) => (
                          <div key={mod} className="flex items-center justify-between">
                            <span className="text-xs text-slate-600 capitalize font-medium">{mod}</span>
                            <div className="flex gap-1">
                              {ACTIONS.map(a => (
                                <span key={a.key}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    actions.includes(a.key)
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-slate-100 text-slate-300'
                                  }`}>
                                  {a.label[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                        <button onClick={() => { setTab('users'); fetchRoleUsers(role.id); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                          <Users className="w-3.5 h-3.5" /> View Users
                        </button>
                        <button onClick={() => openEdit(role)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDelete(role)} disabled={deleting === role.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ── Staff Users tab ── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Role list (left) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">
                Select a role
              </div>
              {roles.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No roles yet</p>
              ) : (
                <div className="space-y-1">
                  {roles.map(role => (
                    <button key={role.id} onClick={() => fetchRoleUsers(role.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                        selectedRoleId === role.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ background: role.color }}>
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <span className="flex-1 truncate">{role.name}</span>
                      <span className="text-xs text-slate-400">{role.user_count || 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Users list (right) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200">
              {!selectedRoleId ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                  Select a role to view its users
                </div>
              ) : usersLoading ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                  Loading users...
                </div>
              ) : (
                <>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{selectedRole?.name} Users</div>
                      <div className="text-xs text-slate-400 mt-0.5">{roleUsers.length} staff member{roleUsers.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  {roleUsers.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                      No users assigned to this role yet
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {roleUsers.map(u => (
                        <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: selectedRole?.color || '#6366f1' }}>
                            {(u.name || '?').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">{u.name}</div>
                            <div className="text-xs text-slate-400 truncate">{u.email}</div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>
                {editing ? 'Edit Role' : 'Create New Role'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Role Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors"
                    placeholder="e.g. Counsellor, Case Manager"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
                  <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors"
                    placeholder="What does this role do?"/>
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Role Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                      className="w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 flex items-center justify-center"
                      style={{
                        background: c,
                        borderColor: form.color === c ? '#1e3a5f' : 'transparent',
                      }}>
                      {form.color === c && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions matrix */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-3">
                  Module Permissions
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Header row */}
                  <div className="grid bg-slate-50 border-b border-slate-200 px-4 py-2.5"
                    style={{ gridTemplateColumns: '1fr repeat(4, 80px)' }}>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Module</span>
                    {ACTIONS.map(a => (
                      <span key={a.key} className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
                        {a.label}
                      </span>
                    ))}
                  </div>

                  {/* Module rows */}
                  {MODULES.map((mod, i) => {
                    const current = form.permissions[mod.key] || [];
                    const allOn   = ACTIONS.every(a => current.includes(a.key));
                    return (
                      <div key={mod.key}
                        className={`grid items-center px-4 py-3 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                        style={{ gridTemplateColumns: '1fr repeat(4, 80px)' }}>
                        {/* Module name + toggle all */}
                        <button onClick={() => toggleModule(mod.key)}
                          className="flex items-center gap-2 text-left group">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            allOn ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-blue-400'
                          }`}>
                            {allOn && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{mod.label}</span>
                        </button>

                        {/* Individual action toggles */}
                        {ACTIONS.map(action => {
                          const on = current.includes(action.key);
                          return (
                            <div key={action.key} className="flex justify-center">
                              <button onClick={() => togglePerm(mod.key, action.key)}
                                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                                  on
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'bg-white border-slate-200 hover:border-emerald-400'
                                }`}>
                                {on && <Check className="w-3.5 h-3.5 text-white" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Click a module name to toggle all its permissions at once.
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 text-sm text-white rounded-xl font-semibold disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
                {saving ? 'Saving...' : (editing ? 'Save Changes' : 'Create Role')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}