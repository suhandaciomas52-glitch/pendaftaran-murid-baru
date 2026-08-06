const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/documentController');

router.use(authenticate);
router.get('/applicant/:applicant_id', ctrl.list);
router.post('/applicant/:applicant_id', upload.single('file'), ctrl.uploadDoc);
router.delete('/:id', ctrl.remove);

module.exports = router;