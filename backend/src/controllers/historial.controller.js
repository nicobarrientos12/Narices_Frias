const { createCrudController } = require('../utils/crud');
const service = require('../services/historial.service');

const base = createCrudController(service);

async function reportPdf(req, res, next) {
  try {
    const buffer = await service.reportPdf(req.query.mascotaId);
    const id = req.query.mascotaId || 'historial';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="historial-clinico-${id}.pdf"`);
    return res.status(200).send(buffer);
  } catch (err) { return next(err); }
}

async function listMascotas(req, res, next) {
  try {
    const data = await service.listMascotas();
    return res.json(data);
  } catch (err) { return next(err); }
}

module.exports = { ...base, reportPdf, listMascotas };
