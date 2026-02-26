const { createCrudController } = require('../utils/crud');
const service = require('../services/tratamientoMedicamento.service');

const base = createCrudController(service);

async function bulkCreate(req, res, next) {
  try {
    const data = await service.bulkCreate(req.body);
    return res.status(201).json(data);
  } catch (err) { return next(err); }
}

module.exports = { ...base, bulkCreate };
