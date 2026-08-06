const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const list = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, school_id, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, school_id, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User tidak ditemukan.' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  const { name, email, role, school_id, password } = req.body;
  const sets = [];
  const params = [];
  if (name !== undefined) { sets.push('name = ?'); params.push(name); }
  if (email !== undefined) { sets.push('email = ?'); params.push(email); }
  if (role !== undefined) { sets.push('role = ?'); params.push(role); }
  if (school_id !== undefined) { sets.push('school_id = ?'); params.push(school_id); }
  if (password) {
    sets.push('password_hash = ?');
    params.push(await bcrypt.hash(password, 10));
  }
  if (!sets.length) return res.status(400).json({ message: 'Tidak ada field untuk diperbarui.' });
  params.push(req.params.id);
  try {
    const [result] = await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ message: 'User tidak ditemukan.' });
    res.json({ message: 'User diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'User tidak ditemukan.' });
    res.json({ message: 'User dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { list, getOne, update, remove };