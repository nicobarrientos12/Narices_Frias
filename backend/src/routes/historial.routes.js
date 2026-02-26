const router = require('express').Router();
const ctrl = require('../controllers/historial.controller');

router.get('/reporte/pdf', ctrl.reportPdf);
router.get('/mascotas', ctrl.listMascotas);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
