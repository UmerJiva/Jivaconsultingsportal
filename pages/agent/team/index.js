// pages/agent/team/index.js
// Agent manages their team + sets permissions per employee

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Plus, Check, Shield } from 'lucide-react';

const PERM_GROUPS = [
  {
    label: 'Students',
    perms: [
      { key: 'can_view_students',   label: 'View students'   },
      { key: 'can_add_students',    label: 'Add students'    },
      { key: 'can_edit_students',   label: 'Edit students'   },
      { key: 'can_delete_students', label: 'Delete students' },
    ],
  },
  {
    label: 'Applications',
    perms: [
      { key: 'can_view_applications',   label: 'View applications'   },
      { key: 'can_add_applications',    label: 'Add applications'    },
      { key: 'can_edit_applications',   label: 'Edit applications'   },
      { key: 'can_delete_applications', label: 'Delete applications' },
    ],
  },
  {
    label: 'Documents',
    perms: [
      { key: 'can_view_documents',   label: 'View documents'   },
      { key: 'can_upload_documents', label: 'Upload documents' },
      { key: 'can_delete_documents', label: 'Delete documents' },
    ],
  },
  {
    label: 'Other Access',
    perms: [
      { key: 'can_view_universities',  label: 'View universities'  },
      { key: 'can_view_programs',      label: 'View programs'      },
      { key: 'can_chat_agent',         label: 'Chat with you'      },
      { key: 'can_view_tasks',         label: 'View tasks'         },
      { key: 'can_update_task_status', label: 'Update task status' },
    ],
  },
];

const DEFAULT_PERMS = {
  can_view_students: true,   can_add_students: false,
  can_edit_students: false,  can_delete_students: false,
  can_view_applications: true,  can_add_applications: false,
  can_edit_applications: false, can_delete_applications: false,
  can_view_documents: true,  can_upload_documents: false, can_delete_documents: false,
  can_view_universities: true,  can_view_programs: true,
  can_chat_agent: true, can_view_tasks: true, can_update_task_status: false,
};

const EMPTY_FORM = { name:'', email:'', password:'', phone:'', designation:'', ...DEFAULT_PERMS };

export default function AgentTeamPage() {
  const [employees, setEmployees]   = useState([]);
  const [students,  setStudents]    = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [tab,       setTab]         = useState('employees');
  const [showModal, setShowModal]   = useState(false);
  const [showAssign,setShowAssign]  = useState(false);
  const [editing,   setEditing]     = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [form,      setForm]        = useState(EMPTY_FORM);
  const [saving,    setSaving]      = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [empRes, stuRes] = await Promise.all([
      fetch('/api/agent-employees'),
      fetch('/api/agent/students?limit=200'),
    ]);
    if (empRes.ok) setEmployees((await empRes.json()).employees || []);
    if (stuRes.ok) setStudents((await stuRes.json()).students   || []);
    setLoading(false);
  }

  function openAdd()    { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); }
  function openEdit(emp) {
    setEditing(emp);
    const f = { name: emp.name, email: emp.email, password:'', phone: emp.phone||'', designation: emp.designation||'' };
    Object.keys(DEFAULT_PERMS).forEach(k => { f[k] = !!emp[k]; });
    setForm(f); setShowModal(true);
  }

  async function handleSave() {
    if (!form.name||!form.email) return alert('Name and email required');
    if (!editing&&!form.password) return alert('Password required');
    setSaving(true);
    const method = editing ? 'PUT' : 'POST';
    const url    = editing ? `/api/agent-employees/${editing.emp_id}` : '/api/agent-employees';
    const r = await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
    const d = await r.json();
    setSaving(false);
    if (r.ok) { setShowModal(false); fetchAll(); } else alert(d.error||'Failed');
  }

  function openAssign(emp) {
    setAssignTarget(emp);
    setSelectedStudents(emp.assigned_students?.map(s=>s.id)||[]);
    setShowAssign(true);
  }

  async function handleAssign() {
    setSaving(true);
    const r = await fetch(`/api/agent-employees/${assignTarget.emp_id}/students`,{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({student_ids:selectedStudents}),
    });
    setSaving(false);
    if (r.ok) { setShowAssign(false); fetchAll(); } else alert('Failed');
  }

  async function toggleActive(emp) {
    await fetch(`/api/agent-employees/${emp.emp_id}`,{
      method:'PATCH',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({is_active:emp.is_active?0:1}),
    });
    fetchAll();
  }

  function togglePerm(key)   { setForm(f=>({...f,[key]:!f[key]})); }
  function toggleGroup(group){
    const keys=group.perms.map(p=>p.key); const allOn=keys.every(k=>form[k]);
    const update={}; keys.forEach(k=>{update[k]=!allOn;});
    setForm(f=>({...f,...update}));
  }

  return (
    <AdminLayout title="My Team">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800" style={{fontFamily:'Georgia,serif'}}>My Team</h1>
            <p className="text-sm text-slate-500 mt-1">Add staff, set permissions and assign students</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90"
            style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}>
            <Plus className="w-4 h-4"/> Add Team Member
          </button>
        </div>

        <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
          {[{key:'employees',label:`Members (${employees.length})`},{key:'assignments',label:'Assignments'}].map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t.key?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Loading team...</div>
        ) : tab==='employees' ? (
          employees.length===0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-slate-500 font-medium">No team members yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {employees.map(emp=>{
                const totalPerms = Object.keys(DEFAULT_PERMS).filter(k=>emp[k]).length;
                return (
                  <div key={emp.emp_id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{background:'linear-gradient(135deg,#064e3b,#059669)'}}>
                          {(emp.name||'?').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{emp.name}</div>
                          <div className="text-xs text-slate-400">{emp.designation||'Team Member'}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${emp.is_active?'bg-green-50 text-green-700 border-green-100':'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {emp.is_active?'Active':'Inactive'}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5"/> Permissions
                        </span>
                        <span className="text-xs text-slate-400">{totalPerms} active</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {emp.can_view_students    && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">View Students</span>}
                        {emp.can_edit_students    && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100">Edit Students</span>}
                        {emp.can_add_applications && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100">Add Apps</span>}
                        {emp.can_edit_applications&& <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100">Edit Apps</span>}
                        {emp.can_upload_documents && <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100">Upload Docs</span>}
                        {emp.can_chat_agent       && <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded border border-teal-100">Chat</span>}
                        {totalPerms===0           && <span className="text-[10px] text-slate-400">No permissions set</span>}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 mb-4">
                      <div className="text-xs font-medium text-slate-600 mb-1.5">Assigned Students ({emp.assigned_students?.length||0})</div>
                      {emp.assigned_students?.length>0 ? (
                        <div className="flex flex-wrap gap-1">
                          {emp.assigned_students.slice(0,3).map(s=>(
                            <span key={s.id} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{s.name}</span>
                          ))}
                          {emp.assigned_students.length>3 && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded">+{emp.assigned_students.length-3} more</span>}
                        </div>
                      ) : <p className="text-xs text-slate-400">No students assigned</p>}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={()=>openAssign(emp)} className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100">Assign Students</button>
                      <button onClick={()=>openEdit(emp)}   className="py-1.5 px-3 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100">Edit</button>
                      <button onClick={()=>toggleActive(emp)}
                        className={`py-1.5 px-3 text-xs font-medium rounded-lg border ${emp.is_active?'bg-red-50 text-red-500 hover:bg-red-100 border-red-100':'bg-green-50 text-green-700 hover:bg-green-100 border-green-100'}`}>
                        {emp.is_active?'✕':'✓'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Assigned Students</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp,i)=>(
                  <tr key={emp.emp_id} className={`border-b border-slate-100 ${i%2?'bg-slate-50/40':''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{background:'linear-gradient(135deg,#064e3b,#059669)'}}>
                          {(emp.name||'?').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{emp.name}</div>
                          <div className="text-xs text-slate-400">{emp.designation||'Team Member'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {emp.assigned_students?.length>0
                          ? emp.assigned_students.map(s=><span key={s.id} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{s.name}</span>)
                          : <span className="text-xs text-slate-400">None</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={()=>openAssign(emp)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 font-medium">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-slate-800" style={{fontFamily:'Georgia,serif'}}>{editing?'Edit Team Member':'Add Team Member'}</h2>
              <button onClick={()=>setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {label:'Full Name *',key:'name',type:'text',placeholder:'Full name'},
                  {label:'Email *',key:'email',type:'email',placeholder:'email@example.com'},
                  {label:editing?'Password (leave blank to keep)':'Password *',key:'password',type:'password',placeholder:'••••••••'},
                  {label:'Phone',key:'phone',type:'text',placeholder:'+92-300-...'},
                ].map(f=>(
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{f.label}</label>
                    <input value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}
                      type={f.type} placeholder={f.placeholder}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400"/>
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Designation</label>
                  <input value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})}
                    placeholder="e.g. Student Advisor, Document Specialist"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400"/>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-slate-500"/>
                  <span className="text-sm font-semibold text-slate-700">Permissions</span>
                </div>
                <div className="space-y-3">
                  {PERM_GROUPS.map(group=>{
                    const allOn = group.perms.every(p=>form[p.key]);
                    const count = group.perms.filter(p=>form[p.key]).length;
                    return (
                      <div key={group.label} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                          <button onClick={()=>toggleGroup(group)} className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${allOn?'bg-blue-600 border-blue-600':'bg-white border-slate-300'}`}>
                              {allOn && <Check className="w-2.5 h-2.5 text-white"/>}
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{group.label}</span>
                          </button>
                          <span className="text-xs text-slate-400">{count}/{group.perms.length}</span>
                        </div>
                        <div className="px-4 py-3 grid grid-cols-2 gap-2">
                          {group.perms.map(p=>(
                            <label key={p.key} className="flex items-center gap-2.5 cursor-pointer">
                              <div onClick={()=>togglePerm(p.key)}
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer shrink-0 transition-colors ${form[p.key]?'bg-emerald-500 border-emerald-500':'bg-white border-slate-300 hover:border-emerald-400'}`}>
                                {form[p.key] && <Check className="w-2.5 h-2.5 text-white"/>}
                              </div>
                              <span className="text-xs text-slate-600">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={()=>setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 text-sm text-white rounded-xl font-semibold disabled:opacity-60 hover:opacity-90"
                style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}>
                {saving?'Saving...':(editing?'Save Changes':'Add Member')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {showAssign && assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-semibold text-slate-800" style={{fontFamily:'Georgia,serif'}}>Assign Students</h2>
                <p className="text-xs text-slate-400 mt-0.5">To {assignTarget.name}</p>
              </div>
              <button onClick={()=>setShowAssign(false)} className="text-slate-400 text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {students.length===0 ? <p className="text-sm text-slate-400 text-center py-8">No students yet</p>
              : students.map(s=>(
                <label key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${selectedStudents.includes(s.id)?'bg-blue-50 border-blue-200':'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                  <div onClick={()=>setSelectedStudents(prev=>prev.includes(s.id)?prev.filter(x=>x!==s.id):[...prev,s.id])}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${selectedStudents.includes(s.id)?'bg-blue-600 border-blue-600':'bg-white border-slate-300'}`}>
                    {selectedStudents.includes(s.id)&&<Check className="w-2.5 h-2.5 text-white"/>}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {(s.name||'?').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{s.name}</div>
                    <div className="text-xs text-slate-400 truncate">{s.email}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">{selectedStudents.length} selected</span>
              <div className="flex gap-3">
                <button onClick={()=>setShowAssign(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl">Cancel</button>
                <button onClick={handleAssign} disabled={saving}
                  className="px-5 py-2 text-sm text-white rounded-xl font-semibold disabled:opacity-60"
                  style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}>
                  {saving?'Saving...':'Save Assignments'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}