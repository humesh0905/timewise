function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userRoles = req.user?.roles || [];
    if (!roles.some(r => userRoles.includes(r))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}

export { requireAuth, requireRole };
