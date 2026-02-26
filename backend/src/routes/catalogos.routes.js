const router = require('express').Router();
const ctrl = require('../controllers/catalogos.controller');

router.get('/mascotas', ctrl.mascotas);
router.get('/vacunas', ctrl.vacunas);
router.get('/enfermedades', ctrl.enfermedades);

module.exports = router;
