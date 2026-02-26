const { createCrudController } = require('../utils/crud');
const service = require('../services/mascotaVacunas.service');

module.exports = createCrudController(service);
