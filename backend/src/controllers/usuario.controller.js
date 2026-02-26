const { createCrudController } = require('../utils/crud');
const service = require('../services/usuario.service');

const base = createCrudController(service);

async function fetchVeterinarios(req, res, next) {
  try {
    const data = await service.listVeterinarios();
    return res.json(data);
  } catch (err) { return next(err); }
}

module.exports = { ...base, fetchVeterinarios };
