// pages/admin/roles.js — Dynamic Role & User Management
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import {
  Plus, Shield, Users, Pencil, Trash2, X, Save, CheckCircle,
  AlertCircle, Loader2, Search, RefreshCw, ChevronRight,
  UserPlus, Eye, EyeOff, Lock, Mail, Phone, Building2,
  Settings, GraduationCap, FileText, DollarSign, BarChart2,
  MessageSquare, Globe, UserCheck, Headphones, TrendingUp,
  Star, BookOpen, Calendar, Award, Hash, ToggleLeft, ToggleRight,
  Copy, ChevronDown, ChevronUp, MoreVertical, Key
} from 'lucide-react';

// ── All modules + their permissions ──────────────────────────
const MODULES = [
  { key:'dashboard',     label:'Dashboard',      icon:BarChart2,    perms:['view','analytics'] },
  { key:'students',      label:'Students',       icon:GraduationCap,perms:['view','create','edit','delete','import','export'] },
  { key:'applications',  label:'Applications',   icon:FileText,     perms:['view','create','edit','delete','status_change','export'] },
  { key:'universities',  label:'Universities',   icon:Building2,    perms:['view','create','edit','delete'] },
  { key:'programs',      label:'Programs',       icon:BookOpen,     perms:['view','create','edit','delete','requirements'] },
  { key:'agents',        label:'Agents',         icon:Users,        perms:['view','create','edit','delete','commission'] },
  { key:'invoices',      label:'Invoices',       icon:DollarSign,   perms:['view','create','edit','delete','mark_paid','export'] },
  { key:'reports',       label:'Reports',        icon:BarChart2,    perms:['view','export'] },
  { key:'chat',          label:'Chat / Messages',icon:MessageSquare,perms:['view','send','manage'] },
  { key:'tasks',         label:'Tasks',          icon:CheckCircle,  perms:['view','create','edit','delete'] },
  { key:'settings',      label:'Settings',       icon:Settings,     perms:['view','manage'] },
  { key:'roles',         label:'Roles & Users',  icon:Shield,       perms:['view','create','edit','delete'] },
  { key:'countries',     label:'Countries',      icon:Globe,        perms:['view','manage'] },
];

const PERM_LABELS = {
  view:'View', create:'Create', edit:'Edit', delete:'Delete', import:'Import',
  export:'Export', status_change:'Change Status', commission:'Commission',
  mark_paid:'Mark Paid', manage:'Manage', send:'Send', analytics:'Analytics',
  requirements:'Requirements',
};

const ROLE_COLORS = [
  '#059669','#7c3aed','#0891b2','#d97706','#dc2626',
  '#0284c7','#9333ea','#16a34a','#ea580c','#475569',
];

const ICON_OPTIONS = [
  { name:'Shield',      icon:Shield      },
  { name:'UserCheck',   icon:UserCheck   },
  { name:'Building2',   icon:Building2   },
  { name:'TrendingUp',  icon:TrendingUp  },
  { name:'Headphones',  icon:Headphones  },
  { name:'DollarSign',  icon:DollarSign  },
  { name:'Star',        icon:Star        },
  { name:'BookOpen',    icon:BookOpen    },
  { name:'Globe',       icon:Globe       },
  { name:'Settings',    icon:Settings    },
];

function getIcon(name) {
  return ICON_OPTIONS.find(o=>o.name===name)?.icon || Shield;
}

const inp = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder-slate-300 font-medium transition-colors";
const sel = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium transition-colors";

function FL({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
        {label}{required&&<span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Permission matrix component ───────────────────────────────
function PermissionMatrix({ permissions, onChange, compact=false }) {
  function hasAll(moduleKey) {
    const mod = MODULES.find(m=>m.key===moduleKey);
    if (!mod) return false;
    return mod.perms.every(p => (permissions[moduleKey]||[]).includes(p));
  }

  function toggleAll(moduleKey) {
    const mod = MODULES.find(m=>m.key===moduleKey);
    if (!mod) return;
    if (hasAll(moduleKey)) {
      onChange({ ...permissions, [moduleKey]: [] });
    } else {
      onChange({ ...permissions, [moduleKey]: [...mod.perms] });
    }
  }

  function togglePerm(moduleKey, perm) {
    const current = permissions[moduleKey] || [];
    const next = current.includes(perm) ? current.filter(p=>p!==perm) : [...current, perm];
    onChange({ ...permissions, [moduleKey]: next });
  }

  function toggleAllModules(checked) {
    const next = {};
    MODULES.forEach(m => { next[m.key] = checked ? [...m.perms] : []; });
    onChange(next);
  }

  const totalGranted = Object.values(permissions).reduce((s,p)=>s+(p?.length||0), 0);
  const totalPossible = MODULES.reduce((s,m)=>s+m.perms.length, 0);

  return (
    <div>
      {/* Global toggle */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <div className="text-xs font-bold text-slate-500">
          {totalGranted} of {totalPossible} permissions granted
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={()=>toggleAllModules(true)}
            className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors">
            Grant All
          </button>
          <button type="button" onClick={()=>toggleAllModules(false)}
            className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition-colors">
            Revoke All
          </button>
        </div>
      </div>

      {/* Module rows */}
      <div className="space-y-0.5">
        {MODULES.map((mod, idx) => {
          const ModIcon = mod.icon;
          const modulePerms = permissions[mod.key] || [];
          const allChecked = hasAll(mod.key);
          const someChecked = modulePerms.length > 0 && !allChecked;
          return (
            <div key={mod.key}
              className={`flex items-start gap-3 px-4 py-3.5 rounded-xl transition-colors ${idx%2===0?'bg-slate-50/60':'bg-white'} hover:bg-brand-50/30`}>
              {/* Module checkbox */}
              <div className="flex items-center gap-3 w-48 shrink-0">
                <input type="checkbox" checked={allChecked} ref={el=>{ if(el) el.indeterminate=someChecked; }}
                  onChange={()=>toggleAll(mod.key)}
                  className="w-4 h-4 accent-brand-600 rounded cursor-pointer shrink-0"/>
                <div className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <ModIcon className="w-3.5 h-3.5 text-slate-500"/>
                </div>
                <span className="text-sm font-bold text-slate-700 capitalize">{mod.label}</span>
              </div>
              {/* Permission checkboxes */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 flex-1">
                {mod.perms.map(perm => (
                  <label key={perm} className="flex items-center gap-1.5 cursor-pointer group">
                    <input type="checkbox"
                      checked={modulePerms.includes(perm)}
                      onChange={()=>togglePerm(mod.key, perm)}
                      className="w-3.5 h-3.5 accent-brand-600 rounded cursor-pointer"/>
                    <span className={`text-xs font-medium transition-colors ${modulePerms.includes(perm)?'text-brand-700 font-semibold':'text-slate-500 group-hover:text-slate-700'}`}>
                      {PERM_LABELS[perm]||perm}
                    </span>
                  </label>
                ))}
              </div>
              {/* Count badge */}
              {modulePerms.length > 0 && (
                <div className="shrink-0 text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                  {modulePerms.length}/{mod.perms.length}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Role create/edit modal ────────────────────────────────────
function RoleModal({ open, editing, onClose, onSaved }) {
  const EMPTY_FORM = { name:'', description:'', color:'#059669', icon:'Shield', is_active:true, permissions:{} };
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [tab, setTab]       = useState('info');

  useEffect(() => {
    if (!open) return;
    setTab('info'); setError('');
    setForm(editing ? {
      name: editing.name||'', description: editing.description||'',
      color: editing.color||'#059669', icon: editing.icon||'Shield',
      is_active: editing.is_active!==0,
      permissions: { ...(editing.permissions||{}) }
    } : EMPTY_FORM);
  }, [open, editing]);

  function f(k,v) { setForm(p=>({...p,[k]:v})); }

  async function handleSave() {
    if (!form.name.trim()) { setError('Role name is required'); return; }
    setSaving(true); setError('');
    try {
      const method = editing ? 'PUT' : 'POST';
      const url    = editing ? `/api/roles/${editing.id}` : '/api/roles';
      const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed');
      onSaved(); onClose();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!open) return null;
  const RoleIcon = getIcon(form.icon);
  const totalPerms = Object.values(form.permissions).reduce((s,p)=>s+(p?.length||0),0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col" style={{maxHeight:'92vh'}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0" style={{background:form.color}}>
              <RoleIcon className="w-6 h-6 text-white"/>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{editing?`Edit Role: ${editing.name}`:'Create New Role'}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{totalPerms} permissions granted across {MODULES.length} modules</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-5 h-5"/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0 bg-slate-50">
          {[{ id:'info', label:'Role Info', icon:Shield },{ id:'permissions', label:`Permissions (${totalPerms})`, icon:Key }].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-colors
                ${tab===t.id?'border-brand-600 text-brand-700 bg-white':'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <t.icon className="w-4 h-4"/>{t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0"/>{error}
            </div>
          )}

          {/* ── INFO TAB ── */}
          {tab==='info' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FL label="Role Name" required>
                  <input className={inp} placeholder="e.g. Counsellor, Branch Manager" value={form.name} onChange={e=>f('name',e.target.value)}/>
                </FL>
                <FL label="Status">
                  <div className="flex items-center gap-3 pt-2">
                    <button type="button" onClick={()=>f('is_active',!form.is_active)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.is_active?'bg-emerald-500':'bg-slate-200'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_active?'translate-x-6':'translate-x-0'}`}/>
                    </button>
                    <span className={`text-sm font-semibold ${form.is_active?'text-emerald-700':'text-slate-400'}`}>{form.is_active?'Active':'Inactive'}</span>
                  </div>
                </FL>
              </div>

              <FL label="Description">
                <textarea rows={3} className={inp+' resize-none'} placeholder="Brief description of this role's responsibilities…"
                  value={form.description} onChange={e=>f('description',e.target.value)}/>
              </FL>

              {/* Color picker */}
              <FL label="Role Color">
                <div className="flex items-center gap-2 flex-wrap">
                  {ROLE_COLORS.map(color=>(
                    <button key={color} type="button" onClick={()=>f('color',color)}
                      className="w-8 h-8 rounded-xl transition-all shadow-sm hover:scale-110"
                      style={{background:color, outline: form.color===color?`3px solid ${color}`:'none', outlineOffset:'2px'}}>
                      {form.color===color && <CheckCircle className="w-4 h-4 text-white mx-auto"/>}
                    </button>
                  ))}
                  <input type="color" value={form.color} onChange={e=>f('color',e.target.value)}
                    className="w-8 h-8 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"/>
                  <span className="text-xs text-slate-400 font-mono">{form.color}</span>
                </div>
              </FL>

              {/* Icon picker */}
              <FL label="Role Icon">
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(opt=>(
                    <button key={opt.name} type="button" onClick={()=>f('icon',opt.name)}
                      className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all
                        ${form.icon===opt.name?'border-brand-600 bg-brand-50':'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <opt.icon className={`w-5 h-5 ${form.icon===opt.name?'text-brand-600':'text-slate-500'}`}/>
                    </button>
                  ))}
                </div>
              </FL>

              {/* Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Preview</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0" style={{background:form.color}}>
                    <RoleIcon className="w-5 h-5 text-white"/>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{form.name||'Role Name'}</div>
                    <div className="text-xs text-slate-400">{form.description||'Role description will appear here'}</div>
                  </div>
                  <div className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{background:form.color}}>
                    {form.is_active?'Active':'Inactive'}
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm text-amber-700">After creating this role, switch to the <b>Permissions tab</b> to configure exactly what this role can access and do in the system.</p>
              </div>
            </div>
          )}

          {/* ── PERMISSIONS TAB ── */}
          {tab==='permissions' && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0" style={{background:form.color}}>
                  <RoleIcon className="w-4 h-4 text-white"/>
                </div>
                <div>
                  <div className="font-bold text-slate-800">{form.name||'New Role'} — Module Permissions</div>
                  <div className="text-xs text-slate-400">Check the modules and actions this role can perform</div>
                </div>
              </div>
              <PermissionMatrix permissions={form.permissions} onChange={perms=>f('permissions',perms)}/>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50 shrink-0 rounded-b-3xl">
          <button onClick={onClose} className="px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors">Cancel</button>
          {tab==='info' && (
            <button onClick={()=>setTab('permissions')}
              className="px-6 py-3 rounded-2xl border-2 border-brand-200 bg-brand-50 text-brand-700 font-bold text-sm hover:bg-brand-100 transition-colors flex items-center gap-2">
              <Key className="w-4 h-4"/>Set Permissions
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors shadow-sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin"/>}
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User create/edit modal ────────────────────────────────────
function UserModal({ open, editing, roles, onClose, onSaved }) {
  const EMPTY = { name:'', email:'', phone:'', password:'', custom_role_id:'', is_active:true };
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(''); setShowPass(false);
    setForm(editing ? {
      name: editing.name||'', email: editing.email||'', phone: editing.phone||'',
      password: '', custom_role_id: editing.custom_role_id||'',
      is_active: editing.is_active!==0
    } : EMPTY);
  }, [open, editing]);

  function f(k,v) { setForm(p=>({...p,[k]:v})); }

  async function handleSave() {
    if (!form.name || !form.email) { setError('Name and email are required'); return; }
    if (!form.custom_role_id) { setError('Please select a role for this user'); return; }
    setSaving(true); setError('');
    try {
      const method = editing ? 'PUT' : 'POST';
      const url    = editing ? `/api/roles/users/${editing.id}` : '/api/roles/users';
      const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed');
      onSaved(); onClose();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const selectedRole = roles.find(r=>String(r.id)===String(form.custom_role_id));
  const RoleIcon     = selectedRole ? getIcon(selectedRole.icon) : Shield;
  const activeRoles  = roles.filter(r=>r.is_active);
  const initials     = form.name ? form.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : '?';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style={{maxHeight:'92vh'}} onClick={e=>e.stopPropagation()}>

        {/* ── Coloured header ── */}
        <div className="relative shrink-0 overflow-hidden" style={{background: selectedRole?.color || '#334155'}}>
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10"/>
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5"/>

          <div className="relative px-7 pt-6 pb-5 flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar preview */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {initials}
                </div>
                {selectedRole && (
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl flex items-center justify-center shadow-md border-2 border-white" style={{background:selectedRole.color}}>
                    <RoleIcon className="w-3.5 h-3.5 text-white"/>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{editing ? 'Edit Staff User' : 'Add Staff User'}</h2>
                <p className="text-sm text-white/70 mt-0.5">
                  {selectedRole ? (
                    <span className="flex items-center gap-1.5">
                      <RoleIcon className="w-3.5 h-3.5"/>
                      {selectedRole.name}
                    </span>
                  ) : 'No role selected'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/20 text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5"/>
            </button>
          </div>

          {/* Status toggle in header */}
          <div className="relative px-7 pb-5 flex items-center gap-3">
            <button type="button" onClick={()=>f('is_active',!form.is_active)}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${form.is_active?'bg-emerald-400':'bg-white/30'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active?'translate-x-5':'translate-x-0'}`}/>
            </button>
            <span className="text-sm font-semibold text-white/80">{form.is_active ? 'Account Active' : 'Account Inactive'}</span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Error */}
          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0"/>{error}
            </div>
          )}

          <div className="p-6 grid grid-cols-2 gap-6">

            {/* ── LEFT: Personal details ── */}
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-4 h-px bg-slate-200 flex-1"/>Personal Info<div className="w-4 h-px bg-slate-200 flex-1"/>
              </div>

              <FL label="Full Name" required>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                  <input className={inp+' pl-10'} value={form.name} onChange={e=>f('name',e.target.value)} placeholder="e.g. Ahmed Khan"/>
                </div>
              </FL>

              <FL label="Email Address" required hint="Used to log into the portal">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                  <input type="email" className={inp+' pl-10'} value={form.email} onChange={e=>f('email',e.target.value)} placeholder="ahmed@company.com"/>
                </div>
              </FL>

              <FL label="Phone Number">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                  <input className={inp+' pl-10'} value={form.phone} onChange={e=>f('phone',e.target.value)} placeholder="+92 300 0000000"/>
                </div>
              </FL>

              <FL label="Password" hint={editing ? 'Leave blank to keep unchanged' : 'Default if empty: User@123'}>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                  <input type={showPass?'text':'password'} className={inp+' pl-10 pr-11'}
                    value={form.password} onChange={e=>f('password',e.target.value)}
                    placeholder={editing?'Leave blank to keep unchanged':'Min 8 characters'}/>
                  <button type="button" onClick={()=>setShowPass(s=>!s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </FL>

              {/* Login summary box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Login Details</div>
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5 text-slate-500"/>
                  </div>
                  <span className={`font-mono font-medium truncate ${form.email?'text-slate-800':'text-slate-300 italic'}`}>
                    {form.email || 'no email entered'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5 text-slate-500"/>
                  </div>
                  <span className={`font-mono font-medium ${form.password?'text-slate-800':'text-slate-400 italic'}`}>
                    {form.password ? '•'.repeat(Math.min(form.password.length,12)) : editing ? 'unchanged' : 'User@123'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200">
                  Logs in at <span className="font-semibold text-slate-600">/login</span> → admin dashboard
                </p>
              </div>
            </div>

            {/* ── RIGHT: Role assignment ── */}
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-4 h-px bg-slate-200 flex-1"/>Assign Role<div className="w-4 h-px bg-slate-200 flex-1"/>
              </div>

              {activeRoles.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-40"/>
                  <p className="text-sm font-medium">No active roles yet</p>
                  <p className="text-xs mt-1">Create a role first, then add users</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeRoles.map(role => {
                    const RIcon   = getIcon(role.icon);
                    const selected = String(form.custom_role_id) === String(role.id);
                    const totalPerms = Object.values(role.permissions||{}).reduce((s,p)=>s+(p?.length||0),0);
                    return (
                      <button key={role.id} type="button" onClick={()=>f('custom_role_id', role.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-150 group
                          ${selected ? 'border-transparent shadow-md' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}
                        style={selected ? {background:`${role.color}15`, borderColor:role.color} : {}}>
                        {/* Role icon */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
                          style={{background: role.color}}>
                          <RIcon className="w-5 h-5 text-white"/>
                        </div>
                        {/* Name + desc */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-bold leading-tight ${selected?'text-slate-900':'text-slate-700'}`}>{role.name}</div>
                          {role.description && (
                            <div className="text-xs text-slate-400 truncate mt-0.5">{role.description}</div>
                          )}
                          <div className="text-[10px] font-semibold mt-1" style={{color:selected?role.color:'#94a3b8'}}>
                            {totalPerms} permission{totalPerms!==1?'s':''} · {role.user_count||0} user{role.user_count!==1?'s':''}
                          </div>
                        </div>
                        {/* Check */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                          ${selected ? 'border-transparent' : 'border-slate-300 group-hover:border-slate-400'}`}
                          style={selected ? {background:role.color} : {}}>
                          {selected && <CheckCircle className="w-3.5 h-3.5 text-white"/>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected role permissions preview */}
              {selectedRole && (
                <div className="rounded-2xl border-2 overflow-hidden" style={{borderColor:`${selectedRole.color}40`}}>
                  <div className="px-4 py-3 flex items-center gap-2" style={{background:`${selectedRole.color}15`}}>
                    <RoleIcon className="w-4 h-4" style={{color:selectedRole.color}}/>
                    <span className="text-xs font-bold" style={{color:selectedRole.color}}>
                      {selectedRole.name} — Module Access
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-1.5 bg-white max-h-36 overflow-y-auto">
                    {MODULES.map(mod => {
                      const granted = selectedRole.permissions?.[mod.key]||[];
                      if (!granted.length) return null;
                      const ModIcon = mod.icon;
                      return (
                        <div key={mod.key} className="flex items-center gap-2">
                          <ModIcon className="w-3 h-3 text-slate-400 shrink-0"/>
                          <span className="text-xs text-slate-600 font-medium w-24 shrink-0">{mod.label}</span>
                          <div className="flex gap-1 flex-wrap">
                            {granted.map(p=>(
                              <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                                style={{background:selectedRole.color}}>
                                {PERM_LABELS[p]||p}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {Object.values(selectedRole.permissions||{}).every(p=>!p?.length) && (
                      <p className="text-xs text-slate-400 italic py-2 text-center">No permissions configured for this role</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0 rounded-b-3xl">
          <button onClick={onClose}
            className="px-6 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-2xl text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-all shadow-sm"
            style={{background: selectedRole?.color || '#1e293b'}}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <UserPlus className="w-4 h-4"/>}
            {saving ? 'Saving…' : editing ? 'Save Changes' : `Create ${selectedRole?.name||'User'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Role detail panel (permissions viewer) ────────────────────
function RoleDetailPanel({ role, onEdit, onClose }) {
  if (!role) return null;
  const RoleIcon = getIcon(role.icon);
  const totalPerms = Object.values(role.permissions||{}).reduce((s,p)=>s+(p?.length||0),0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0" style={{background:role.color}}>
            <RoleIcon className="w-5 h-5 text-white"/>
          </div>
          <div>
            <div className="font-bold text-slate-800">{role.name}</div>
            <div className="text-xs text-slate-400">{totalPerms} permissions · {role.user_count||0} users</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-xl border border-brand-200 transition-colors">
            <Pencil className="w-3.5 h-3.5"/>Edit
          </button>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {role.description && (
          <p className="text-sm text-slate-500 mb-4 bg-slate-50 rounded-xl px-4 py-3 italic">{role.description}</p>
        )}

        {/* Permission summary */}
        <div className="space-y-1 mb-5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Module Access</div>
          {MODULES.map(mod => {
            const granted = (role.permissions?.[mod.key]||[]);
            if (granted.length === 0) return null;
            const ModIcon = mod.icon;
            return (
              <div key={mod.key} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <ModIcon className="w-3.5 h-3.5 text-slate-500"/>
                </div>
                <span className="text-sm font-semibold text-slate-700 w-28 shrink-0">{mod.label}</span>
                <div className="flex flex-wrap gap-1 flex-1">
                  {granted.map(p => (
                    <span key={p} className="text-[10px] font-bold px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-100 rounded-full">
                      {PERM_LABELS[p]||p}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {totalPerms === 0 && (
            <div className="text-center py-6 text-slate-400">
              <Lock className="w-8 h-8 mx-auto mb-2 opacity-40"/>
              <p className="text-sm">No permissions assigned</p>
            </div>
          )}
        </div>

        {/* Users with this role */}
        {(role.users||[]).length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Users with this role</div>
            <div className="space-y-2">
              {(role.users||[]).map(u=>(
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:role.color}}>
                    {(u.name||'?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{u.name}</div>
                    <div className="text-xs text-slate-400 truncate">{u.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function RolesPage() {
  const [roles, setRoles]         = useState([]);
  const [users, setUsers]         = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingRole, setEditingRole]     = useState(null);
  const [editingUser, setEditingUser]     = useState(null);
  const [selectedRole, setSelectedRole]   = useState(null);
  const [activeTab, setActiveTab]         = useState('roles');
  const [userSearch, setUserSearch]       = useState('');
  const [filterRoleId, setFilterRoleId]   = useState('');
  const [userPage, setUserPage]           = useState(1);
  const [userPages, setUserPages]         = useState(1);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetch('/api/roles').then(r=>r.json());
      setRoles(d.roles||[]);
    } finally { setLoading(false); }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const p = new URLSearchParams({ page: userPage, limit:15 });
      if (userSearch)    p.set('search', userSearch);
      if (filterRoleId)  p.set('role_id', filterRoleId);
      const d = await fetch(`/api/roles/users?${p}`).then(r=>r.json());
      setUsers(d.users||[]);
      setTotalUsers(d.total||0);
      setUserPages(d.pages||1);
    } finally { setUsersLoading(false); }
  }, [userPage, userSearch, filterRoleId]);

  useEffect(()=>{ loadRoles(); },[loadRoles]);
  useEffect(()=>{ loadUsers(); },[loadUsers]);

  async function loadRoleDetail(role) {
    const d = await fetch(`/api/roles/${role.id}`).then(r=>r.json());
    setSelectedRole(d);
  }

  async function handleDeleteRole(role) {
    if (!confirm(`Delete role "${role.name}"? Users with this role will lose it.`)) return;
    await fetch(`/api/roles/${role.id}`, { method:'DELETE' });
    setSelectedRole(null);
    loadRoles(); loadUsers();
  }

  async function handleDeleteUser(user) {
    if (!confirm(`Deactivate "${user.name}"?`)) return;
    await fetch(`/api/roles/users/${user.id}`, { method:'DELETE' });
    loadUsers();
  }

  return (
    <AdminLayout title="Roles & Users">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Roles & User Management</h2>
          <p className="text-sm text-slate-500 mt-1">{roles.length} custom roles · {totalUsers} staff users</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={()=>{ loadRoles(); loadUsers(); }}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shadow-sm transition-colors">
            <RefreshCw className="w-4 h-4"/>
          </button>
          <button onClick={()=>{ setEditingUser(null); setShowUserModal(true); }}
            className="flex items-center gap-2 border-2 border-brand-600 bg-white hover:bg-brand-50 text-brand-700 font-bold px-4 py-2.5 rounded-2xl text-sm transition-colors">
            <UserPlus className="w-4 h-4"/>Add User
          </button>
          <button onClick={()=>{ setEditingRole(null); setShowRoleModal(true); }}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-2xl text-sm transition-colors shadow-md">
            <Plus className="w-4 h-4"/>New Role
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-6 w-fit">
        {[{ id:'roles', label:`Roles (${roles.length})`, icon:Shield },{ id:'users', label:`Users (${totalUsers})`, icon:Users }].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
              ${activeTab===tab.id?'bg-white text-brand-700 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
            <tab.icon className="w-4 h-4"/>{tab.label}
          </button>
        ))}
      </div>

      {/* ── ROLES TAB ── */}
      {activeTab==='roles' && (
        <div className={`flex gap-5 ${selectedRole?'':'flex-col'}`}>
          {/* Roles grid */}
          <div className={selectedRole?'flex-1':'w-full'}>
            {loading ? (
              <div className="flex justify-center py-20"><Spinner size="lg"/></div>
            ) : (
              <div className={`grid gap-4 ${selectedRole?'grid-cols-1':'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {/* Create new role card */}
                <button onClick={()=>{ setEditingRole(null); setShowRoleModal(true); }}
                  className="border-2 border-dashed border-slate-300 hover:border-brand-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-brand-600 hover:bg-brand-50/30 transition-all min-h-[160px] group">
                  <div className="w-12 h-12 bg-slate-100 group-hover:bg-brand-100 rounded-2xl flex items-center justify-center transition-colors">
                    <Plus className="w-6 h-6"/>
                  </div>
                  <div className="text-sm font-bold text-center">Create New Role</div>
                </button>

                {roles.map(role => {
                  const RoleIcon = getIcon(role.icon);
                  const isSelected = selectedRole?.id === role.id;
                  const totalPerms = Object.values(role.permissions||{}).reduce((s,p)=>s+(p?.length||0),0);
                  return (
                    <div key={role.id}
                      className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden
                        ${isSelected?'border-brand-500':'border-slate-200 hover:border-slate-300'}`}
                      onClick={()=>loadRoleDetail(role)}>
                      {/* Color top bar */}
                      <div className="h-1.5 w-full" style={{background:role.color}}/>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0" style={{background:role.color}}>
                            <RoleIcon className="w-6 h-6 text-white"/>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${role.is_active?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-slate-100 text-slate-400 border-slate-200'}`}>
                              {role.is_active?'Active':'Inactive'}
                            </span>
                          </div>
                        </div>
                        <h3 className="font-bold text-slate-800 text-base mb-1">{role.name}</h3>
                        {role.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{role.description}</p>}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                            <div className="text-lg font-bold text-slate-800">{totalPerms}</div>
                            <div className="text-[10px] text-slate-400 font-semibold">Permissions</div>
                          </div>
                          <div className="rounded-xl p-2.5 text-center" style={{background:`${role.color}15`}}>
                            <div className="text-lg font-bold" style={{color:role.color}}>{role.user_count||0}</div>
                            <div className="text-[10px] text-slate-400 font-semibold">Users</div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                          <button onClick={e=>{e.stopPropagation();setEditingRole(role);setShowRoleModal(true);}}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-500 hover:text-brand-700 text-xs font-bold transition-all">
                            <Pencil className="w-3.5 h-3.5"/>Edit
                          </button>
                          <button onClick={e=>{e.stopPropagation();handleDeleteRole(role);}}
                            className="w-9 flex items-center justify-center rounded-xl border-2 border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Role detail panel */}
          {selectedRole && (
            <div className="w-96 shrink-0">
              <RoleDetailPanel
                role={selectedRole}
                onEdit={() => { setEditingRole(selectedRole); setShowRoleModal(true); }}
                onClose={() => setSelectedRole(null)}/>
            </div>
          )}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab==='users' && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input value={userSearch} onChange={e=>{ setUserSearch(e.target.value); setUserPage(1); }}
                  placeholder="Search by name or email…"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium placeholder-slate-400"/>
              </div>
              {/* Filter by role — pill buttons */}
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={()=>{ setFilterRoleId(''); setUserPage(1); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${filterRoleId===''?'bg-brand-600 text-white border-brand-600':'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                  All Roles
                </button>
                {roles.map(r=>(
                  <button key={r.id} onClick={()=>{ setFilterRoleId(String(r.id)); setUserPage(1); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all
                      ${filterRoleId===String(r.id)?'text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                    style={filterRoleId===String(r.id)?{background:r.color,borderColor:r.color}:{}}>
                    {r.name}
                  </button>
                ))}
              </div>
              <button onClick={()=>{ setEditingUser(null); setShowUserModal(true); }}
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm ml-auto">
                <UserPlus className="w-4 h-4"/>Add User
              </button>
            </div>
          </div>

          {/* Users table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50">
                  {['User','Role','Permissions','Status','Created','Actions'].map(h=>(
                    <th key={h} className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersLoading ? (
                  <tr><td colSpan={6} className="py-16 text-center"><Spinner size="lg"/></td></tr>
                ) : users.length===0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center"><Users className="w-7 h-7 opacity-50"/></div>
                        <p className="font-semibold text-slate-500">No users found</p>
                        <button onClick={()=>{ setEditingUser(null); setShowUserModal(true); }}
                          className="flex items-center gap-2 bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-sm">
                          <UserPlus className="w-4 h-4"/>Add First User
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : users.map(user=>{
                  const role = roles.find(r=>r.id===user.custom_role_id);
                  const RIcon = role ? getIcon(role.icon) : Shield;
                  const rolePerms = role ? Object.values(role.permissions||{}).reduce((s,p)=>s+(p?.length||0),0) : 0;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                            style={{background: role?.color||'#6366f1'}}>
                            {(user.name||'?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{user.name}</div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                            {user.phone && <div className="text-xs text-slate-400">{user.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {role ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{background:role.color}}>
                              <RIcon className="w-3.5 h-3.5 text-white"/>
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{role.name}</span>
                          </div>
                        ) : <span className="text-slate-400 text-sm">No role</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {role && Object.entries(role.permissions||{}).slice(0,3).map(([mod,perms])=>
                            perms.length>0 ? (
                              <span key={mod} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                {mod} ({perms.length})
                              </span>
                            ) : null
                          )}
                          {rolePerms > 0 && Object.keys(role?.permissions||{}).filter(k=>(role?.permissions[k]||[]).length>0).length > 3 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full">+more</span>
                          )}
                          {rolePerms === 0 && <span className="text-xs text-slate-400">No permissions</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${user.is_active?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-red-50 text-red-600 border-red-200'}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${user.is_active?'bg-emerald-500':'bg-red-500'}`}/>
                          {user.is_active?'Active':'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={()=>{ setEditingUser(user); setShowUserModal(true); }}
                            className="p-2 rounded-lg hover:bg-amber-50 hover:text-amber-600 text-slate-400 transition-colors">
                            <Pencil className="w-4 h-4"/>
                          </button>
                          <button onClick={()=>handleDeleteUser(user)}
                            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!usersLoading && users.length>0 && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                <span>Showing <span className="font-bold text-slate-700">{users.length}</span> of <span className="font-bold text-slate-700">{totalUsers}</span> users</span>
                {userPages>1 && (
                  <div className="flex items-center gap-1">
                    {Array.from({length:Math.min(5,userPages)},(_,i)=>{
                      const p=Math.max(1,Math.min(userPages-4,userPage-2))+i;
                      return <button key={p} onClick={()=>setUserPage(p)}
                        className={`w-8 h-8 rounded-lg border text-xs font-bold ${p===userPage?'bg-brand-700 text-white border-brand-700':'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{p}</button>;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <RoleModal open={showRoleModal} editing={editingRole}
        onClose={()=>{ setShowRoleModal(false); setEditingRole(null); }}
        onSaved={()=>{ loadRoles(); loadUsers(); }}/>

      <UserModal open={showUserModal} editing={editingUser} roles={roles}
        onClose={()=>{ setShowUserModal(false); setEditingUser(null); }}
        onSaved={loadUsers}/>
    </AdminLayout>
  );
}