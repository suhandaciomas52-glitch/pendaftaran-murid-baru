const pool = require('../config/db');

const list = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM schools ORDER BY name');
    res.json({ schools: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM schools WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Sekolah tidak ditemukan.' });
    res.json({ school: rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  const { name, npsn, address, phone, email } = req.body;
  if (!name) return res.status(400).json({ message: 'name wajib diisi.' });
  try {
    const [result] = await pool.query(
      'INSERT INTO schools (name, npsn, address, phone, email) VALUES (?, ?, ?, ?, ?)',
      [name, npsn || null, address || null, phone || null, email || null]
    );
    res.status(201).json({ message: 'Sekolah dibuat.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  const { name, npsn, address, phone, email } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE schools SET name = COALESCE(?, name), npsn = COALESCE(?, npsn), address = COALESCE(?, address), phone = COALESCE(?, phone), email = COALESCE(?, email) WHERE id = ?',
      [name || null, npsn || null, address || null, phone || null, email || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Sekolah tidak ditemukan.' });
    res.json({ message: 'Sekolah diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM schools WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Sekolah tidak ditemukan.' });
    res.json({ message: 'Sekolah dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { list, getOne, create, update, remove };