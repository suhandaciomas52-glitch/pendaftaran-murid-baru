const router = require('express').Router();
const multer = require('multer');
const path = require('path');

const webCtrl = require('../controllers/webController');
const studentCtrl = require('../controllers/studentController');
const adminCtrl = require('../controllers/adminController');
const pdfCtrl = require('../controllers/pdfController');
const { requireAuth, requireRole } = require('../middleware/webauth');
const upload = require('../middleware/upload');

// ---------- Publik ----------
router.get('/', webCtrl.home);
router.get('/announcements', webCtrl.announcements);

// ---------- Auth ----------
router.get('/login', webCtrl.showLogin);
router.post('/login', webCtrl.doLogin);
router.get('/register', webCtrl.showRegister);
router.post('/register', webCtrl.doRegister);
router.get('/logout', webCtrl.logout);

// ---------- Calon Siswa ----------
router.use('/dashboard', requireAuth);
router.get('/dashboard', studentCtrl.dashboard);
router.get('/dashboard/apply', studentCtrl.showApply);
router.post('/dashboard/apply', studentCtrl.submitApply);
router.get('/dashboard/documents', studentCtrl.showDocuments);
router.post('/dashboard/documents', upload.single('file'), studentCtrl.uploadDocument);
router.post('/dashboard/documents/:id/delete', studentCtrl.deleteDocument);
router.get('/dashboard/payment', studentCtrl.showPayment);
router.post('/dashboard/payment', upload.single('proof'), studentCtrl.uploadPayment);

// ---------- Bukti PDF ----------
router.get('/bukti/:id.pdf', requireAuth, pdfCtrl.buktiPendaftaran);

// ---------- Admin / Super Admin ----------
router.use('/admin', requireAuth, requireRole('super_admin', 'admin_school'));
router.get('/admin', adminCtrl.dashboard);
router.get('/admin/applicants', adminCtrl.listApplicants);
router.get('/admin/applicants/:id', adminCtrl.applicantDetail);
router.post('/admin/applicants/:id/status', adminCtrl.updateApplicantStatus);
router.post('/admin/payments/:id/verify', adminCtrl.verifyPayment);

router.get('/admin/schools', requireRole('super_admin'), adminCtrl.schools);
router.post('/admin/schools', requireRole('super_admin'), adminCtrl.createSchool);
router.get('/admin/majors', adminCtrl.majors);
router.post('/admin/majors', adminCtrl.createMajor);
router.get('/admin/announcements', adminCtrl.announcements);
router.post('/admin/announcements', adminCtrl.createAnnouncement);
router.post('/admin/announcements/:id/delete', adminCtrl.deleteAnnouncement);

module.exports = router;