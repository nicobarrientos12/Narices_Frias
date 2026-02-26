const { createCrudController } = require('../utils/crud');
const service = require('../services/medicamento.service');

module.exports = createCrudController(service);
