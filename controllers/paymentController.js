const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const uploadDir = path.join(__dirname, '..', 'uploads');

const list = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
    res.json({ payments: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getByApplicant = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payments WHERE applicant_id = ?', [req.params.applicant_id]);
    res.json({ payments: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST multipart: body amount, file proof
const create = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Bukti pembayaran wajib diunggah.' });
  const { amount } = req.body;
  if (!amount) return res.status(400).json({ message: 'amount wajib diisi.' });
  try {
    const [result] = await pool.query(
      'INSERT INTO payments (applicant_id, amount, proof_path) VALUES (?, ?, ?)',
      [req.params.applicant_id, amount, `/uploads/${req.file.filename}`]
    );
    res.status(201).json({ message: 'Pembayaran dicatat.', id: result.insertId, proof_path: `/uploads/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// req.body: { status }
const verify = async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'verified', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid.' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE payments SET status = ?, verified_by = ?, verified_at = NOW() WHERE id = ?',
      [status, req.user.id, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Pembayaran tidak ditemukan.' });
    res.json({ message: `Pembayaran ${status}.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT proof_path FROM payments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Pembayaran tidak ditemukan.' });
    await pool.query('DELETE FROM payments WHERE id = ?', [req.params.id]);
    const stored = path.basename(rows[0].proof_path);
    const file = path.join(uploadDir, stored);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    res.json({ message: 'Pembayaran dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { list, getByApplicant, create, verify, remove };