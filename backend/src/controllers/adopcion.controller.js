const { createCrudController } = require('../utils/crud');
const service = require('../services/adopcion.service');

const base = createCrudController(service);

async function disponibles(req, res, next) {
  try {
    const data = await service.disponibles();
    return res.json(data);
  } catch (err) { return next(err); }
}

module.exports = { ...base, disponibles };
