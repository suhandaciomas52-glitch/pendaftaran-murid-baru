const jwt = require('jsonwebtoken');

const COOKIE = 'eduenroll_token';

function setAuthCookie(res, token) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE);
}

function getAuthUser(req) {
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const user = getAuthUser(req);
  if (!user) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    const user = getAuthUser(req);
    if (!user) return res.redirect('/login');
    if (!roles.includes(user.role)) return res.status(403).render('error', { status: 403, message: 'Akses ditolak.', user });
    req.user = user;
    next();
  };
}

function viewUser(req) {
  return getAuthUser(req);
}

module.exports = { COOKIE, setAuthCookie, clearAuthCookie, getAuthUser, requireAuth, requireRole, viewUser };