// pages/agent/dorm-applications/[id].js  (also student/dorm-applications/[id].js)
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import {
  ArrowLeft, Upload, CheckCircle, XCircle, Clock, Home,
  FileText, MapPin, BedDouble, Users, DollarSign, Calendar,
  Loader2, AlertCircle, Eye, X, RefreshCw
} from 'lucide-react';

const STATUS_CFG = {
  'Submitted':    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  'Under Review': { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  'Approved':     { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Rejected':     { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     dot: 'bg-red-500'     },
  'Cancelled':    { bg: 'bg-slate-100',  text: 'text-slate-500',   border: 'border-slate-200',   dot: 'bg-slate-400'   },
};

const DOC_STATUS = {
  'Pending':  { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: Clock       },
  'Approved': { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
  'Rejected': { bg: 'bg-red-50',     text: 'text-red-600',     icon: XCircle     },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG['Submitted'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

export default function DormApplicationDetailPage() {
  const router   = useRouter();
  const { id }   = router.query;
  const isAdmin  = router.pathname.startsWith('/admin/');
  const isStudent = router.pathname.startsWith('/student/');

  const [app,       setApp]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(null); // doc id being uploaded
  const [previewImg,setPreviewImg]= useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const fileRefs = useRef({});

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    setLoading(true);
    const data = await fetch(`/api/dorm-applications/${id}`).then(r => r.json());
    setApp(data);
    setLoading(false);
  }

  async function uploadDoc(requiredDoc) {
    const input = fileRefs.current[requiredDoc.id];
    if (!input) return;
    input.click();
  }

  async function handleFileChange(e, requiredDoc) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(requiredDoc.id);

    const reader = new FileReader();
    reader.onload = async ev => {
      const base64 = ev.target.result;
      try {
        await fetch(`/api/dorm-applications/${id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            required_doc_id: requiredDoc.id,
            file_name: file.name,
            file_data: base64,
          }),
        });
        await load();
      } finally { setUploading(null); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function reviewDoc(docId, status, note = '') {
    await fetch(`/api/dorm-applications/${id}/documents`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_id: docId, status, admin_note: note }),
    });
    load();
  }

  async function updateStatus(newStatus) {
    setSavingStatus(true);
    await fetch(`/api/dorm-applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, admin_notes: statusNote }),
    });
    setSavingStatus(false);
    load();
  }

  if (loading) return (
    <AdminLayout title="Dormitory Application">
      <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
    </AdminLayout>
  );

  if (!app || app.error) return (
    <AdminLayout title="Dormitory Application">
      <div className="flex flex-col items-center py-20 text-slate-400">
        <Home className="w-12 h-12 mb-3 opacity-20" />
        <p className="font-semibold text-slate-500">Application not found</p>
      </div>
    </AdminLayout>
  );

  const requiredDocs = app.required_docs || [];
  const uploadedDocs = app.uploaded_docs || [];

  function getUploadedDoc(reqDocId) {
    return uploadedDocs.find(d => d.required_doc_id === reqDocId);
  }

  const docProgress = requiredDocs.length > 0
    ? uploadedDocs.filter(d => d.status === 'Approved' && requiredDocs.find(r => r.id === d.required_doc_id && r.is_required)).length
    : 0;
  const totalRequired = requiredDocs.filter(d => d.is_required).length;

  return (
    <AdminLayout title={`Dorm Application ${app.app_code}`}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>
                  {app.app_code}
                </h2>
                <StatusBadge status={app.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Submitted {new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button onClick={load} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-5">
          {/* Main */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Dorm info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Dormitory Details</h3>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <Home className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-800 text-base">{app.hotel_name}</div>
                  <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" /> {[app.city, app.country].filter(Boolean).join(', ')}
                  </div>
                  {app.room_name && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5 text-slate-400" /> {app.room_name}</span>
                      {app.bed_type && <span>· {app.bed_type}</span>}
                      {app.room_price && <span className="text-emerald-700 font-bold">· PKR {Number(app.room_price).toLocaleString()}/mo</span>}
                    </div>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    {app.move_in_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Move in: {new Date(app.move_in_date).toLocaleDateString('en-GB')}</span>}
                    {app.duration && <span>Duration: {app.duration}</span>}
                  </div>
                </div>
              </div>
              {app.notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Notes</div>
                  <p className="text-sm text-slate-600">{app.notes}</p>
                </div>
              )}
            </div>

            {/* Document progress */}
            {totalRequired > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Document Progress</h3>
                  <span className="text-sm font-bold text-emerald-700">{docProgress}/{totalRequired} approved</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: totalRequired ? `${(docProgress / totalRequired) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            )}

            {/* Required Documents */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Required Documents</h3>

              {requiredDocs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No documents required for this dormitory</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requiredDocs.map((reqDoc, i) => {
                    const uploaded = getUploadedDoc(reqDoc.id);
                    const DocStatusCfg = uploaded ? DOC_STATUS[uploaded.status] : null;
                    const DocStatusIcon = DocStatusCfg?.icon;

                    return (
                      <div key={reqDoc.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="flex items-start gap-3 px-4 py-3.5 bg-white">
                          <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-800">{reqDoc.name}</span>
                              {reqDoc.is_required
                                ? <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">Required</span>
                                : <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">Optional</span>
                              }
                              {uploaded && DocStatusIcon && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${DocStatusCfg.bg} ${DocStatusCfg.text}`}>
                                  <DocStatusIcon className="w-3 h-3" />{uploaded.status}
                                </span>
                              )}
                            </div>
                            {reqDoc.description && <p className="text-xs text-slate-400 mt-0.5">{reqDoc.description}</p>}
                            {uploaded && (
                              <div className="flex items-center gap-2 mt-1.5">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs text-slate-600 font-medium">{uploaded.file_name}</span>
                                {uploaded.file_data && (
                                  <button onClick={() => setPreviewImg(uploaded.file_data)}
                                    className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:underline">
                                    <Eye className="w-3 h-3" /> Preview
                                  </button>
                                )}
                              </div>
                            )}
                            {uploaded?.admin_note && (
                              <div className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                                Admin note: {uploaded.admin_note}
                              </div>
                            )}
                          </div>

                          {/* Upload / Re-upload */}
                          {!isAdmin && (
                            <div className="shrink-0">
                              <input type="file" accept="image/*,.pdf,.doc,.docx"
                                ref={el => fileRefs.current[reqDoc.id] = el}
                                className="hidden"
                                onChange={e => handleFileChange(e, reqDoc)} />
                              <button
                                onClick={() => uploadDoc(reqDoc)}
                                disabled={uploading === reqDoc.id}
                                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm disabled:opacity-60">
                                {uploading === reqDoc.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Upload className="w-3.5 h-3.5" />
                                }
                                {uploaded ? 'Re-upload' : 'Upload'}
                              </button>
                            </div>
                          )}

                          {/* Admin review buttons */}
                          {isAdmin && uploaded && uploaded.status === 'Pending' && (
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => reviewDoc(uploaded.id, 'Approved')}
                                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button onClick={() => reviewDoc(uploaded.id, 'Rejected', 'Please re-upload a clearer copy')}
                                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 shrink-0 space-y-4">

            {/* Student info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Student</div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                  {(app.student_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{app.student_name}</div>
                  <div className="text-xs text-slate-400">{app.student_email}</div>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => router.push(`/admin/student/${app.student_db_id}`)}
                  className="text-xs text-emerald-600 font-bold hover:underline">
                  View student profile →
                </button>
              )}
            </div>

            {/* Admin: change status */}
            {isAdmin && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Update Status</div>
                <div className="space-y-2 mb-3">
                  {Object.keys(STATUS_CFG).map(s => (
                    <button key={s} onClick={() => updateStatus(s)} disabled={app.status === s || savingStatus}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-50 ${
                        app.status === s
                          ? `${STATUS_CFG[s].bg} ${STATUS_CFG[s].text} ${STATUS_CFG[s].border}`
                          : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${STATUS_CFG[s].dot}`} />
                        {s}
                        {app.status === s && <CheckCircle className="w-4 h-4 ml-auto" />}
                      </div>
                    </button>
                  ))}
                </div>
                <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)}
                  placeholder="Admin note (optional)..." rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            )}

            {/* Admin note (if exists) */}
            {app.admin_notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Admin Note</div>
                <p className="text-sm text-amber-800">{app.admin_notes}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Timeline</div>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Submitted</span>
                  <span className="font-medium text-slate-700">{new Date(app.created_at).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated</span>
                  <span className="font-medium text-slate-700">{new Date(app.updated_at).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <StatusBadge status={app.status} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image preview lightbox */}
      {previewImg && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImg(null)}>
          <button className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          <img src={previewImg} alt="Document preview"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </AdminLayout>
  );
}