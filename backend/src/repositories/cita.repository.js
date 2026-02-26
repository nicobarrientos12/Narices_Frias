const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT c.id,
                     c.mascota_id,
                     c.dueno_id,
                     c.usuario_id,
                     c.fecha,
                     c.motivo,
                     c.precio,
                     c.tipo,
                     c.observaciones,
                     c.estado,
                     c.fecha_creacion,
                     c.fecha_actualizacion,
                     m.nombre AS nombre_mascota,
                     d.nombre AS nombre_dueno,
                     CONCAT(u.nombre, ' ', u.primer_apellido) AS nombre_veterinario
               FROM cita c
               JOIN mascota m ON m.id = c.mascota_id
               LEFT JOIN dueno d ON d.id = COALESCE(c.dueno_id, m.dueno_id)
               JOIN usuario u ON u.id = c.usuario_id
               WHERE c.estado = 1
                 AND m.estado = 1
                 AND u.estado = 1
                 AND (d.id IS NULL OR d.estado = 1)`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT c.id,
                     c.mascota_id,
                     c.dueno_id,
                     c.usuario_id,
                     c.fecha,
                     c.motivo,
                     c.precio,
                     c.tipo,
                     c.observaciones,
                     c.estado,
                     c.fecha_creacion,
                     c.fecha_actualizacion,
                     m.nombre AS nombre_mascota,
                     d.nombre AS nombre_dueno,
                     CONCAT(u.nombre, ' ', u.primer_apellido) AS nombre_veterinario
               FROM cita c
               JOIN mascota m ON m.id = c.mascota_id
               LEFT JOIN dueno d ON d.id = COALESCE(c.dueno_id, m.dueno_id)
               JOIN usuario u ON u.id = c.usuario_id
               WHERE c.id = ?
                 AND c.estado = 1
                 AND m.estado = 1
                 AND u.estado = 1
                 AND (d.id IS NULL OR d.estado = 1)`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO cita (mascota_id, dueno_id, usuario_id, fecha, motivo, precio, tipo, observaciones, estado)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    data.mascota_id,
    data.dueno_id || null,
    data.usuario_id,
    data.fecha,
    data.motivo || null,
    data.precio ?? null,
    data.tipo,
    data.observaciones || null,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE cita
               SET mascota_id = ?, dueno_id = ?, usuario_id = ?, fecha = ?, motivo = ?, precio = ?, tipo = ?, observaciones = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.mascota_id,
    data.dueno_id || null,
    data.usuario_id,
    data.fecha,
    data.motivo || null,
    data.precio ?? null,
    data.tipo,
    data.observaciones || null,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE cita SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
