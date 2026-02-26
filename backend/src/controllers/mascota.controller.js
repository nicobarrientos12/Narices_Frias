const { createCrudController } = require('../utils/crud');
const service = require('../services/mascota.service');

module.exports = createCrudController(service);
