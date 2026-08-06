const jwt = require('jsonwebtoken');

const TOKEN_ORDER = {
  super_admin: 3,
  admin_school: 2,
  candidate_student: 1,
};

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, school_id: user.school_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login.' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const granular = req.user.role === 'super_admin' ? 3 : TOKEN_ORDER[req.user.role] || 0;
    const minLevel = Math.min(...roles.map((r) => TOKEN_ORDER[r]).filter((v) => v != null));
    if (req.user.role !== 'super_admin' && minLevel > granular) {
      return res.status(403).json({ message: 'Akses ditolak. Peran tidak diizinkan.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize, signToken, TOKEN_ORDER };