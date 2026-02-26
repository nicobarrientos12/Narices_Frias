const { createCrudController } = require('../utils/crud');
const service = require('../services/campania.service');

module.exports = createCrudController(service);
