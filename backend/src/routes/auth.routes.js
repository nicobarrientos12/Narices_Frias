const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

router.get('/captcha', ctrl.captcha);
router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/forgot', ctrl.forgot);
router.post('/reset', ctrl.reset);

module.exports = router;
