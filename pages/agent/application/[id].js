// pages/agent/application/[id].js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Spinner } from '../../../components/ui/index';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle, Send,
  ChevronDown, ChevronUp, User, Building2, BookOpen, Calendar,
  DollarSign, FileText, MessageSquare, Loader2, Edit3,
  Shield, GraduationCap, Phone, Mail, Globe,
  Award, Check, X, AlertTriangle, Upload, Eye, MoreVertical,
  Filter, Pencil, Target, Star, Rocket, Flag, RefreshCw,
  Download, Trash2, Image, File, CheckSquare, Clock3
} from 'lucide-react';
import { apiCall } from '../../../lib/useApi';

const ALL_STATUSES = ['Submitted','Under Review','Conditional Offer','Accepted','Offer Received','Enrolled','Rejected','Withdrawn','Deferred'];

const STATUS_CFG = {
  'Submitted':        { color:'bg-blue-50 text-blue-700 border-blue-200',       dot:'bg-blue-500',    icon:Clock         },
  'Under Review':     { color:'bg-amber-50 text-amber-700 border-amber-200',    dot:'bg-amber-500',   icon:AlertCircle   },
  'Conditional Offer':{ color:'bg-purple-50 text-purple-700 border-purple-200', dot:'bg-purple-500',  icon:AlertTriangle },
  'Accepted':         { color:'bg-emerald-50 text-emerald-700 border-emerald-200',dot:'bg-emerald-500',icon:CheckCircle  },
  'Offer Received':   { color:'bg-teal-50 text-teal-700 border-teal-200',       dot:'bg-teal-500',    icon:Award         },
  'Enrolled':         { color:'bg-green-50 text-green-700 border-green-200',    dot:'bg-green-600',   icon:Check         },
  'Rejected':         { color:'bg-red-50 text-red-600 border-red-200',          dot:'bg-red-500',     icon:XCircle       },
  'Withdrawn':        { color:'bg-slate-100 text-slate-500 border-slate-200',   dot:'bg-slate-400',   icon:X             },
  'Deferred':         { color:'bg-orange-50 text-orange-700 border-orange-200', dot:'bg-orange-500',  icon:Clock         },
};

const PIPELINE_STEPS = [
  { label:'Application\nCreated',   key:'created'    },
  { label:'Application\nStarted',   key:'started'    },
  { label:'Under\nReview',          key:'review'     },
  { label:'Submitted\nto School',   key:'submitting' },
  { label:'Awaiting\nDecision',     key:'awaiting'   },
  { label:'Admission\nProcessing',  key:'admission'  },
  { label:'Pre-Arrival',            key:'pre_arrival'},
  { label:'Arrival',                key:'arrival'    },
];

function getActiveStep(status) {
  return { 'Submitted':1,'Under Review':2,'Conditional Offer':3,'Accepted':4,'Offer Received':4,'Enrolled':7,'Rejected':2,'Withdrawn':0,'Deferred':3 }[status] ?? 1;
}

function StatusBadge({ status, large }) {
  const cfg = STATUS_CFG[status] || { color:'bg-slate-100 text-slate-500 border-slate-200', dot:'bg-slate-400', icon:Clock };
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold border rounded-full ${large?'px-4 py-2 text-sm':'px-2.5 py-1 text-xs'} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`}/>{status}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value, mono }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500"/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</div>
        <div className={`text-sm font-semibold text-slate-800 ${mono?'font-mono':''}`}>{value}</div>
      </div>
    </div>
  );
}

// ── Upload Modal ──────────────────────────────────────────────
function UploadModal({ open, doc, applicationId, onClose, onUploaded }) {
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');
  const fileRef = useRef(null);

  useEffect(() => { if (!open) { setFile(null); setPreview(null); setError(''); } }, [open]);

  function handleFile(f) {
    if (!f) return;
    if (f.size > 10*1024*1024) { setError('File must be under 10MB'); return; }
    setFile(f); setError('');
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }

  async function handleUpload() {
    if (!file || !preview) { setError('Please select a file'); return; }
    setUploading(true); setError('');
    try {
      const r = await fetch(`/api/applications/documents?application_id=${applicationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_doc_id: doc?.id || null,
          doc_name: doc?.name || file.name,
          doc_type: file.type,
          file_name: file.name,
          file_url: preview,
          file_size: file.size,
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onUploaded();
      onClose();
    } catch(e) { setError(e.message); }
    finally { setUploading(false); }
  }

  if (!open) return null;
  const isImage = file?.type?.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Upload Document</h3>
            <p className="text-xs text-slate-400 mt-0.5">{doc?.name || 'Document'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Drop zone */}
          <div
            onDrop={e=>{ e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e=>e.preventDefault()}
            onClick={()=>fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
              ${file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-brand-400 bg-slate-50 hover:bg-brand-50'}`}>
            <input ref={fileRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={e=>handleFile(e.target.files[0])}/>
            {file ? (
              <div className="flex flex-col items-center gap-2">
                {isImage && preview ? (
                  <img src={preview} className="w-20 h-20 object-cover rounded-xl shadow-sm" alt="preview"/>
                ) : (
                  <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-7 h-7 text-brand-600"/>
                  </div>
                )}
                <p className="text-sm font-bold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size/1024).toFixed(1)} KB · Click to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Upload className="w-8 h-8"/>
                <p className="text-sm font-semibold text-slate-600">Click or drag & drop</p>
                <p className="text-xs">PDF, Word, JPG, PNG — max 10MB</p>
              </div>
            )}
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0"/>{error}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white">Cancel</button>
          <button onClick={handleUpload} disabled={!file||uploading}
            className="flex-1 py-2.5 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
            {uploading ? 'Uploading…' : 'Upload Document'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Doc row ───────────────────────────────────────────────────
function DocRow({ doc, uploadedDoc, onUpload, onViewDoc, onUpdateStatus, role }) {
  const status = uploadedDoc?.status || 'pending';
  const statusCfg = {
    pending:   { color:'bg-amber-50 text-amber-600 border-amber-200',   label:'Pending'    },
    in_review: { color:'bg-blue-50 text-blue-700 border-blue-200',     label:'In Review'  },
    approved:  { color:'bg-emerald-50 text-emerald-700 border-emerald-200', label:'Approved' },
    rejected:  { color:'bg-red-50 text-red-600 border-red-200',         label:'Rejected'   },
  };
  const cfg = statusCfg[status] || statusCfg.pending;

  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group px-1">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
        ${uploadedDoc ? 'bg-brand-100 border border-brand-200' : 'bg-amber-50 border border-amber-200'}`}>
        <FileText className={`w-4 h-4 ${uploadedDoc ? 'text-brand-600' : 'text-amber-600'}`}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800">{doc.name}</span>
          {!doc.required && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Optional</span>}
        </div>
        {doc.description && <p className="text-xs text-slate-400 mt-0.5">{doc.description}</p>}
        {uploadedDoc && (
          <p className="text-xs text-slate-400 mt-0.5">
            {uploadedDoc.file_name} · {uploadedDoc.uploaded_at ? new Date(uploadedDoc.uploaded_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : ''}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {uploadedDoc && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
        )}
        {uploadedDoc ? (
          <>
            <button onClick={()=>onViewDoc(uploadedDoc)}
              className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
              <Eye className="w-3.5 h-3.5"/>View
            </button>
            {['admin','custom'].includes(role) && status==='in_review' && (
              <div className="flex gap-1.5">
                <button onClick={()=>onUpdateStatus(uploadedDoc,'approved')}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-sm">
                  <Check className="w-3.5 h-3.5"/>Approve
                </button>
                <button onClick={()=>onUpdateStatus(uploadedDoc,'rejected')}
                  className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-sm">
                  <X className="w-3.5 h-3.5"/>Reject
                </button>
              </div>
            )}
            {['admin','custom'].includes(role) && status==='rejected' && (
              <button onClick={()=>onUpdateStatus(uploadedDoc,'in_review')}
                className="flex items-center gap-1.5 border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                Re-review
              </button>
            )}
          </>
        ) : (
          <button onClick={()=>onUpload(doc)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm">
            <Upload className="w-3.5 h-3.5"/>{uploadedDoc ? 'Re-upload' : 'Upload'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── DocGroup ──────────────────────────────────────────────────
function DocGroup({ title, subtitle, count, color, icon: Icon, children }) {
  const [open, setOpen] = useState(true);
  const colors = { amber:'bg-amber-50 border-amber-200 text-amber-700', blue:'bg-blue-50 border-blue-200 text-blue-700', emerald:'bg-emerald-50 border-emerald-200 text-emerald-700', red:'bg-red-50 border-red-200 text-red-600' };
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden mb-3">
      <button onClick={()=>setOpen(o=>!o)} className={`w-full flex items-center gap-3 px-4 py-3.5 ${colors[color]||colors.amber} border-b border-current/20`}>
        <Icon className="w-4 h-4 shrink-0"/>
        <span className="font-bold text-sm">{title}</span>
        {subtitle && <span className="text-xs opacity-70">{subtitle}</span>}
        <span className="ml-1 font-bold text-sm">({count})</span>
        <div className="ml-auto">{open?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}</div>
      </button>
      {open && <div className="px-4 bg-white">{children}</div>}
    </div>
  );
}

// ── Activity Log item ─────────────────────────────────────────
function LogItem({ log, isLast }) {
  const actionCfg = {
    'Application Created':    { icon:Rocket,      color:'bg-brand-500',   light:'bg-brand-50'   },
    'Status Changed':         { icon:RefreshCw,   color:'bg-amber-500',   light:'bg-amber-50'   },
    'Document Uploaded':      { icon:Upload,       color:'bg-blue-500',    light:'bg-blue-50'    },
    'Document Status Updated':{ icon:CheckSquare, color:'bg-emerald-500', light:'bg-emerald-50' },
    'Note Added':             { icon:MessageSquare,color:'bg-slate-500',  light:'bg-slate-50'   },
    'Application Submitted':  { icon:Send,         color:'bg-purple-500',  light:'bg-purple-50'  },
  };
  const cfg = actionCfg[log.action] || { icon:Clock3, color:'bg-slate-400', light:'bg-slate-50' };
  const Icon = cfg.icon;

  return (
    <div className="flex gap-4 relative">
      {/* Vertical line */}
      {!isLast && <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-slate-100"/>}
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full ${cfg.color} flex items-center justify-center shrink-0 shadow-sm z-10`}>
        <Icon className="w-4 h-4 text-white"/>
      </div>
      {/* Content */}
      <div className="flex-1 pb-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="font-bold text-slate-800 text-sm">{log.action}</div>
              {log.description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{log.description}</p>}
              {log.performed_by_name && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-brand-700">{log.performed_by_name[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-xs text-slate-400">{log.performed_by_name} · <span className="capitalize">{log.role}</span></span>
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-semibold text-slate-500">
                {log.created_at ? new Date(log.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {log.created_at ? new Date(log.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── View Document Modal ───────────────────────────────────────
function ViewDocModal({ doc, onClose }) {
  if (!doc) return null;
  const isImage = doc.doc_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.file_name||'');
  const isPDF   = doc.doc_type === 'application/pdf' || /\.pdf$/i.test(doc.file_name||'');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-slate-800">{doc.doc_name}</h3>
            <p className="text-xs text-slate-400">{doc.file_name} · {doc.file_size ? `${(doc.file_size/1024).toFixed(1)} KB` : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={doc.file_url} download={doc.file_name}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
              <Download className="w-3.5 h-3.5"/>Download
            </a>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-4 h-4"/></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-50 rounded-b-3xl">
          {isImage ? (
            <img src={doc.file_url} alt={doc.doc_name} className="max-w-full max-h-full object-contain rounded-xl shadow-md"/>
          ) : isPDF ? (
            <iframe src={doc.file_url} className="w-full h-96 rounded-xl border border-slate-200" title={doc.doc_name}/>
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-400 py-12">
              <FileText className="w-16 h-16 opacity-30"/>
              <p className="font-medium text-slate-500">Preview not available</p>
              <a href={doc.file_url} download={doc.file_name}
                className="flex items-center gap-2 bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm">
                <Download className="w-4 h-4"/>Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function ApplicationDetail() {
  const router  = useRouter();
  const { id }  = router.query;
  const [app, setApp]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [programDocs, setProgramDocs]   = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [logs, setLogs]             = useState([]);
  const [activeTab, setActiveTab]   = useState('requirements');
  const [docFilter, setDocFilter]   = useState('all');
  const [uploadModal, setUploadModal]   = useState({ open:false, doc:null });
  const [viewDocModal, setViewDocModal] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus]   = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [saving, setSaving]         = useState(false);
  const [comment, setComment]       = useState('');
  const [sendingComment, setSending]= useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(true);
  const [editIntake, setEditIntake] = useState(false);
  const [intakeVal, setIntakeVal]   = useState('');
  const [user, setUser]             = useState(null);

  useEffect(()=>{ fetch('/api/auth/me').then(r=>r.json()).then(d=>setUser(d.user)); },[]);

  const loadUploadedDocs = useCallback(async () => {
    if (!id) return;
    try {
      const d = await fetch(`/api/applications/documents?application_id=${id}`).then(r=>r.json());
      setUploadedDocs(d.documents||[]);
    } catch {}
  }, [id]);

  const loadLogs = useCallback(async () => {
    if (!id) return;
    try {
      const d = await fetch(`/api/applications/logs?application_id=${id}`).then(r=>r.json());
      setLogs(d.logs||[]);
    } catch {}
  }, [id]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await fetch(`/api/applications/${id}`).then(r=>r.json());
      setApp(d);
      setIntakeVal(d.intake||'');
      if (d.program_id) {
        const rd = await fetch(`/api/programs/${d.program_id}/requirements`).then(r=>r.json()).catch(()=>({documents:[]}));
        setProgramDocs(rd.documents||[]);
      }
    } catch {}
    finally { setLoading(false); }
  }, [id]);

  useEffect(()=>{ load(); loadUploadedDocs(); loadLogs(); },[load, loadUploadedDocs, loadLogs]);

  async function handleStatusChange() {
    if (!newStatus) return;
    setSaving(true);
    try {
      await apiCall(`/api/applications/${id}`, 'PUT', { status: newStatus, comment: statusNote });
      setShowStatusModal(false); setStatusNote(''); setNewStatus('');
      load(); loadLogs();
    } catch(e) { console.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleSaveIntake() {
    try {
      await apiCall(`/api/applications/${id}`, 'PUT', { intake: intakeVal });
      setEditIntake(false); load();
    } catch(e) { console.error(e.message); }
  }

  async function handleSendComment() {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/applications/${id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({comment}) });
      // Also log it
      await fetch(`/api/applications/logs?application_id=${id}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'Note Added', description: comment.trim() })
      });
      setComment(''); load(); loadLogs();
    } catch {}
    finally { setSending(false); }
  }

  async function handleUpdateDocStatus(doc, status) {
    try {
      await fetch(`/api/applications/documents?application_id=${id}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ doc_id: doc.id, status })
      });
      loadUploadedDocs(); loadLogs();
    } catch {}
  }

  const role = user?.role || 'admin';
  if (loading) return <AdminLayout title="Application"><div className="flex justify-center py-20"><Spinner size="lg"/></div></AdminLayout>;
  if (!app || app.error) return <AdminLayout title="Application"><div className="text-center py-20 text-slate-400">Application not found</div></AdminLayout>;

  const activeStep = getActiveStep(app.status);
  const history    = app.history  || [];
  const comments   = app.comments || [];
  const backups    = app.backup_programs || [];

  // Map uploaded docs by program_doc_id for quick lookup
  const uploadedByProgramDoc = {};
  uploadedDocs.forEach(d => { if (d.program_doc_id) uploadedByProgramDoc[d.program_doc_id] = d; });

  // Filter docs
  const filteredDocs = programDocs.filter(doc => {
    const up = uploadedByProgramDoc[doc.id];
    if (docFilter === 'all') return true;
    if (docFilter === 'pending') return !up;
    if (docFilter === 'in_review') return up?.status === 'in_review';
    if (docFilter === 'approved') return up?.status === 'approved';
    if (docFilter === 'rejected') return up?.status === 'rejected';
    return true;
  });

  const docCounts = {
    all:       programDocs.length,
    pending:   programDocs.filter(d=>!uploadedByProgramDoc[d.id]).length,
    in_review: programDocs.filter(d=>uploadedByProgramDoc[d.id]?.status==='in_review').length,
    approved:  programDocs.filter(d=>uploadedByProgramDoc[d.id]?.status==='approved').length,
    rejected:  programDocs.filter(d=>uploadedByProgramDoc[d.id]?.status==='rejected').length,
  };

  const profileFields = [app.student_name, app.phone, app.education_level, app.gpa, app.ielts_score, app.passport_no];
  const profilePct    = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  return (
    <AdminLayout title={`Application ${app.app_code}`}>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-4 overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <button onClick={()=>router.back()} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 mt-1 shrink-0"><ArrowLeft className="w-5 h-5"/></button>
              <div>
                <div className="flex items-center gap-2 mb-1 text-sm text-slate-400 font-medium">{app.university_name} {app.flag}</div>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{app.program_name || 'Application Details'}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-slate-500">App ID: <span className="font-bold font-mono text-slate-800">{app.app_code}</span></span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Intake:</span>
                    {editIntake ? (
                      <div className="flex items-center gap-2">
                        <input value={intakeVal} onChange={e=>setIntakeVal(e.target.value)} className="border border-slate-300 rounded-lg px-2.5 py-1 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"/>
                        <button onClick={handleSaveIntake} className="p-1.5 bg-emerald-600 text-white rounded-lg"><Check className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>setEditIntake(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg"><X className="w-3.5 h-3.5"/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{app.intake||'Not set'}</span>
                        {role==='admin' && <button onClick={()=>setEditIntake(true)} className="text-slate-400 hover:text-brand-600"><Pencil className="w-3.5 h-3.5"/></button>}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={app.status}/>
                </div>
              </div>
            </div>
            {role==='admin' && (
              <button onClick={()=>{ setNewStatus(app.status); setShowStatusModal(true); }}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                <Edit3 className="w-4 h-4"/>Update Status<ChevronDown className="w-3.5 h-3.5"/>
              </button>
            )}
          </div>
        </div>

        {/* Pipeline */}
        <div className="border-t border-slate-100">
          <button onClick={()=>setPipelineOpen(p=>!p)} className="w-full flex items-center justify-end px-6 py-2 text-slate-400">
            {pipelineOpen?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}
          </button>
          {pipelineOpen && (
            <div className="px-6 pb-5">
              <div className="flex items-center">
                {PIPELINE_STEPS.map((step,i)=>{
                  const done=i<activeStep, current=i===activeStep, failed=['Rejected','Withdrawn'].includes(app.status)&&i===activeStep;
                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0
                          ${failed?'bg-red-500 border-red-500':done?'bg-emerald-500 border-emerald-500':current?'bg-white border-brand-600':'bg-white border-slate-300'}`}>
                          {failed?<X className="w-4 h-4 text-white"/>:done?<Check className="w-4 h-4 text-white"/>:current?<div className="w-2.5 h-2.5 rounded-full bg-brand-600"/>:null}
                        </div>
                        <div className={`text-center mt-2 text-[10px] font-semibold leading-tight max-w-[80px] whitespace-pre-line ${done||current?'text-slate-700':'text-slate-400'}`}>{step.label}</div>
                      </div>
                      {i<PIPELINE_STEPS.length-1 && <div className={`flex-1 h-0.5 mx-1 -mt-5 ${i<activeStep?'bg-emerald-500':'bg-slate-200'}`}/>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning */}
      {profilePct < 80 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 mb-4">
          <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-amber-600 shrink-0"/>
            <span className="text-sm font-semibold text-amber-700">Student profile is incomplete ({profilePct}%). Complete it to meet all requirements.</span>
          </div>
          <button onClick={()=>router.push(`/agent/student/${app.student_db_id}`)} className="text-sm font-bold text-amber-700 hover:text-amber-900 underline ml-4">Complete Now</button>
        </div>
      )}

      {/* 2-col layout */}
      <div className="flex gap-5">
        {/* Sidebar */}
        <div className="w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-brand-600 to-brand-400 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                {(app.student_name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-800 truncate">{app.student_name}</div>
                <button onClick={()=>router.push(`/agent/student/${app.student_db_id}`)} className="text-xs text-brand-600 hover:underline">ID: {app.student_db_id} · View profile →</button>
              </div>
            </div>
            {/* Success score */}
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/>Profile Score</div>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray={`${(profilePct/100)*201} 201`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-slate-800">{profilePct}%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[['Profile',profilePct>=80],['Documents',docCounts.approved>0],['IELTS',!!app.ielts_score],['GPA',!!app.gpa]].map(([l,done])=>(
                    <div key={l} className="flex items-center gap-2 text-xs">
                      {done?<CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0"/>:<div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0"/>}
                      <span className={done?'text-slate-700':'text-slate-400'}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Info */}
            <div className="px-5 py-3">
              <InfoRow icon={Mail}          label="Email"      value={app.student_email}/>
              <InfoRow icon={Phone}         label="Phone"      value={app.phone}/>
              <InfoRow icon={GraduationCap} label="Education"  value={app.education_level}/>
              <InfoRow icon={Star}          label="GPA"        value={app.gpa?`${app.gpa}`:null}/>
              <InfoRow icon={Globe}         label="IELTS"      value={app.ielts_score?`${app.ielts_score}`:null}/>
              <InfoRow icon={Shield}        label="Passport"   value={app.passport_no} mono/>
              <InfoRow icon={Calendar}      label="Applied"    value={app.applied_date?new Date(app.applied_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):null}/>
              <InfoRow icon={DollarSign}    label="Tuition"    value={app.tuition_fee?`${app.currency} ${Number(app.tuition_fee).toLocaleString()}`:null}/>
              {app.agent_name && <InfoRow icon={User} label="Agent" value={app.agent_name}/>}
            </div>
          </div>

          {/* Quick actions */}
          {role==='admin' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Status Change</div>
              <div className="flex flex-wrap gap-2">
                {[{l:'Accept',s:'Accepted',c:'emerald'},{l:'Offer',s:'Offer Received',c:'teal'},{l:'Conditional',s:'Conditional Offer',c:'purple'},{l:'Enroll',s:'Enrolled',c:'green'},{l:'Reject',s:'Rejected',c:'red'}].map(btn=>(
                  <button key={btn.s} disabled={app.status===btn.s}
                    onClick={()=>{ setNewStatus(btn.s); setShowStatusModal(true); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-40
                      ${btn.c==='emerald'?'bg-emerald-600 hover:bg-emerald-700 text-white':
                        btn.c==='teal'?'bg-teal-600 hover:bg-teal-700 text-white':
                        btn.c==='purple'?'bg-purple-600 hover:bg-purple-700 text-white':
                        btn.c==='green'?'bg-green-600 hover:bg-green-700 text-white':
                        'bg-red-600 hover:bg-red-700 text-white'}`}>
                    {btn.l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center px-4 border-b border-slate-100">
              {[
                { id:'requirements', label:`Requirements (${programDocs.length})` },
                { id:'notes',        label:'Student Records' },
                { id:'history',      label:'Status History' },
                { id:'comments',     label:'Notes' },
              ].map(tab=>(
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                  className={`px-4 py-3.5 text-sm font-bold border-b-2 transition-colors -mb-px
                    ${activeTab===tab.id?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── REQUIREMENTS TAB ── */}
            {activeTab==='requirements' && (
              <div className="p-5">
                {programDocs.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-slate-400 gap-3">
                    <FileText className="w-10 h-10 opacity-30"/>
                    <p className="font-semibold text-slate-500">No documents configured for this program</p>
                    {role==='admin' && <button onClick={()=>router.push(`/agent/program/${app.program_id}/requirements`)} className="text-brand-600 font-bold text-sm hover:underline">Configure Requirements →</button>}
                  </div>
                ) : (
                  <>
                    {/* Filter pills */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      {[['all','All'],['pending','Pending'],['in_review','In Review'],['approved','Approved'],['rejected','Rejected']].map(([k,l])=>(
                        <button key={k} onClick={()=>setDocFilter(k)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${docFilter===k?'bg-brand-600 text-white border-brand-600':'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                          {l} <span className={`ml-0.5 ${docFilter===k?'text-white/70':'text-slate-400'}`}>({docCounts[k]})</span>
                        </button>
                      ))}
                    </div>

                    {/* Pending group */}
                    {filteredDocs.some(d=>!uploadedByProgramDoc[d.id]) && (
                      <DocGroup title="Not Yet Uploaded" count={filteredDocs.filter(d=>!uploadedByProgramDoc[d.id]).length} color="amber" icon={Clock}>
                        {filteredDocs.filter(d=>!uploadedByProgramDoc[d.id]).map(doc=>(
                          <DocRow key={doc.id} doc={doc} uploadedDoc={null} role={role}
                            onUpload={d=>setUploadModal({open:true,doc:d})}
                            onViewDoc={setViewDocModal}
                            onUpdateStatus={handleUpdateDocStatus}/>
                        ))}
                      </DocGroup>
                    )}
                    {/* In Review group */}
                    {filteredDocs.some(d=>uploadedByProgramDoc[d.id]?.status==='in_review') && (
                      <DocGroup title="In Review" count={filteredDocs.filter(d=>uploadedByProgramDoc[d.id]?.status==='in_review').length} color="blue" icon={Eye}>
                        {filteredDocs.filter(d=>uploadedByProgramDoc[d.id]?.status==='in_review').map(doc=>(
                          <DocRow key={doc.id} doc={doc} uploadedDoc={uploadedByProgramDoc[doc.id]} role={role}
                            onUpload={d=>setUploadModal({open:true,doc:d})} onViewDoc={setViewDocModal} onUpdateStatus={handleUpdateDocStatus}/>
                        ))}
                      </DocGroup>
                    )}
                    {/* Approved group */}
                    {filteredDocs.some(d=>uploadedByProgramDoc[d.id]?.status==='approved') && (
                      <DocGroup title="Approved" count={filteredDocs.filter(d=>uploadedByProgramDoc[d.id]?.status==='approved').length} color="emerald" icon={CheckCircle}>
                        {filteredDocs.filter(d=>uploadedByProgramDoc[d.id]?.status==='approved').map(doc=>(
                          <DocRow key={doc.id} doc={doc} uploadedDoc={uploadedByProgramDoc[doc.id]} role={role}
                            onUpload={d=>setUploadModal({open:true,doc:d})} onViewDoc={setViewDocModal} onUpdateStatus={handleUpdateDocStatus}/>
                        ))}
                      </DocGroup>
                    )}
                    {/* Rejected group */}
                    {filteredDocs.some(d=>uploadedByProgramDoc[d.id]?.status==='rejected') && (
                      <DocGroup title="Rejected" count={filteredDocs.filter(d=>uploadedByProgramDoc[d.id]?.status==='rejected').length} color="red" icon={XCircle}>
                        {filteredDocs.filter(d=>uploadedByProgramDoc[d.id]?.status==='rejected').map(doc=>(
                          <DocRow key={doc.id} doc={doc} uploadedDoc={uploadedByProgramDoc[doc.id]} role={role}
                            onUpload={d=>setUploadModal({open:true,doc:d})} onViewDoc={setViewDocModal} onUpdateStatus={handleUpdateDocStatus}/>
                        ))}
                      </DocGroup>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── STUDENT RECORDS / ACTIVITY LOG TAB ── */}
            {activeTab==='notes' && (
              <div className="p-5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Application Activity Timeline</div>
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-slate-400 gap-3">
                    <Clock3 className="w-10 h-10 opacity-30"/>
                    <p className="font-semibold text-slate-500">No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="relative pl-2">
                    {logs.map((log, i) => (
                      <LogItem key={log.id||i} log={log} isLast={i===logs.length-1}/>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STATUS HISTORY TAB ── */}
            {activeTab==='history' && (
              <div className="p-5">
                {history.length===0 ? (
                  <div className="flex flex-col items-center py-12 text-slate-400 gap-2"><Clock className="w-10 h-10 opacity-30"/><p className="font-semibold text-slate-500">No status changes yet</p></div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100"/>
                    <div className="space-y-4">
                      {history.map((h,i)=>{
                        const cfg=STATUS_CFG[h.new_status||h.status]||STATUS_CFG['Submitted'];
                        const Icon=cfg.icon||Clock;
                        return (
                          <div key={h.id||i} className="flex gap-4 relative">
                            <div className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center shrink-0 shadow-sm z-10 ${cfg.color.split(' ')[0]}`}>
                              <Icon className={`w-4 h-4 ${cfg.color.split(' ')[1]}`}/>
                            </div>
                            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    {h.old_status&&<><StatusBadge status={h.old_status}/><span className="text-slate-400 text-xs">→</span></>}
                                    <StatusBadge status={h.new_status||h.status}/>
                                  </div>
                                  {h.changed_by_name&&<div className="text-xs text-slate-400">by <span className="font-semibold">{h.changed_by_name}</span></div>}
                                  {h.note&&<p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2 italic">"{h.note}"</p>}
                                </div>
                                <span className="text-xs text-slate-400 shrink-0">{h.changed_at?new Date(h.changed_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── NOTES TAB ── */}
            {activeTab==='comments' && (
              <div className="p-5">
                {app.notes && <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4"><div className="text-xs font-bold text-amber-700 mb-1">Application Note</div><p className="text-sm text-amber-800">{app.notes}</p></div>}
                <div className="space-y-3 mb-5">
                  {comments.length===0&&<div className="flex flex-col items-center py-8 text-slate-400 gap-2"><MessageSquare className="w-8 h-8 opacity-40"/><p className="text-sm">No comments yet</p></div>}
                  {comments.map((c,i)=>{
                    const initials=(c.author_name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                    const isMe=user&&c.author_email===user.email;
                    return (
                      <div key={c.id||i} className={`flex gap-3 ${isMe?'flex-row-reverse':''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isMe?'bg-brand-600':'bg-slate-500'}`}>{initials}</div>
                        <div className={`max-w-[80%] flex flex-col ${isMe?'items-end':''}`}>
                          <div className={`text-[10px] text-slate-400 mb-1 ${isMe?'text-right':''}`}>{c.author_name||'User'}</div>
                          <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${isMe?'bg-brand-600 text-white rounded-tr-sm':'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>{c.comment}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {['admin','agent'].includes(role) && (
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSendComment();}}}
                      placeholder="Add a note… (Enter to send)"
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"/>
                    <button onClick={handleSendComment} disabled={sendingComment||!comment.trim()} className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl disabled:opacity-50 transition-colors">
                      {sendingComment?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowStatusModal(false)}/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg">Update Status</h3>
              <button onClick={()=>setShowStatusModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {ALL_STATUSES.map(s=>{
                  const cfg=STATUS_CFG[s]||{};
                  return <button key={s} onClick={()=>setNewStatus(s)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all text-left ${newStatus===s?'border-brand-500 bg-brand-50':'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot||'bg-slate-400'}`}/>{s}
                  </button>;
                })}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Note (optional)</label>
                <textarea rows={3} value={statusNote} onChange={e=>setStatusNote(e.target.value)} placeholder="Reason for status change…" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"/>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button onClick={()=>setShowStatusModal(false)} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm">Cancel</button>
              <button onClick={handleStatusChange} disabled={saving||!newStatus}
                className="flex-1 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {saving&&<Loader2 className="w-4 h-4 animate-spin"/>}{saving?'Updating…':'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal open={uploadModal.open} doc={uploadModal.doc} applicationId={id}
        onClose={()=>setUploadModal({open:false,doc:null})}
        onUploaded={()=>{ loadUploadedDocs(); loadLogs(); }}/>

      {/* View Document Modal */}
      <ViewDocModal doc={viewDocModal} onClose={()=>setViewDocModal(null)}/>
    </AdminLayout>
  );
}