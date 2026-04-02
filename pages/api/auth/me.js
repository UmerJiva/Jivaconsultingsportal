// pages/api/auth/me.js
// Returns current user from JWT cookie — include permissions for agent_employee

import { verifyToken, getTokenFromRequest } from '../../../lib/auth';
import { queryOne } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' });

    // For agent_employee — load their permissions from DB and attach
    if (decoded.role === 'agent_employee') {
      const emp = await queryOne(`
        SELECT
          ae.id,
          ae.agent_id,
          ae.designation,
          ae.is_active,
          ae.can_view_students,
          ae.can_add_students,
          ae.can_edit_students,
          ae.can_delete_students,
          ae.can_view_applications,
          ae.can_add_applications,
          ae.can_edit_applications,
          ae.can_delete_applications,
          ae.can_view_documents,
          ae.can_upload_documents,
          ae.can_delete_documents,
          ae.can_view_universities,
          ae.can_view_programs,
          ae.can_chat_agent,
          ae.can_view_tasks,
          ae.can_update_task_status,
          a.user_id  AS agent_user_id,
          u2.name    AS agent_name
        FROM agent_employees ae
        JOIN agents a  ON a.id  = ae.agent_id
        JOIN users  u2 ON u2.id = a.user_id
        WHERE ae.id = ? AND ae.is_active = 1
      `, [decoded.roleId]);

      if (!emp) return res.status(401).json({ error: 'Account deactivated' });

      // Build permissions object
      const permissions = {
        can_view_students:       !!emp.can_view_students,
        can_add_students:        !!emp.can_add_students,
        can_edit_students:       !!emp.can_edit_students,
        can_delete_students:     !!emp.can_delete_students,
        can_view_applications:   !!emp.can_view_applications,
        can_add_applications:    !!emp.can_add_applications,
        can_edit_applications:   !!emp.can_edit_applications,
        can_delete_applications: !!emp.can_delete_applications,
        can_view_documents:      !!emp.can_view_documents,
        can_upload_documents:    !!emp.can_upload_documents,
        can_delete_documents:    !!emp.can_delete_documents,
        can_view_universities:   !!emp.can_view_universities,
        can_view_programs:       !!emp.can_view_programs,
        can_chat_agent:          !!emp.can_chat_agent,
        can_view_tasks:          !!emp.can_view_tasks,
        can_update_task_status:  !!emp.can_update_task_status,
      };

      return res.json({
        user: {
          ...decoded,
          empId:       emp.id,
          agentId:     emp.agent_id,
          agentUserId: emp.agent_user_id,
          agentName:   emp.agent_name,
          designation: emp.designation,
          permissions,
        }
      });
    }

    // For all other roles just return decoded token as-is
    return res.json({ user: decoded });

  } catch (e) {
    console.error('[auth/me]', e.message);
    return res.status(500).json({ error: e.message });
  }
}