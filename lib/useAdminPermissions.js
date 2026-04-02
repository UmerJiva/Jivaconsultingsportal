// lib/useAdminPermissions.js
// Permission hook for admin-side pages
// - role === 'admin'          → full access to everything
// - role === 'custom'         → uses permissions object from JWT (module-based)
// - role === 'admin_employee' → uses can_* flags from JWT permissions object
//
// Usage:
//   const { can, isRestricted, user, loading } = useAdminPermissions();
//   if (!can('students', 'view')) return <AccessDenied />;
//   {can('students', 'create') && <button>Add Student</button>}

import { useState, useEffect } from 'react';

export default function useAdminPermissions() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { setUser(d.user || d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const isAdmin         = user?.role === 'admin';
  const isCustom        = user?.role === 'custom';
  const isAdminEmployee = user?.role === 'admin_employee';

  // True when access is NOT full admin
  const isRestricted = isCustom || isAdminEmployee;

  /**
   * Check if user can perform an action on a module
   * @param {string} module  - e.g. 'students', 'applications', 'universities', 'programs', 'agents'
   * @param {string} action  - 'view' | 'create' | 'edit' | 'delete'
   */
  function can(module, action = 'view') {
    if (!user) return false;

    // Admin always has full access
    if (isAdmin) return true;

    // Custom role — uses the permissions object (array of actions per module)
    if (isCustom) {
      if (action === 'view') {
        // Dashboard always visible
        if (module === 'dashboard') return true;
        return (user.permissions?.[module] || []).includes('view');
      }
      return (user.permissions?.[module] || []).includes(action);
    }

    // Admin employee — uses specific boolean flags
    if (isAdminEmployee) {
      const p = user.permissions || {};
      // Map module+action to their specific permission flags
      if (module === 'universities') return action === 'view' ? true : !!p.canAddUniversities;
      if (module === 'programs')     return action === 'view' ? true : !!p.canAddPrograms;
      if (module === 'applications') return !!p.canManageApplications;
      if (module === 'tasks')        return !!p.canAssignTasks;
      if (module === 'chat')         return !!p.canChatAgent;
      // Admin employees can view students and agents of their assigned agent
      if (module === 'students')     return action === 'view';
      if (module === 'agents')       return action === 'view';
      if (module === 'dashboard')    return true;
      return false;
    }

    return false;
  }

  return { user, loading, isAdmin, isCustom, isAdminEmployee, isRestricted, can };
}

// ── Reusable AccessDenied component ──────────────────────────
export function AccessDenied({ message = "You don't have permission to access this page." }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-3xl">🔒</div>
      <h2 className="text-lg font-semibold text-slate-700 mb-2">Access Restricted</h2>
      <p className="text-sm text-slate-400 max-w-sm">{message}</p>
    </div>
  );
}