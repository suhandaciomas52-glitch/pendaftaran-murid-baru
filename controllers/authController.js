const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { signToken } = require('../middleware/auth');

// req.body: { name, email, password, role?, school_id? }
const register = async (req, res) => {
  const { name, email, password, role = 'candidate_student', school_id = null } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, dan password wajib diisi.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password minimal 6 karakter.' });
  }
  const allowedRoles = ['super_admin', 'admin_school', 'candidate_student'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Role tidak valid.' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, school_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, role, school_id]
    );
    const user = { id: result.insertId, name, email, role, school_id };
    res.status(201).json({ message: 'Registrasi berhasil.', user });
  } catch (err) {
    res.status(500).json({ message: `Gagal registrasi: ${err.message}` });
  }
};

// req.body: { email, password }
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email dan password wajib diisi.' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }
    const token = signToken(user);
    res.json({
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
      },
    });
  } catch (err) {
    res.status(500).json({ message: `Login gagal: ${err.message}` });
  }
};

const me = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, school_id, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User tidak ditemukan.' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, me };