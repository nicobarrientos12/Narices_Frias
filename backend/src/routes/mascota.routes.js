const router = require('express').Router();
const ctrl = require('../controllers/mascota.controller');
const { upload } = require('../middlewares/upload.middleware');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', upload.single('foto'), ctrl.create);
router.put('/:id', upload.single('foto'), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
