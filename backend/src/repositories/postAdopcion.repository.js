const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT id, adopcion_id, fecha, observaciones, foto_url, estado, fecha_creacion, fecha_actualizacion
               FROM seguimiento_postadopcion
               WHERE estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT id, adopcion_id, fecha, observaciones, foto_url, estado, fecha_creacion, fecha_actualizacion
               FROM seguimiento_postadopcion
               WHERE id = ? AND estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO seguimiento_postadopcion
    (adopcion_id, fecha, observaciones, foto_url, estado)
    VALUES (?, ?, ?, ?, ?)`;
  const params = [
    data.adopcion_id,
    data.fecha || null,
    data.observaciones || null,
    data.foto_url || null,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE seguimiento_postadopcion
               SET adopcion_id = ?, fecha = ?, observaciones = ?, foto_url = COALESCE(?, foto_url), estado = ?
               WHERE id = ?`;
  const params = [
    data.adopcion_id,
    data.fecha || null,
    data.observaciones || null,
    data.foto_url || null,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE seguimiento_postadopcion SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
