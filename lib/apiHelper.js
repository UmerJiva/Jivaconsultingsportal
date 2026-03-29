// lib/apiHelper.js

export function methodNotAllowed(res, allowed = ['GET']) {
  res.setHeader('Allow', allowed);
  return res.status(405).json({ error: 'Method not allowed' });
}

export function paginate(req) {
  const page  = Math.max(1, parseInt(req.query.page  || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20')));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function searchLike(val) {
  return `%${(val || '').replace(/[%_]/g, '\\$&')}%`;
}
