const { createCrudController } = require('../utils/crud');
const service = require('../services/mascotaAlergia.service');

module.exports = createCrudController(service);
