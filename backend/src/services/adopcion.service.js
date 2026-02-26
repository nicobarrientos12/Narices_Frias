const adopcionRepo = require('../repositories/adopcion.repository');

const ESTADOS = ['En revisión', 'Aprobada', 'Rechazada'];

function toNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : v;
}

function normalize(payload) {
  return {
    mascota_id: Number(payload.mascota_id),
    dueno_id: Number(payload.dueno_id),
    fecha_solicitud: String(payload.fecha_solicitud || '').trim(),
    fecha_aprobacion: toNull(payload.fecha_aprobacion),
    estado_llegada: String(payload.estado_llegada || '').trim(),
    observaciones: toNull(payload.observaciones),
    usuario_id: Number(payload.usuario_id),
    estado: payload.estado ?? 1,
  };
}

function validate(payload) {
  if (!payload?.mascota_id || !payload?.dueno_id || !payload?.usuario_id || !payload?.fecha_solicitud) {
    const err = new Error('mascota_id, dueno_id, usuario_id y fecha_solicitud son requeridos');
    err.status = 400;
    throw err;
  }
  if (!payload?.estado_llegada) {
    const err = new Error('estado_llegada es requerido');
    err.status = 400;
    throw err;
  }
  if (!ESTADOS.includes(payload.estado_llegada)) {
    const err = new Error('estado_llegada invalido');
    err.status = 400;
    throw err;
  }
  if (payload.estado_llegada === 'Aprobada' && !payload.fecha_aprobacion) {
    const err = new Error('fecha_aprobacion es requerida cuando estado_llegada es Aprobada');
    err.status = 400;
    throw err;
  }
  if (payload.estado_llegada !== 'Aprobada' && payload.fecha_aprobacion) {
    const err = new Error('fecha_aprobacion debe ser null cuando estado_llegada no es Aprobada');
    err.status = 400;
    throw err;
  }
}

async function list() {
  return adopcionRepo.findAll();
}

async function getById(id) {
  const row = await adopcionRepo.findById(id);
  if (!row) {
    const err = new Error('Adopcion no encontrada');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload) {
  validate(payload);
  const data = normalize(payload);
  const id = await adopcionRepo.create(data);
  return { id };
}

async function update(id, payload) {
  validate(payload);
  const data = normalize(payload);
  await adopcionRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await adopcionRepo.remove(id);
  return true;
}

async function disponibles() {
  return adopcionRepo.findDisponibles();
}

module.exports = { list, getById, create, update, remove, disponibles };
