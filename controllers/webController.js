const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { setAuthCookie, clearAuthCookie, getAuthUser } = require('../middleware/webauth');

const jwt = require('jsonwebtoken');

function token(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, school_id: user.school_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ---------- Publik ----------
async function home(req, res) {
  try {
    const [schools] = await pool.query('SELECT COUNT(*) c FROM schools');
    const [majors] = await pool.query('SELECT COUNT(*) c FROM majors');
    const [applicants] = await pool.query('SELECT COUNT(*) c FROM applicants');
    const [announcements] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 5');
    res.render('home', {
      title: 'Beranda',
      user: getAuthUser(req),
      stats: {
        schools: schools[0].c,
        majors: majors[0].c,
        applicants: applicants[0].c,
      },
      announcements,
    });
  } catch (err) {
    res.render('home', { title: 'Beranda', user: getAuthUser(req), stats: { schools: 0, majors: 0, applicants: 0 }, announcements: [] });
  }
}

async function announcements(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.render('announcements', { title: 'Pengumuman', user: getAuthUser(req), announcements: rows });
  } catch (err) {
    res.render('announcements', { title: 'Pengumuman', user: getAuthUser(req), announcements: [] });
  }
}

// ---------- Auth web ----------
function showLogin(req, res) {
  res.render('auth/login', { title: 'Masuk', user: null, error: null, message: null, form: {}, next: req.query.next || '' });
}

async function doLogin(req, res) {
  const { email, password, next } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.render('auth/login', { title: 'Masuk', user: null, error: 'Email atau password salah.', message: null, form: { email }, next: next || '' });
    }
    setAuthCookie(res, token(rows[0]));
    const dest = next && next.startsWith('/') && !next.startsWith('/login') ? next : '/';
    res.redirect(dest);
  } catch (err) {
    res.render('auth/login', { title: 'Masuk', user: null, error: 'Terjadi kesalahan.', message: null, form: { email }, next: next || '' });
  }
}

function showRegister(req, res) {
  res.render('auth/register', { title: 'Daftar', user: null, error: null, message: null, form: {} });
}

async function doRegister(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.render('auth/register', { title: 'Daftar', user: null, error: 'Semua field wajib diisi.', message: null, form: req.body });
  }
  if (password.length < 6) {
    return res.render('auth/register', { title: 'Daftar', user: null, error: 'Password minimal 6 karakter.', message: null, form: req.body });
  }
  try {
    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) {
      return res.render('auth/register', { title: 'Daftar', user: null, error: 'Email sudah terdaftar.', message: null, form: req.body });
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)', [name, email, hash, 'candidate_student']);
    res.render('auth/login', { title: 'Masuk', user: null, error: null, message: 'Pendaftaran berhasil. Silakan masuk.', form: { email }, next: '' });
  } catch (err) {
    res.render('auth/register', { title: 'Daftar', user: null, error: err.message, message: null, form: req.body });
  }
}

function logout(req, res) {
  clearAuthCookie(res);
  res.redirect('/');
}

module.exports = { home, announcements, showLogin, doLogin, showRegister, doRegister, logout };