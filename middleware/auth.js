function requireStudent(req, res, next) {
  if (req.session && req.session.role === 'student') {
    return next();
  }
  res.status(401).json({ error: 'Authentication required', redirect: '/login.html' });
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') {
    return next();
  }
  res.status(401).json({ error: 'Admin authentication required', redirect: '/admin.html' });
}

module.exports = { requireStudent, requireAdmin };
