const router = require('express').Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'EduEnroll API', time: new Date().toISOString() });
});

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/schools', require('./school.routes'));
router.use('/majors', require('./major.routes'));
router.use('/applicants', require('./applicant.routes'));
router.use('/documents', require('./document.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/announcements', require('./announcement.routes'));

module.exports = router;