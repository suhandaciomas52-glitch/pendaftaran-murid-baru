const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/announcementController');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);

router.use(authenticate);
router.post('/', authorize('super_admin', 'admin_school'), ctrl.create);
router.put('/:id', authorize('super_admin', 'admin_school'), ctrl.update);
router.delete('/:id', authorize('super_admin', 'admin_school'), ctrl.remove);

module.exports = router;