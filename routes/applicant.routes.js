const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/applicantController');

router.use(authenticate);
router.get('/', authorize('super_admin', 'admin_school'), ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.patch('/:id/status', authorize('super_admin', 'admin_school'), ctrl.updateStatus);
router.delete('/:id', authorize('super_admin', 'admin_school'), ctrl.remove);

module.exports = router;