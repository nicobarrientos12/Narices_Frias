const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT id, nombre, descripcion, precio, estado, fecha_creacion, fecha_actualizacion
               FROM vacuna
               WHERE estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT id, nombre, descripcion, precio, estado, fecha_creacion, fecha_actualizacion
               FROM vacuna
               WHERE id = ? AND estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO vacuna (nombre, descripcion, precio, estado)
               VALUES (?, ?, ?, ?)`;
  const params = [
    data.nombre,
    data.descripcion || null,
    data.precio ?? null,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE vacuna
               SET nombre = ?, descripcion = ?, precio = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.nombre,
    data.descripcion || null,
    data.precio ?? null,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE vacuna SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
