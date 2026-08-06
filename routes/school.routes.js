const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/schoolController');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);

router.use(authenticate);
router.post('/', authorize('super_admin'), ctrl.create);
router.put('/:id', authorize('super_admin'), ctrl.update);
router.delete('/:id', authorize('super_admin'), ctrl.remove);

module.exports = router;