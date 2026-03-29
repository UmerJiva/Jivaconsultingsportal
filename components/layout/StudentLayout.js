// components/layout/StudentLayout.js
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GraduationCap, ChevronDown, LogOut, Bell, Menu, X, LayoutDashboard, User, FileText, Building2 } from 'lucide-react';
import { fetchUser } from '../../lib/auth';
import { Spinner } from '../ui/index';

const NAV_LINKS = [
  { label: 'Dashboard',    href: '/student/dashboard'    },
  { label: 'My Profile',   href: '/student/profile'      },
  { label: 'Applications', href: '/student/applications' },
  { label: 'Universities', href: '/student/universities' },
];

export default function StudentLayout({ children }) {
  const router  = useRouter();
  const dropRef = useRef(null);
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dropOpen, setDropOpen]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);

  useEffect(() => {
    fetchUser().then(u => {
      if (!u) { router.replace('/login'); return; }
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    function h(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f4ff] flex flex-col">
      {/* Top navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          {/* Logo */}
          <Link href="/student/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-brand-700 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-brand-800 text-lg" style={{fontFamily:'Georgia,serif'}}>EduPortal</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(link => {
              const active = router.pathname === link.href;
              return (
                <Link key={link.href} href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
                    ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-brand-700 hover:bg-slate-50'}`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            <div className="relative" ref={dropRef}>
              <button onClick={() => setDropOpen(d => !d)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.avatar || '?'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name?.split(' ')[0]}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <div className="text-sm font-bold text-slate-800">{user?.name}</div>
                    <div className="text-xs text-slate-400">{user?.email}</div>
                  </div>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu */}
            <button className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500"
              onClick={() => setMobileOpen(m => !m)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${router.pathname === link.href ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white mt-8">
        © 2025 EduPortal. All rights reserved.
      </footer>
    </div>
  );
}