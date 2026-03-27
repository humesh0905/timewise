import pool from '../db/pool.js';

/**
 * Middleware to verify that the logged-in user has the required role(s)
 * Usage:
 *   router.get('/admin', checkRole(['Admin']), handler)
 */
function checkRole(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - No user session' });
      }

      const result = await pool.query(
        `SELECT roles.name
         FROM roles
         JOIN user_roles ON roles.id = user_roles.role_id
         WHERE user_roles.user_id = $1`,
        [req.user.id]
      );

      const userRoles = result.rows.map(r => r.name);
      const hasAccess = allowedRoles.some(role => userRoles.includes(role));

      if (!hasAccess) {
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }

      next();
    } catch (err) {
      console.error('checkRole error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export default checkRole;
