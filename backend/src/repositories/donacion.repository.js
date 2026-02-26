const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT id, usuario_id, nombre_donante, tipo, monto, descripcion_especie, fecha_donacion,
                     estado, fecha_creacion, fecha_actualizacion
               FROM donacion
               WHERE estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT id, usuario_id, nombre_donante, tipo, monto, descripcion_especie, fecha_donacion,
                     estado, fecha_creacion, fecha_actualizacion
               FROM donacion
               WHERE id = ? AND estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO donacion
    (usuario_id, nombre_donante, tipo, monto, descripcion_especie, fecha_donacion, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    data.usuario_id,
    data.nombre_donante || null,
    data.tipo,
    data.monto ?? null,
    data.descripcion_especie || null,
    data.fecha_donacion || null,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE donacion
               SET usuario_id = ?, nombre_donante = ?, tipo = ?, monto = ?, descripcion_especie = ?, fecha_donacion = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.usuario_id,
    data.nombre_donante || null,
    data.tipo,
    data.monto ?? null,
    data.descripcion_especie || null,
    data.fecha_donacion || null,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE donacion SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
