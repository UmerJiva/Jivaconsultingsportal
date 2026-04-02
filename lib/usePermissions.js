// lib/usePermissions.js
// Universal permission hook for agent pages
// - If role === 'agent' → full access to everything
// - If role === 'agent_employee' → access controlled by their permission flags
//
// Usage in any agent page:
//   const { can, isEmployee, loading } = usePermissions();
//   if (!can('view_students')) return <AccessDenied />;
//   {can('edit_students') && <button>Edit</button>}

import { useState, useEffect } from 'react';

export default function usePermissions() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        setUser(d.user || d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Agent has full access to everything
  const isAgent    = user?.role === 'agent';
  // Agent employee has restricted access
  const isEmployee = user?.role === 'agent_employee';

  /**
   * Check if current user can perform an action
   * @param {string} permission - e.g. 'view_students', 'edit_students', 'add_applications'
   * @returns {boolean}
   */
  function can(permission) {
    if (!user) return false;
    // Agent always has full access
    if (isAgent) return true;
    // Agent employee checks their specific permission flags
    if (isEmployee) {
      const key = `can_${permission}`;
      return !!user.permissions?.[key];
    }
    return false;
  }

  /**
   * Check if user can access a page at all
   * Redirects if they can't view the section
   */
  function canAccessPage(viewPermission) {
    if (!user) return false;
    if (isAgent) return true;
    if (isEmployee) return can(viewPermission);
    return false;
  }

  return {
    user,
    loading,
    isAgent,
    isEmployee,
    can,
    canAccessPage,
  };
}

// ── AccessDenied component to show when blocked ───────────────
export function AccessDenied({ message = "You don't have permission to view this page." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-3xl">🔒</div>
      <h2 className="text-lg font-semibold text-slate-700 mb-2">Access Restricted</h2>
      <p className="text-sm text-slate-400 max-w-sm">{message}</p>
    </div>
  );
}