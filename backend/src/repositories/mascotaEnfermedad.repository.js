const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT me.id,
                     me.mascota_id,
                     me.enfermedad_id,
                     me.fecha_diagnostico,
                     me.observaciones,
                     me.estado,
                     me.fecha_creacion,
                     me.fecha_actualizacion,
                     m.nombre AS mascota,
                     e.nombre AS enfermedad
               FROM mascota_enfermedad me
               JOIN mascota m ON m.id = me.mascota_id
               JOIN enfermedad e ON e.id = me.enfermedad_id
               WHERE me.estado = 1
                 AND m.estado = 1
                 AND e.estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT me.id,
                     me.mascota_id,
                     me.enfermedad_id,
                     me.fecha_diagnostico,
                     me.observaciones,
                     me.estado,
                     me.fecha_creacion,
                     me.fecha_actualizacion,
                     m.nombre AS mascota,
                     e.nombre AS enfermedad
               FROM mascota_enfermedad me
               JOIN mascota m ON m.id = me.mascota_id
               JOIN enfermedad e ON e.id = me.enfermedad_id
               WHERE me.id = ?
                 AND me.estado = 1
                 AND m.estado = 1
                 AND e.estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO mascota_enfermedad
    (mascota_id, enfermedad_id, fecha_diagnostico, observaciones, estado)
    VALUES (?, ?, ?, ?, ?)`;
  const params = [
    data.mascota_id,
    data.enfermedad_id,
    data.fecha_diagnostico || null,
    data.observaciones || null,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE mascota_enfermedad
               SET mascota_id = ?, enfermedad_id = ?, fecha_diagnostico = ?, observaciones = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.mascota_id,
    data.enfermedad_id,
    data.fecha_diagnostico || null,
    data.observaciones || null,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE mascota_enfermedad SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
