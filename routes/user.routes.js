const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.use(authenticate);
router.get('/', authorize('super_admin'), ctrl.list);
router.get('/:id', authorize('super_admin', 'admin_school'), ctrl.getOne);
router.put('/:id', authorize('super_admin'), ctrl.update);
router.delete('/:id', authorize('super_admin'), ctrl.remove);

module.exports = router;