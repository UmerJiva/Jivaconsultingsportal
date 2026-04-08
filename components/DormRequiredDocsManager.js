// components/DormRequiredDocsManager.js
// Drop this inside the hotel admin edit page (admin/hotels/[id]/edit.js or form.js)
// Usage: <DormRequiredDocsManager hotelId={id} />
import { useState, useEffect } from 'react';
import {
  Plus, Trash2, GripVertical, Save, FileText,
  CheckCircle, Loader2, AlertCircle
} from 'lucide-react';

export default function DormRequiredDocsManager({ hotelId }) {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!hotelId) return;
    fetch(`/api/admin/hotels/${hotelId}/required-docs`)
      .then(r => r.json())
      .then(d => { setDocs(d.docs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [hotelId]);

  function addDoc() {
    setDocs(d => [...d, { _key: Date.now(), name: '', description: '', is_required: 1 }]);
  }

  function updateDoc(idx, field, value) {
    setDocs(d => d.map((doc, i) => i === idx ? { ...doc, [field]: value } : doc));
  }

  function removeDoc(idx) {
    setDocs(d => d.filter((_, i) => i !== idx));
  }

  async function save() {
    setSaving(true); setError(''); setSaved(false);
    try {
      const r = await fetch(`/api/admin/hotels/${hotelId}/required-docs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: docs.filter(d => d.name?.trim()) }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Failed to save');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // Reload to get IDs
      const fresh = await fetch(`/api/admin/hotels/${hotelId}/required-docs`).then(r => r.json());
      setDocs(fresh.docs || []);
    } catch (e) {
      setError(e.message);
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex items-center gap-2 py-6 text-slate-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading required documents…
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Required Documents for Application</h3>
          <p className="text-xs text-slate-400 mt-0.5">Students must upload these to complete their dormitory application</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={addDoc}
            className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Document
          </button>
          <button type="button" onClick={save} disabled={saving}
            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
            {saving
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : saved
              ? <CheckCircle className="w-3.5 h-3.5" />
              : <Save className="w-3.5 h-3.5" />
            }
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5 mb-3">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      {docs.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl py-10 text-center text-slate-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No required documents yet</p>
          <p className="text-xs mt-1">Click "Add Document" to add the first one</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc, i) => (
            <div key={doc.id || doc._key}
              className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3.5 hover:border-emerald-200 transition-colors">
              {/* Order handle */}
              <div className="w-6 h-6 flex items-center justify-center text-slate-300 shrink-0 mt-1 cursor-grab">
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Number */}
              <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>

              {/* Fields */}
              <div className="flex-1 grid grid-cols-1 gap-2">
                <div className="flex gap-2">
                  <input
                    value={doc.name}
                    onChange={e => updateDoc(i, 'name', e.target.value)}
                    placeholder="Document name (e.g. Passport Copy)"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium placeholder-slate-300"
                  />
                  {/* Required toggle */}
                  <button type="button"
                    onClick={() => updateDoc(i, 'is_required', doc.is_required ? 0 : 1)}
                    className={`text-xs font-bold px-3 py-2 rounded-lg border transition-colors whitespace-nowrap ${
                      doc.is_required
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}>
                    {doc.is_required ? 'Required' : 'Optional'}
                  </button>
                </div>
                <input
                  value={doc.description || ''}
                  onChange={e => updateDoc(i, 'description', e.target.value)}
                  placeholder="Description or instructions (optional)"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600 placeholder-slate-300"
                />
              </div>

              {/* Remove */}
              <button type="button" onClick={() => removeDoc(i)}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 mt-0.5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {docs.length > 0 && (
        <p className="text-xs text-slate-400 mt-3 text-center">
          {docs.filter(d => d.is_required).length} required · {docs.filter(d => !d.is_required).length} optional
        </p>
      )}
    </div>
  );
}