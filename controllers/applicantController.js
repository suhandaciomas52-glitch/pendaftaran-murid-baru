const pool = require('../config/db');

function generateRegNumber(id) {
  const y = new Date().getFullYear();
  return `PPDB-${y}-${String(id).padStart(6, '0')}`;
}

const list = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM applicants';
    const params = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ applicants: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Pendaftaran tidak ditemukan.' });
    res.json({ applicant: rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// req.body: { user_id, school_id, major_id, full_name, place_of_birth, date_of_birth, gender, address, phone, email, previous_school }
const create = async (req, res) => {
  const { user_id, school_id, major_id, full_name, place_of_birth, date_of_birth, gender, address, phone, email, previous_school } = req.body;
  if (!user_id || !school_id || !major_id || !full_name) {
    return res.status(400).json({ message: 'user_id, school_id, major_id, dan full_name wajib diisi.' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO applicants
        (user_id, school_id, major_id, full_name, place_of_birth, date_of_birth, gender, address, phone, email, previous_school)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, school_id, major_id, full_name, place_of_birth || null, date_of_birth || null, gender || null, address || null, phone || null, email || null, previous_school || null]
    );
    const reg = generateRegNumber(result.insertId);
    await pool.query('UPDATE applicants SET registration_number = ? WHERE id = ?', [reg, result.insertId]);
    res.status(201).json({ message: 'Pendaftaran dibuat.', id: result.insertId, registration_number: reg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  const fields = ['full_name', 'place_of_birth', 'date_of_birth', 'gender', 'address', 'phone', 'email', 'previous_school'];
  const sets = [];
  const params = [];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      sets.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  });
  if (!sets.length) return res.status(400).json({ message: 'Tidak ada field untuk diperbarui.' });
  params.push(req.params.id);
  try {
    const [result] = await pool.query(`UPDATE applicants SET ${sets.join(', ')} WHERE id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ message: 'Pendaftaran tidak ditemukan.' });
    res.json({ message: 'Pendaftaran diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// req.body: { status }
const updateStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'verified', 'rejected', 'accepted'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid.' });
  }
  try {
    const [result] = await pool.query('UPDATE applicants SET status = ? WHERE id = ?', [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Pendaftaran tidak ditemukan.' });
    res.json({ message: `Status diperbarui menjadi ${status}.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM applicants WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Pendaftaran tidak ditemukan.' });
    res.json({ message: 'Pendaftaran dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { list, getOne, create, update, updateStatus, remove };