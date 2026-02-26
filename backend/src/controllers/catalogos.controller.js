const service = require('../services/catalogos.service');

async function mascotas(req, res, next) {
  try {
    const data = await service.getMascotas();
    return res.json(data);
  } catch (err) { return next(err); }
}

async function vacunas(req, res, next) {
  try {
    const data = await service.getVacunas();
    return res.json(data);
  } catch (err) { return next(err); }
}

async function enfermedades(req, res, next) {
  try {
    const data = await service.getEnfermedades();
    return res.json(data);
  } catch (err) { return next(err); }
}

module.exports = { mascotas, vacunas, enfermedades };
