const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const uploadDir = path.join(__dirname, '..', 'uploads');

const list = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM documents WHERE applicant_id = ? ORDER BY created_at DESC', [req.params.applicant_id]);
    res.json({ documents: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST with multipart: field 'file', body type
const uploadDoc = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File wajib diunggah.' });
  const { type } = req.body;
  if (!type) return res.status(400).json({ message: 'type dokumen wajib diisi.' });
  try {
    const [result] = await pool.query(
      'INSERT INTO documents (applicant_id, type, file_path) VALUES (?, ?, ?)',
      [req.params.applicant_id, type, `/uploads/${req.file.filename}`]
    );
    res.status(201).json({ message: 'Dokumen diunggah.', id: result.insertId, file_path: `/uploads/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT file_path FROM documents WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Dokumen tidak ditemukan.' });
    await pool.query('DELETE FROM documents WHERE id = ?', [req.params.id]);
    const stored = path.basename(rows[0].file_path);
    const file = path.join(uploadDir, stored);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    res.json({ message: 'Dokumen dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { list, uploadDoc, remove };