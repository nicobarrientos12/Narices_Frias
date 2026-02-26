const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT tm.id,
                     tm.tratamiento_id,
                     tm.medicamento_id,
                     tm.dosis,
                     tm.frecuencia,
                     tm.duracion,
                     tm.estado,
                     tm.fecha_creacion,
                     tm.fecha_actualizacion,
                     m.nombre AS mascota,
                     CONCAT(u.nombre, ' ', u.primer_apellido) AS veterinario,
                     md.nombre AS medicamento,
                     t.diagnostico
               FROM tratamiento_medicamento tm
               JOIN tratamiento t ON t.id = tm.tratamiento_id
               JOIN mascota m ON m.id = t.mascota_id
               JOIN usuario u ON u.id = t.usuario_id
               JOIN medicamento md ON md.id = tm.medicamento_id
               WHERE tm.estado = 1
                 AND t.estado = 1
                 AND m.estado = 1
                 AND u.estado = 1
                 AND md.estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT tm.id,
                     tm.tratamiento_id,
                     tm.medicamento_id,
                     tm.dosis,
                     tm.frecuencia,
                     tm.duracion,
                     tm.estado,
                     tm.fecha_creacion,
                     tm.fecha_actualizacion,
                     m.nombre AS mascota,
                     CONCAT(u.nombre, ' ', u.primer_apellido) AS veterinario,
                     md.nombre AS medicamento,
                     t.diagnostico
               FROM tratamiento_medicamento tm
               JOIN tratamiento t ON t.id = tm.tratamiento_id
               JOIN mascota m ON m.id = t.mascota_id
               JOIN usuario u ON u.id = t.usuario_id
               JOIN medicamento md ON md.id = tm.medicamento_id
               WHERE tm.id = ?
                 AND tm.estado = 1
                 AND t.estado = 1
                 AND m.estado = 1
                 AND u.estado = 1
                 AND md.estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO tratamiento_medicamento
    (tratamiento_id, medicamento_id, dosis, frecuencia, duracion, estado)
    VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [
    data.tratamiento_id,
    data.medicamento_id,
    data.dosis || null,
    data.frecuencia || null,
    data.duracion || null,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE tratamiento_medicamento
               SET tratamiento_id = ?, medicamento_id = ?, dosis = ?, frecuencia = ?, duracion = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.tratamiento_id,
    data.medicamento_id,
    data.dosis || null,
    data.frecuencia || null,
    data.duracion || null,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE tratamiento_medicamento SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
