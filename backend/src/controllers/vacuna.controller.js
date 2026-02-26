const { createCrudController } = require('../utils/crud');
const service = require('../services/vacuna.service');

module.exports = createCrudController(service);
