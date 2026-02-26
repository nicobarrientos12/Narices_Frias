const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT mv.id,
                     mv.mascota_id,
                     mv.vacuna_id,
                     mv.fecha_aplicacion,
                     mv.proxima_aplicacion,
                     mv.usuario_id,
                     mv.estado,
                     mv.fecha_creacion,
                     mv.fecha_actualizacion,
                     m.nombre AS mascota,
                     v.nombre AS vacuna
               FROM mascota_vacuna mv
               JOIN mascota m ON m.id = mv.mascota_id
               JOIN vacuna v ON v.id = mv.vacuna_id
               WHERE mv.estado = 1
                 AND m.estado = 1
                 AND v.estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT mv.id,
                     mv.mascota_id,
                     mv.vacuna_id,
                     mv.fecha_aplicacion,
                     mv.proxima_aplicacion,
                     mv.usuario_id,
                     mv.estado,
                     mv.fecha_creacion,
                     mv.fecha_actualizacion,
                     m.nombre AS mascota,
                     v.nombre AS vacuna
               FROM mascota_vacuna mv
               JOIN mascota m ON m.id = mv.mascota_id
               JOIN vacuna v ON v.id = mv.vacuna_id
               WHERE mv.id = ?
                 AND mv.estado = 1
                 AND m.estado = 1
                 AND v.estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO mascota_vacuna
    (mascota_id, vacuna_id, fecha_aplicacion, proxima_aplicacion, usuario_id, estado)
    VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [
    data.mascota_id,
    data.vacuna_id,
    data.fecha_aplicacion || null,
    data.proxima_aplicacion || null,
    data.usuario_id,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE mascota_vacuna
               SET mascota_id = ?, vacuna_id = ?, fecha_aplicacion = ?, proxima_aplicacion = ?, usuario_id = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.mascota_id,
    data.vacuna_id,
    data.fecha_aplicacion || null,
    data.proxima_aplicacion || null,
    data.usuario_id,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE mascota_vacuna SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
