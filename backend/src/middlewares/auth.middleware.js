const { env } = require('../config/env');
const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No autorizado' });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalido' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.rol || req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ message: 'No tiene permisos' });
    }
    return next();
  };
}

module.exports = { authRequired, requireRole };
