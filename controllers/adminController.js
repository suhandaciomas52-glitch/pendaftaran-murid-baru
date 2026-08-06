const pool = require('../config/db');

// Scope: super_admin melihat semua; admin_school hanya sekolahnya.
function scopeWhere(user) {
  if (user.role === 'super_admin') return { sql: '', param: [] };
  return { sql: ' WHERE a.school_id = ?', param: [user.school_id] };
}

async function dashboard(req, res) {
  try {
    const scope = scopeWhere(req.user);
    const [appCount] = await pool.query(`SELECT COUNT(*) AS c FROM applicants a${scope.sql}`, scope.param);
    const [pending] = await pool.query(`SELECT COUNT(*) AS c FROM applicants a${scope.sql ? scope.sql + ' AND a.status=? ' : ' WHERE a.status=?'}`, [...scope.param, 'pending']);
    const [payments] = await pool.query('SELECT COUNT(*) AS c FROM payments');
    const [annCount] = await pool.query('SELECT COUNT(*) AS c FROM announcements');
    const [schools] = await pool.query('SELECT * FROM schools ORDER BY name');
    const [applicants] = await pool.query(
      `SELECT a.*, m.name AS major_name, s.name AS school_name
       FROM applicants a
       LEFT JOIN majors m ON m.id = a.major_id
       LEFT JOIN schools s ON s.id = a.school_id
       ${scope.sql}
       ORDER BY a.created_at DESC LIMIT 8`,
      scope.param
    );
    res.render('admin/dashboard', {
      title: 'Dashboard Admin',
      user: req.user,
      schools,
      applicants,
      message: null,
      error: null,
      stats: {
        applicants: appCount[0].c,
        pending: pending[0].c,
        payments: payments[0].c,
        announcements: annCount[0].c,
      },
    });
  } catch (err) {
    res.render('admin/dashboard', { title: 'Dashboard', user: req.user, schools: [], applicants: [], stats: {}, message: null, error: err.message });
  }
}

async function listApplicants(req, res) {
  const { status } = req.query;
  const scope = scopeWhere(req.user);
  let where = scope.sql;
  const param = [...scope.param];
  if (status && status !== 'all') {
    where += where ? ' AND a.status=?' : ' WHERE a.status=?';
    param.push(status);
  }
  try {
    const [applicants] = await pool.query(
      `SELECT a.*, m.name AS major_name, s.name AS school_name
       FROM applicants a
       LEFT JOIN majors m ON m.id = a.major_id
       LEFT JOIN schools s ON s.id = a.school_id
       ${where}
       ORDER BY a.created_at DESC`,
      param
    );
    res.render('admin/applicants', {
      title: 'Daftar Pendaftar',
      user: req.user,
      applicants,
      statusFilter: status || 'all',
      message: null,
      error: null,
    });
  } catch (err) {
    res.render('admin/applicants', { title: 'Daftar Pendaftar', user: req.user, applicants: [], statusFilter: status || 'all', message: null, error: err.message });
  }
}

async function applicantDetail(req, res) {
  try {
    const [applicants] = await pool.query(
      `SELECT a.*, m.name AS major_name, s.name AS school_name
       FROM applicants a
       LEFT JOIN majors m ON m.id = a.major_id
       LEFT JOIN schools s ON s.id = a.school_id
       WHERE a.id=?`,
      [req.params.id]
    );
    if (!applicants.length) return res.render('error', { status: 404, message: 'Pendaftar tidak ditemukan.' });
    const [documents] = await pool.query('SELECT * FROM documents WHERE applicant_id=?', [req.params.id]);
    const [payments] = await pool.query('SELECT * FROM payments WHERE applicant_id=?', [req.params.id]);
    // admin school validation
    if (req.user.role === 'admin_school' && applicants[0].school_id !== req.user.school_id) {
      return res.render('error', { status: 403, message: 'Akses ditolak.' });
    }
    res.render('admin/applicantDetail', { title: 'Detail Pendaftar', user: req.user, applicant: applicants[0], documents, payments, message: null, error: null });
  } catch (err) {
    res.render('error', { status: 500, message: err.message });
  }
}

async function updateApplicantStatus(req, res) {
  const { status } = req.body;
  const allowed = ['pending', 'verified', 'accepted', 'rejected'];
  if (!allowed.includes(status)) return res.redirect(`/admin/applicants/${req.params.id}`);
try {
    await pool.query('UPDATE applicants SET status=? WHERE id=?', [status, req.params.id]);
  } catch (err) { /* ignore */ }
  res.redirect(`/admin/applicants/${req.params.id}`);
}

async function verifyPayment(req, res) {
  const { status } = req.body;
  try {
    await pool.query('UPDATE payments SET status=?, verified_by=?, verified_at=NOW() WHERE id=?', [status, req.user.id, req.params.id]);
  } catch (err) { /* ignore */ }
  const [rows] = await pool.query('SELECT applicant_id FROM payments WHERE id=?', [req.params.id]);
  res.redirect(`/admin/applicants/${rows[0] ? rows[0].applicant_id : ''}`);
}

// ---------- Kelola master (schools, majors, announcements) ----------
async function schools(req, res) {
  const [schools] = await pool.query('SELECT * FROM schools ORDER BY name');
  res.render('admin/schools', { title: 'Kelola Sekolah', user: req.user, schools, message: null, error: null });
}
async function createSchool(req, res) {
  const { name, npsn, address, phone } = req.body;
  try {
    await pool.query('INSERT INTO schools (name, npsn, address, phone) VALUES (?,?,?,?)', [name, npsn || null, address || null, phone || null]);
  } catch (err) { /* ignore */ }
  res.redirect('/admin/schools');
}

async function majors(req, res) {
  const [majors] = await pool.query('SELECT * FROM majors ORDER BY name');
  const [schools] = await pool.query('SELECT * FROM schools ORDER BY name');
  res.render('admin/majors', { title: 'Kelola Jurusan', user: req.user, majors, schools, message: null, error: null });
}
async function createMajor(req, res) {
  const { school_id, code, name, quota } = req.body;
  try {
    await pool.query('INSERT INTO majors (school_id, code, name, quota) VALUES (?,?,?,?)', [school_id || req.user.school_id, code || null, name, quota || 0]);
  } catch (err) { /* ignore */ }
  res.redirect('/admin/majors');
}

async function announcementsPage(req, res) {
  const [announcements] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
  res.render('admin/announcements', { title: 'Kelola Pengumuman', user: req.user, announcements, message: null, error: null });
}
async function createAnnouncement(req, res) {
  const { title, content } = req.body;
  try {
    await pool.query('INSERT INTO announcements (school_id, title, content) VALUES (?,?,?)', [req.user.school_id, title, content]);
  } catch (err) { /* ignore */ }
  res.redirect('/admin/announcements');
}
async function deleteAnnouncement(req, res) {
  try { await pool.query('DELETE FROM announcements WHERE id=?', [req.params.id]); } catch (err) { /* ignore */ }
  res.redirect('/admin/announcements');
}

module.exports = {
  dashboard,
  listApplicants,
  applicantDetail,
  updateApplicantStatus,
  verifyPayment,
  schools,
  createSchool,
  majors,
  createMajor,
  announcements: announcementsPage,
  createAnnouncement,
  deleteAnnouncement,
};