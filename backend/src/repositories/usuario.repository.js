const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT id, nombre, primer_apellido, segundo_apellido, carnet_identidad, direccion, latitud, longitud, correo, rol, estado, fecha_creacion, fecha_actualizacion
               FROM usuario
               WHERE estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT id, nombre, primer_apellido, segundo_apellido, carnet_identidad, direccion, latitud, longitud, correo, rol, estado, fecha_creacion, fecha_actualizacion
               FROM usuario WHERE id = ? AND estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function findByEmail(correo) {
  const sql = `SELECT * FROM usuario WHERE correo = ?`;
  const rows = await query(sql, [correo]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO usuario (nombre, primer_apellido, segundo_apellido, carnet_identidad, direccion, latitud, longitud, correo, contrasena, rol, estado)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    data.nombre,
    data.primer_apellido,
    data.segundo_apellido || null,
    data.carnet_identidad || null,
    data.direccion || null,
    data.latitud || null,
    data.longitud || null,
    data.correo,
    data.contrasena,
    data.rol,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE usuario
               SET nombre = ?, primer_apellido = ?, segundo_apellido = ?, carnet_identidad = ?, direccion = ?, latitud = ?, longitud = ?, correo = ?, contrasena = COALESCE(?, contrasena), rol = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.nombre,
    data.primer_apellido,
    data.segundo_apellido || null,
    data.carnet_identidad || null,
    data.direccion || null,
    data.latitud || null,
    data.longitud || null,
    data.correo,
    data.contrasena || null,
    data.rol,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE usuario SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

async function findVeterinarios() {
  const sql = `SELECT id, nombre, primer_apellido, segundo_apellido, correo, rol
               FROM usuario WHERE rol = 'Veterinario' AND estado = 1`;
  return query(sql);
}

module.exports = { findAll, findById, findByEmail, create, update, remove, findVeterinarios };
