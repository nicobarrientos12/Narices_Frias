const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT t.id,
                     t.mascota_id,
                     t.diagnostico,
                     t.fecha_inicio,
                     t.fecha_fin,
                     t.precio,
                     t.observaciones,
                     t.usuario_id,
                     t.estado,
                     t.fecha_creacion,
                     t.fecha_actualizacion,
                     m.nombre AS mascota,
                     CONCAT(u.nombre, ' ', u.primer_apellido) AS veterinario
               FROM tratamiento t
               JOIN mascota m ON m.id = t.mascota_id
               JOIN usuario u ON u.id = t.usuario_id
               WHERE t.estado = 1
                 AND m.estado = 1
                 AND u.estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT t.id,
                     t.mascota_id,
                     t.diagnostico,
                     t.fecha_inicio,
                     t.fecha_fin,
                     t.precio,
                     t.observaciones,
                     t.usuario_id,
                     t.estado,
                     t.fecha_creacion,
                     t.fecha_actualizacion,
                     m.nombre AS mascota,
                     CONCAT(u.nombre, ' ', u.primer_apellido) AS veterinario
               FROM tratamiento t
               JOIN mascota m ON m.id = t.mascota_id
               JOIN usuario u ON u.id = t.usuario_id
               WHERE t.id = ?
                 AND t.estado = 1
                 AND m.estado = 1
                 AND u.estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO tratamiento
    (mascota_id, diagnostico, fecha_inicio, fecha_fin, precio, observaciones, usuario_id, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    data.mascota_id,
    data.diagnostico || null,
    data.fecha_inicio || null,
    data.fecha_fin || null,
    data.precio ?? null,
    data.observaciones || null,
    data.usuario_id,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE tratamiento
               SET mascota_id = ?, diagnostico = ?, fecha_inicio = ?, fecha_fin = ?, precio = ?, observaciones = ?, usuario_id = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.mascota_id,
    data.diagnostico || null,
    data.fecha_inicio || null,
    data.fecha_fin || null,
    data.precio ?? null,
    data.observaciones || null,
    data.usuario_id,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE tratamiento SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
