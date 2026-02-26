const { createCrudController } = require('../utils/crud');
const service = require('../services/enfermedad.service');

module.exports = createCrudController(service);
