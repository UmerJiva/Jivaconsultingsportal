// components/ui/index.js

export function StatCard({ icon: Icon, label, value, change, color = 'brand', loading = false }) {
  const colors = {
    brand:  { bg: 'bg-brand-50',   text: 'text-brand-600',   icon: 'bg-brand-100'  },
    gold:   { bg: 'bg-amber-50',   text: 'text-amber-600',   icon: 'bg-amber-100'  },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100'},
    purple: { bg: 'bg-purple-50',  text: 'text-purple-600',  icon: 'bg-purple-100' },
    red:    { bg: 'bg-red-50',     text: 'text-red-600',     icon: 'bg-red-100'    },
  };
  const c = colors[color] || colors.brand;
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      {loading
        ? <div className="h-7 w-16 bg-slate-100 rounded animate-pulse mb-1" />
        : <div className="text-2xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>{value}</div>
      }
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    'Active':        'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Pending':       'bg-amber-50   text-amber-700   border-amber-200',
    'Inactive':      'bg-slate-100  text-slate-600   border-slate-200',
    'Suspended':     'bg-red-50     text-red-600     border-red-200',
    'Rejected':      'bg-red-50     text-red-600     border-red-200',
    'Withdrawn':     'bg-slate-100  text-slate-500   border-slate-200',
    'Partner':       'bg-brand-50   text-brand-700   border-brand-200',
    'Accepted':      'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Enrolled':      'bg-brand-50   text-brand-700   border-brand-200',
    'Graduated':     'bg-purple-50  text-purple-700  border-purple-200',
    'Offer Received':'bg-blue-50    text-blue-700    border-blue-200',
    'Under Review':  'bg-amber-50   text-amber-700   border-amber-200',
    'Conditional':   'bg-purple-50  text-purple-700  border-purple-200',
    'Submitted':     'bg-sky-50     text-sky-700     border-sky-200',
    'Draft':         'bg-slate-50   text-slate-500   border-slate-200',
  };
  const cls = map[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {status}
    </span>
  );
}

export function Avatar({ initials = '?', size = 'md', color = 'brand' }) {
  const sizes  = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const colors = { brand: 'bg-brand-600', gold: 'bg-amber-500', slate: 'bg-slate-500', purple: 'bg-purple-500' };
  return (
    <div className={`${sizes[size]} ${colors[color]||'bg-brand-600'} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {(initials||'?').slice(0,2).toUpperCase()}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return <div className={`${s[size]} border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin`} />;
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <p className="font-semibold text-slate-700 mb-1">{title}</p>
      {description && <p className="text-sm text-slate-400 max-w-xs">{description}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function FormField({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
        bg-white placeholder-slate-400 transition ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
        bg-white text-slate-700 transition ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Btn({ variant = 'primary', className = '', loading, children, ...props }) {
  const variants = {
    primary:  'bg-brand-700 hover:bg-brand-800 text-white shadow-sm',
    secondary:'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
    danger:   'bg-red-600 hover:bg-red-700 text-white',
    ghost:    'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />}
      {children}
    </button>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative flex-1 min-w-48 max-w-sm">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
    </div>
  );
}

export function Pagination({ total, limit, offset, onChange }) {
  const page  = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
      <span>Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}</span>
      <div className="flex gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition">
          ‹ Prev
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = Math.max(1, Math.min(pages - 4, page - 2)) + i;
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`px-3 py-1.5 rounded-lg border transition ${p === page ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-200 hover:bg-slate-50'}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onChange(page + 1)} disabled={page >= pages}
          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition">
          Next ›
        </button>
      </div>
    </div>
  );
}
