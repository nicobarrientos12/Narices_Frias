const { createCrudController } = require('../utils/crud');
const service = require('../services/mascotaEnfermedad.service');

module.exports = createCrudController(service);
