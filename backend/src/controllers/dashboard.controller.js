const service = require('../services/dashboard.service');

async function overview(req, res, next) {
  try {
    const data = await service.overview(req.query, req);
    return res.json(data);
  } catch (err) { return next(err); }
}

async function exportPdf(req, res, next) {
  try {
    await service.exportPdf(req.query);
    return res.status(501).json({ message: 'Export PDF no implementado' });
  } catch (err) { return next(err); }
}

async function exportExcel(req, res, next) {
  try {
    await service.exportExcel(req.query);
    return res.status(501).json({ message: 'Export Excel no implementado' });
  } catch (err) { return next(err); }
}

module.exports = { overview, exportPdf, exportExcel };
