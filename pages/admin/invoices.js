// pages/admin/invoices.js — Full invoicing & commission management
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import {
  Plus, Search, RefreshCw, Filter, X, ChevronDown, ChevronLeft,
  ChevronRight, Eye, Pencil, Trash2, Download, Send, CheckCircle,
  Clock, XCircle, AlertTriangle, DollarSign, Users, FileText,
  Loader2, Save, Printer, ArrowLeft, MoreVertical, TrendingUp,
  CreditCard, Calendar, Building2, GraduationCap, User, Award
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────
const STATUS_CFG = {
  draft:     { color:'bg-slate-100 text-slate-600 border-slate-200',     dot:'bg-slate-400',    icon:FileText    },
  sent:      { color:'bg-blue-50 text-blue-700 border-blue-200',         dot:'bg-blue-500',     icon:Send        },
  paid:      { color:'bg-emerald-50 text-emerald-700 border-emerald-200',dot:'bg-emerald-500',  icon:CheckCircle },
  overdue:   { color:'bg-red-50 text-red-600 border-red-200',            dot:'bg-red-500',      icon:AlertTriangle},
  cancelled: { color:'bg-slate-100 text-slate-400 border-slate-200',     dot:'bg-slate-300',    icon:XCircle     },
};

const TYPE_CFG = {
  commission:{ label:'Commission',  color:'bg-emerald-50 text-emerald-700', icon:Award      },
  fee:       { label:'Fee',         color:'bg-blue-50 text-blue-700',       icon:CreditCard },
  refund:    { label:'Refund',      color:'bg-amber-50 text-amber-700',     icon:TrendingUp },
  bonus:     { label:'Bonus',       color:'bg-purple-50 text-purple-700',   icon:Award      },
  other:     { label:'Other',       color:'bg-slate-100 text-slate-600',    icon:FileText   },
};

const RECIP_CFG = {
  agent:    { label:'Agent',    icon:Users,        color:'bg-brand-50 text-brand-700'    },
  employee: { label:'Employee', icon:User,         color:'bg-violet-50 text-violet-700'  },
  student:  { label:'Student',  icon:GraduationCap,color:'bg-amber-50 text-amber-700'   },
  other:    { label:'Other',    icon:Building2,    color:'bg-slate-100 text-slate-600'   },
};

const CURRENCIES = ['USD','GBP','EUR','AED','PKR','CAD','AUD','INR'];
const PAYMENT_METHODS = ['Bank Transfer','Cash','Cheque','Online Transfer','Stripe','PayPal','Other'];

function fmt(amount, currency='USD') {
  const symbols = { USD:'$', GBP:'£', EUR:'€', AED:'AED ', PKR:'Rs ', CAD:'CA$', AUD:'A$', INR:'₹' };
  const sym = symbols[currency] || currency + ' ';
  return sym + Number(amount||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`}/>
      {status.charAt(0).toUpperCase()+status.slice(1)}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const c = { emerald:'bg-emerald-50 text-emerald-700', blue:'bg-blue-50 text-blue-700', amber:'bg-amber-50 text-amber-700', red:'bg-red-50 text-red-600', slate:'bg-slate-50 text-slate-600', purple:'bg-purple-50 text-purple-700' };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${c[color]||c.slate} rounded-2xl flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6"/>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 leading-none mb-0.5">{value}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── LINE ITEMS editor ─────────────────────────────────────────
function ItemsEditor({ items, onChange }) {
  function addItem() {
    onChange([...items, { description:'', quantity:1, unit_price:0, amount:0 }]);
  }
  function removeItem(i) { onChange(items.filter((_,idx)=>idx!==i)); }
  function updateItem(i, k, v) {
    const next = items.map((item,idx) => {
      if (idx!==i) return item;
      const updated = {...item, [k]:v};
      updated.amount = (parseFloat(updated.quantity)||1)*(parseFloat(updated.unit_price)||0);
      return updated;
    });
    onChange(next);
  }
  const inp = "px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white";
  return (
    <div>
      <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
        <div className="col-span-5">Description</div>
        <div className="col-span-2">Qty</div>
        <div className="col-span-2">Unit Price</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-1"/>
      </div>
      <div className="space-y-2">
        {items.map((item,i)=>(
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <input className={`${inp} col-span-5`} placeholder="Service description…" value={item.description} onChange={e=>updateItem(i,'description',e.target.value)}/>
            <input type="number" className={`${inp} col-span-2`} min="0.01" step="0.01" value={item.quantity} onChange={e=>updateItem(i,'quantity',e.target.value)}/>
            <input type="number" className={`${inp} col-span-2`} min="0" step="0.01" placeholder="0.00" value={item.unit_price} onChange={e=>updateItem(i,'unit_price',e.target.value)}/>
            <div className={`${inp} col-span-2 bg-slate-50 font-bold text-slate-700`}>{fmt(item.amount)}</div>
            <button onClick={()=>removeItem(i)} className="col-span-1 flex justify-center text-slate-300 hover:text-red-500 transition-colors">
              <X className="w-4 h-4"/>
            </button>
          </div>
        ))}
      </div>
      <button onClick={addItem}
        className="mt-3 flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-800 transition-colors">
        <Plus className="w-4 h-4"/>Add Line Item
      </button>
    </div>
  );
}

// ── PDF PRINT ─────────────────────────────────────────────────
function printInvoice(inv) {
  const items = inv.items || [];
  const statusLabel = inv.status?.charAt(0).toUpperCase()+inv.status?.slice(1);
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Invoice ${inv.invoice_no}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; color:#1e293b; background:#fff; }
  .page { max-width:820px; margin:0 auto; padding:48px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; padding-bottom:24px; border-bottom:2px solid #e2e8f0; }
  .brand { font-size:24px; font-weight:800; color:#059669; letter-spacing:-0.5px; }
  .brand-sub { font-size:12px; color:#94a3b8; font-weight:500; margin-top:2px; }
  .inv-badge { text-align:right; }
  .inv-no { font-size:20px; font-weight:800; color:#1e293b; }
  .status-pill { display:inline-block; padding:4px 14px; border-radius:999px; font-size:11px; font-weight:700; margin-top:6px; background:${inv.status==='paid'?'#d1fae5':inv.status==='overdue'?'#fee2e2':inv.status==='sent'?'#dbeafe':'#f1f5f9'}; color:${inv.status==='paid'?'#065f46':inv.status==='overdue'?'#dc2626':inv.status==='sent'?'#1d4ed8':'#475569'}; }
  .meta { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-bottom:36px; }
  .meta-box h4 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin-bottom:8px; }
  .meta-box p { font-size:13px; color:#334155; line-height:1.7; }
  .meta-box .name { font-size:15px; font-weight:700; color:#0f172a; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  thead th { background:#f8fafc; padding:10px 14px; text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#64748b; border-bottom:2px solid #e2e8f0; }
  tbody td { padding:12px 14px; border-bottom:1px solid #f1f5f9; font-size:13px; color:#334155; }
  tbody tr:last-child td { border-bottom:none; }
  .right { text-align:right; }
  .totals { margin-left:auto; width:280px; }
  .totals-row { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; color:#475569; border-bottom:1px solid #f1f5f9; }
  .totals-row.total { font-size:17px; font-weight:800; color:#0f172a; border-top:2px solid #e2e8f0; border-bottom:none; padding-top:12px; margin-top:4px; }
  .payment-box { margin-top:32px; padding:18px 20px; background:#f0fdf4; border-radius:12px; border:1px solid #bbf7d0; }
  .payment-box h4 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#15803d; margin-bottom:8px; }
  .payment-box p { font-size:13px; color:#166534; line-height:1.7; }
  .notes-box { margin-top:24px; padding:16px 20px; background:#fafafa; border-radius:10px; border:1px solid #e2e8f0; }
  .notes-box h4 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin-bottom:6px; }
  .footer { margin-top:48px; padding-top:20px; border-top:1px solid #e2e8f0; text-align:center; font-size:11px; color:#94a3b8; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="brand">EduPortal</div>
      <div class="brand-sub">Management System</div>
    </div>
    <div class="inv-badge">
      <div class="inv-no">${inv.invoice_no}</div>
      <div class="status-pill">${statusLabel}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-box">
      <h4>Bill To</h4>
      <p class="name">${inv.recipient_name}</p>
      <p>${inv.recipient_email||''}</p>
      <p>${inv.recipient_phone||''}</p>
      <p>${inv.recipient_address||''}</p>
    </div>
    <div class="meta-box" style="text-align:right">
      <h4>Invoice Details</h4>
      <p><b>Type:</b> ${inv.type?.charAt(0).toUpperCase()+inv.type?.slice(1)}</p>
      <p><b>Recipient:</b> ${inv.recipient_type?.charAt(0).toUpperCase()+inv.recipient_type?.slice(1)}</p>
      <p><b>Issue Date:</b> ${inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}) : '—'}</p>
      <p><b>Due Date:</b> ${inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}) : '—'}</p>
      ${inv.university_name ? `<p><b>University:</b> ${inv.university_name}</p>` : ''}
      ${inv.program_name ? `<p><b>Program:</b> ${inv.program_name}</p>` : ''}
      ${inv.intake ? `<p><b>Intake:</b> ${inv.intake}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th class="right">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.length > 0 ? items.map((item,i)=>`
        <tr>
          <td style="color:#94a3b8">${i+1}</td>
          <td>${item.description}</td>
          <td class="right">${item.quantity}</td>
          <td class="right">${inv.currency} ${Number(item.unit_price).toFixed(2)}</td>
          <td class="right" style="font-weight:600">${inv.currency} ${Number(item.amount).toFixed(2)}</td>
        </tr>
      `).join('') : `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px">No line items</td></tr>`}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>${inv.currency} ${Number(inv.subtotal).toFixed(2)}</span></div>
    ${Number(inv.discount_amount)>0?`<div class="totals-row"><span>Discount</span><span style="color:#dc2626">- ${inv.currency} ${Number(inv.discount_amount).toFixed(2)}</span></div>`:''}
    ${Number(inv.tax_rate)>0?`<div class="totals-row"><span>Tax (${inv.tax_rate}%)</span><span>${inv.currency} ${Number(inv.tax_amount).toFixed(2)}</span></div>`:''}
    <div class="totals-row total"><span>Total</span><span>${inv.currency} ${Number(inv.total).toFixed(2)}</span></div>
  </div>

  ${inv.payment_date ? `
  <div class="payment-box">
    <h4>✓ Payment Received</h4>
    <p><b>Date:</b> ${new Date(inv.payment_date).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</p>
    ${inv.payment_method ? `<p><b>Method:</b> ${inv.payment_method}</p>` : ''}
    ${inv.payment_ref ? `<p><b>Reference:</b> ${inv.payment_ref}</p>` : ''}
  </div>` : ''}

  ${inv.notes ? `
  <div class="notes-box">
    <h4>Notes</h4>
    <p style="color:#475569;line-height:1.7">${inv.notes}</p>
  </div>` : ''}

  <div class="footer">
    <p>Generated by EduPortal Management System · ${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</p>
    <p style="margin-top:4px">Thank you for your partnership.</p>
  </div>
</div>
</body>
</html>`;
  const win = window.open('','_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(()=>{ win.print(); }, 400);
}

// ── MODAL: Create / Edit Invoice ──────────────────────────────
function InvoiceModal({ open, editing, onClose, onSaved }) {
  const EMPTY = {
    type:'commission', recipient_type:'agent', recipient_name:'', recipient_email:'',
    recipient_phone:'', recipient_address:'', university_name:'', program_name:'',
    intake:'', issue_date: new Date().toISOString().split('T')[0], due_date:'',
    status:'draft', currency:'USD', tax_rate:0, discount_amount:0, subtotal:0,
    notes:'', payment_method:'', payment_date:'', payment_ref:'',
    items:[{ description:'', quantity:1, unit_price:0, amount:0 }]
  };
  const [form, setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(()=>{
    if (!open) return;
    if (editing) {
      setForm({ ...editing, items: editing.items||[{ description:'', quantity:1, unit_price:0, amount:0 }] });
    } else setForm(EMPTY);
    setError('');
  }, [open, editing]);

  function f(k,v) {
    setForm(p=>{
      const next = {...p,[k]:v};
      // Auto-calc subtotal from items if changing tax/discount
      return next;
    });
  }

  function updateItems(items) {
    const subtotal = items.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
    setForm(p=>({...p, items, subtotal}));
  }

  const tax_amount = (parseFloat(form.subtotal)||0)*(parseFloat(form.tax_rate)||0)/100;
  const total = (parseFloat(form.subtotal)||0) - (parseFloat(form.discount_amount)||0) + tax_amount;

  async function handleSave() {
    if (!form.recipient_name || !form.issue_date) { setError('Recipient name and issue date are required'); return; }
    setSaving(true); setError('');
    try {
      const method = editing ? 'PUT' : 'POST';
      const url    = editing ? `/api/invoices/${editing.id}` : '/api/invoices';
      const r = await fetch(url, {
        method, headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, subtotal: form.subtotal, tax_amount, total })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed');
      onSaved(); onClose();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!open) return null;
  const inp = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder-slate-300 font-medium transition-colors";
  const sel = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium transition-colors";
  const FL = ({ label, children, required }) => (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
        {label}{required&&<span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh]" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{editing?'Edit Invoice':'Create New Invoice'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{editing?editing.invoice_no:'New invoice number will be auto-generated'}</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-4 h-4"/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0"/>{error}
            </div>
          )}

          {/* Type + Recipient */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <FL label="Invoice Type" required>
              <select className={sel} value={form.type} onChange={e=>f('type',e.target.value)}>
                {Object.entries(TYPE_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </FL>
            <FL label="Recipient Type" required>
              <select className={sel} value={form.recipient_type} onChange={e=>f('recipient_type',e.target.value)}>
                {Object.entries(RECIP_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </FL>
            <FL label="Status">
              <select className={sel} value={form.status} onChange={e=>f('status',e.target.value)}>
                {Object.keys(STATUS_CFG).map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </FL>
          </div>

          {/* Recipient info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recipient Information</div>
            <div className="grid grid-cols-2 gap-4">
              <FL label="Full Name" required><input className={inp} value={form.recipient_name} onChange={e=>f('recipient_name',e.target.value)} placeholder="Agent / Employee / Student name"/></FL>
              <FL label="Email"><input type="email" className={inp} value={form.recipient_email} onChange={e=>f('recipient_email',e.target.value)} placeholder="email@example.com"/></FL>
              <FL label="Phone"><input className={inp} value={form.recipient_phone} onChange={e=>f('recipient_phone',e.target.value)} placeholder="+92 300 0000000"/></FL>
              <FL label="Address"><input className={inp} value={form.recipient_address} onChange={e=>f('recipient_address',e.target.value)} placeholder="City, Country"/></FL>
            </div>
          </div>

          {/* Application context */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Application Context (Optional)</div>
            <div className="grid grid-cols-3 gap-4">
              <FL label="University"><input className={inp} value={form.university_name} onChange={e=>f('university_name',e.target.value)} placeholder="University name"/></FL>
              <FL label="Program"><input className={inp} value={form.program_name} onChange={e=>f('program_name',e.target.value)} placeholder="Program name"/></FL>
              <FL label="Intake"><input className={inp} value={form.intake} onChange={e=>f('intake',e.target.value)} placeholder="Fall 2025"/></FL>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <FL label="Issue Date" required><input type="date" className={inp} value={form.issue_date} onChange={e=>f('issue_date',e.target.value)}/></FL>
            <FL label="Due Date"><input type="date" className={inp} value={form.due_date} onChange={e=>f('due_date',e.target.value)}/></FL>
            <FL label="Currency">
              <select className={sel} value={form.currency} onChange={e=>f('currency',e.target.value)}>
                {CURRENCIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </FL>
          </div>

          {/* Line items */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 mb-5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Line Items</div>
            <ItemsEditor items={form.items} onChange={updateItems}/>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Pricing</div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <FL label="Tax Rate (%)"><input type="number" className={inp} min="0" max="100" step="0.5" value={form.tax_rate} onChange={e=>f('tax_rate',e.target.value)} placeholder="0"/></FL>
              <FL label="Discount"><input type="number" className={inp} min="0" step="0.01" value={form.discount_amount} onChange={e=>f('discount_amount',e.target.value)} placeholder="0.00"/></FL>
            </div>
            {/* Totals preview */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span><span className="font-semibold">{fmt(form.subtotal, form.currency)}</span>
              </div>
              {parseFloat(form.discount_amount)>0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>Discount</span><span className="font-semibold">− {fmt(form.discount_amount, form.currency)}</span>
                </div>
              )}
              {parseFloat(form.tax_rate)>0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax ({form.tax_rate}%)</span><span className="font-semibold">+ {fmt(tax_amount, form.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2">
                <span>Total</span><span className="text-emerald-700 text-lg">{fmt(total, form.currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          {(form.status==='paid') && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Payment Details</div>
              <div className="grid grid-cols-3 gap-4">
                <FL label="Payment Date"><input type="date" className={inp} value={form.payment_date} onChange={e=>f('payment_date',e.target.value)}/></FL>
                <FL label="Payment Method">
                  <select className={sel} value={form.payment_method} onChange={e=>f('payment_method',e.target.value)}>
                    <option value="">Select method</option>
                    {PAYMENT_METHODS.map(m=><option key={m}>{m}</option>)}
                  </select>
                </FL>
                <FL label="Reference / TXN ID"><input className={inp} value={form.payment_ref} onChange={e=>f('payment_ref',e.target.value)} placeholder="TXN123456"/></FL>
              </div>
            </div>
          )}

          {/* Notes */}
          <FL label="Notes">
            <textarea rows={3} className={inp+' resize-none'} value={form.notes} onChange={e=>f('notes',e.target.value)} placeholder="Additional notes for this invoice…"/>
          </FL>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50 shrink-0 rounded-b-3xl">
          <button onClick={onClose} className="px-5 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors shadow-sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin"/>}
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [stats, setStats]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatus] = useState('');
  const [typeFilter, setType]   = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewInv, setViewInv]   = useState(null);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit:LIMIT });
      if (search)       p.set('search', search);
      if (statusFilter) p.set('status', statusFilter);
      if (typeFilter)   p.set('type',   typeFilter);
      const d = await fetch(`/api/invoices?${p}`).then(r=>r.json());
      setInvoices(d.invoices||[]);
      setTotal(d.total||0);
      setPages(d.pages||1);
      setStats(d.stats||[]);
    } finally { setLoading(false); }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(()=>{ load(); },[load]);

  async function loadFull(inv) {
    const d = await fetch(`/api/invoices/${inv.id}`).then(r=>r.json());
    return d;
  }

  async function handleEdit(inv) {
    const full = await loadFull(inv);
    setEditing(full); setShowModal(true);
  }

  async function handleView(inv) {
    const full = await loadFull(inv);
    setViewInv(full);
  }

  async function handleDelete(inv) {
    if (!confirm(`Delete invoice ${inv.invoice_no}?`)) return;
    await fetch(`/api/invoices/${inv.id}`, { method:'DELETE' });
    load();
  }

  async function handlePrint(inv) {
    const full = await loadFull(inv);
    printInvoice(full);
  }

  async function markPaid(inv) {
    const today = new Date().toISOString().split('T')[0];
    const full = await loadFull(inv);
    await fetch(`/api/invoices/${inv.id}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...full, status:'paid', payment_date: today })
    });
    load();
  }

  // Stats aggregation
  const totalRevenue = stats.filter(s=>s.status==='paid').reduce((a,b)=>a+parseFloat(b.total_amount||0),0);
  const totalPending = stats.filter(s=>['sent','draft'].includes(s.status)).reduce((a,b)=>a+parseFloat(b.total_amount||0),0);
  const totalOverdue = stats.filter(s=>s.status==='overdue').reduce((a,b)=>a+parseFloat(b.total_amount||0),0);
  const paidCount    = stats.find(s=>s.status==='paid')?.count || 0;

  return (
    <AdminLayout title="Invoices">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices & Billing</h2>
          <p className="text-sm text-slate-500 mt-1">{loading?'Loading…':`${total} invoices · commission, fees & payments`}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={load} className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shadow-sm transition-colors">
            <RefreshCw className="w-4 h-4"/>
          </button>
          <button onClick={()=>{ setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-2xl text-sm transition-colors shadow-md">
            <Plus className="w-4 h-4"/>New Invoice
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign}   label="Total Collected"  value={`$${(totalRevenue/1000).toFixed(1)}k`}  sub={`${paidCount} paid invoices`}      color="emerald"/>
        <StatCard icon={Clock}        label="Pending Amount"   value={`$${(totalPending/1000).toFixed(1)}k`}  sub="Awaiting payment"                   color="blue"/>
        <StatCard icon={AlertTriangle}label="Overdue"          value={`$${(totalOverdue/1000).toFixed(1)}k`}  sub="Past due date"                      color="red"/>
        <StatCard icon={FileText}     label="Total Invoices"   value={total}                                  sub="All time"                           color="slate"/>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}
              onKeyDown={e=>e.key==='Enter'&&load()}
              placeholder="Search by invoice no, recipient, university…"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium placeholder-slate-400"/>
          </div>
          {/* Status pills */}
          <div className="flex gap-1.5 flex-wrap">
            {['','draft','sent','paid','overdue','cancelled'].map(s=>(
              <button key={s} onClick={()=>{ setStatus(s); setPage(1); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all
                  ${statusFilter===s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                {s===''?'All':s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
          {/* Type filter */}
          <div className="relative">
            <select value={typeFilter} onChange={e=>{ setType(e.target.value); setPage(1); }}
              className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer">
              <option value="">All Types</option>
              {Object.entries(TYPE_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"/>
          </div>
          {(search||statusFilter||typeFilter) && (
            <button onClick={()=>{ setSearch(''); setStatus(''); setType(''); setPage(1); }}
              className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-700 px-3 py-2.5 rounded-xl hover:bg-red-50 border border-red-200 transition-colors">
              <X className="w-3.5 h-3.5"/>Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50">
                {['Invoice No','Type','Recipient','Reference','Issue Date','Due Date','Amount','Status','Actions'].map(h=>(
                  <th key={h} className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="py-20 text-center"><Spinner size="lg"/></td></tr>
              ) : invoices.length===0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <FileText className="w-8 h-8 opacity-50"/>
                      </div>
                      <p className="font-semibold text-slate-500">No invoices found</p>
                      <button onClick={()=>{ setEditing(null); setShowModal(true); }}
                        className="flex items-center gap-2 bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
                        <Plus className="w-4 h-4"/>Create First Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ) : invoices.map(inv=>{
                const typeCfg  = TYPE_CFG[inv.type]   || TYPE_CFG.other;
                const recipCfg = RECIP_CFG[inv.recipient_type] || RECIP_CFG.other;
                const RecipIcon = recipCfg.icon;
                const isOverdue = inv.status==='sent' && inv.due_date && new Date(inv.due_date) < new Date();
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Invoice No */}
                    <td className="px-4 py-4">
                      <button onClick={()=>handleView(inv)}
                        className="font-mono text-sm font-bold text-brand-600 hover:underline">{inv.invoice_no}</button>
                    </td>
                    {/* Type */}
                    <td className="px-4 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${typeCfg.color}`}>{typeCfg.label}</span>
                    </td>
                    {/* Recipient */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 ${recipCfg.color} rounded-xl flex items-center justify-center shrink-0`}>
                          <RecipIcon className="w-4 h-4"/>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{inv.recipient_name}</div>
                          <div className="text-xs text-slate-400">{recipCfg.label} · {inv.recipient_email||'—'}</div>
                        </div>
                      </div>
                    </td>
                    {/* Reference (university/program) */}
                    <td className="px-4 py-4">
                      <div className="text-xs text-slate-600 font-medium max-w-[150px]">
                        {inv.university_name || inv.program_name || <span className="text-slate-300">—</span>}
                      </div>
                      {inv.intake && <div className="text-[10px] text-slate-400">{inv.intake}</div>}
                    </td>
                    {/* Issue date */}
                    <td className="px-4 py-4 text-sm text-slate-600 font-medium">
                      {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                    </td>
                    {/* Due date */}
                    <td className="px-4 py-4">
                      <span className={`text-sm font-medium ${isOverdue?'text-red-600 font-bold':inv.due_date?'text-slate-600':'text-slate-300'}`}>
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                      </span>
                    </td>
                    {/* Amount */}
                    <td className="px-4 py-4">
                      <div className="text-base font-bold text-slate-900">{fmt(inv.total, inv.currency)}</div>
                      {parseFloat(inv.discount_amount)>0 && <div className="text-[10px] text-red-400">-{fmt(inv.discount_amount,inv.currency)} disc.</div>}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-4"><StatusBadge status={isOverdue?'overdue':inv.status}/></td>
                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={()=>handleView(inv)} title="View"
                          className="p-2 rounded-lg hover:bg-brand-50 hover:text-brand-600 text-slate-400 transition-colors">
                          <Eye className="w-4 h-4"/>
                        </button>
                        <button onClick={()=>handleEdit(inv)} title="Edit"
                          className="p-2 rounded-lg hover:bg-amber-50 hover:text-amber-600 text-slate-400 transition-colors">
                          <Pencil className="w-4 h-4"/>
                        </button>
                        <button onClick={()=>handlePrint(inv)} title="Download PDF"
                          className="p-2 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 transition-colors">
                          <Download className="w-4 h-4"/>
                        </button>
                        {inv.status!=='paid' && (
                          <button onClick={()=>markPaid(inv)} title="Mark as Paid"
                            className="p-2 rounded-lg hover:bg-green-50 hover:text-green-600 text-slate-400 transition-colors">
                            <CheckCircle className="w-4 h-4"/>
                          </button>
                        )}
                        <button onClick={()=>handleDelete(inv)} title="Delete"
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
        </div>
        {!loading && invoices.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            Showing <span className="font-bold text-slate-700">{invoices.length}</span> of <span className="font-bold text-slate-700">{total}</span> invoices
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">Page {page} of {pages}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white shadow-sm">
              <ChevronLeft className="w-4 h-4 text-slate-600"/>
            </button>
            {Array.from({length:Math.min(5,pages)},(_,i)=>{
              const p=Math.max(1,Math.min(pages-4,page-2))+i;
              return <button key={p} onClick={()=>setPage(p)}
                className={`w-10 h-10 rounded-xl border text-sm font-bold transition-all shadow-sm ${p===page?'bg-brand-700 text-white border-brand-700':'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{p}</button>;
            })}
            <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 bg-white shadow-sm">
              <ChevronRight className="w-4 h-4 text-slate-600"/>
            </button>
          </div>
        </div>
      )}

      {/* VIEW modal (read-only with print) */}
      {viewInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setViewInv(null)}/>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
              <div>
                <div className="font-mono text-base font-bold text-slate-900">{viewInv.invoice_no}</div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={viewInv.status}/>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_CFG[viewInv.type]?.color}`}>{TYPE_CFG[viewInv.type]?.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>{ printInvoice(viewInv); }}
                  className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                  <Download className="w-4 h-4"/>Download PDF
                </button>
                <button onClick={()=>{ setEditing(viewInv); setViewInv(null); setShowModal(true); }}
                  className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
                  <Pencil className="w-4 h-4"/>Edit
                </button>
                <button onClick={()=>setViewInv(null)} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-4 h-4"/></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-7 py-6">
              {/* Recipient */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</div>
                  <div className="font-bold text-slate-900 text-base">{viewInv.recipient_name}</div>
                  {viewInv.recipient_email && <div className="text-sm text-slate-500">{viewInv.recipient_email}</div>}
                  {viewInv.recipient_phone && <div className="text-sm text-slate-500">{viewInv.recipient_phone}</div>}
                  {viewInv.recipient_address && <div className="text-sm text-slate-500">{viewInv.recipient_address}</div>}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Details</div>
                  {[
                    ['Recipient', RECIP_CFG[viewInv.recipient_type]?.label],
                    ['Issue Date', viewInv.issue_date ? new Date(viewInv.issue_date).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}) : '—'],
                    ['Due Date',  viewInv.due_date  ? new Date(viewInv.due_date).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}) : '—'],
                    viewInv.university_name && ['University', viewInv.university_name],
                    viewInv.program_name    && ['Program',    viewInv.program_name],
                    viewInv.intake          && ['Intake',     viewInv.intake],
                  ].filter(Boolean).map(([k,v])=>(
                    <div key={k} className="flex justify-end gap-4 text-sm mb-1">
                      <span className="text-slate-400">{k}</span>
                      <span className="font-semibold text-slate-700 w-40 text-left">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Line items */}
              {(viewInv.items||[]).length > 0 && (
                <table className="w-full mb-5 text-sm">
                  <thead><tr className="border-b-2 border-slate-200 bg-slate-50">
                    {['#','Description','Qty','Unit Price','Amount'].map(h=><th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {(viewInv.items||[]).map((item,i)=>(
                      <tr key={i} className="border-b border-slate-100">
                        <td className="px-3 py-3 text-slate-400">{i+1}</td>
                        <td className="px-3 py-3 font-medium text-slate-800">{item.description}</td>
                        <td className="px-3 py-3 text-slate-600">{item.quantity}</td>
                        <td className="px-3 py-3 text-slate-600">{fmt(item.unit_price, viewInv.currency)}</td>
                        <td className="px-3 py-3 font-bold text-slate-800">{fmt(item.amount, viewInv.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {/* Totals */}
              <div className="ml-auto w-64 space-y-2 mb-5">
                <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span className="font-semibold">{fmt(viewInv.subtotal, viewInv.currency)}</span></div>
                {parseFloat(viewInv.discount_amount)>0 && <div className="flex justify-between text-sm text-red-500"><span>Discount</span><span>−{fmt(viewInv.discount_amount,viewInv.currency)}</span></div>}
                {parseFloat(viewInv.tax_rate)>0 && <div className="flex justify-between text-sm text-slate-600"><span>Tax ({viewInv.tax_rate}%)</span><span>{fmt(viewInv.tax_amount,viewInv.currency)}</span></div>}
                <div className="flex justify-between text-base font-bold text-slate-900 border-t-2 border-slate-200 pt-2">
                  <span>Total</span><span className="text-emerald-700">{fmt(viewInv.total, viewInv.currency)}</span>
                </div>
              </div>
              {/* Payment info */}
              {viewInv.payment_date && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
                  <div className="text-xs font-bold text-emerald-700 mb-1">✓ Payment Received</div>
                  <div className="text-sm text-emerald-800">
                    {new Date(viewInv.payment_date).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}
                    {viewInv.payment_method && ` · ${viewInv.payment_method}`}
                    {viewInv.payment_ref && ` · Ref: ${viewInv.payment_ref}`}
                  </div>
                </div>
              )}
              {viewInv.notes && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</div>
                  <p className="text-sm text-slate-600">{viewInv.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <InvoiceModal open={showModal} editing={editing} onClose={()=>{ setShowModal(false); setEditing(null); }} onSaved={load}/>
    </AdminLayout>
  );
}