// components/layout/AdminLayout.js — White sidebar, green accents, collapsible (icons-only mode)
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  GraduationCap, LayoutDashboard, Users, Building2, UserCheck, MessageSquare,
  FileText, Settings, LogOut, Bell, Menu, X, ChevronDown, ChevronLeft,
  Receipt, Shield,
  TrendingUp, ChevronRight, BookOpen, Home, Search, CheckCircle, PanelLeftClose, PanelLeftOpen, HelpCircle,
  UserCog, Users2, Hotel, Inbox
} from 'lucide-react';
import { fetchUser } from '../../lib/auth';
import { Spinner } from '../ui/index';

// ── Navigation config ─────────────────────────────────────────
const NAV = {
  admin: [
    {
      group: 'Main',
      items: [
        { label: 'Dashboard',    href: '/admin/dashboard',    icon: LayoutDashboard },
        { label: 'Students',     href: '/admin/students',     icon: Users           },
        { label: 'Universities', href: '/admin/universities', icon: Building2,
          activeOn: ['/admin/universities', '/admin/university'] },
        { label: 'Programs',     href: '/admin/programs',     icon: BookOpen,
          activeOn: ['/admin/programs', '/admin/program'] },
        { label: 'Agents',       href: '/admin/agents',       icon: UserCheck,
          activeOn: ['/admin/agents', '/admin/agent'] },
        { label: 'Applications', href: '/admin/applications', icon: FileText,
          activeOn: ['/admin/applications', '/admin/application'] },
      ],
    },
    {
      group: 'System',
      items: [
        { label: 'Domitories',           href: '/admin/hotels',            icon: Hotel,      activeOn: ['/admin/hotels', '/admin/hotels/'] },
        { label: 'Dorm Applications',href: '/admin/dorm-applications', icon: Home,       activeOn: ['/admin/dorm-applications'] },
        { label: 'Leads',            href: '/admin/leads',             icon: Inbox,      activeOn: ['/admin/leads'] },
        { label: 'Employees',        href: '/admin/employees',         icon: Users2     },
        { label: 'Invoices',         href: '/admin/invoices',          icon: Receipt    },
        { label: 'Roles',            href: '/admin/roles',             icon: Shield     },
        { label: 'Reports',          href: '/admin/reports',           icon: TrendingUp },
        { label: 'Questions',        href: '/admin/questions',         icon: HelpCircle },
        { label: 'Settings',         href: '/admin/settings',          icon: Settings   },
      ],
    },
  ],
  agent: [
    {
      group: 'Menu',
      items: [
        { label: 'Dashboard',        href: '/agent/dashboard',         icon: LayoutDashboard },
        { label: 'My Students',      href: '/agent/students',          icon: Users,
          activeOn: ['/agent/students', '/agent/student'] },
        { label: 'My Team',          href: '/agent/team',              icon: Users2,
          activeOn: ['/agent/team'] },
        { label: 'My Tasks',         href: '/agent/tasks',             icon: CheckCircle,
          activeOn: ['/agent/tasks'] },
        { label: 'Programs',         href: '/agent/universities',      icon: BookOpen,
          activeOn: ['/agent/universities', '/agent/university', '/agent/program'] },
        { label: 'Chat with Admin',  href: '/agent/chat',              icon: MessageSquare,
          activeOn: ['/agent/chat'] },
        { label: 'Applications',     href: '/agent/applications',      icon: FileText,
          activeOn: ['/agent/applications', '/agent/application'] },
        { label: 'Dormitories',      href: '/agent/dormitories',       icon: Building2,
          activeOn: ['/agent/dormitories'] },
        { label: 'Dorm Applications',href: '/agent/dorm-applications', icon: Home,
          activeOn: ['/agent/dorm-applications'] },
      ],
    },
  ],
  student: [
    {
      group: 'Menu',
      items: [
        { label: 'Dashboard',        href: '/student/dashboard',         icon: LayoutDashboard },
        { label: 'My Profile',       href: '/student/profile',           icon: Users           },
        { label: 'Programs',         href: '/student/universities',      icon: BookOpen,
          activeOn: ['/student/universities', '/student/university', '/student/program'] },
        { label: 'Applications',     href: '/student/applications',      icon: FileText        },
        { label: 'Dormitories',      href: '/student/dormitories',       icon: Building2,
          activeOn: ['/student/dormitories'] },
        { label: 'Dorm Applications',href: '/student/dorm-applications', icon: Home,
          activeOn: ['/student/dorm-applications'] },
      ],
    },
  ],

  // ── Admin Employee ──
  admin_employee: [
    {
      group: 'Menu',
      items: [
        { label: 'Dashboard',    href: '/admin-employee/dashboard',    icon: LayoutDashboard },
        { label: 'My Agent',     href: '/admin-employee/agent',        icon: UserCheck       },
        { label: 'Students',     href: '/admin-employee/students',     icon: Users,
          activeOn: ['/admin-employee/students', '/admin-employee/student'] },
        { label: 'Applications', href: '/admin-employee/applications', icon: FileText,
          activeOn: ['/admin-employee/applications'] },
        { label: 'Tasks',        href: '/admin-employee/tasks',        icon: CheckCircle,
          activeOn: ['/admin-employee/tasks'] },
        { label: 'Chat',         href: '/admin-employee/chat',         icon: MessageSquare,
          activeOn: ['/admin-employee/chat'] },
      ],
    },
  ],

  // ── Agent Employee — uses SAME pages as agent, permissions control access ──
  agent_employee: [
    {
      group: 'Menu',
      items: [
        { label: 'Dashboard',        href: '/agent/dashboard',         icon: LayoutDashboard },
        { label: 'My Students',      href: '/agent/students',          icon: Users,
          activeOn: ['/agent/students', '/agent/student'] },
        { label: 'Applications',     href: '/agent/applications',      icon: FileText,
          activeOn: ['/agent/applications'] },
        { label: 'Programs',         href: '/agent/universities',      icon: BookOpen,
          activeOn: ['/agent/universities', '/agent/university', '/agent/program'] },
        { label: 'Dormitories',      href: '/agent/dormitories',       icon: Building2,
          activeOn: ['/agent/dormitories'] },
        { label: 'Dorm Applications',href: '/agent/dorm-applications', icon: Home,
          activeOn: ['/agent/dorm-applications'] },
        { label: 'Chat with Agent',  href: '/agent/chat',              icon: MessageSquare,
          activeOn: ['/agent/chat'] },
      ],
    },
  ],
};

const ROLE_CONFIG = {
  admin:          { label: 'Administrator',   dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
  agent:          { label: 'Agent',           dot: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700'     },
  student:        { label: 'Student',         dot: 'bg-sky-400',     badge: 'bg-sky-100 text-sky-700'         },
  custom:         { label: 'Staff',           dot: 'bg-violet-400',  badge: 'bg-violet-100 text-violet-700'   },
  admin_employee: { label: 'Admin Employee',  dot: 'bg-blue-400',    badge: 'bg-blue-100 text-blue-700'       },
  agent_employee: { label: 'Agent Employee',  dot: 'bg-teal-400',    badge: 'bg-teal-100 text-teal-700'       },
};

const ALLOWED_ROLES = ['admin', 'agent', 'student', 'custom', 'admin_employee', 'agent_employee'];

export default function AdminLayout({ children, title = 'Dashboard' }) {
  const router  = useRouter();
  const dropRef = useRef(null);

  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [dropOpen, setDropOpen]       = useState(false);
  const [portalSettings, setPortalSettings] = useState({
    portal_name: 'EduPortal',
    portal_tagline: 'Management System',
  });

  useEffect(() => {
    fetchUser().then(u => {
      if (!u || !ALLOWED_ROLES.includes(u.role)) {
        router.replace('/login');
        return;
      }
      setUser(u);
      setAuthLoading(false);
    });
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.settings) setPortalSettings(d.settings);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  function isActive(item) {
    const path = router.pathname;
    if (item.activeOn) {
      return item.activeOn.some(prefix =>
        path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '[')
      );
    }
    return path === item.href || path.startsWith(item.href + '/') || path.startsWith(item.href + '[');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Build nav groups ──────────────────────────────────────────
  const navGroups = (() => {
    if (user?.role === 'custom') {
      const perms = user.permissions || {};
      const ALL_ITEMS = [
        { label: 'Dashboard',        href: '/admin/dashboard',         icon: LayoutDashboard, module: 'dashboard'    },
        { label: 'Students',         href: '/admin/students',          icon: Users,           module: 'students',     activeOn: ['/admin/students', '/admin/student']         },
        { label: 'Universities',     href: '/admin/universities',      icon: Building2,       module: 'universities', activeOn: ['/admin/universities', '/admin/university']   },
        { label: 'Search & Apply',   href: '/admin/programs',          icon: BookOpen,        module: 'programs',     activeOn: ['/admin/programs', '/admin/program']          },
        { label: 'Agents',           href: '/admin/agents',            icon: UserCheck,       module: 'agents',       activeOn: ['/admin/agents', '/admin/agent']              },
        { label: 'Applications',     href: '/admin/applications',      icon: FileText,        module: 'applications', activeOn: ['/admin/applications', '/admin/application']  },
        { label: 'Hotels',           href: '/admin/hotels',            icon: Hotel,           module: 'hotels',       activeOn: ['/admin/hotels']                             },
        { label: 'Dorm Applications',href: '/admin/dorm-applications', icon: Home,            module: 'hotels',       activeOn: ['/admin/dorm-applications']                  },
        { label: 'Leads',            href: '/admin/leads',             icon: Inbox,           module: 'leads',        activeOn: ['/admin/leads']                              },
        { label: 'Invoices',         href: '/admin/invoices',          icon: Receipt,         module: 'invoices'  },
        { label: 'Reports',          href: '/admin/reports',           icon: TrendingUp,      module: 'reports'   },
        { label: 'Settings',         href: '/admin/settings',          icon: Settings,        module: 'settings'  },
        { label: 'Questions',        href: '/admin/questions',         icon: HelpCircle,      module: 'questions' },
        { label: 'Roles',            href: '/admin/roles',             icon: Shield,          module: 'roles'     },
      ];
      const allowed = ALL_ITEMS.filter(item =>
        item.module === 'dashboard' || (perms[item.module] || []).includes('view')
      );
      return allowed.length
        ? [{ group: 'Menu', items: allowed }]
        : [{ group: 'Menu', items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }] }];
    }

    if (user?.role === 'admin_employee') {
      const base = NAV.admin_employee[0].items;
      const extra = [];
      if (user?.permissions?.canAddUniversities)
        extra.push({ label: 'Universities', href: '/admin-employee/universities', icon: Building2 });
      if (user?.permissions?.canAddPrograms)
        extra.push({ label: 'Programs', href: '/admin-employee/programs', icon: BookOpen });
      return [{ group: 'Menu', items: [...base, ...extra] }];
    }

    return NAV[user?.role] || [];
  })();

  const roleCfg  = ROLE_CONFIG[user?.role] || ROLE_CONFIG.student;
  const initials = (user?.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  function getRoleLabel() {
    if (user?.role === 'custom')          return user?.customRoleName || 'Staff';
    if (user?.role === 'admin_employee')  return user?.designation   || 'Admin Employee';
    if (user?.role === 'agent_employee')  return user?.designation   || 'Agent Employee';
    return user?.role;
  }

  function getDashboardPath() {
    if (user?.role === 'custom')          return '/admin/dashboard';
    if (user?.role === 'admin_employee')  return '/admin/dashboard';
    if (user?.role === 'agent_employee')  return '/agent/dashboard';
    return `/${user?.role}/dashboard`;
  }

  // ── Sidebar inner ─────────────────────────────────────────────
  function SidebarContent({ isMobile = false }) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-slate-200 shadow-sm">

        {/* Logo area */}
        <div className={`flex items-center h-16 border-b border-slate-100 shrink-0 ${collapsed && !isMobile ? 'justify-center px-3' : 'px-5 gap-3'}`}>
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800 text-base leading-tight" style={{ fontFamily: 'Georgia,serif' }}>
                {portalSettings.portal_name || 'EduPortal'}
              </div>
              <div className="text-slate-400 text-[10px] font-medium tracking-wide">
                {portalSettings.portal_tagline || 'Management System'}
              </div>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 ml-auto">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User card */}
        {(!collapsed || isMobile) ? (
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm shadow-emerald-200">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-800 truncate leading-tight">{user?.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${roleCfg.dot}`} />
                  <span className="text-[10px] text-slate-500 font-medium">{roleCfg.label}</span>
                </div>
              </div>
            </div>

            {user?.role === 'admin_employee' && user?.agentName && (
              <div className="mt-2 flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"/>
                <span className="text-[10px] text-blue-700 truncate font-medium">Agent: {user.agentName}</span>
              </div>
            )}

            {user?.role === 'agent_employee' && user?.agentName && (
              <div className="mt-2 flex items-center gap-1.5 bg-teal-50 border border-teal-100 rounded-lg px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"/>
                <span className="text-[10px] text-teal-700 truncate font-medium">Under: {user.agentName}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3" style={{ scrollbarWidth: 'none' }}>
          {navGroups.map(group => (
            <div key={group.group} className={`mb-4 ${collapsed && !isMobile ? 'px-2' : 'px-3'}`}>
              {(!collapsed || isMobile) && (
                <div className="px-3 mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{group.group}</span>
                </div>
              )}
              {collapsed && !isMobile && <div className="h-px bg-slate-100 mb-3"/>}

              <div className="space-y-0.5">
                {group.items.map(item => {
                  const { label, href, icon: Icon } = item;
                  const active = isActive(item);
                  return (
                    <Link key={`${href}-${label}`} href={href}
                      onClick={() => isMobile && setMobileOpen(false)}
                      title={collapsed && !isMobile ? label : undefined}
                      className={`
                        relative flex items-center rounded-xl text-sm font-medium transition-all duration-150 group
                        ${collapsed && !isMobile ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
                        ${active
                          ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}
                      `}>
                      {active && !collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-emerald-500 rounded-r-full" />
                      )}
                      <div className={`
                        flex items-center justify-center shrink-0 rounded-lg transition-all
                        ${collapsed && !isMobile ? 'w-9 h-9' : 'w-8 h-8'}
                        ${active
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50'}
                      `}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {(!collapsed || isMobile) && (
                        <span className={`flex-1 ${active ? 'text-emerald-700 font-semibold' : ''}`}>{label}</span>
                      )}
                      {active && (!collapsed || isMobile) && (
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <div className="px-3 pb-2">
            <button onClick={() => setCollapsed(c => !c)}
              className={`w-full flex items-center rounded-xl py-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all text-xs font-semibold group
                ${collapsed ? 'justify-center px-2' : 'gap-2 px-3'}`}>
              {collapsed
                ? <PanelLeftOpen className="w-4 h-4 group-hover:text-emerald-600"/>
                : <><PanelLeftClose className="w-4 h-4 group-hover:text-emerald-600"/><span>Collapse</span></>
              }
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="border-t border-slate-100 p-3">
          <button onClick={handleLogout}
            className={`
              w-full flex items-center rounded-xl py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-medium group
              ${collapsed && !isMobile ? 'justify-center px-2' : 'gap-3 px-3'}
            `}
            title={collapsed && !isMobile ? 'Sign Out' : undefined}>
            <div className={`flex items-center justify-center rounded-lg group-hover:bg-red-100 transition-all shrink-0
              ${collapsed && !isMobile ? 'w-9 h-9' : 'w-8 h-8'}`}>
              <LogOut className="w-4 h-4" />
            </div>
            {(!collapsed || isMobile) && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        <SidebarContent isMobile={false} />
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent isMobile={true} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center gap-4 shrink-0 z-10 shadow-sm">
          <button className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
            onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <button className="hidden lg:flex p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
            onClick={() => setCollapsed(c => !c)}>
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 text-xs capitalize hidden sm:block">{getRoleLabel()}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />
            <h1 className="font-bold text-slate-800">{title}</h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 group">
              <Bell className="w-5 h-5 group-hover:text-emerald-600 transition-colors" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <div className="relative" ref={dropRef}>
              <button onClick={() => setDropOpen(d => !d)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-bold text-slate-800 leading-tight">{user?.name?.split(' ')[0]}</div>
                  <div className="text-[10px] text-slate-400 capitalize leading-tight">{getRoleLabel()}</div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-800 truncate">{user?.name}</div>
                        <div className="text-xs text-slate-400 truncate">{user?.email}</div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${roleCfg.badge}`}>
                          <span className={`w-1 h-1 rounded-full ${roleCfg.dot}`} />
                          {roleCfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={getDashboardPath()} onClick={() => setDropOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 transition-colors font-medium">
                    <Home className="w-4 h-4" />Dashboard
                  </Link>
                  {user?.role === 'student' && (
                    <Link href="/student/profile" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 transition-colors font-medium">
                      <Users className="w-4 h-4" />My Profile
                    </Link>
                  )}
                  <div className="border-t border-slate-100 mt-1" />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
                    <LogOut className="w-4 h-4" />Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}