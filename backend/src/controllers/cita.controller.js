const { createCrudController } = require('../utils/crud');
const service = require('../services/cita.service');

module.exports = createCrudController(service);
