function notFound(req, res) {
  res.status(404).json({ message: 'Ruta no encontrada' });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Error interno';
  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
