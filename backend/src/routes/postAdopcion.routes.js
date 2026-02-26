const router = require('express').Router();
const ctrl = require('../controllers/postAdopcion.controller');
const { upload } = require('../middlewares/upload.middleware');

router.get('/preview', ctrl.preview);
router.get('/reporte/pdf', ctrl.reportPdf);
router.get('/adopciones-disponibles', ctrl.adopcionesDisponibles);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', upload.single('foto_url'), ctrl.create);
router.put('/:id', upload.single('foto_url'), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
