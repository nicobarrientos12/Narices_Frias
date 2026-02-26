const { createCrudController } = require('../utils/crud');
const service = require('../services/donacion.service');

module.exports = createCrudController(service);
