const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT id, nombre, especie, raza, edad, genero, esterilizado, color, caracteristicas,
                     fecha_ingreso, estado_llegada, foto_url, dueno_id, estado, fecha_creacion, fecha_actualizacion
               FROM mascota
               WHERE estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT id, nombre, especie, raza, edad, genero, esterilizado, color, caracteristicas,
                     fecha_ingreso, estado_llegada, foto_url, dueno_id, estado, fecha_creacion, fecha_actualizacion
               FROM mascota WHERE id = ? AND estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO mascota
    (nombre, especie, raza, edad, genero, esterilizado, color, caracteristicas, fecha_ingreso,
     estado_llegada, foto_url, dueno_id, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    data.nombre,
    data.especie,
    data.raza || null,
    data.edad ?? null,
    data.genero || null,
    data.esterilizado || null,
    data.color || null,
    data.caracteristicas || null,
    data.fecha_ingreso || null,
    data.estado_llegada,
    data.foto_url || null,
    data.dueno_id || null,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE mascota SET
    nombre = ?, especie = ?, raza = ?, edad = ?, genero = ?, esterilizado = ?, color = ?, caracteristicas = ?,
    fecha_ingreso = ?, estado_llegada = ?, foto_url = COALESCE(?, foto_url), dueno_id = ?, estado = ?
    WHERE id = ?`;
  const params = [
    data.nombre,
    data.especie,
    data.raza || null,
    data.edad ?? null,
    data.genero || null,
    data.esterilizado || null,
    data.color || null,
    data.caracteristicas || null,
    data.fecha_ingreso || null,
    data.estado_llegada,
    data.foto_url || null,
    data.dueno_id || null,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE mascota SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
