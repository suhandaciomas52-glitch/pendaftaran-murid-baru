const pool = require('../config/db');

const list = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json({ announcements: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Pengumuman tidak ditemukan.' });
    res.json({ announcement: rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// req.body: { school_id, title, content }
const create = async (req, res) => {
  const { school_id, title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'title dan content wajib diisi.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO announcements (school_id, title, content) VALUES (?, ?, ?)',
      [school_id || null, title, content]
    );
    res.status(201).json({ message: 'Pengumuman dibuat.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  const { title, content, school_id } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE announcements SET title = COALESCE(?, title), content = COALESCE(?, content), school_id = COALESCE(?, school_id) WHERE id = ?',
      [title || null, content || null, school_id != null ? school_id : null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Pengumuman tidak ditemukan.' });
    res.json({ message: 'Pengumuman diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Pengumuman tidak ditemukan.' });
    res.json({ message: 'Pengumuman dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { list, getOne, create, update, remove };