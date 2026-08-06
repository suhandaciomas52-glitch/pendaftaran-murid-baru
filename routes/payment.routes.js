const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/paymentController');

router.use(authenticate);
router.get('/', authorize('super_admin', 'admin_school'), ctrl.list);
router.get('/applicant/:applicant_id', ctrl.getByApplicant);
router.post('/applicant/:applicant_id', upload.single('proof'), ctrl.create);
router.patch('/:id/verify', authorize('super_admin', 'admin_school'), ctrl.verify);
router.delete('/:id', authorize('super_admin', 'admin_school'), ctrl.remove);

module.exports = router;