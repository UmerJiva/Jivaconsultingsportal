// pages/api/auth/login.js
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../../../lib/db';
import { signToken, setAuthCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    // Find user — is_active check uses COALESCE so NULL counts as active
    // (existing rows before the column was added will have NULL)
    const user = await queryOne(
      `SELECT u.id, u.name, u.email, u.password, u.role, u.avatar, u.custom_role_id,
              r.name  AS custom_role_name,  r.slug  AS custom_role_slug,
              r.color AS custom_role_color, r.icon  AS custom_role_icon
       FROM users u
       LEFT JOIN custom_roles r ON r.id = u.custom_role_id
       WHERE u.email = ?
         AND COALESCE(u.is_active, 1) = 1`,
      [email.toLowerCase().trim()]
    );

    if (!user)
      return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password' });

    // Role-specific sub-table id
    let roleId = null;

    if (user.role === 'agent') {
      const agent = await queryOne('SELECT id FROM agents WHERE user_id = ?', [user.id]);
      roleId = agent?.id || null;

    } else if (user.role === 'student') {
      const student = await queryOne('SELECT id FROM students WHERE user_id = ?', [user.id]);
      roleId = student?.id || null;

    } else if (user.role === 'admin_employee') {
      // Must have an active record in admin_employees
      const emp = await queryOne(
        'SELECT id FROM admin_employees WHERE user_id = ? AND is_active = 1',
        [user.id]
      );
      if (!emp) return res.status(401).json({ error: 'Account deactivated' });
      roleId = emp.id;

    } else if (user.role === 'agent_employee') {
      // Must have an active record in agent_employees
      const emp = await queryOne(
        'SELECT id FROM agent_employees WHERE user_id = ? AND is_active = 1',
        [user.id]
      );
      if (!emp) return res.status(401).json({ error: 'Account deactivated' });
      roleId = emp.id;
    }

    // Permissions for custom role users
    let permissions = {};
    if (user.role === 'custom' && user.custom_role_id) {
      try {
        const perms = await query(
          'SELECT module, permissions FROM role_permissions WHERE role_id = ?',
          [user.custom_role_id]
        );
        perms.forEach(p => {
          try { permissions[p.module] = JSON.parse(p.permissions); }
          catch { permissions[p.module] = []; }
        });
      } catch {}
    }

    // Update last_seen (non-fatal)
    try { await query('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]); } catch {}

    const payload = {
      userId:          user.id,
      roleId,
      name:            user.name,
      email:           user.email,
      role:            user.role,
      avatar:          user.avatar,
      customRoleId:    user.custom_role_id    || null,
      customRoleName:  user.custom_role_name  || null,
      customRoleSlug:  user.custom_role_slug  || null,
      customRoleColor: user.custom_role_color || null,
      customRoleIcon:  user.custom_role_icon  || null,
      permissions,
    };

    const token = signToken(payload);
    setAuthCookie(res, token);
    return res.status(200).json({ message: 'Login successful', user: payload });

  } catch (err) {
    console.error('[login]', err.code, err.message);
    if (err.code === 'ECONNREFUSED')
      return res.status(500).json({ error: 'Cannot connect to MySQL. Make sure XAMPP is running.' });
    if (err.code === 'ER_ACCESS_DENIED_ERROR')
      return res.status(500).json({ error: 'MySQL access denied. Check DB credentials.' });
    if (err.code === 'ER_BAD_DB_ERROR')
      return res.status(500).json({ error: 'Database "eduportal" not found. Import the SQL first.' });
    if (err.code === 'ER_NO_SUCH_TABLE')
      return res.status(500).json({ error: 'Tables not found. Import eduportal.sql into your database.' });
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}