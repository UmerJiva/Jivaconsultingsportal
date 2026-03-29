// pages/admin/application/[id].js — Admin application detail + review page
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Spinner } from '../../../components/ui/index';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle, Send,
  ChevronDown, User, Building2, BookOpen, Calendar, DollarSign,
  FileText, MessageSquare, TrendingUp, Loader2, Edit3,
  ExternalLink, Shield, GraduationCap, Phone, Mail, Globe,
  Award, Check, X, AlertTriangle
} from 'lucide-react';
import { apiCall } from '../../../lib/useApi';

const ALL_STATUSES = [
  'Submitted', 'Under Review', 'Conditional Offer',
  'Accepted', 'Offer Received', 'Enrolled',
  'Rejected', 'Withdrawn', 'Deferred'
];

const STATUS_CONFIG = {
  'Submitted':       { color:'bg-blue-50 text-blue-700 border-blue-200',    dot:'bg-blue-500',    icon: Clock },
  'Under Review':    { color:'bg-amber-50 text-amber-700 border-amber-200', dot:'bg-amber-500',   icon: AlertCircle },
  'Conditional Offer':{ color:'bg-purple-50 text-purple-700 border-purple-200', dot:'bg-purple-500', icon: AlertTriangle },
  'Accepted':        { color:'bg-emerald-50 text-emerald-700 border-emerald-200', dot:'bg-emerald-500', icon: CheckCircle },
  'Offer Received':  { color:'bg-teal-50 text-teal-700 border-teal-200',    dot:'bg-teal-500',    icon: Award },
  'Enrolled':        { color:'bg-green-50 text-green-700 border-green-200', dot:'bg-green-600',   icon: Check },
  'Rejected':        { color:'bg-red-50 text-red-600 border-red-200',       dot:'bg-red-500',     icon: XCircle },
  'Withdrawn':       { color:'bg-slate-100 text-slate-500 border-slate-200',dot:'bg-slate-400',   icon: X },
  'Deferred':        { color:'bg-orange-50 text-orange-700 border-orange-200', dot:'bg-orange-500', icon: Clock },
};

function StatusBadge({ status, large }) {
  const cfg = STATUS_CONFIG[status] || { color:'bg-slate-100 text-slate-500 border-slate-200', dot:'bg-slate-400' };
  const Icon = cfg.icon || Clock;
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold border rounded-full
      ${large ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-xs'}
      ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`}/>
      {status}
    </span>
  );
}

// Info row
function InfoRow({ icon: Icon, label, value, link, onClick }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500"/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-400 font-medium">{label}</div>
        {onClick ? (
          <button onClick={onClick} className="text-sm font-semibold text-brand-600 hover:underline mt-0.5 text-left">{value||'—'}</button>
        ) : (
          <div className="text-sm font-semibold text-slate-800 mt-0.5">{value||'—'}</div>
        )}
      </div>
    </div>
  );
}

// Timeline event
function TimelineItem({ event, isLast }) {
  const cfg = STATUS_CONFIG[event.status||event.new_status] || { dot:'bg-slate-400' };
  const date = new Date(event.changed_at||event.created_at);
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm mt-1 shrink-0 ${cfg.dot}`}/>
        {!isLast && <div className="w-0.5 bg-slate-200 flex-1 mt-1"/>}
      </div>
      <div className={`pb-4 ${isLast?'':'pb-4'}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {(event.status||event.new_status) && (
            <StatusBadge status={event.status||event.new_status}/>
          )}
          {event.old_status && event.new_status && event.old_status !== event.new_status && (
            <span className="text-xs text-slate-400 line-through">{event.old_status}</span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {event.changed_by_name || 'System'} · {date.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})} {date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
        </div>
        {event.note && <p className="text-xs text-slate-600 mt-1 bg-slate-50 px-2 py-1 rounded-lg">{event.note}</p>}
      </div>
    </div>
  );
}

// Comment bubble
function CommentBubble({ comment, currentUserId }) {
  const isMe = comment.user_id === currentUserId;
  const date = new Date(comment.created_at);
  return (
    <div className={`flex gap-2 ${isMe?'flex-row-reverse':''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isMe?'bg-brand-600':'bg-slate-500'}`}>
        {(comment.author_name||'?')[0].toUpperCase()}
      </div>
      <div className={`max-w-[75%] ${isMe?'items-end':'items-start'} flex flex-col`}>
        <div className={`text-[10px] text-slate-400 mb-1 ${isMe?'text-right':''}`}>
          {comment.author_name} · {date.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})} {date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
        </div>
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe?'bg-brand-600 text-white rounded-tr-sm':'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
          {comment.comment}
        </div>
      </div>
    </div>
  );
}

export default function AdminApplicationDetail() {
  const router = useRouter();
  const { id } = router.query;
  const commentEndRef = useRef(null);

  const [app, setApp]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  // Status update
  const [newStatus, setNewStatus]   = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showStatusEdit, setShowStatusEdit] = useState(false);

  // Comment
  const [comment, setComment]   = useState('');
  const [sending, setSending]   = useState(false);

  // Notes
  const [notes, setNotes]       = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  function load() {
    if (!id) return;
    setLoading(true);
    fetch(`/api/applications/${id}`)
      .then(r=>r.json())
      .then(d => {
        setApp(d);
        setNewStatus(d.status||'Submitted');
        setNotes(d.notes||'');
      })
      .finally(()=>setLoading(false));
  }

  useEffect(()=>{ load(); },[id]);

  useEffect(()=>{
    if (commentEndRef.current) commentEndRef.current.scrollIntoView({ behavior:'smooth' });
  },[app?.comments?.length]);

  async function handleStatusUpdate() {
    setSaving(true); setError('');
    try {
      await apiCall(`/api/applications/${id}`, 'PUT', {
        status: newStatus,
        comment: statusNote.trim() || `Status changed to ${newStatus}`,
      });
      setShowStatusEdit(false);
      setStatusNote('');
      load();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleSendComment() {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await apiCall(`/api/applications/${id}`, 'POST', { comment: comment.trim() });
      setComment('');
      load();
    } catch(e) { setError(e.message); }
    finally { setSending(false); }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try { await apiCall(`/api/applications/${id}`, 'PUT', { notes }); load(); }
    catch(e) { setError(e.message); }
    finally { setSavingNotes(false); }
  }

  if (loading) return <AdminLayout title="Application Detail"><div className="flex justify-center py-20"><Spinner size="lg"/></div></AdminLayout>;
  if (!app||app.error) return <AdminLayout title="Application Detail"><div className="text-center py-20 text-slate-400">Application not found</div></AdminLayout>;

  const history  = app.history  || [];
  const comments = app.comments || [];
  const backups  = Array.isArray(app.backup_programs) ? app.backup_programs : [];
  const cfg      = STATUS_CONFIG[app.status] || STATUS_CONFIG['Submitted'];

  return (
    <AdminLayout title={`Application #${app.app_code}`}>
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={()=>router.push('/admin/applications')}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
              <ArrowLeft className="w-4 h-4"/>
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>
                  Application #{app.app_code}
                </h2>
                <StatusBadge status={app.status} large/>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Submitted {app.applied_date ? new Date(app.applied_date).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}) : '—'}
              </p>
            </div>
          </div>
          {/* Quick approve/reject */}
          <div className="flex items-center gap-2">
            <button onClick={()=>{ setNewStatus('Rejected'); setShowStatusEdit(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm transition-colors">
              <XCircle className="w-4 h-4"/>Reject
            </button>
            <button onClick={()=>{ setNewStatus('Under Review'); setShowStatusEdit(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-amber-200 text-amber-600 hover:bg-amber-50 font-bold text-sm transition-colors">
              <Clock className="w-4 h-4"/>Under Review
            </button>
            <button onClick={()=>{ setNewStatus('Accepted'); setShowStatusEdit(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-sm">
              <CheckCircle className="w-4 h-4"/>Accept
            </button>
          </div>
        </div>

        {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}

        {/* ── Status Update Modal ── */}
        {showStatusEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowStatusEdit(false)}/>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e=>e.stopPropagation()}>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Update Status</h3>
              <p className="text-sm text-slate-500 mb-4">Application #{app.app_code} · {app.student_name}</p>

              {/* Status selector */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {ALL_STATUSES.map(s => {
                  const c = STATUS_CONFIG[s] || STATUS_CONFIG['Submitted'];
                  return (
                    <button key={s} onClick={()=>setNewStatus(s)}
                      className={`px-2 py-2 rounded-xl border-2 text-xs font-bold transition-all ${newStatus===s?'border-brand-500 bg-brand-50 text-brand-700':'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${c.dot}`}/>
                      {s}
                    </button>
                  );
                })}
              </div>

              {/* Note */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Comment / Note (optional)
                </label>
                <textarea rows={3} value={statusNote} onChange={e=>setStatusNote(e.target.value)}
                  placeholder="Reason for this status change…"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none bg-white"/>
              </div>

              <div className="flex gap-3">
                <button onClick={()=>setShowStatusEdit(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleStatusUpdate} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<CheckCircle className="w-4 h-4"/>}
                  {saving?'Saving…':'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main 3-column layout ── */}
        <div className="grid grid-cols-12 gap-5">

          {/* ── LEFT: Application + Student + Program info ── */}
          <div className="col-span-4 space-y-4">

            {/* Application info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-brand-600"/>
                </div>
                <h3 className="font-bold text-slate-800">Application Info</h3>
              </div>
              <InfoRow icon={FileText}   label="App Code"    value={`#${app.app_code}`}/>
              <InfoRow icon={Calendar}   label="Submitted"   value={app.applied_date ? new Date(app.applied_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}/>
              <InfoRow icon={Calendar}   label="Intake"      value={app.intake||'—'}/>
              <InfoRow icon={Calendar}   label="Decision Date" value={app.decision_date ? new Date(app.decision_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}/>
              <InfoRow icon={TrendingUp} label="Status"      value={app.status}/>
              {app.agent_name && <InfoRow icon={User} label="Agent" value={app.agent_name}/>}
            </div>

            {/* Student info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-sky-600"/>
                  </div>
                  <h3 className="font-bold text-slate-800">Student</h3>
                </div>
                <button onClick={()=>router.push(`/admin/student/${app.student_id}`)}
                  className="text-xs text-brand-600 font-bold hover:underline flex items-center gap-1">
                  View Profile <ExternalLink className="w-3 h-3"/>
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0">
                  {(app.student_name||'?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{app.student_name}</div>
                  <div className="text-xs text-slate-500">{app.student_email}</div>
                </div>
              </div>
              <InfoRow icon={Phone}         label="Phone"           value={app.phone}/>
              <InfoRow icon={GraduationCap} label="Education Level" value={app.education_level}/>
              <InfoRow icon={Award}         label="GPA"             value={app.gpa ? `${app.gpa}%` : null}/>
              <InfoRow icon={FileText}      label="IELTS Score"     value={app.ielts_score}/>
              <InfoRow icon={FileText}      label="Passport No."    value={app.passport_no}/>
            </div>

            {/* Program info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-emerald-600"/>
                  </div>
                  <h3 className="font-bold text-slate-800">Program</h3>
                </div>
                <button onClick={()=>router.push(`/admin/program/${app.program_id}`)}
                  className="text-xs text-brand-600 font-bold hover:underline flex items-center gap-1">
                  View Program <ExternalLink className="w-3 h-3"/>
                </button>
              </div>
              <InfoRow icon={BookOpen}    label="Program Name" value={app.program_name}/>
              <InfoRow icon={GraduationCap} label="Level"      value={app.level}/>
              <InfoRow icon={Building2}   label="University"   value={app.university_name}/>
              <InfoRow icon={Globe}       label="Country"      value={app.flag ? `${app.flag} ${app.country}` : app.country}/>
              <InfoRow icon={DollarSign}  label="Tuition"      value={app.tuition_fee ? `${app.currency} ${Number(app.tuition_fee).toLocaleString()}` : null}/>
              <InfoRow icon={Clock}       label="Duration"     value={app.duration_text}/>
            </div>

            {/* Backup programs */}
            {backups.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-amber-600"/>
                  </div>
                  <h3 className="font-bold text-slate-800">Backup Programs ({backups.length})</h3>
                </div>
                <div className="space-y-2">
                  {backups.map((bp, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-xs shrink-0">{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{bp.name}</div>
                        {bp.university_name && <div className="text-xs text-slate-400">{bp.university_name}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── MIDDLE: Status timeline + Notes ── */}
          <div className="col-span-4 space-y-4">

            {/* Current status + quick change */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.color.replace('text-','').replace('border-','').split(' ')[0]||'bg-slate-100'}`}>
                    <TrendingUp className="w-4 h-4 text-slate-600"/>
                  </div>
                  <h3 className="font-bold text-slate-800">Status</h3>
                </div>
                <button onClick={()=>setShowStatusEdit(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-colors border border-brand-200">
                  <Edit3 className="w-3 h-3"/>Change Status
                </button>
              </div>

              {/* Current status */}
              <div className={`p-4 rounded-2xl border-2 mb-4 ${cfg.color}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.color}`}>
                    <span className={`w-3 h-3 rounded-full ${cfg.dot}`}/>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider opacity-70">Current Status</div>
                    <div className="text-lg font-bold mt-0.5">{app.status}</div>
                  </div>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="grid grid-cols-2 gap-2">
                {['Under Review','Conditional Offer','Accepted','Rejected','Enrolled','Deferred'].map(s => (
                  <button key={s} onClick={()=>{ setNewStatus(s); setShowStatusEdit(true); }}
                    disabled={app.status === s}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed
                      ${app.status===s ? 'opacity-30' : STATUS_CONFIG[s]?.color || 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-slate-600"/>
                </div>
                <h3 className="font-bold text-slate-800">Status History</h3>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40"/>
                  No history yet
                </div>
              ) : (
                <div className="pl-1">
                  {history.map((h, i) => (
                    <TimelineItem key={h.id||i} event={h} isLast={i===history.length-1}/>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Notes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                  <Edit3 className="w-4 h-4 text-amber-600"/>
                </div>
                <h3 className="font-bold text-slate-800">Internal Notes</h3>
              </div>
              <textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)}
                placeholder="Add internal notes about this application — only visible to admin and agents…"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none bg-white mb-3"/>
              <button onClick={handleSaveNotes} disabled={savingNotes}
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60">
                {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Check className="w-3.5 h-3.5"/>}
                {savingNotes ? 'Saving…' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Comments / Activity ── */}
          <div className="col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col" style={{height:'calc(100vh - 140px)', minHeight:'500px'}}>

              {/* Header */}
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200 shrink-0">
                <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-brand-600"/>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Comments & Activity</h3>
                  <p className="text-xs text-slate-400">{comments.length} comment{comments.length!==1?'s':''}</p>
                </div>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                    <MessageSquare className="w-10 h-10 mb-2 opacity-40"/>
                    <p className="text-sm font-medium">No comments yet</p>
                    <p className="text-xs mt-1">Add a comment or note below</p>
                  </div>
                ) : (
                  comments.map((c, i) => (
                    <CommentBubble key={c.id||i} comment={c} currentUserId={null}/>
                  ))
                )}
                <div ref={commentEndRef}/>
              </div>

              {/* Comment input */}
              <div className="px-5 py-4 border-t border-slate-200 shrink-0">
                <div className="flex gap-2">
                  <textarea
                    value={comment}
                    onChange={e=>setComment(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSendComment();} }}
                    placeholder="Write a comment… (Enter to send)"
                    rows={2}
                    className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none bg-white"/>
                  <button onClick={handleSendComment} disabled={sending||!comment.trim()}
                    className="px-3.5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl transition-colors disabled:opacity-50 shrink-0 self-end">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Press Enter to send · Shift+Enter for new line</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}