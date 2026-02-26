const router = require('express').Router();
const ctrl = require('../controllers/calendario.controller');

router.post('/notificar/correo', ctrl.notifyMail);
router.post('/notificar/whatsapp', ctrl.notifyWhatsApp);
router.get('/:fecha', ctrl.getByDate);

module.exports = router;
