const { createCrudController } = require('../utils/crud');
const service = require('../services/dueno.service');

module.exports = createCrudController(service);
