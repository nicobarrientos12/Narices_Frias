const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT ma.id,
                     ma.mascota_id,
                     ma.alergia_id,
                     ma.observaciones,
                     ma.estado,
                     ma.fecha_creacion,
                     ma.fecha_actualizacion,
                     m.nombre AS mascota,
                     a.nombre AS alergia
               FROM mascota_alergia ma
               JOIN mascota m ON m.id = ma.mascota_id
               JOIN alergia a ON a.id = ma.alergia_id
               WHERE ma.estado = 1
                 AND m.estado = 1
                 AND a.estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT ma.id,
                     ma.mascota_id,
                     ma.alergia_id,
                     ma.observaciones,
                     ma.estado,
                     ma.fecha_creacion,
                     ma.fecha_actualizacion,
                     m.nombre AS mascota,
                     a.nombre AS alergia
               FROM mascota_alergia ma
               JOIN mascota m ON m.id = ma.mascota_id
               JOIN alergia a ON a.id = ma.alergia_id
               WHERE ma.id = ?
                 AND ma.estado = 1
                 AND m.estado = 1
                 AND a.estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO mascota_alergia
    (mascota_id, alergia_id, observaciones, estado)
    VALUES (?, ?, ?, ?)`;
  const params = [
    data.mascota_id,
    data.alergia_id,
    data.observaciones || null,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE mascota_alergia
               SET mascota_id = ?, alergia_id = ?, observaciones = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.mascota_id,
    data.alergia_id,
    data.observaciones || null,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE mascota_alergia SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
