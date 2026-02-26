const service = require('../services/auth.service');

async function login(req, res, next) {
  try {
    const data = await service.login(req.body || {});
    return res.json(data);
  } catch (err) { return next(err); }
}

async function forgot(req, res, next) {
  try {
    const data = await service.forgot(req.body || {});
    return res.json(data);
  } catch (err) { return next(err); }
}

async function reset(req, res, next) {
  try {
    const data = await service.reset(req.body || {});
    return res.json(data);
  } catch (err) { return next(err); }
}

module.exports = { login, forgot, reset };
