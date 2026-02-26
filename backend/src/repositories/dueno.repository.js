const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT id, nombre, direccion, telefono, correo, latitud, longitud, estado, fecha_creacion, fecha_actualizacion
               FROM dueno
               WHERE estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT id, nombre, direccion, telefono, correo, latitud, longitud, estado, fecha_creacion, fecha_actualizacion
               FROM dueno WHERE id = ? AND estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO dueno (nombre, direccion, telefono, correo, latitud, longitud, estado)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    data.nombre,
    data.direccion || null,
    data.telefono || null,
    data.correo || null,
    data.latitud || null,
    data.longitud || null,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE dueno SET nombre = ?, direccion = ?, telefono = ?, correo = ?, latitud = ?, longitud = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.nombre,
    data.direccion || null,
    data.telefono || null,
    data.correo || null,
    data.latitud || null,
    data.longitud || null,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE dueno SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
