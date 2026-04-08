// pages/agent/dorm-applications/new.js
// Also works for student: pages/student/dorm-applications/new.js (same file, different layout role)
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import {
  ArrowLeft, ArrowRight, Search, CheckCircle, X, Loader2,
  Home, BedDouble, Users, MapPin, DollarSign, Calendar,
  FileText, Check, AlertCircle, ChevronDown
} from 'lucide-react';

const WIZARD_STEPS = ['Dormitory', 'Room', 'Student', 'Details', 'Documents'];

function Stepper({ step }) {
  return (
    <div className="flex items-start overflow-x-auto pb-2 mb-6">
      {WIZARD_STEPS.map((label, i) => {
        const done = i < step, current = i === step;
        return (
          <div key={label} className="flex items-center shrink-0">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all z-10
                ${done ? 'bg-emerald-600 border-emerald-600 text-white'
                  : current ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white border-slate-300 text-slate-400'}`}>
                {done ? <Check className="w-4 h-4" strokeWidth={3} /> : <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <span className={`text-xs mt-1.5 font-semibold whitespace-nowrap text-center max-w-[72px]
                ${done ? 'text-emerald-600' : current ? 'text-emerald-700' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={`h-0.5 w-8 lg:w-12 -mt-5 transition-colors shrink-0 ${i < step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SearchDropdown({ items, value, onChange, placeholder, renderItem, renderSelected }) {
  const [q, setQ]       = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = items.filter(item => !q || JSON.stringify(item).toLowerCase().includes(q.toLowerCase()));
  const selected = value ? items.find(i => i.id === value) : null;

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full border-2 border-slate-200 hover:border-emerald-400 rounded-xl px-3.5 py-3 cursor-pointer bg-white transition-colors">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          value={selected ? renderSelected(selected) : q}
          onChange={e => { setQ(e.target.value); onChange(null); setOpen(true); }}
          onClick={e => { e.stopPropagation(); setOpen(true); }}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400"
        />
        {selected
          ? <button type="button" onClick={e => { e.stopPropagation(); onChange(null); setQ(''); }} className="p-0.5 hover:text-red-500 text-slate-400"><X className="w-4 h-4" /></button>
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 bg-white border-2 border-slate-200 rounded-xl shadow-xl mt-1 max-h-64 overflow-y-auto">
          {filtered.length === 0
            ? <div className="px-4 py-4 text-sm text-slate-400 text-center">No results found</div>
            : filtered.map(item => (
                <button key={item.id} type="button" onClick={() => { onChange(item.id, item); setQ(''); setOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-0">
                  {renderItem(item)}
                </button>
              ))
          }
        </div>
      )}
    </div>
  );
}

export default function NewDormApplicationPage() {
  const router = useRouter();
  const { hotel: queryHotel, student: queryStudent, role: pageRole } = router.query;

  // Detect if this is student page by pathname
  const isStudentPage = router.pathname.startsWith('/student/');

  const [step,           setStep]           = useState(0);
  const [dorms,          setDorms]          = useState([]);
  const [students,       setStudents]       = useState([]);
  const [selectedDorm,   setSelectedDorm]   = useState(null);
  const [selectedRoom,   setSelectedRoom]   = useState(null);
  const [selectedStudent,setSelectedStudent]= useState(null);
  const [requiredDocs,   setRequiredDocs]   = useState([]);
  const [form,           setForm]           = useState({ move_in_date: '', duration: '', notes: '' });
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState('');
  const [createdApp,     setCreatedApp]     = useState(null);

  useEffect(() => {
    // Load dorms
    fetch('/api/admin/hotels?status=active')
      .then(r => r.json())
      .then(d => {
        const list = d.hotels || [];
        setDorms(list);
        if (queryHotel) {
          const found = list.find(h => String(h.id) === String(queryHotel));
          if (found) { handleSelectDorm(found.id, found); setStep(1); }
        }
      });

    // Load students (only for agent/admin pages)
    if (!isStudentPage) {
      fetch('/api/students?limit=500')
        .then(r => r.json())
        .then(d => {
          const studs = (d.students || []).map(s => ({
            id: s.id,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || 'Unknown',
            email: s.email,
          }));
          setStudents(studs);
          if (queryStudent) {
            const found = studs.find(s => String(s.id) === String(queryStudent));
            if (found) setSelectedStudent(found);
          }
        });
    }
  }, [router.isReady]);

  async function handleSelectDorm(id, item) {
    setSelectedDorm(item || dorms.find(d => d.id === id));
    setSelectedRoom(null);

    // Load full dorm details (rooms + required docs)
    const detail = await fetch(`/api/admin/hotels/${id}`).then(r => r.json());
    setSelectedDorm(prev => ({ ...(item || prev), rooms: detail.rooms || [] }));

    const docsData = await fetch(`/api/admin/hotels/${id}/required-docs`).then(r => r.json());
    setRequiredDocs(docsData.docs || []);
  }

  function canNext() {
    if (step === 0) return !!selectedDorm;
    if (step === 1) return true; // room optional
    if (step === 2) return isStudentPage ? true : !!selectedStudent;
    if (step === 3) return true;
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true); setError('');
    try {
      const body = {
        hotel_id:     selectedDorm.id,
        room_type_id: selectedRoom?.id || null,
        student_id:   isStudentPage ? undefined : selectedStudent?.id,
        move_in_date: form.move_in_date || null,
        duration:     form.duration || null,
        notes:        form.notes || null,
      };

      const r = await fetch('/api/dorm-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to submit');
      setCreatedApp(d);
      setStep(5); // success
    } catch (e) {
      setError(e.message);
    } finally { setSubmitting(false); }
  }

  const rooms = selectedDorm?.rooms || [];

  const layoutTitle = "New Dormitory Application";

  return (
    <AdminLayout title={layoutTitle}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>
              Apply for Dormitory
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Step {Math.min(step + 1, 5)} of {WIZARD_STEPS.length}</p>
          </div>
        </div>

        {step < 5 && <Stepper step={step} />}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6">

            {/* ── STEP 0: Select Dormitory ── */}
            {step === 0 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Select Dormitory</h3>
                <p className="text-sm text-slate-500 mb-4">Search and select the dormitory to apply for.</p>
                <SearchDropdown
                  items={dorms}
                  value={selectedDorm?.id}
                  placeholder="Search by dormitory name, city..."
                  onChange={(id, item) => handleSelectDorm(id, item)}
                  renderSelected={d => `${d.name} — ${d.city}`}
                  renderItem={d => (
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{d.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {[d.city, d.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  )}
                />
                {selectedDorm && (
                  <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-emerald-800">{selectedDorm.name}</div>
                      <div className="text-sm text-emerald-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {[selectedDorm.city, selectedDorm.country].filter(Boolean).join(', ')}
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-emerald-700">
                        <span>🏠 {selectedDorm.room_count || 0} room types</span>
                        {requiredDocs.length > 0 && <span>📄 {requiredDocs.length} documents required</span>}
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 1: Select Room ── */}
            {step === 1 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Select Room Type</h3>
                <p className="text-sm text-slate-500 mb-4">Choose a preferred room type (optional).</p>

                {rooms.length === 0 ? (
                  <div className="text-center py-8 border border-slate-200 rounded-xl text-slate-400">
                    <BedDouble className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No room types listed — you can still apply</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* No preference option */}
                    <button type="button" onClick={() => setSelectedRoom(null)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all text-left
                        ${!selectedRoom ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 bg-white'}`}>
                      <span className="font-semibold text-slate-700">No preference</span>
                      {!selectedRoom && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    </button>

                    {rooms.map(room => (
                      <button key={room.id} type="button" onClick={() => setSelectedRoom(room)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all text-left
                          ${selectedRoom?.id === room.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 bg-white'}`}>
                        <div>
                          <div className="font-semibold text-slate-800">{room.name}</div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                            {room.bed_type && <span>🛏️ {room.bed_type}</span>}
                            {room.size_sqm && <span>📐 {room.size_sqm}m²</span>}
                            <span>👥 Max {room.max_guests}</span>
                            {room.price_per_night && (
                              <span className="text-emerald-700 font-bold">PKR {Number(room.price_per_night).toLocaleString()}/mo</span>
                            )}
                          </div>
                        </div>
                        {selectedRoom?.id === room.id && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: Select Student (agent only) ── */}
            {step === 2 && !isStudentPage && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Select Student</h3>
                <p className="text-sm text-slate-500 mb-4">Select the student applying for this dormitory.</p>
                <SearchDropdown
                  items={students}
                  value={selectedStudent?.id}
                  placeholder="Search by name, email..."
                  onChange={(id, item) => setSelectedStudent(item || null)}
                  renderSelected={s => `[${s.id}] ${s.name} · ${s.email}`}
                  renderItem={s => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(s.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">[{s.id}] {s.name}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </div>
                    </div>
                  )}
                />
                {selectedStudent && (
                  <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                      {selectedStudent.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-emerald-800">[{selectedStudent.id}] {selectedStudent.name}</div>
                      <div className="text-sm text-emerald-600">{selectedStudent.email}</div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2 for students: skip straight to details ── */}
            {step === 2 && isStudentPage && (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-medium text-slate-600">You're applying as yourself</p>
              </div>
            )}

            {/* ── STEP 3: Details ── */}
            {step === 3 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Application Details</h3>
                <p className="text-sm text-slate-500 mb-4">Provide move-in preferences and any notes.</p>

                {/* Info card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-sm space-y-1.5">
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-bold text-slate-600">Dormitory</span>
                    <span className="text-slate-700">{selectedDorm?.name}</span>
                  </div>
                  {selectedRoom && (
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="font-bold text-slate-600">Room</span>
                      <span className="text-slate-700">{selectedRoom.name}</span>
                    </div>
                  )}
                  {selectedStudent && !isStudentPage && (
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="font-bold text-slate-600">Student</span>
                      <span className="text-slate-700">{selectedStudent.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Preferred Move-in Date
                    </label>
                    <input type="date" value={form.move_in_date}
                      onChange={e => setForm(p => ({ ...p, move_in_date: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Duration
                    </label>
                    <select value={form.duration}
                      onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                      <option value="">Select duration</option>
                      {['1 month', '3 months', '6 months', '1 year', '2 years'].map(d => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Notes / Special Requests
                    </label>
                    <textarea value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      rows={4} placeholder="Any special requirements or notes..."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Required Documents info ── */}
            {step === 4 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Required Documents</h3>
                <p className="text-sm text-slate-500 mb-4">
                  You'll need to upload these documents after submitting. Review them now.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Submit your application first, then upload documents from the application detail page.
                    Your application won't be processed until all required documents are approved.
                  </p>
                </div>

                {requiredDocs.length === 0 ? (
                  <div className="text-center py-8 border border-slate-200 rounded-xl text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No specific documents required for this dormitory</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {requiredDocs.map((doc, i) => (
                      <div key={doc.id}
                        className="flex items-start gap-3 border border-slate-200 rounded-xl px-4 py-3 bg-white">
                        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800">{doc.name}</span>
                            {!doc.is_required && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">Optional</span>
                            )}
                            {doc.is_required && (
                              <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">Required</span>
                            )}
                          </div>
                          {doc.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{doc.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mt-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}
              </div>
            )}

            {/* ── SUCCESS ── */}
            {step === 5 && createdApp && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Application Submitted!</h3>
                <p className="text-sm text-slate-500 mb-2">
                  Your application <span className="font-bold text-emerald-700">{createdApp.app_code}</span> has been submitted.
                </p>
                <p className="text-sm text-slate-400 mb-6">
                  Please upload the required documents to proceed.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => router.push(
                      isStudentPage
                        ? `/student/dorm-applications/${createdApp.id}`
                        : `/agent/dorm-applications/${createdApp.id}`
                    )}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                    Upload Documents →
                  </button>
                  <button
                    onClick={() => router.push(
                      isStudentPage ? '/student/dorm-applications' : '/agent/dorm-applications'
                    )}
                    className="border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                    View All Applications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer nav */}
          {step < 5 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
              <button onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                {step === 0 ? 'Cancel' : 'Previous'}
              </button>
              <div className="flex gap-3">
                {step < WIZARD_STEPS.length - 1 ? (
                  <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting || !canNext()}
                    className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-60">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><CheckCircle className="w-4 h-4" /> Submit Application</>}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}