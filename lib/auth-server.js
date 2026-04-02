// lib/auth-server.js  — import this ONLY inside pages/api/* files, never in components or pages

import { query, queryOne } from './db';
import { serialize, parse } from 'cookie';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'eduportal_secret_change_in_prod';
const COOKIE_NAME = 'edu_token';

export function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

export function withAuth(handler, allowedRoles = null) {
  return async (req, res) => {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    if (allowedRoles && !allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = decoded;
    return handler(req, res);
  };
}