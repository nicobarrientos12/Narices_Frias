const { query } = require('./base.repository');

async function findAll() {
  const sql = `SELECT id, mascota_id, fecha, descripcion, usuario_id, estado, fecha_creacion, fecha_actualizacion
               FROM historial_clinico
               WHERE estado = 1`;
  return query(sql);
}

async function findById(id) {
  const sql = `SELECT id, mascota_id, fecha, descripcion, usuario_id, estado, fecha_creacion, fecha_actualizacion
               FROM historial_clinico
               WHERE id = ? AND estado = 1`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

async function create(data) {
  const sql = `INSERT INTO historial_clinico
    (mascota_id, fecha, descripcion, usuario_id, estado)
    VALUES (?, ?, ?, ?, ?)`;
  const params = [
    data.mascota_id,
    data.fecha || null,
    data.descripcion || null,
    data.usuario_id,
    data.estado ?? 1,
  ];
  const result = await query(sql, params);
  return result.insertId;
}

async function update(id, data) {
  const sql = `UPDATE historial_clinico
               SET mascota_id = ?, fecha = ?, descripcion = ?, usuario_id = ?, estado = ?
               WHERE id = ?`;
  const params = [
    data.mascota_id,
    data.fecha || null,
    data.descripcion || null,
    data.usuario_id,
    data.estado ?? 1,
    id,
  ];
  await query(sql, params);
  return true;
}

async function remove(id) {
  const sql = `UPDATE historial_clinico SET estado = 0 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

async function reportData(mascotaId) {
  const mascotaSql = `SELECT m.id, m.nombre, m.especie, m.raza, m.edad, m.genero, m.esterilizado,
                             m.color, m.estado_llegada, m.fecha_ingreso, m.foto_url,
                             d.nombre AS dueno, d.telefono AS dueno_telefono
                      FROM mascota m
                      LEFT JOIN dueno d ON d.id = m.dueno_id
                      WHERE m.id = ? AND m.estado = 1 AND (d.id IS NULL OR d.estado = 1)`;
  const mascotaRows = await query(mascotaSql, [mascotaId]);
  const mascota = mascotaRows[0] || null;

  const citas = await query(
    `SELECT c.id, c.fecha, c.motivo, c.tipo, c.precio,
            CONCAT(u.nombre, ' ', u.primer_apellido) AS veterinario
     FROM cita c
     JOIN usuario u ON u.id = c.usuario_id
     WHERE c.mascota_id = ? AND c.estado = 1 AND u.estado = 1
     ORDER BY c.fecha DESC`,
    [mascotaId]
  );

  const vacunas = await query(
    `SELECT mv.id, mv.fecha_aplicacion, mv.proxima_aplicacion,
            v.nombre AS vacuna,
            CONCAT(u.nombre, ' ', u.primer_apellido) AS veterinario
     FROM mascota_vacuna mv
     JOIN vacuna v ON v.id = mv.vacuna_id
     JOIN usuario u ON u.id = mv.usuario_id
     WHERE mv.mascota_id = ? AND mv.estado = 1 AND v.estado = 1 AND u.estado = 1
     ORDER BY COALESCE(mv.fecha_aplicacion, mv.fecha_creacion) DESC`,
    [mascotaId]
  );

  const enfermedades = await query(
    `SELECT me.id, me.fecha_diagnostico, me.observaciones, e.nombre AS enfermedad
     FROM mascota_enfermedad me
     JOIN enfermedad e ON e.id = me.enfermedad_id
     WHERE me.mascota_id = ? AND me.estado = 1 AND e.estado = 1
     ORDER BY COALESCE(me.fecha_diagnostico, me.fecha_creacion) DESC`,
    [mascotaId]
  );

  const alergias = await query(
    `SELECT ma.id, ma.observaciones, a.nombre AS alergia
     FROM mascota_alergia ma
     JOIN alergia a ON a.id = ma.alergia_id
     WHERE ma.mascota_id = ? AND ma.estado = 1 AND a.estado = 1
     ORDER BY COALESCE(ma.fecha_creacion, ma.id) DESC`,
    [mascotaId]
  );

  const tratamientos = await query(
    `SELECT t.id, t.diagnostico, t.fecha_inicio, t.fecha_fin, t.precio,
            CONCAT(u.nombre, ' ', u.primer_apellido) AS veterinario
     FROM tratamiento t
     JOIN usuario u ON u.id = t.usuario_id
     WHERE t.mascota_id = ? AND t.estado = 1 AND u.estado = 1
     ORDER BY COALESCE(t.fecha_inicio, t.fecha_creacion) DESC`,
    [mascotaId]
  );

  const medicamentos = await query(
    `SELECT tm.id, tm.tratamiento_id, tm.dosis, tm.frecuencia, tm.duracion,
            md.nombre AS medicamento
     FROM tratamiento_medicamento tm
     JOIN tratamiento t ON t.id = tm.tratamiento_id
     JOIN medicamento md ON md.id = tm.medicamento_id
     WHERE t.mascota_id = ? AND tm.estado = 1 AND t.estado = 1 AND md.estado = 1
     ORDER BY tm.tratamiento_id DESC, tm.id DESC`,
    [mascotaId]
  );

  const historial = await query(
    `SELECT h.id, h.fecha, h.descripcion,
            CONCAT(u.nombre, ' ', u.primer_apellido) AS veterinario
     FROM historial_clinico h
     JOIN usuario u ON u.id = h.usuario_id
     WHERE h.mascota_id = ? AND h.estado = 1 AND u.estado = 1
     ORDER BY COALESCE(h.fecha, h.fecha_creacion) DESC`,
    [mascotaId]
  );

  return { mascota, citas, vacunas, enfermedades, alergias, tratamientos, medicamentos, historial };
}

async function listMascotas() {
  const sql = `SELECT m.id,
                     m.nombre AS nombre_mascota,
                     d.nombre AS nombre_dueno
               FROM mascota m
               LEFT JOIN dueno d ON d.id = m.dueno_id
               WHERE m.estado = 1 AND (d.id IS NULL OR d.estado = 1)
               ORDER BY m.nombre ASC`;
  return query(sql);
}

module.exports = { findAll, findById, create, update, remove, reportData, listMascotas };
