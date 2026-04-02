// lib/auth.js
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET  = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = 'edu_token';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

export function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  }));
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,
    path:     '/',
  }));
}

export function getTokenFromRequest(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  return cookies[COOKIE_NAME] || null;
}

// ── Route guard ───────────────────────────────────────────────
export function withAuth(handler, allowedRoles = []) {
  return async (req, res) => {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const user = verifyToken(token);
    if (!user)  return res.status(401).json({ error: 'Invalid or expired token' });

    if (allowedRoles.length > 0) {
      // Custom role (staff) users are treated as admins for route-level access.
      // Fine-grained permission control happens inside each handler via req.user.permissions.
      const effective = user.role === 'custom' ? 'admin' : user.role;
      if (!allowedRoles.includes(effective)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    req.user = user;
    return handler(req, res);
  };
}

// ── Client helpers ────────────────────────────────────────────
export async function fetchUser() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch { return null; }
}

export function getDashboardPath(role) {
  if (role === 'admin')   return '/admin/dashboard';
  if (role === 'agent')   return '/agent/dashboard';
  if (role === 'student') return '/student/dashboard';
  if (role === 'custom')  return '/admin/dashboard';
  return '/admin/dashboard';
}

// ── Permission helper ─────────────────────────────────────────
// Use in pages/components: can(user, 'invoices', 'create')
export function can(user, module, action) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'custom') return false;
  return (user.permissions?.[module] || []).includes(action);
}

// Add to the bottom of your existing lib/auth.js

export function redirectByRole(role, router) {
  const routes = {
    admin:          '/admin/dashboard',
    agent:          '/agent/dashboard',
    student:        '/student/dashboard',
    admin_employee: '/admin-employee/dashboard',
    agent_employee: '/agent-employee/dashboard',
  };
  router.push(routes[role] || '/');
}

export function dashboardRoot(role) {
  if (role === 'admin')          return '/admin';
  if (role === 'agent')          return '/agent';
  if (role === 'student')        return '/student';
  if (role === 'admin_employee') return '/admin-employee';
  if (role === 'agent_employee') return '/agent-employee';
  return '/';
}