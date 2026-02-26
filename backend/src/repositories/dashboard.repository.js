const { query } = require('./base.repository');

function buildDateFilter(column, start, end) {
  const clauses = [];
  const params = [];
  if (start) {
    clauses.push(`DATE(${column}) >= ?`);
    params.push(start);
  }
  if (end) {
    clauses.push(`DATE(${column}) <= ?`);
    params.push(end);
  }
  if (!clauses.length) return { sql: '', params: [] };
  return { sql: ` AND ${clauses.join(' AND ')}`, params };
}

async function sumDonaciones(start, end) {
  const { sql, params } = buildDateFilter('fecha_donacion', start, end);
  const rows = await query(
    `SELECT COALESCE(SUM(monto), 0) AS total
     FROM donacion
     WHERE estado = 1 AND tipo = 'Monetaria'${sql}`,
    params
  );
  return rows[0]?.total || 0;
}

async function sumCampanias(start, end) {
  const { sql, params } = buildDateFilter('fecha', start, end);
  const rows = await query(
    `SELECT COALESCE(SUM(total_recaudado), 0) AS total
     FROM campania
     WHERE estado = 1${sql}`,
    params
  );
  return rows[0]?.total || 0;
}

async function sumCitas(start, end) {
  const { sql, params } = buildDateFilter('fecha', start, end);
  const rows = await query(
    `SELECT COALESCE(SUM(precio), 0) AS total
     FROM cita
     WHERE estado = 1${sql}`,
    params
  );
  return rows[0]?.total || 0;
}

async function sumTratamientos(start, end) {
  const { sql, params } = buildDateFilter('fecha_inicio', start, end);
  const rows = await query(
    `SELECT COALESCE(SUM(precio), 0) AS total
     FROM tratamiento
     WHERE estado = 1${sql}`,
    params
  );
  return rows[0]?.total || 0;
}

async function ingresosPorEspecie(start, end) {
  const { sql, params } = buildDateFilter('c.fecha', start, end);
  const rows = await query(
    `SELECT m.especie AS especie, COALESCE(SUM(c.precio), 0) AS ingresos
     FROM cita c
     JOIN mascota m ON m.id = c.mascota_id
     WHERE c.estado = 1 AND m.estado = 1${sql}
     GROUP BY m.especie
     ORDER BY ingresos DESC`,
    params
  );
  return rows;
}

async function countAdopciones(start, end) {
  const { sql, params } = buildDateFilter('fecha_solicitud', start, end);
  const rows = await query(
    `SELECT
        SUM(CASE WHEN estado_llegada = 'Aprobada' THEN 1 ELSE 0 END) AS aprobadas,
        SUM(CASE WHEN estado_llegada = 'Rechazada' THEN 1 ELSE 0 END) AS rechazadas
     FROM adopcion
     WHERE estado = 1${sql}`,
    params
  );
  return {
    aprobadas: Number(rows[0]?.aprobadas || 0),
    rechazadas: Number(rows[0]?.rechazadas || 0),
  };
}

async function proximasCitas(limit = 10) {
  const rows = await query(
    `SELECT c.id,
            m.nombre AS mascota,
            d.nombre AS dueno,
            CONCAT(u.nombre, ' ', u.primer_apellido) AS veterinario,
            c.fecha AS fecha_hora,
            c.precio,
            c.tipo
     FROM cita c
     JOIN mascota m ON m.id = c.mascota_id
     LEFT JOIN dueno d ON d.id = c.dueno_id
     JOIN usuario u ON u.id = c.usuario_id
     WHERE c.estado = 1
       AND m.estado = 1
       AND (d.id IS NULL OR d.estado = 1)
       AND u.estado = 1
       AND c.fecha >= NOW()
     ORDER BY c.fecha ASC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

async function ultimasMascotas(limit = 10) {
  const rows = await query(
    `SELECT id, nombre, especie, raza, estado_llegada, fecha_ingreso
     FROM mascota
     WHERE estado = 1
     ORDER BY COALESCE(fecha_ingreso, fecha_creacion) DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

async function tratamientosActivos(limit = 10) {
  const rows = await query(
    `SELECT t.id, m.nombre AS mascota, t.diagnostico, t.fecha_inicio, t.precio
     FROM tratamiento t
     JOIN mascota m ON m.id = t.mascota_id
     WHERE t.estado = 1 AND m.estado = 1
       AND (t.fecha_fin IS NULL OR t.fecha_fin >= CURDATE())
     ORDER BY COALESCE(t.fecha_inicio, t.fecha_creacion) DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

async function refugioConEnfermedades(limit = 10) {
  const rows = await query(
    `SELECT me.id, m.nombre AS mascota, m.especie, e.nombre AS enfermedad, me.fecha_diagnostico
     FROM mascota_enfermedad me
     JOIN mascota m ON m.id = me.mascota_id
     JOIN enfermedad e ON e.id = me.enfermedad_id
     WHERE me.estado = 1 AND m.estado = 1
       AND m.estado_llegada = 'En refugio'
     ORDER BY COALESCE(me.fecha_diagnostico, me.fecha_creacion) DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

async function proximasCampanias(limit = 10) {
  const rows = await query(
    `SELECT id, nombre, fecha, monto_invertido, total_recaudado
     FROM campania
     WHERE estado = 1 AND (fecha IS NULL OR fecha >= CURDATE())
     ORDER BY fecha ASC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

async function ultimasDonaciones(limit = 10) {
  const rows = await query(
    `SELECT d.id, d.tipo, d.nombre_donante, d.monto, d.descripcion_especie, d.fecha_donacion,
            CONCAT(u.nombre, ' ', u.primer_apellido) AS responsable
     FROM donacion d
     JOIN usuario u ON u.id = d.usuario_id
     WHERE d.estado = 1 AND u.estado = 1
     ORDER BY COALESCE(d.fecha_donacion, d.fecha_creacion) DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

async function inventarioVacunas() {
  const rows = await query(
    `SELECT id, nombre, precio
     FROM vacuna
     WHERE estado = 1
     ORDER BY nombre ASC`
  );
  return rows;
}

async function inventarioMedicamentos() {
  const rows = await query(
    `SELECT id, nombre, precio
     FROM medicamento
     WHERE estado = 1
     ORDER BY nombre ASC`
  );
  return rows;
}

async function vacunasProximasSemana(limit = 10) {
  const rows = await query(
    `SELECT mv.id,
            m.nombre AS mascota,
            v.nombre AS vacuna,
            mv.proxima_aplicacion,
            CONCAT(u.nombre, ' ', u.primer_apellido) AS veterinario
     FROM mascota_vacuna mv
     JOIN mascota m ON m.id = mv.mascota_id
     JOIN vacuna v ON v.id = mv.vacuna_id
     LEFT JOIN usuario u ON u.id = mv.usuario_id
     WHERE mv.estado = 1 AND m.estado = 1 AND v.estado = 1
       AND mv.proxima_aplicacion IS NOT NULL
       AND DATE(mv.proxima_aplicacion) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
     ORDER BY DATE(mv.proxima_aplicacion) ASC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

async function tratamientosPorVencerSemana(limit = 10) {
  const rows = await query(
    `SELECT t.id,
            m.nombre AS mascota,
            t.diagnostico,
            t.fecha_fin,
            CONCAT(u.nombre, ' ', u.primer_apellido) AS veterinario
     FROM tratamiento t
     JOIN mascota m ON m.id = t.mascota_id
     JOIN usuario u ON u.id = t.usuario_id
     WHERE t.estado = 1 AND m.estado = 1 AND u.estado = 1
       AND t.fecha_fin IS NOT NULL
       AND t.fecha_fin <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
     ORDER BY t.fecha_fin ASC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

async function citasSinContactoSemana(limit = 10) {
  const rows = await query(
    `SELECT c.id,
            m.nombre AS mascota,
            d.nombre AS dueno,
            d.telefono,
            d.correo,
            c.fecha,
            c.motivo
     FROM cita c
     JOIN mascota m ON m.id = c.mascota_id
     LEFT JOIN dueno d ON d.id = COALESCE(c.dueno_id, m.dueno_id)
     WHERE c.estado = 1 AND m.estado = 1
       AND DATE(c.fecha) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       AND (
         d.id IS NULL
         OR d.telefono IS NULL OR TRIM(d.telefono) = ''
         OR d.correo IS NULL OR TRIM(d.correo) = ''
       )
     ORDER BY DATE(c.fecha) ASC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

module.exports = {
  sumDonaciones,
  sumCampanias,
  sumCitas,
  sumTratamientos,
  ingresosPorEspecie,
  countAdopciones,
  proximasCitas,
  ultimasMascotas,
  tratamientosActivos,
  refugioConEnfermedades,
  proximasCampanias,
  ultimasDonaciones,
  inventarioVacunas,
  inventarioMedicamentos,
  vacunasProximasSemana,
  tratamientosPorVencerSemana,
  citasSinContactoSemana,
};
