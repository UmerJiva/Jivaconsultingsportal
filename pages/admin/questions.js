// pages/admin/questions.js — Admin: manage onboarding quiz questions & options
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import {
  Plus, Trash2, Save, Loader2, CheckCircle, AlertCircle,
  GripVertical, Globe, GraduationCap, BookOpen, DollarSign,
  Calendar, Flag, ChevronDown, ChevronUp, Edit2, X
} from 'lucide-react';
import { apiCall } from '../../lib/useApi';

const QUESTIONS = [
  { key:'study_countries', label:'Countries to Study In',     icon:Globe,          desc:'Destination countries shown to students' },
  { key:'edu_levels',      label:'Education Levels',          icon:GraduationCap,  desc:'Program levels students can select' },
  { key:'fields_of_study', label:'Fields of Study',           icon:BookOpen,       desc:'Academic fields / disciplines' },
  { key:'budget',          label:'Tuition Budget Options',    icon:DollarSign,     desc:'Budget ranges for filtering programs' },
];

const inp = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder-slate-300";

function QuestionSection({ q, options, onSave, onDelete, onAdd }) {
  const [open, setOpen]   = useState(false);
  const [items, setItems] = useState(options);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [adding, setAdding]     = useState(false);
  const Icon = q.icon;

  useEffect(() => setItems(options), [options]);

  function upd(id, k, v) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [k]: v } : i));
  }

  async function save() {
    setSaving(true);
    try {
      await onSave(items);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }

  async function addNew() {
    if (!newLabel.trim()) return;
    const val = newValue.trim() || newLabel.trim().toLowerCase().replace(/\s+/g,'-');
    const newOpt = { question_key: q.key, option_value: val, option_label: newLabel.trim(), sort_order: items.length, is_active: 1 };
    await onAdd(newOpt);
    setNewLabel(''); setNewValue(''); setAdding(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-brand-600"/>
          </div>
          <div>
            <div className="font-bold text-slate-800 flex items-center gap-2">
              {q.label}
              <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full">{items.filter(i=>i.is_active).length} active</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{q.desc}</div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-6 py-5">
          {/* Options list */}
          <div className="space-y-2 mb-4">
            {items.map((opt, idx) => (
              <div key={opt.id||idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${opt.is_active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0"/>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Display Label</label>
                    <input value={opt.option_label} onChange={e => upd(opt.id, 'option_label', e.target.value)} className={inp}/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Value (used in filter)</label>
                    <input value={opt.option_value} onChange={e => upd(opt.id, 'option_value', e.target.value)} className={inp}/>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600">
                    <input type="checkbox" checked={!!opt.is_active} onChange={e => upd(opt.id, 'is_active', e.target.checked?1:0)} className="w-4 h-4 accent-brand-600"/>
                    Active
                  </label>
                  <button onClick={() => onDelete(opt.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new option */}
          {adding ? (
            <div className="border-2 border-brand-200 rounded-2xl p-4 bg-brand-50 mb-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Display Label *</label>
                  <input autoFocus value={newLabel} onChange={e => setNewLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addNew()}
                    placeholder="e.g. United Kingdom" className={inp}/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Value (optional)</label>
                  <input value={newValue} onChange={e => setNewValue(e.target.value)}
                    placeholder="Auto-generated if blank" className={inp}/>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addNew} disabled={!newLabel.trim()} className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-40 transition-colors">
                  <Plus className="w-4 h-4"/>Add Option
                </button>
                <button onClick={() => { setAdding(false); setNewLabel(''); setNewValue(''); }} className="px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-white">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="flex items-center gap-2 text-sm font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl border border-brand-200 transition-colors mb-4">
              <Plus className="w-4 h-4"/>Add Option
            </button>
          )}

          {/* Save button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Changes are saved per section. Don't forget to save!</p>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : saved ? <CheckCircle className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminQuestions() {
  const [options, setOptions]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  async function load() {
    setLoading(true);
    try {
      const d = await fetch('/api/preferences').then(r => r.json());
      const grouped = {};
      (d.options || []).forEach(o => {
        if (!grouped[o.question_key]) grouped[o.question_key] = [];
        grouped[o.question_key].push({ ...o });
      });
      setOptions(grouped);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(items) {
    await apiCall('/api/preferences', 'PUT', { options: items });
    await load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this option?')) return;
    await apiCall('/api/preferences', 'DELETE', { id });
    await load();
  }

  async function handleAdd(opt) {
    await apiCall('/api/preferences', 'PUT', { options: [opt] });
    await load();
  }

  return (
    <AdminLayout title="Onboarding Questions">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>Onboarding Questions</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage the quiz questions and answer options shown to students when they first search for programs</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-blue-600"/>
          </div>
          <div>
            <div className="font-bold text-blue-800 mb-1">How this works</div>
            <p className="text-sm text-blue-700 leading-relaxed">
              When a student clicks "Find Programs" from their dashboard, they go through a short preference quiz.
              The answers are used to automatically filter the programs page. You can add, remove, or rename any option below.
              All changes take effect immediately for new students.
            </p>
          </div>
        </div>

        {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4"><AlertCircle className="w-4 h-4"/>{error}</div>}

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg"/></div> : (
          QUESTIONS.map(q => (
            <QuestionSection
              key={q.key}
              q={q}
              options={options[q.key] || []}
              onSave={handleSave}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          ))
        )}
      </div>
    </AdminLayout>
  );
}