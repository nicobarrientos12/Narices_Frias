const { createCrudController } = require('../utils/crud');
const service = require('../services/postAdopcion.service');

const base = createCrudController(service);

async function preview(req, res, next) {
  try {
    const data = await service.preview(req.query.adopcionId);
    return res.json(data);
  } catch (err) { return next(err); }
}

async function reportPdf(req, res, next) {
  try {
    const buffer = await service.reportPdf(req.query.adopcionId);
    const id = req.query.adopcionId || 'reporte';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="post-adopcion-${id}.pdf"`);
    return res.status(200).send(buffer);
  } catch (err) { return next(err); }
}

async function adopcionesDisponibles(req, res, next) {
  try {
    const data = await service.adopcionesDisponibles();
    return res.json(data);
  } catch (err) { return next(err); }
}

module.exports = { ...base, preview, reportPdf, adopcionesDisponibles };
