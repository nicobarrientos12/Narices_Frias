const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

router.post('/login', ctrl.login);
router.post('/forgot', ctrl.forgot);
router.post('/reset', ctrl.reset);

module.exports = router;
