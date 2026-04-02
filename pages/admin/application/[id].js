// pages/admin/application/[id].js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Spinner } from '../../../components/ui/index';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle, Send,
  ChevronDown, ChevronUp, User, Building2, BookOpen, Calendar,
  DollarSign, FileText, MessageSquare, Loader2, Edit3,
  Shield, GraduationCap, Phone, Mail, Globe,
  Award, Check, X, AlertTriangle, Upload, Eye,
  Pencil, Target, Star, Rocket, RefreshCw,
  Download, CheckSquare, Clock3, Flag, AlertOctagon,ChevronRight 
} from 'lucide-react';
import { apiCall } from '../../../lib/useApi';

const ALL_STATUSES = ['Submitted','Under Review','Conditional Offer','Accepted','Offer Received','Enrolled','Rejected','Withdrawn','Deferred'];

const STATUS_CFG = {
  'Submitted':        { color:'bg-blue-50 text-blue-700 border-blue-200',        dot:'bg-blue-500',    icon:Clock         },
  'Under Review':     { color:'bg-amber-50 text-amber-700 border-amber-200',     dot:'bg-amber-500',   icon:AlertCircle   },
  'Conditional Offer':{ color:'bg-purple-50 text-purple-700 border-purple-200',  dot:'bg-purple-500',  icon:AlertTriangle },
  'Accepted':         { color:'bg-emerald-50 text-emerald-700 border-emerald-200',dot:'bg-emerald-500', icon:CheckCircle   },
  'Offer Received':   { color:'bg-teal-50 text-teal-700 border-teal-200',        dot:'bg-teal-500',    icon:Award         },
  'Enrolled':         { color:'bg-green-50 text-green-700 border-green-200',     dot:'bg-green-600',   icon:Check         },
  'Rejected':         { color:'bg-red-50 text-red-600 border-red-200',           dot:'bg-red-500',     icon:XCircle       },
  'Withdrawn':        { color:'bg-slate-100 text-slate-500 border-slate-200',    dot:'bg-slate-400',   icon:X             },
  'Deferred':         { color:'bg-orange-50 text-orange-700 border-orange-200',  dot:'bg-orange-500',  icon:Clock         },
};

const PIPELINE_STEPS = [
  { label:'Application\nCreated',  key:'created'    },
  { label:'Application\nStarted',  key:'started'    },
  { label:'Under\nReview',         key:'review'     },
  { label:'Submitted\nto School',  key:'submitting' },
  { label:'Awaiting\nDecision',    key:'awaiting'   },
  { label:'Admission\nProcessing', key:'admission'  },
  { label:'Pre-Arrival',           key:'pre_arrival'},
  { label:'Arrival',               key:'arrival'    },
];

// Map app status → pipeline step key
const STATUS_TO_STEP = {
  'Submitted':        'started',
  'Under Review':     'review',
  'Conditional Offer':'awaiting',
  'Accepted':         'awaiting',
  'Offer Received':   'awaiting',
  'Enrolled':         'arrival',
  'Rejected':         'review',
  'Withdrawn':        'created',
  'Deferred':         'awaiting',
};


// Map pipeline step key → best matching application status
const STEP_TO_STATUS = {
  'created':     'Submitted',
  'started':     'Submitted',
  'review':      'Under Review',
  'submitting':  'Under Review',
  'awaiting':    'Accepted',
  'admission':   'Offer Received',
  'pre_arrival': 'Enrolled',
  'arrival':     'Enrolled',
};

// Map pipeline step key → display color
const STEP_STYLE = {
  'created':     { bg:'bg-slate-100',   text:'text-slate-600',   active:'bg-slate-600 text-white',   border:'border-slate-300'   },
  'started':     { bg:'bg-sky-50',      text:'text-sky-700',     active:'bg-sky-600 text-white',     border:'border-sky-300'     },
  'review':      { bg:'bg-amber-50',    text:'text-amber-700',   active:'bg-amber-500 text-white',   border:'border-amber-300'   },
  'submitting':  { bg:'bg-blue-50',     text:'text-blue-700',    active:'bg-blue-600 text-white',    border:'border-blue-300'    },
  'awaiting':    { bg:'bg-purple-50',   text:'text-purple-700',  active:'bg-purple-600 text-white',  border:'border-purple-300'  },
  'admission':   { bg:'bg-emerald-50',  text:'text-emerald-700', active:'bg-emerald-600 text-white', border:'border-emerald-300' },
  'pre_arrival': { bg:'bg-teal-50',     text:'text-teal-700',    active:'bg-teal-600 text-white',    border:'border-teal-300'    },
  'arrival':     { bg:'bg-green-50',    text:'text-green-700',   active:'bg-green-600 text-white',   border:'border-green-300'   },
};

// Map pipeline step key → application status
function statusToStep(status) {
  return {
    'Submitted':         'started',
    'Under Review':      'review',
    'Conditional Offer': 'awaiting',
    'Accepted':          'awaiting',
    'Offer Received':    'awaiting',
    'Enrolled':          'arrival',
    'Rejected':          'review',
    'Withdrawn':         'created',
    'Deferred':          'awaiting',
  }[status] || 'created';
}

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
  const [file, setFile]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]   = useState('');
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
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          program_doc_id: doc?.id || null,
          doc_name: doc?.name || file.name,
          doc_type: file.type, file_name: file.name,
          file_url: preview, file_size: file.size,
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onUploaded(); onClose();
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
            <h3 className="font-bold text-slate-900">{doc?.rejection_reason ? 'Re-upload Document' : 'Upload Document'}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{doc?.name || 'Document'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
        </div>
        {doc?.rejection_reason && (
          <div className="mx-6 mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5"/>
            <div><span className="font-bold">Rejection reason: </span>{doc.rejection_reason}</div>
          </div>
        )}
        <div className="px-6 py-5 space-y-4">
          <div onDrop={e=>{ e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e=>e.preventDefault()} onClick={()=>fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
              ${file?'border-emerald-400 bg-emerald-50':'border-slate-300 hover:border-brand-400 bg-slate-50 hover:bg-brand-50'}`}>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={e=>handleFile(e.target.files[0])}/>
            {file ? (
              <div className="flex flex-col items-center gap-2">
                {isImage && preview ? <img src={preview} className="w-20 h-20 object-cover rounded-xl shadow-sm" alt="preview"/> : <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center"><FileText className="w-7 h-7 text-brand-600"/></div>}
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
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white">Cancel</button>
          <button onClick={handleUpload} disabled={!file||uploading}
            className="flex-1 py-2.5 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {uploading?<Loader2 className="w-4 h-4 animate-spin"/>:<Upload className="w-4 h-4"/>}
            {uploading?'Uploading…':doc?.rejection_reason?'Re-upload Document':'Upload Document'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────
function RejectModal({ open, doc, applicationId, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setReason(''); }, [open]);
  if (!open || !doc) return null;

  async function handleReject() {
    if (!reason.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/applications/documents?application_id=${applicationId}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ doc_id: doc.id, status:'rejected', rejection_reason: reason.trim() })
      });
      onDone(); onClose();
    } catch {}
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-800">Reject Document</h3>
            <p className="text-xs text-slate-400 mt-0.5">{doc.doc_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
        </div>
        <div className="px-6 py-5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rejection Reason <span className="text-red-500">*</span></label>
          <textarea rows={4} value={reason} onChange={e=>setReason(e.target.value)}
            placeholder="Explain why this document was rejected so the student knows what to fix and re-upload…"
            className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none bg-white"/>
          <p className="text-xs text-slate-400 mt-2">This reason will be shown to the student when they view the rejected document.</p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm">Cancel</button>
          <button onClick={handleReject} disabled={!reason.trim()||saving}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<XCircle className="w-4 h-4"/>}
            {saving?'Rejecting…':'Reject Document'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Doc row ───────────────────────────────────────────────────
function DocRow({ doc, uploadedDoc, onUpload, onViewDoc, onApprove, onReject, role }) {
  const status = uploadedDoc?.status || 'not_uploaded';
  const statusCfg = {
    not_uploaded:{ color:'bg-amber-50 text-amber-600 border-amber-200',   label:'Not Uploaded' },
    in_review:   { color:'bg-blue-50 text-blue-700 border-blue-200',      label:'In Review'    },
    approved:    { color:'bg-emerald-50 text-emerald-700 border-emerald-200', label:'Approved'  },
    rejected:    { color:'bg-red-50 text-red-600 border-red-200',          label:'Rejected'     },
  };
  const cfg = statusCfg[status] || statusCfg.not_uploaded;

  return (
    <div className={`flex items-start gap-3 py-3.5 border-b border-slate-100 last:border-0 px-1 transition-colors
      ${status==='rejected'?'bg-red-50/30':status==='approved'?'bg-emerald-50/20':'hover:bg-slate-50/50'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5
        ${status==='approved'?'bg-emerald-100 border border-emerald-200':status==='rejected'?'bg-red-100 border border-red-200':status==='in_review'?'bg-blue-100 border border-blue-200':'bg-amber-50 border border-amber-200'}`}>
        <FileText className={`w-4 h-4 ${status==='approved'?'text-emerald-600':status==='rejected'?'text-red-600':status==='in_review'?'text-blue-600':'text-amber-600'}`}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800">{doc.name}</span>
          {!doc.required && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Optional</span>}
        </div>
        {doc.description && <p className="text-xs text-slate-400 mt-0.5">{doc.description}</p>}
        {uploadedDoc && (
          <p className="text-xs text-slate-400 mt-0.5">{uploadedDoc.file_name} · {uploadedDoc.uploaded_at?new Date(uploadedDoc.uploaded_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):''}</p>
        )}
        {/* Rejection reason shown to everyone */}
        {uploadedDoc?.rejection_reason && (
          <div className="flex items-start gap-1.5 mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <AlertOctagon className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5"/>
            <div className="text-xs text-red-700"><span className="font-bold">Reason: </span>{uploadedDoc.rejection_reason}</div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
        {uploadedDoc && (
          <button onClick={()=>onViewDoc(uploadedDoc)}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
            <Eye className="w-3.5 h-3.5"/>View
          </button>
        )}
        {/* Admin approve/reject on in_review docs */}
        {['admin','custom'].includes(role) && uploadedDoc?.status==='in_review' && (
          <div className="flex gap-1.5">
            <button onClick={()=>onApprove(uploadedDoc)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-sm">
              <Check className="w-3.5 h-3.5"/>Approve
            </button>
            <button onClick={()=>onReject(uploadedDoc)}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-sm">
              <X className="w-3.5 h-3.5"/>Reject
            </button>
          </div>
        )}
        {/* Re-review option */}
        {['admin','custom'].includes(role) && uploadedDoc?.status==='rejected' && (
          <button onClick={()=>onApprove({...uploadedDoc, _action:'in_review'})}
            className="flex items-center gap-1.5 border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
            Re-review
          </button>
        )}
        {/* Upload / Re-upload for non-admin or rejected */}
        {(!['admin','custom'].includes(role) || uploadedDoc?.status==='rejected') && (
          <button onClick={()=>onUpload({...doc, rejection_reason: uploadedDoc?.rejection_reason})}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm
              ${uploadedDoc?.status==='rejected'?'bg-amber-500 hover:bg-amber-600 text-white':'bg-brand-600 hover:bg-brand-700 text-white'}`}>
            <Upload className="w-3.5 h-3.5"/>{uploadedDoc ? 'Re-upload' : 'Upload'}
          </button>
        )}
        {/* Admin can also upload if not yet uploaded */}
        {['admin','custom'].includes(role) && !uploadedDoc && (
          <button onClick={()=>onUpload(doc)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm">
            <Upload className="w-3.5 h-3.5"/>Upload
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

// ── Log item ──────────────────────────────────────────────────
function LogItem({ log, isLast }) {
  const actionCfg = {
    'Application Created':    { icon:Rocket,       color:'bg-brand-500'   },
    'Status Changed':         { icon:RefreshCw,    color:'bg-amber-500'   },
    'Document Uploaded':      { icon:Upload,        color:'bg-blue-500'    },
    'Document Re-uploaded':   { icon:Upload,        color:'bg-sky-500'     },
    'Document Status Updated':{ icon:CheckSquare,  color:'bg-emerald-500' },
    'Note Added':             { icon:MessageSquare, color:'bg-slate-500'   },
    'Application Submitted':  { icon:Send,          color:'bg-purple-500'  },
  };
  const cfg = actionCfg[log.action] || { icon:Clock3, color:'bg-slate-400' };
  const Icon = cfg.icon;
  return (
    <div className="flex gap-4 relative">
      {!isLast && <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-slate-100"/>}
      <div className={`w-10 h-10 rounded-full ${cfg.color} flex items-center justify-center shrink-0 shadow-sm z-10`}>
        <Icon className="w-4 h-4 text-white"/>
      </div>
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
              <div className="text-xs font-semibold text-slate-500">{log.created_at?new Date(log.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{log.created_at?new Date(log.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):''}</div>
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
  const isPDF   = doc.doc_type==='application/pdf' || /\.pdf$/i.test(doc.file_name||'');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-slate-800">{doc.doc_name}</h3>
            <p className="text-xs text-slate-400">{doc.file_name} · {doc.file_size?`${(doc.file_size/1024).toFixed(1)} KB`:''}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={doc.file_url} download={doc.file_name} className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
              <Download className="w-3.5 h-3.5"/>Download
            </a>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-4 h-4"/></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-50 rounded-b-3xl">
          {isImage?<img src={doc.file_url} alt={doc.doc_name} className="max-w-full max-h-full object-contain rounded-xl shadow-md"/>
            :isPDF?<iframe src={doc.file_url} className="w-full h-96 rounded-xl border border-slate-200" title={doc.doc_name}/>
            :<div className="flex flex-col items-center gap-4 text-slate-400 py-12"><FileText className="w-16 h-16 opacity-30"/><p className="font-medium text-slate-500">Preview not available</p><a href={doc.file_url} download={doc.file_name} className="flex items-center gap-2 bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm"><Download className="w-4 h-4"/>Download File</a></div>}
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function ApplicationDetail() {
  const router = useRouter();
  const { id }  = router.query;
  const [app, setApp]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [programDocs, setProgramDocs]   = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [logs, setLogs]           = useState([]);
  const [activeTab, setActiveTab] = useState('requirements');
  const [uploadModal, setUploadModal]   = useState({ open:false, doc:null });
  const [viewDocModal, setViewDocModal] = useState(null);
  const [rejectModal, setRejectModal]   = useState({ open:false, doc:null });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [saving, setSaving]       = useState(false);
  const [sendingReview, setSendingReview] = useState(false);
  const [comment, setComment]     = useState('');
  const [sendingComment, setSending] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(true);
  const [editIntake, setEditIntake] = useState(false);
  const [intakeVal, setIntakeVal] = useState('');
  const [user, setUser]           = useState(null);

  useEffect(()=>{ fetch('/api/auth/me').then(r=>r.json()).then(d=>setUser(d.user)); },[]);

  const loadUploadedDocs = useCallback(async () => {
    if (!id) return;
    try { const d = await fetch(`/api/applications/documents?application_id=${id}`).then(r=>r.json()); setUploadedDocs(d.documents||[]); } catch {}
  }, [id]);

  const loadLogs = useCallback(async () => {
    if (!id) return;
    try { const d = await fetch(`/api/applications/logs?application_id=${id}`).then(r=>r.json()); setLogs(d.logs||[]); } catch {}
  }, [id]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await fetch(`/api/applications/${id}`).then(r=>r.json());
      setApp(d); setIntakeVal(d.intake||'');
      if (d.program_id) {
        const rd = await fetch(`/api/programs/${d.program_id}/requirements`).then(r=>r.json()).catch(()=>({documents:[]}));
        setProgramDocs(rd.documents||[]);
      }
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(()=>{ load(); loadUploadedDocs(); loadLogs(); },[load,loadUploadedDocs,loadLogs]);

  async function handleStatusChange() {
    if (!newStatus) return;
    setSaving(true);
    try {
      await apiCall(`/api/applications/${id}`,'PUT',{ status:newStatus, comment:statusNote });
      setShowStatusModal(false); setStatusNote(''); setNewStatus('');
      load(); loadLogs();
    } catch(e) { console.error(e.message); } finally { setSaving(false); }
  }

  async function handleSaveIntake() {
    try { await apiCall(`/api/applications/${id}`,'PUT',{ intake:intakeVal }); setEditIntake(false); load(); } catch {}
  }

  async function handleSendComment() {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/applications/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({comment})});
      await fetch(`/api/applications/logs?application_id=${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'Note Added',description:comment.trim()})});
      setComment(''); load(); loadLogs();
    } catch {} finally { setSending(false); }
  }

  async function handleApproveDoc(uploadedDoc) {
    const status = uploadedDoc._action || 'approved';
    try {
      await fetch(`/api/applications/documents?application_id=${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({doc_id:uploadedDoc.id,status})});
      loadUploadedDocs(); loadLogs();
    } catch {}
  }

  // Send all current-step docs for review — marks all uploaded docs as in_review
  async function handleSendForReview() {
    setSendingReview(true);
    try {
      const stepKey = STATUS_TO_STEP[app.status] || 'started';
      const stepDocs = programDocs.filter(d => !d.application_step || d.application_step === stepKey || d.application_step === '');
      // Mark all uploaded docs for this step as in_review
      for (const doc of stepDocs) {
        const up = uploadedByDocId[doc.id];
        if (up && up.status !== 'approved' && up.status !== 'in_review') {
          await fetch(`/api/applications/documents?application_id=${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_id: up.id, status: 'in_review' })
          });
        }
      }
      await fetch(`/api/applications/logs?application_id=${id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'Application Submitted', description: `Documents submitted for admin review (step: ${stepKey})` })
      });
      loadUploadedDocs(); loadLogs();
    } catch(e) { console.error(e); }
    finally { setSendingReview(false); }
  }

  // Admin approves step and advances to next pipeline step directly (no modal)
  async function handleAdvanceStep() {
    const currentIdx = PIPELINE_STEPS.findIndex(s => s.key === (STATUS_TO_STEP[app.status] || 'started'));
    const nextStep   = PIPELINE_STEPS[currentIdx + 1];
    if (!nextStep) return;
    const nextStatus = STEP_TO_STATUS[nextStep.key] || app.status;
    setSaving(true);
    try {
      await apiCall(`/api/applications/${id}`, 'PUT', {
        status: nextStatus,
        comment: `Step approved. Advanced to: ${nextStep.label.replace(/\n/g,' ')}`
      });
      load(); loadLogs();
    } catch(e) { console.error(e.message); }
    finally { setSaving(false); }
  }

  const role = user?.role || 'admin';

  if (loading) return <AdminLayout title="Application"><div className="flex justify-center py-20"><Spinner size="lg"/></div></AdminLayout>;
  if (!app||app.error) return <AdminLayout title="Application"><div className="text-center py-20 text-slate-400">Application not found</div></AdminLayout>;

  const activeStep  = getActiveStep(app.status);
  const currentStepKey = STATUS_TO_STEP[app.status] || 'started';
  const history  = app.history  || [];
  const comments = app.comments || [];

  // Map uploaded docs by program_doc_id
  const uploadedByDocId = {};
  uploadedDocs.forEach(d => { if (d.program_doc_id) uploadedByDocId[d.program_doc_id] = d; });

  // Filter program docs to only show docs for current step (or "all steps" / empty step)
  const currentStepDocs = programDocs.filter(d =>
    !d.application_step || d.application_step === currentStepKey || d.application_step === ''
  );

  // Check if all required docs for current step are uploaded (not rejected)
  const requiredCurrentDocs = currentStepDocs.filter(d => d.required);
  const allRequiredUploaded = requiredCurrentDocs.every(d => {
    const up = uploadedByDocId[d.id];
    return up && up.status !== 'rejected';
  });
  const anyInReview = currentStepDocs.some(d => uploadedByDocId[d.id]?.status === 'in_review');
  const notYetUploaded = currentStepDocs.filter(d => !uploadedByDocId[d.id]).length;

  // Doc groups for current step
  const docsNotUploaded = currentStepDocs.filter(d => !uploadedByDocId[d.id]);
  const docsInReview    = currentStepDocs.filter(d => uploadedByDocId[d.id]?.status === 'in_review');
  const docsApproved    = currentStepDocs.filter(d => uploadedByDocId[d.id]?.status === 'approved');
  const docsRejected    = currentStepDocs.filter(d => uploadedByDocId[d.id]?.status === 'rejected');

  const profileFields = [app.student_name,app.phone,app.education_level,app.gpa,app.ielts_score,app.passport_no];
  const profilePct = Math.round((profileFields.filter(Boolean).length/profileFields.length)*100);

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
                <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{app.program_name||'Application Details'}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-slate-500">App ID: <span className="font-bold font-mono text-slate-800">{app.app_code}</span></span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Intake:</span>
                    {editIntake?(
                      <div className="flex items-center gap-2">
                        <input value={intakeVal} onChange={e=>setIntakeVal(e.target.value)} className="border border-slate-300 rounded-lg px-2.5 py-1 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"/>
                        <button onClick={handleSaveIntake} className="p-1.5 bg-emerald-600 text-white rounded-lg"><Check className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>setEditIntake(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg"><X className="w-3.5 h-3.5"/></button>
                      </div>
                    ):(
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{app.intake||'Not set'}</span>
                        {role==='admin'&&<button onClick={()=>setEditIntake(true)} className="text-slate-400 hover:text-brand-600"><Pencil className="w-3.5 h-3.5"/></button>}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={app.status}/>
                </div>
              </div>
            </div>
            {role==='admin'&&(
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
          {pipelineOpen&&(
            <div className="px-6 pb-5">
              <div className="flex items-center">
                {PIPELINE_STEPS.map((step,i)=>{
                  const done=i<activeStep,current=i===activeStep,failed=['Rejected','Withdrawn'].includes(app.status)&&i===activeStep;
                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0
                          ${failed?'bg-red-500 border-red-500':done?'bg-emerald-500 border-emerald-500':current?'bg-white border-brand-600':'bg-white border-slate-300'}`}>
                          {failed?<X className="w-4 h-4 text-white"/>:done?<Check className="w-4 h-4 text-white"/>:current?<div className="w-2.5 h-2.5 rounded-full bg-brand-600"/>:null}
                        </div>
                        <div className={`text-center mt-2 text-[10px] font-semibold leading-tight max-w-[80px] whitespace-pre-line ${done||current?'text-slate-700':'text-slate-400'}`}>{step.label}</div>
                      </div>
                      {i<PIPELINE_STEPS.length-1&&<div className={`flex-1 h-0.5 mx-1 -mt-5 ${i<activeStep?'bg-emerald-500':'bg-slate-200'}`}/>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {profilePct<80&&(
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 mb-4">
          <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-amber-600 shrink-0"/>
            <span className="text-sm font-semibold text-amber-700">Student profile is incomplete ({profilePct}%).</span>
          </div>
          <button onClick={()=>router.push(`/admin/student/${app.student_db_id}`)} className="text-sm font-bold text-amber-700 hover:text-amber-900 underline ml-4">Complete Now</button>
        </div>
      )}

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
                <button onClick={()=>router.push(`/admin/student/${app.student_db_id}`)} className="text-xs text-brand-600 hover:underline">ID: {app.student_db_id} · View profile →</button>
              </div>
            </div>
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/>Profile Score</div>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray={`${(profilePct/100)*201} 201`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs font-bold text-slate-800">{profilePct}%</span></div>
                </div>
                <div className="space-y-1.5">
                  {[['Profile',profilePct>=80],['Docs OK',docsApproved.length>0],['IELTS',!!app.ielts_score],['GPA',!!app.gpa]].map(([l,done])=>(
                    <div key={l} className="flex items-center gap-2 text-xs">
                      {done?<CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0"/>:<div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0"/>}
                      <span className={done?'text-slate-700':'text-slate-400'}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-3">
              <InfoRow icon={Mail}          label="Email"     value={app.student_email}/>
              <InfoRow icon={Phone}         label="Phone"     value={app.phone}/>
              <InfoRow icon={GraduationCap} label="Education" value={app.education_level}/>
              <InfoRow icon={Star}          label="GPA"       value={app.gpa?`${app.gpa}`:null}/>
              <InfoRow icon={Globe}         label="IELTS"     value={app.ielts_score?`${app.ielts_score}`:null}/>
              <InfoRow icon={Shield}        label="Passport"  value={app.passport_no} mono/>
              <InfoRow icon={Calendar}      label="Applied"   value={app.applied_date?new Date(app.applied_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):null}/>
              <InfoRow icon={DollarSign}    label="Tuition"   value={app.tuition_fee?`${app.currency} ${Number(app.tuition_fee).toLocaleString()}`:null}/>
              {app.agent_name&&<InfoRow icon={User} label="Agent" value={app.agent_name}/>}
            </div>
          </div>
          {role==='admin'&&(
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Application Pipeline</div>
              <div className="space-y-1">
                {PIPELINE_STEPS.map((step, i) => {
                  const isCurrent = step.key === currentStepKey;
                  const isDone    = i < activeStep;
                  const style     = STEP_STYLE[step.key] || STEP_STYLE['created'];
                  // Count docs for this step
                  const stepDocsList = programDocs.filter(d => d.application_step === step.key);
                  const stepApproved = stepDocsList.filter(d => uploadedByDocId[d.id]?.status === 'approved').length;
                  const stepTotal    = stepDocsList.length;
                  return (
                    <div key={step.key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold
                      ${isCurrent
                        ? style.active + ' border-transparent shadow-sm'
                        : isDone
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold
                        ${isCurrent ? 'bg-white/30' : isDone ? 'bg-emerald-500 text-white' : 'bg-white/30'}`}>
                        {isDone ? <Check className="w-3 h-3"/> : i+1}
                      </div>
                      <span className="flex-1 leading-tight">{step.label.replace(/\n/g,' ')}</span>
                      {isCurrent && <span className="text-[9px] opacity-70 uppercase tracking-wide font-bold">Active</span>}
                      {isDone && stepTotal > 0 && <span className="text-[10px] text-emerald-600 font-bold">{stepApproved}/{stepTotal}</span>}
                      {isDone && <Check className="w-3 h-3 text-emerald-500"/>}
                    </div>
                  );
                })}
              </div>

              {/* Approve Step & Advance button — shown when all current step required docs are approved */}
              {(() => {
                const currentIdx = PIPELINE_STEPS.findIndex(s => s.key === currentStepKey);
                const nextStep   = PIPELINE_STEPS[currentIdx + 1];
                const stepDocs   = programDocs.filter(d => !d.application_step || d.application_step === currentStepKey || d.application_step === '');
                const reqDocs    = stepDocs.filter(d => d.required);
                const allApproved = reqDocs.length > 0 && reqDocs.every(d => uploadedByDocId[d.id]?.status === 'approved');
                const anyInReview = stepDocs.some(d => uploadedByDocId[d.id]?.status === 'in_review');
                if (!nextStep) return null;
                return (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {/* Advance button — enabled only when all required docs approved */}
                    <button
                      onClick={handleAdvanceStep}
                      disabled={saving || !allApproved}
                      title={!allApproved ? 'Approve all required documents first' : `Advance to ${nextStep.label.replace(/\n/g,' ')}`}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all
                        ${allApproved
                          ? 'bg-brand-700 hover:bg-brand-800 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}>
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <ChevronRight className="w-3.5 h-3.5"/>}
                      {allApproved
                        ? `Approve & Move to ${nextStep.label.replace(/\n/g,' ')}`
                        : anyInReview
                          ? 'Review documents first'
                          : reqDocs.length > 0
                            ? `${reqDocs.filter(d=>uploadedByDocId[d.id]?.status==='approved').length}/${reqDocs.length} required docs approved`
                            : `Move to ${nextStep.label.replace(/\n/g,' ')}`
                      }
                    </button>
                    {/* Manual override — for edge cases */}
                    {!allApproved && (
                      <button onClick={()=>{ setNewStatus(STEP_TO_STATUS[nextStep.key]||app.status); setShowStatusModal(true); }}
                        className="w-full py-2 rounded-xl text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200">
                        Override & advance anyway
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Reject / Withdraw */}
              <div className="mt-2 flex gap-2">
                <button onClick={()=>{ setNewStatus('Rejected'); setShowStatusModal(true); }}
                  disabled={app.status==='Rejected'}
                  className="flex-1 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold hover:bg-red-100 transition-colors disabled:opacity-40">
                  Reject
                </button>
                <button onClick={()=>{ setNewStatus('Withdrawn'); setShowStatusModal(true); }}
                  disabled={app.status==='Withdrawn'}
                  className="flex-1 py-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold hover:bg-slate-200 transition-colors disabled:opacity-40">
                  Withdraw
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center px-4 border-b border-slate-100">
              {[{id:'requirements',label:`Documents (${currentStepDocs.length})`},{id:'notes',label:'Activity Log'},{id:'history',label:'Status History'},{id:'comments',label:'Notes'}].map(tab=>(
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                  className={`px-4 py-3.5 text-sm font-bold border-b-2 transition-colors -mb-px ${activeTab===tab.id?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── DOCUMENTS TAB ── */}
            {activeTab==='requirements'&&(
              <div className="p-5">
                {/* Current step indicator */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-brand-500"/>
                    <span className="text-sm font-bold text-slate-700">Current Step:</span>
                    <span className="text-sm font-bold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1 rounded-full">
                      {PIPELINE_STEPS.find(s=>s.key===currentStepKey)?.label.replace('\n',' ') || app.status}
                    </span>
                  </div>
                  {currentStepDocs.length > 0 && (
                    <div className="text-xs text-slate-500">
                      {docsApproved.length}/{currentStepDocs.length} approved · {docsInReview.length} in review · {docsRejected.length} rejected
                    </div>
                  )}
                </div>

                {currentStepDocs.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-slate-400 gap-3">
                    <FileText className="w-10 h-10 opacity-30"/>
                    <p className="font-semibold text-slate-500">No documents required for this step</p>
                    {role==='admin'&&<button onClick={()=>router.push(`/admin/program/${app.program_id}/requirements`)} className="text-brand-600 font-bold text-sm hover:underline">Configure Requirements →</button>}
                  </div>
                ) : (
                  <>
                    {/* ── AGENT/STUDENT: upload progress + send for review ── */}
                    {!['admin','custom'].includes(role) && (
                      <>
                        {notYetUploaded > 0 ? (
                          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0"/>
                            <div className="flex-1">
                              <div className="font-bold text-amber-800 text-sm">{notYetUploaded} required document{notYetUploaded!==1?'s':''} still missing</div>
                              <div className="text-xs text-amber-600 mt-0.5">Upload all required documents before you can send for review</div>
                            </div>
                            <div className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                              {currentStepDocs.filter(d=>uploadedByDocId[d.id]).length}/{currentStepDocs.length} uploaded
                            </div>
                          </div>
                        ) : docsInReview.length > 0 ? (
                          <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
                            <CheckCircle className="w-5 h-5 text-blue-500 shrink-0"/>
                            <div>
                              <div className="font-bold text-blue-800 text-sm">Documents submitted for review</div>
                              <div className="text-xs text-blue-600 mt-0.5">Admin is reviewing your documents. You will be notified when approved.</div>
                            </div>
                          </div>
                        ) : allRequiredUploaded && docsInReview.length === 0 && docsRejected.length === 0 ? (
                          <div className="mb-4 flex items-center justify-between bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4">
                            <div>
                              <div className="font-bold text-brand-800 text-sm">All documents uploaded!</div>
                              <div className="text-xs text-brand-600 mt-0.5">Click to send documents to admin for review</div>
                            </div>
                            <button onClick={handleSendForReview} disabled={sendingReview}
                              className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-60">
                              {sendingReview?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                              Send for Review
                            </button>
                          </div>
                        ) : docsRejected.length > 0 ? (
                          <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
                            <div>
                              <div className="font-bold text-red-800 text-sm">{docsRejected.length} document{docsRejected.length!==1?'s':''} rejected — please re-upload</div>
                              <div className="text-xs text-red-600 mt-0.5">Check the rejection reasons below and re-upload corrected documents</div>
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}

                    {/* ── ADMIN: approve all in-review docs at once ── */}
                    {['admin','custom'].includes(role) && docsInReview.length > 0 && (
                      <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
                        <div>
                          <div className="font-bold text-blue-800 text-sm">{docsInReview.length} document{docsInReview.length!==1?'s':''} waiting for review</div>
                          <div className="text-xs text-blue-600 mt-0.5">Review and approve each document, then advance the step from the sidebar</div>
                        </div>
                      </div>
                    )}

                    {/* Not uploaded */}
                    {docsNotUploaded.length > 0 && (
                      <DocGroup title="Not Yet Uploaded" count={docsNotUploaded.length} color="amber" icon={Clock}>
                        {docsNotUploaded.map(doc=>(
                          <DocRow key={doc.id} doc={doc} uploadedDoc={null} role={role}
                            onUpload={d=>setUploadModal({open:true,doc:d})} onViewDoc={setViewDocModal}
                            onApprove={handleApproveDoc} onReject={d=>setRejectModal({open:true,doc:d})}/>
                        ))}
                      </DocGroup>
                    )}
                    {/* In Review */}
                    {docsInReview.length > 0 && (
                      <DocGroup title="In Review" count={docsInReview.length} color="blue" icon={Eye}>
                        {docsInReview.map(doc=>(
                          <DocRow key={doc.id} doc={doc} uploadedDoc={uploadedByDocId[doc.id]} role={role}
                            onUpload={d=>setUploadModal({open:true,doc:d})} onViewDoc={setViewDocModal}
                            onApprove={handleApproveDoc} onReject={d=>setRejectModal({open:true,doc:uploadedByDocId[d.id]})}/>
                        ))}
                      </DocGroup>
                    )}
                    {/* Rejected */}
                    {docsRejected.length > 0 && (
                      <DocGroup title="Rejected — Re-upload Required" count={docsRejected.length} color="red" icon={XCircle}>
                        {docsRejected.map(doc=>(
                          <DocRow key={doc.id} doc={doc} uploadedDoc={uploadedByDocId[doc.id]} role={role}
                            onUpload={d=>setUploadModal({open:true,doc:{...d, rejection_reason:uploadedByDocId[d.id]?.rejection_reason}})} onViewDoc={setViewDocModal}
                            onApprove={handleApproveDoc} onReject={d=>setRejectModal({open:true,doc:uploadedByDocId[d.id]})}/>
                        ))}
                      </DocGroup>
                    )}
                    {/* Approved */}
                    {docsApproved.length > 0 && (
                      <DocGroup title="Approved" count={docsApproved.length} color="emerald" icon={CheckCircle}>
                        {docsApproved.map(doc=>(
                          <DocRow key={doc.id} doc={doc} uploadedDoc={uploadedByDocId[doc.id]} role={role}
                            onUpload={d=>setUploadModal({open:true,doc:d})} onViewDoc={setViewDocModal}
                            onApprove={handleApproveDoc} onReject={d=>setRejectModal({open:true,doc:uploadedByDocId[d.id]})}/>
                        ))}
                      </DocGroup>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── ACTIVITY LOG ── */}
            {activeTab==='notes'&&(
              <div className="p-5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Application Activity Timeline</div>
                {logs.length===0?(
                  <div className="flex flex-col items-center py-12 text-slate-400 gap-3"><Clock3 className="w-10 h-10 opacity-30"/><p className="font-semibold text-slate-500">No activity recorded yet</p></div>
                ):(
                  <div className="relative pl-2">
                    {logs.map((log,i)=><LogItem key={log.id||i} log={log} isLast={i===logs.length-1}/>)}
                  </div>
                )}
              </div>
            )}

            {/* ── STATUS HISTORY ── */}
            {activeTab==='history'&&(
              <div className="p-5">
                {history.length===0?(
                  <div className="flex flex-col items-center py-12 text-slate-400 gap-2"><Clock className="w-10 h-10 opacity-30"/><p className="font-semibold text-slate-500">No status changes yet</p></div>
                ):(
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

            {/* ── NOTES ── */}
            {activeTab==='comments'&&(
              <div className="p-5">
                {app.notes&&<div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4"><div className="text-xs font-bold text-amber-700 mb-1">Application Note</div><p className="text-sm text-amber-800">{app.notes}</p></div>}
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
                {['admin','agent'].includes(role)&&(
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
      {showStatusModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowStatusModal(false)}/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg">Update Status</h3>
              <button onClick={()=>setShowStatusModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {ALL_STATUSES.map(s=>{ const cfg=STATUS_CFG[s]||{}; return <button key={s} onClick={()=>setNewStatus(s)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all text-left ${newStatus===s?'border-brand-500 bg-brand-50':'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot||'bg-slate-400'}`}/>{s}</button>; })}
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

      <UploadModal open={uploadModal.open} doc={uploadModal.doc} applicationId={id}
        onClose={()=>setUploadModal({open:false,doc:null})}
        onUploaded={()=>{ loadUploadedDocs(); loadLogs(); }}/>

      <RejectModal open={rejectModal.open} doc={rejectModal.doc} applicationId={id}
        onClose={()=>setRejectModal({open:false,doc:null})}
        onDone={()=>{ loadUploadedDocs(); loadLogs(); }}/>

      <ViewDocModal doc={viewDocModal} onClose={()=>setViewDocModal(null)}/>
    </AdminLayout>
  );
}