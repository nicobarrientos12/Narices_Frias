const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT id, usuario_id, nombre, fecha, monto_invertido, total_recaudado, ganancia,
                     estado, fecha_creacion, fecha_actualizacion
               FROM campania
               WHERE estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT id, usuario_id, nombre, fecha, monto_invertido, total_recaudado, ganancia,
                     estado, fecha_creacion, fecha_actualizacion
               FROM campania
               WHERE id = ? AND estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO campania
    (usuario_id, nombre, fecha, monto_invertido, total_recaudado, ganancia, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    data.usuario_id,
    data.nombre,
    data.fecha || null,
    data.monto_invertido ?? null,
    data.total_recaudado ?? null,
    data.ganancia ?? null,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE campania
               SET usuario_id = ?, nombre = ?, fecha = ?, monto_invertido = ?, total_recaudado = ?, ganancia = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.usuario_id,
    data.nombre,
    data.fecha || null,
    data.monto_invertido ?? null,
    data.total_recaudado ?? null,
    data.ganancia ?? null,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE campania SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
