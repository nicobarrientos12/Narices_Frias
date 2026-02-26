const router = require('express').Router();
const { authRequired } = require('../middlewares/auth.middleware');

const authRoutes = require('./auth.routes');
const adopcionRoutes = require('./adopcion.routes');
const alergiaRoutes = require('./alergia.routes');
const campaniaRoutes = require('./campania.routes');
const citaRoutes = require('./cita.routes');
const calendarioRoutes = require('./calendario.routes');
const dashboardRoutes = require('./dashboard.routes');
const donacionRoutes = require('./donacion.routes');
const duenoRoutes = require('./dueno.routes');
const enfermedadRoutes = require('./enfermedad.routes');
const historialRoutes = require('./historial.routes');
const mascotaRoutes = require('./mascota.routes');
const mascotaEnfermedadRoutes = require('./mascotaEnfermedad.routes');
const mascotaAlergiaRoutes = require('./mascotaAlergia.routes');
const mascotaVacunasRoutes = require('./mascotaVacunas.routes');
const medicamentoRoutes = require('./medicamento.routes');
const postAdopcionRoutes = require('./postAdopcion.routes');
const tratamientoRoutes = require('./tratamiento.routes');
const tratamientoMedicamentoRoutes = require('./tratamientoMedicamento.routes');
const usuarioRoutes = require('./usuario.routes');
const vacunaRoutes = require('./vacuna.routes');
const catalogosRoutes = require('./catalogos.routes');

router.use('/auth', authRoutes);

router.use(authRequired);

router.use('/adopciones', adopcionRoutes);
router.use('/alergias', alergiaRoutes);
router.use('/campanias', campaniaRoutes);
router.use('/citas', citaRoutes);
router.use('/calendario', calendarioRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/donaciones', donacionRoutes);
router.use('/duenos', duenoRoutes);
router.use('/enfermedades', enfermedadRoutes);
router.use('/historial', historialRoutes);
router.use('/mascotas', mascotaRoutes);
router.use('/mascota-enfermedad', mascotaEnfermedadRoutes);
router.use('/mascota-alergia', mascotaAlergiaRoutes);
router.use('/mascota-vacunas', mascotaVacunasRoutes);
router.use('/medicamentos', medicamentoRoutes);
router.use('/post-adopcion', postAdopcionRoutes);
router.use('/tratamientos', tratamientoRoutes);
router.use('/tratamiento-medicamento', tratamientoMedicamentoRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/vacunas', vacunaRoutes);
router.use('/catalogos', catalogosRoutes);

module.exports = router;
