const router = require('express').Router();
const ctrl = require('../controllers/tratamientoMedicamento.controller');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.post('/bulk', ctrl.bulkCreate);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
