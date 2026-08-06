const pool = require('../config/db');

const list = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM majors ORDER BY name');
    res.json({ majors: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM majors WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Jurusan tidak ditemukan.' });
    res.json({ major: rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// req.body: { school_id, code, name, quota }
const create = async (req, res) => {
  const { school_id, code, name, quota } = req.body;
  if (!school_id || !name) {
    return res.status(400).json({ message: 'school_id dan name wajib diisi.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO majors (school_id, code, name, quota) VALUES (?, ?, ?, ?)',
      [school_id, code || null, name, quota || 0]
    );
    res.status(201).json({ message: 'Jurusan dibuat.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  const { code, name, quota } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE majors SET code = COALESCE(?, code), name = COALESCE(?, name), quota = COALESCE(?, quota) WHERE id = ?',
      [code || null, name || null, quota != null ? quota : null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Jurusan tidak ditemukan.' });
    res.json({ message: 'Jurusan diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM majors WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Jurusan tidak ditemukan.' });
    res.json({ message: 'Jurusan dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { list, getOne, create, update, remove };