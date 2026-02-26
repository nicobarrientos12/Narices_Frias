const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT a.id,
                     a.mascota_id,
                     a.dueno_id,
                     a.fecha_solicitud,
                     a.fecha_aprobacion,
                     a.estado_llegada,
                     a.observaciones,
                     a.usuario_id,
                     a.estado,
                     a.fecha_creacion,
                     a.fecha_actualizacion,
                     m.nombre AS nombre_mascota,
                     d.nombre AS nombre_dueno,
                     d.telefono AS telefono_dueno,
                     (
                       SELECT sp.foto_url
                       FROM seguimiento_postadopcion sp
                       WHERE sp.adopcion_id = a.id AND sp.estado = 1
                       ORDER BY COALESCE(sp.fecha, sp.fecha_creacion) DESC
                       LIMIT 1
                     ) AS foto_url
               FROM adopcion a
               JOIN mascota m ON m.id = a.mascota_id
               JOIN dueno d ON d.id = a.dueno_id
               WHERE a.estado = 1
                 AND m.estado = 1
                 AND d.estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT a.id,
                     a.mascota_id,
                     a.dueno_id,
                     a.fecha_solicitud,
                     a.fecha_aprobacion,
                     a.estado_llegada,
                     a.observaciones,
                     a.usuario_id,
                     a.estado,
                     a.fecha_creacion,
                     a.fecha_actualizacion,
                     m.nombre AS nombre_mascota,
                     d.nombre AS nombre_dueno,
                     d.telefono AS telefono_dueno,
                     (
                       SELECT sp.foto_url
                       FROM seguimiento_postadopcion sp
                       WHERE sp.adopcion_id = a.id AND sp.estado = 1
                       ORDER BY COALESCE(sp.fecha, sp.fecha_creacion) DESC
                       LIMIT 1
                     ) AS foto_url
               FROM adopcion a
               JOIN mascota m ON m.id = a.mascota_id
               JOIN dueno d ON d.id = a.dueno_id
               WHERE a.id = ?
                 AND a.estado = 1
                 AND m.estado = 1
                 AND d.estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function findDisponibles() {
  const sql = `SELECT a.id,
                     a.mascota_id,
                     a.dueno_id,
                     a.fecha_solicitud,
                     a.fecha_aprobacion,
                     a.estado_llegada,
                     a.observaciones,
                     a.usuario_id,
                     a.estado,
                     a.fecha_creacion,
                     a.fecha_actualizacion,
                     m.nombre AS nombre_mascota,
                     d.nombre AS nombre_dueno,
                     d.telefono AS telefono_dueno,
                     (
                       SELECT sp.foto_url
                       FROM seguimiento_postadopcion sp
                       WHERE sp.adopcion_id = a.id AND sp.estado = 1
                       ORDER BY COALESCE(sp.fecha, sp.fecha_creacion) DESC
                       LIMIT 1
                     ) AS foto_url
               FROM adopcion a
               JOIN mascota m ON m.id = a.mascota_id
               JOIN dueno d ON d.id = a.dueno_id
               WHERE a.estado = 1
                 AND a.estado_llegada = 'Aprobada'
                 AND m.estado = 1
                 AND d.estado = 1`;
  return query(sql);
}

async function create(data) {
  const sql = `INSERT INTO adopcion
    (mascota_id, dueno_id, fecha_solicitud, fecha_aprobacion, estado_llegada, observaciones, usuario_id, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    data.mascota_id,
    data.dueno_id,
    data.fecha_solicitud,
    data.fecha_aprobacion || null,
    data.estado_llegada,
    data.observaciones || null,
    data.usuario_id,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE adopcion
               SET mascota_id = ?, dueno_id = ?, fecha_solicitud = ?, fecha_aprobacion = ?, estado_llegada = ?,
                   observaciones = ?, usuario_id = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.mascota_id,
    data.dueno_id,
    data.fecha_solicitud,
    data.fecha_aprobacion || null,
    data.estado_llegada,
    data.observaciones || null,
    data.usuario_id,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE adopcion SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, findDisponibles, create, update, remove };
