const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');

router.get('/', ctrl.overview);
router.get('/export/pdf', ctrl.exportPdf);
router.get('/export/excel', ctrl.exportExcel);

module.exports = router;
