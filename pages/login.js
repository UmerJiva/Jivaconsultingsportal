// pages/login.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Eye, EyeOff, GraduationCap, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { fetchUser } from '../lib/auth';

const HINTS = [
  { label: 'Admin',   email: 'admin@eduportal.com',   pass: 'Admin@123'   },
  { label: 'Agent',   email: 'agent@eduportal.com',   pass: 'Agent@123'   },
  { label: 'Student', email: 'student@eduportal.com', pass: 'Student@123' },
];

const STATS = [
  { value: '240+',   label: 'Universities' },
  { value: '1,800+', label: 'Students'     },
  { value: '48',     label: 'Countries'    },
];

// Self-contained — no import dependency that might be stale
function dashboardFor(role) {
  if (role === 'admin')   return '/admin/dashboard';
  if (role === 'agent')   return '/agent/dashboard';
  if (role === 'student') return '/student/dashboard';
  if (role === 'custom')  return '/admin/dashboard';
  return '/admin/dashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUser().then(u => { if (u?.role) router.replace(dashboardFor(u.role)); });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      console.log('[LOGIN] response:', res.status, data);
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      const dest = dashboardFor(data.user?.role);
      console.log('[LOGIN] redirecting to:', dest, 'role:', data.user?.role);
      window.location.href = dest;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Sign In — EduPortal</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <style suppressHydrationWarning>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink:        #0d0f14;
          --ink-soft:   #3d4151;
          --ink-muted:  #7a7f94;
          --line:       rgba(255,255,255,0.10);
          --gold:       #c9a84c;
          --gold-light: #e8cc80;
          --gold-dim:   rgba(201,168,76,0.18);
          --cream:      #f7f4ee;
          --cream-deep: #ede9e0;
          --white:      #ffffff;
          --blue:       #1a3a6b;
          --blue-light: #2554a0;
          --card-bg:    rgba(255,255,255,0.92);
          --shadow-lg:  0 32px 80px rgba(13,15,20,0.28), 0 8px 24px rgba(13,15,20,0.14);
        }

        html, body { height: 100%; }
        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--ink);
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        .page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr;
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 1024px) {
          .page { grid-template-columns: 1fr 520px; }
        }

        .bg {
          position: fixed; inset: 0; z-index: 0;
          background-color: #0b1220;
          background-image: url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1800&q=80");
          background-size: cover;
          background-position: center 30%;
        }
        .bg::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(10,18,40,0.92) 0%, rgba(10,18,40,0.70) 50%, rgba(15,22,48,0.88) 100%);
        }
        .bg::before {
          content: '';
          position: absolute; inset: 0; z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.6;
        }

        .orb {
          position: fixed; border-radius: 50%;
          filter: blur(80px); pointer-events: none; z-index: 1;
          animation: drift 12s ease-in-out infinite alternate;
        }
        .orb1 { width:500px;height:500px;background:radial-gradient(circle,rgba(26,58,107,0.5),transparent 70%);top:-100px;left:-100px; }
        .orb2 { width:400px;height:400px;background:radial-gradient(circle,rgba(201,168,76,0.15),transparent 70%);bottom:-80px;right:480px;animation-delay:-6s; }
        .orb3 { width:300px;height:300px;background:radial-gradient(circle,rgba(37,84,160,0.3),transparent 70%);top:40%;left:30%;animation-delay:-3s; }
        @keyframes drift { from{transform:translate(0,0) scale(1);}to{transform:translate(30px,20px) scale(1.08);} }

        .left {
          position: relative; z-index: 2;
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 52px 56px;
        }
        @media (min-width: 1024px) { .left { display: flex; } }

        .left-logo   { opacity:0;animation:fadeUp 0.6s 0.1s ease forwards; }
        .left-body   { opacity:0;animation:fadeUp 0.7s 0.25s ease forwards; }
        .left-stats  { opacity:0;animation:fadeUp 0.7s 0.40s ease forwards; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);} }

        .left-logo { display:flex;align-items:center;gap:12px; }
        .left-logo-icon {
          width:42px;height:42px;
          background:linear-gradient(135deg,var(--gold),#a8711d);
          border-radius:11px;display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 16px rgba(201,168,76,0.35);
        }
        .left-logo-name { font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:500;color:var(--white);letter-spacing:0.02em; }

        .left-body { max-width:420px; }
        .left-tag {
          display:inline-flex;align-items:center;gap:7px;
          font-size:0.68rem;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;
          color:var(--gold-light);margin-bottom:22px;
        }
        .left-tag::before { content:'';width:28px;height:1px;background:var(--gold);display:inline-block; }
        .left-headline {
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(2.4rem,3.5vw,3.2rem);font-weight:300;line-height:1.15;
          color:var(--white);margin-bottom:22px;letter-spacing:-0.01em;
        }
        .left-headline em { font-style:italic;color:var(--gold-light); }
        .left-desc { font-size:0.9rem;line-height:1.85;color:rgba(255,255,255,0.5);max-width:340px;font-weight:300; }

        .left-badge {
          display:inline-flex;align-items:center;gap:8px;margin-top:32px;
          background:rgba(201,168,76,0.10);border:1px solid rgba(201,168,76,0.25);
          border-radius:100px;padding:8px 16px;
        }
        .badge-dot { width:6px;height:6px;border-radius:50%;background:#4ade80;flex-shrink:0;box-shadow:0 0 6px #4ade80; }
        .badge-text { font-size:0.75rem;color:rgba(255,255,255,0.65);font-family:'DM Mono',monospace; }

        .left-stats {
          border-top:1px solid rgba(255,255,255,0.08);padding-top:32px;
          display:grid;grid-template-columns:repeat(3,1fr);gap:0;
        }
        .stat { padding:0 24px 0 0;border-right:1px solid rgba(255,255,255,0.08); }
        .stat:last-child { border-right:none; }
        .stat:not(:first-child) { padding-left:24px; }
        .stat-val { font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:500;color:var(--white);display:block;line-height:1; }
        .stat-lbl { font-size:0.71rem;color:rgba(255,255,255,0.38);margin-top:5px;display:block;text-transform:uppercase;letter-spacing:0.08em; }

        .right {
          position:relative;z-index:2;
          display:flex;align-items:center;justify-content:center;
          padding:28px 20px;background:transparent;
        }
        @media (min-width:1024px) {
          .right { background:rgba(5,10,22,0.4);backdrop-filter:blur(2px);border-left:1px solid rgba(255,255,255,0.06); }
        }

        .card {
          width:100%;max-width:440px;
          background:var(--card-bg);backdrop-filter:blur(20px);
          border-radius:20px;border:1px solid rgba(255,255,255,0.6);
          padding:44px 40px 36px;box-shadow:var(--shadow-lg);
          opacity:0;animation:cardIn 0.65s 0.15s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes cardIn { from{opacity:0;transform:translateY(24px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);} }
        .card::before {
          content:'';display:block;height:2px;width:48px;
          background:linear-gradient(90deg,var(--gold),var(--gold-light));
          border-radius:2px;margin-bottom:28px;
        }

        .mobile-logo { display:flex;align-items:center;gap:9px;margin-bottom:24px; }
        @media (min-width:1024px) { .mobile-logo { display:none; } }
        .mobile-logo-icon {
          width:34px;height:34px;background:linear-gradient(135deg,var(--gold),#a8711d);
          border-radius:8px;display:flex;align-items:center;justify-content:center;
          box-shadow:0 3px 10px rgba(201,168,76,0.35);
        }
        .mobile-logo-name { font-family:'Cormorant Garamond',serif;font-size:1.25rem;font-weight:500;color:var(--ink); }

        .card-heading { font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:400;color:var(--ink);margin-bottom:4px;line-height:1.1; }
        .card-sub { font-size:0.83rem;color:var(--ink-muted);margin-bottom:28px;font-weight:300; }

        .demo-label { font-size:0.67rem;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:9px; }
        .demo-row { display:flex;gap:8px;margin-bottom:22px; }
        .demo-btn {
          flex:1;padding:9px 6px;border:1px solid var(--cream-deep);border-radius:9px;
          background:var(--cream);font-family:'DM Sans',sans-serif;font-size:0.78rem;
          font-weight:500;color:var(--ink-soft);cursor:pointer;transition:all 0.18s ease;letter-spacing:0.01em;
        }
        .demo-btn:hover { border-color:var(--gold);background:rgba(201,168,76,0.07);color:#8a5e10;box-shadow:0 0 0 2px rgba(201,168,76,0.12); }

        .divider {
          display:flex;align-items:center;gap:12px;margin-bottom:22px;
          font-size:0.7rem;letter-spacing:0.06em;color:var(--ink-muted);text-transform:uppercase;
        }
        .divider::before,.divider::after { content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--cream-deep),transparent); }

        .field { margin-bottom:15px; }
        .field-label { display:block;font-size:0.78rem;font-weight:500;color:var(--ink-soft);margin-bottom:6px;letter-spacing:0.01em; }
        .input-wrap { position:relative; }
        .input-icon { position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--ink-muted);display:flex;pointer-events:none; }
        .input {
          width:100%;height:44px;padding:0 14px 0 40px;
          border:1.5px solid var(--cream-deep);border-radius:10px;
          font-family:'DM Sans',sans-serif;font-size:0.875rem;color:var(--ink);background:var(--cream);outline:none;transition:all 0.18s ease;
        }
        .input:focus { border-color:var(--gold);background:#fff;box-shadow:0 0 0 3px rgba(201,168,76,0.14); }
        .input::placeholder { color:#bbb8b0; }
        .eye-btn {
          position:absolute;right:11px;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;color:var(--ink-muted);
          display:flex;padding:4px;border-radius:4px;transition:color 0.15s;
        }
        .eye-btn:hover { color:var(--ink); }

        .error-box {
          display:flex;align-items:center;gap:8px;
          background:#fff5f5;border:1.5px solid #fecaca;color:#c0392b;
          font-size:0.8rem;border-radius:9px;padding:10px 13px;margin-bottom:14px;font-weight:400;
        }

        .submit-btn {
          width:100%;height:46px;
          background:linear-gradient(135deg,var(--blue) 0%,var(--blue-light) 100%);
          color:#fff;border:none;border-radius:11px;
          font-family:'DM Sans',sans-serif;font-size:0.9rem;font-weight:500;
          cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;
          margin-top:8px;transition:all 0.2s ease;letter-spacing:0.02em;
          position:relative;overflow:hidden;box-shadow:0 4px 18px rgba(26,58,107,0.35);
        }
        .submit-btn::before { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.12),transparent);opacity:0;transition:opacity 0.2s; }
        .submit-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 8px 28px rgba(26,58,107,0.45); }
        .submit-btn:hover:not(:disabled)::before { opacity:1; }
        .submit-btn:active:not(:disabled) { transform:translateY(0); }
        .submit-btn:disabled { opacity:0.5;cursor:not-allowed; }

        .spinner { width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.65s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg);} }

        .card-footer { text-align:center;font-size:0.69rem;color:var(--ink-muted);margin-top:24px;letter-spacing:0.03em; }
        .card-footer span { display:inline-block;margin:0 6px;color:var(--cream-deep); }
      `}</style>

      <div className="page">
        <div className="bg" />
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />

        {/* LEFT */}
        <div className="left">
          <div className="left-logo">
            <div className="left-logo-icon"><GraduationCap size={20} color="#fff" /></div>
            <span className="left-logo-name">EduPortal</span>
          </div>
          <div className="left-body">
            <div className="left-tag">Education Management</div>
            <h1 className="left-headline">The smarter way<br />to manage <em>global</em><br />education</h1>
            <p className="left-desc">One unified platform for admins, agents, and students — purpose-built to simplify university admissions across the world.</p>
            <div className="left-badge">
              <span className="badge-dot" />
              <span className="badge-text">240+ institutions currently active</span>
            </div>
          </div>
          <div className="left-stats">
            {STATS.map(s=>(
              <div className="stat" key={s.label}>
                <span className="stat-val">{s.value}</span>
                <span className="stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="right">
          <div className="card">
            <div className="mobile-logo">
              <div className="mobile-logo-icon"><GraduationCap size={17} color="#fff" /></div>
              <span className="mobile-logo-name">EduPortal</span>
            </div>

            <h2 className="card-heading">Welcome back</h2>
            <p className="card-sub">Sign in to continue to your portal</p>

            <p className="demo-label">Quick demo access</p>
            <div className="demo-row">
              {HINTS.map(h=>(
                <button key={h.label} className="demo-btn"
                  onClick={()=>{ setForm({email:h.email,password:h.pass}); setError(''); }}>
                  {h.label}
                </button>
              ))}
            </div>

            <div className="divider">or continue with email</div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="field-label">Email address</label>
                <div className="input-wrap">
                  <span className="input-icon"><Mail size={15} /></span>
                  <input className="input" type="email" required placeholder="you@example.com"
                    value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <span className="input-icon"><Lock size={15} /></span>
                  <input className="input" type={showPass?'text':'password'} required placeholder="••••••••"
                    value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
                  <button type="button" className="eye-btn" onClick={()=>setShowPass(s=>!s)}>
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-box">
                  <AlertCircle size={14} style={{flexShrink:0}} />
                  {error}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading
                  ? <span className="spinner"/>
                  : <><span>Sign in to EduPortal</span><ArrowRight size={15}/></>}
              </button>
            </form>

            <p className="card-footer">© 2025 EduPortal <span>·</span> All rights reserved</p>
          </div>
        </div>
      </div>
    </>
  );
}