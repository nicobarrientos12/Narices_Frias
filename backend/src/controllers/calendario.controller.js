const service = require('../services/calendario.service');

async function getByDate(req, res, next) {
  try {
    const data = await service.getByDate(req.params.fecha);
    return res.json(data);
  } catch (err) { return next(err); }
}

async function notifyMail(req, res, next) {
  try {
    const data = await service.notifyMail(req.body);
    return res.json(data);
  } catch (err) { return next(err); }
}

async function notifyWhatsApp(req, res, next) {
  try {
    const data = await service.notifyWhatsApp(req.body);
    return res.json(data);
  } catch (err) { return next(err); }
}

module.exports = { getByDate, notifyMail, notifyWhatsApp };
