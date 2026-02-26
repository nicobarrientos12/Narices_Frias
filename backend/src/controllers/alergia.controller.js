const { createCrudController } = require('../utils/crud');
const service = require('../services/alergia.service');

module.exports = createCrudController(service);
