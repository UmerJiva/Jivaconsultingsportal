// pages/admin/settings.js — Full settings page
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  Settings, Bell, Shield, Globe, Save, CheckCircle, AlertCircle,
  Loader2, GraduationCap, Building2, Mail, Phone, Clock,
  Key, RefreshCw, Database, Palette, FileText, ToggleLeft, ToggleRight
} from 'lucide-react';

const inp   = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white placeholder-slate-300 transition-colors font-medium";
const sel   = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-700 transition-colors font-medium";

function FL({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ value, onChange, label, desc }) {
  const on = value === '1' || value === true;
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <div className="text-sm font-semibold text-slate-700">{label}</div>
        {desc && <div className="text-xs text-slate-400 mt-0.5">{desc}</div>}
      </div>
      <button onClick={() => onChange(on ? '0' : '1')}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${on ? 'bg-emerald-500' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${on ? 'translate-x-6' : 'translate-x-0'}`}/>
      </button>
    </div>
  );
}

function SectionCard({ icon: Icon, title, desc, color = 'emerald', children, onSave, saving, saved, error }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue:    'bg-blue-50 text-blue-600',
    purple:  'bg-purple-50 text-purple-600',
    amber:   'bg-amber-50 text-amber-600',
    red:     'bg-red-50 text-red-600',
    slate:   'bg-slate-100 text-slate-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-start gap-4 px-6 py-5 border-b border-slate-100">
        <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5"/>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">
        {children}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0"/>{error}
          </div>
        )}
        {onSave && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-4">
            {saved && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                <CheckCircle className="w-4 h-4"/>Saved successfully!
              </div>
            )}
            <button onClick={onSave} disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 ml-auto shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// LOGO ICONS available
const LOGO_ICONS = [
  { key:'GraduationCap', label:'Graduation Cap', icon: GraduationCap },
  { key:'Building2',     label:'Building',       icon: Building2     },
  { key:'Globe',         label:'Globe',           icon: Globe         },
  { key:'BookOpen',      label:'Book',            icon: Database      },
  { key:'Shield',        label:'Shield',          icon: Shield        },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading]   = useState(true);

  // Per-section saving state
  const [state, setState] = useState({});
  function sec(key) { return { saving: state[key+'_saving'], saved: state[key+'_saved'], error: state[key+'_error'] }; }
  function setS(key, patch) { setState(s => ({ ...s, ...Object.fromEntries(Object.entries(patch).map(([k,v])=>[key+'_'+k,v])) })); }

  useEffect(() => {
    fetch('/api/settings').then(r=>r.json()).then(d => {
      setSettings(d.settings || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function set(k, v) { setSettings(s => ({ ...s, [k]: v })); }

  async function save(section, keys) {
    setS(section, { saving:true, saved:false, error:'' });
    try {
      const payload = {};
      keys.forEach(k => { payload[k] = settings[k] ?? ''; });
      const r = await fetch('/api/settings', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setS(section, { saving:false, saved:true, error:'' });
      setTimeout(() => setS(section, { saved:false }), 3000);
      // Refresh page branding
      window.dispatchEvent(new CustomEvent('settings-updated', { detail: payload }));
    } catch(e) {
      setS(section, { saving:false, error:e.message });
    }
  }

  if (loading) return (
    <AdminLayout title="Settings">
      <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400"/></div>
    </AdminLayout>
  );

  const selectedIcon = LOGO_ICONS.find(i => i.key === (settings.portal_logo_icon || 'GraduationCap')) || LOGO_ICONS[0];

  return (
    <AdminLayout title="Settings">

      {/* Header */}
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your portal configuration and preferences</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* ── General / Branding ── */}
        <SectionCard icon={Palette} title="General & Branding" color="emerald"
          desc="Portal name, logo, tagline and appearance"
          onSave={() => save('general', ['portal_name','portal_tagline','portal_logo_icon','portal_color','footer_text'])}
          {...sec('general')}>

          <div className="grid grid-cols-2 gap-4">
            <FL label="Portal Name" hint="Shown in the sidebar and browser tab">
              <input className={inp} value={settings.portal_name||''} onChange={e=>set('portal_name',e.target.value)} placeholder="EduPortal"/>
            </FL>
            <FL label="Tagline" hint="Sub-text below the portal name">
              <input className={inp} value={settings.portal_tagline||''} onChange={e=>set('portal_tagline',e.target.value)} placeholder="Management System"/>
            </FL>
          </div>

          <FL label="Logo Icon" hint="Icon shown in the sidebar header">
            <div className="flex gap-2 flex-wrap mt-1">
              {LOGO_ICONS.map(icon => {
                const selected = (settings.portal_logo_icon || 'GraduationCap') === icon.key;
                return (
                  <button key={icon.key} onClick={() => set('portal_logo_icon', icon.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <icon.icon className={`w-6 h-6 ${selected ? 'text-emerald-600' : 'text-slate-500'}`}/>
                    <span className={`text-[10px] font-bold ${selected ? 'text-emerald-700' : 'text-slate-400'}`}>{icon.label}</span>
                  </button>
                );
              })}
            </div>
          </FL>

          <FL label="Accent Color" hint="Primary color used throughout the portal">
            <div className="flex items-center gap-3">
              <input type="color" value={settings.portal_color||'#059669'}
                onChange={e=>set('portal_color',e.target.value)}
                className="w-12 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"/>
              <input className={inp} value={settings.portal_color||'#059669'}
                onChange={e=>set('portal_color',e.target.value)} placeholder="#059669"/>
            </div>
          </FL>

          <FL label="Footer Text">
            <input className={inp} value={settings.footer_text||''} onChange={e=>set('footer_text',e.target.value)} placeholder="© 2025 EduPortal. All rights reserved."/>
          </FL>
        </SectionCard>

        {/* ── Regional ── */}
        <SectionCard icon={Globe} title="Regional & Locale" color="blue"
          desc="Timezone, language, date format and currency"
          onSave={() => save('regional', ['timezone','language','date_format','currency'])}
          {...sec('regional')}>

          <div className="grid grid-cols-2 gap-4">
            <FL label="Timezone">
              <select className={sel} value={settings.timezone||'Asia/Karachi'} onChange={e=>set('timezone',e.target.value)}>
                {[
                  'Asia/Karachi', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Dhaka',
                  'Europe/London', 'Europe/Berlin', 'America/New_York',
                  'America/Los_Angeles', 'Australia/Sydney', 'Asia/Singapore',
                ].map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </FL>
            <FL label="Language">
              <select className={sel} value={settings.language||'en'} onChange={e=>set('language',e.target.value)}>
                {[['en','English'],['ar','Arabic'],['tr','Turkish'],['ur','Urdu'],['fr','French'],['de','German']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </FL>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FL label="Date Format">
              <select className={sel} value={settings.date_format||'DD/MM/YYYY'} onChange={e=>set('date_format',e.target.value)}>
                {['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD','DD MMM YYYY'].map(f=><option key={f}>{f}</option>)}
              </select>
            </FL>
            <FL label="Default Currency">
              <select className={sel} value={settings.currency||'USD'} onChange={e=>set('currency',e.target.value)}>
                {['USD','GBP','EUR','AUD','CAD','PKR','AED','INR'].map(c=><option key={c}>{c}</option>)}
              </select>
            </FL>
          </div>
        </SectionCard>

        {/* ── Email / SMTP ── */}
        <SectionCard icon={Mail} title="Email Configuration" color="purple"
          desc="SMTP settings for sending emails from the portal"
          onSave={() => save('email', ['email_from','email_from_name','smtp_host','smtp_port','smtp_user','smtp_pass'])}
          {...sec('email')}>

          <div className="grid grid-cols-2 gap-4">
            <FL label="From Name">
              <input className={inp} value={settings.email_from_name||''} onChange={e=>set('email_from_name',e.target.value)} placeholder="EduPortal"/>
            </FL>
            <FL label="From Email">
              <input type="email" className={inp} value={settings.email_from||''} onChange={e=>set('email_from',e.target.value)} placeholder="noreply@eduportal.com"/>
            </FL>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <FL label="SMTP Host">
                <input className={inp} value={settings.smtp_host||''} onChange={e=>set('smtp_host',e.target.value)} placeholder="smtp.gmail.com"/>
              </FL>
            </div>
            <FL label="SMTP Port">
              <input type="number" className={inp} value={settings.smtp_port||'587'} onChange={e=>set('smtp_port',e.target.value)} placeholder="587"/>
            </FL>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FL label="SMTP Username">
              <input className={inp} value={settings.smtp_user||''} onChange={e=>set('smtp_user',e.target.value)} placeholder="user@gmail.com"/>
            </FL>
            <FL label="SMTP Password">
              <input type="password" className={inp} value={settings.smtp_pass||''} onChange={e=>set('smtp_pass',e.target.value)} placeholder="••••••••"/>
            </FL>
          </div>
        </SectionCard>

        {/* ── Notifications ── */}
        <SectionCard icon={Bell} title="Notifications" color="amber"
          desc="Control which events trigger email notifications"
          onSave={() => save('notif', ['notify_new_app','notify_status_change','notify_new_student'])}
          {...sec('notif')}>

          <Toggle
            value={settings.notify_new_app}
            onChange={v => set('notify_new_app', v)}
            label="New Application"
            desc="Send email when a new application is submitted"/>
          <Toggle
            value={settings.notify_status_change}
            onChange={v => set('notify_status_change', v)}
            label="Application Status Change"
            desc="Send email when an application status is updated"/>
          <Toggle
            value={settings.notify_new_student}
            onChange={v => set('notify_new_student', v)}
            label="New Student Registered"
            desc="Send email when a new student account is created"/>

          <FL label="SMS Provider" hint="Leave blank to disable SMS notifications">
            <select className={sel} value={settings.sms_provider||''} onChange={e=>set('sms_provider',e.target.value)}>
              <option value="">Disabled</option>
              {['Twilio','Telesign','Nexmo','MSG91'].map(p=><option key={p}>{p}</option>)}
            </select>
          </FL>
          {settings.sms_provider && (
            <FL label="SMS API Key">
              <input className={inp} value={settings.sms_api_key||''} onChange={e=>set('sms_api_key',e.target.value)} placeholder="API key"/>
            </FL>
          )}
        </SectionCard>

        {/* ── Security ── */}
        <SectionCard icon={Shield} title="Security" color="red"
          desc="Password policy, session timeout and access control"
          onSave={() => save('security', ['min_password_len','session_timeout','require_2fa','maintenance_mode'])}
          {...sec('security')}>

          <div className="grid grid-cols-2 gap-4">
            <FL label="Min Password Length" hint="Minimum characters required">
              <input type="number" className={inp} min="6" max="32" value={settings.min_password_len||'8'} onChange={e=>set('min_password_len',e.target.value)}/>
            </FL>
            <FL label="Session Timeout (minutes)" hint="Auto-logout after inactivity">
              <select className={sel} value={settings.session_timeout||'60'} onChange={e=>set('session_timeout',e.target.value)}>
                {['15','30','60','120','240','480','0'].map(v=><option key={v} value={v}>{v==='0'?'Never':`${v} min`}</option>)}
              </select>
            </FL>
          </div>

          <Toggle
            value={settings.require_2fa}
            onChange={v => set('require_2fa', v)}
            label="Require Two-Factor Authentication"
            desc="Force all admin accounts to enable 2FA"/>
          <Toggle
            value={settings.maintenance_mode}
            onChange={v => set('maintenance_mode', v)}
            label="Maintenance Mode"
            desc="Show maintenance page to non-admin users"/>
        </SectionCard>

        {/* ── Integrations ── */}
        <SectionCard icon={Globe} title="Integrations" color="slate"
          desc="Connect third-party CRM, analytics and communication tools"
          onSave={() => save('integrations', ['crm_provider','crm_api_key'])}
          {...sec('integrations')}>

          <FL label="CRM Provider">
            <select className={sel} value={settings.crm_provider||''} onChange={e=>set('crm_provider',e.target.value)}>
              <option value="">None</option>
              {['Salesforce','HubSpot','Zoho','Pipedrive','Monday'].map(p=><option key={p}>{p}</option>)}
            </select>
          </FL>

          {settings.crm_provider && (
            <FL label="CRM API Key">
              <input className={inp} value={settings.crm_api_key||''} onChange={e=>set('crm_api_key',e.target.value)} placeholder="API key or access token"/>
            </FL>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Configuration</p>
            <div className="space-y-1.5">
              {[
                ['Portal Name',  settings.portal_name || 'EduPortal'],
                ['Timezone',     settings.timezone || 'Asia/Karachi'],
                ['Currency',     settings.currency || 'USD'],
                ['CRM',          settings.crm_provider || 'Not connected'],
                ['SMS',          settings.sms_provider || 'Disabled'],
              ].map(([k,v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">{k}</span>
                  <span className="font-bold text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

      </div>

      {/* Danger zone */}
      <div className="mt-5 bg-red-50 border border-red-200 rounded-2xl p-6">
        <h3 className="font-bold text-red-700 mb-1 flex items-center gap-2"><AlertCircle className="w-5 h-5"/>Danger Zone</h3>
        <p className="text-sm text-red-500 mb-4">These actions are irreversible. Proceed with caution.</p>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-300 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors">
            <RefreshCw className="w-4 h-4"/>Reset All Settings to Default
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-300 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors">
            <Database className="w-4 h-4"/>Clear All Cache
          </button>
        </div>
      </div>

    </AdminLayout>
  );
}