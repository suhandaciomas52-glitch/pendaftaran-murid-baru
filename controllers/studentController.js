const pool = require('../config/db');

function generateRegNumber(id) {
  return `PPDB-${new Date().getFullYear()}-${String(id).padStart(6, '0')}`;
}

async function getMyApplicant(userId) {
  const [rows] = await pool.query(
    `SELECT a.*, m.name AS major_name, s.name AS school_name
     FROM applicants a
     LEFT JOIN majors m ON m.id = a.major_id
     LEFT JOIN schools s ON s.id = a.school_id
     WHERE a.user_id = ? ORDER BY a.id DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function dashboard(req, res) {
  const applicant = await getMyApplicant(req.user.id);
  res.render('student/dashboard', {
    title: 'Dashboard',
    user: req.user,
    applicant,
    message: null,
    error: null,
  });
}

async function showApply(req, res) {
  try {
    const [schools] = await pool.query('SELECT * FROM schools ORDER BY name');
    const [majors] = await pool.query('SELECT * FROM majors ORDER BY name');
    const applicant = await getMyApplicant(req.user.id);
    res.render('student/apply', {
      title: 'Formulir Pendaftaran',
      user: req.user,
      applicant,
      schools,
      majors,
      message: null,
      error: null,
    });
  } catch (err) {
    res.render('error', { status: 500, message: err.message });
  }
}

async function submitApply(req, res) {
  const { school_id, major_id, full_name, place_of_birth, date_of_birth, gender, address, phone, previous_school, email } = req.body;
  const applicant = await getMyApplicant(req.user.id);
  try {
    if (applicant) {
      // only update if still pending
      if (applicant.status !== 'pending' && applicant.status !== 'rejected') {
        return res.render('student/apply', { title: 'Formulir Pendaftaran', user: req.user, applicant, schools: [], majors: [], message: null, error: 'Pendaftaran sudah diproses, tidak dapat diubah.' });
      }
      await pool.query(
        'UPDATE applicants SET school_id=?, major_id=?, full_name=?, place_of_birth=?, date_of_birth=?, gender=?, address=?, phone=?, previous_school=?, email=? WHERE id=?',
        [school_id, major_id, full_name, place_of_birth || null, date_of_birth || null, gender || null, address || null, phone || null, previous_school || null, email || req.user.email, applicant.id]
      );
      return res.render('student/dashboard', { title: 'Dashboard', user: req.user, applicant: await getMyApplicant(req.user.id), message: 'Pendaftaran diperbarui.', error: null });
    }
    const [result] = await pool.query(
      `INSERT INTO applicants (user_id, school_id, major_id, full_name, place_of_birth, date_of_birth, gender, address, phone, previous_school, email)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.id, school_id, major_id, full_name, place_of_birth || null, date_of_birth || null, gender || null, address || null, phone || null, previous_school || null, email || req.user.email]
    );
    await pool.query('UPDATE applicants SET registration_number=? WHERE id=?', [generateRegNumber(result.insertId), result.insertId]);
    res.redirect('/dashboard');
  } catch (err) {
    const [schools] = await pool.query('SELECT * FROM schools ORDER BY name');
    const [majors] = await pool.query('SELECT * FROM majors ORDER BY name');
    res.render('student/apply', {
      title: 'Formulir Pendaftaran',
      user: req.user,
      applicant: await getMyApplicant(req.user.id),
      schools,
      majors,
      message: null,
      error: err.message,
    });
  }
}

async function showDocuments(req, res) {
  const applicant = await getMyApplicant(req.user.id);
  let documents = [];
  if (applicant) {
    const [rows] = await pool.query('SELECT * FROM documents WHERE applicant_id=? ORDER BY created_at DESC', [applicant.id]);
    documents = rows;
  }
  res.render('student/documents', {
    title: 'Dokumen',
    user: req.user,
    applicant,
    documents,
    message: null,
    error: null,
  });
}

async function uploadDocument(req, res) {
  const applicant = await getMyApplicant(req.user.id);
  if (!applicant) return res.redirect('/dashboard/apply');
  if (!req.file) return res.redirect('/dashboard/documents');
  const { type } = req.body;
  try {
    await pool.query('INSERT INTO documents (applicant_id, type, file_path) VALUES (?,?,?)', [applicant.id, type, `/uploads/${req.file.filename}`]);
    res.redirect('/dashboard/documents');
  } catch (err) {
    res.redirect('/dashboard/documents');
  }
}

async function deleteDocument(req, res) {
  const applicant = await getMyApplicant(req.user.id);
  if (!applicant) return res.redirect('/dashboard');
  try {
    const [rows] = await pool.query('SELECT applicant_id FROM documents WHERE id=?', [req.params.id]);
    if (rows.length && rows[0].applicant_id === applicant.id) {
      await pool.query('DELETE FROM documents WHERE id=?', [req.params.id]);
    }
  } catch (err) { /* ignore */ }
  res.redirect('/dashboard/documents');
}

async function showPayment(req, res) {
  const applicant = await getMyApplicant(req.user.id);
  let payments = [];
  if (applicant) {
    const [rows] = await pool.query('SELECT * FROM payments WHERE applicant_id=? ORDER BY created_at DESC', [applicant.id]);
    payments = rows;
  }
  res.render('student/payment', {
    title: 'Pembayaran',
    user: req.user,
    applicant,
    payments,
    message: null,
    error: null,
  });
}

async function uploadPayment(req, res) {
  const applicant = await getMyApplicant(req.user.id);
  if (!applicant) return res.redirect('/dashboard/apply');
  if (!req.file) return res.redirect('/dashboard/payment');
  const { amount } = req.body;
  try {
    await pool.query('INSERT INTO payments (applicant_id, amount, proof_path) VALUES (?,?,?)', [applicant.id, amount || 0, `/uploads/${req.file.filename}`]);
    res.redirect('/dashboard/payment');
  } catch (err) {
    res.redirect('/dashboard/payment');
  }
}

module.exports = {
  dashboard,
  showApply,
  submitApply,
  showDocuments,
  uploadDocument,
  deleteDocument,
  showPayment,
  uploadPayment,
};