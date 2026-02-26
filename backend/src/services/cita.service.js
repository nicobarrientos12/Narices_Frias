const citaRepo = require('../repositories/cita.repository');

const TIPOS = ['Consulta', 'Vacunación', 'Cirugía', 'Control'];

function toNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : v;
}

function toNumberOrNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function normalize(payload) {
  return {
    mascota_id: Number(payload.mascota_id),
    dueno_id: toNumberOrNull(payload.dueno_id),
    usuario_id: Number(payload.usuario_id),
    fecha: String(payload.fecha || '').trim(),
    motivo: toNull(payload.motivo),
    precio: toNumberOrNull(payload.precio),
    tipo: String(payload.tipo || '').trim(),
    observaciones: toNull(payload.observaciones),
    estado: toNumberOrNull(payload.estado) ?? 1,
  };
}

async function list() {
  return citaRepo.findAll();
}

async function getById(id) {
  const row = await citaRepo.findById(id);
  if (!row) {
    const err = new Error('Cita no encontrada');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload) {
  if (!payload?.mascota_id || !payload?.usuario_id || !payload?.fecha || !payload?.tipo) {
    const err = new Error('mascota_id, usuario_id, fecha y tipo son requeridos');
    err.status = 400;
    throw err;
  }
  if (!TIPOS.includes(payload.tipo)) {
    const err = new Error('tipo invalido');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  const id = await citaRepo.create(data);
  return { id };
}

async function update(id, payload) {
  if (!payload?.mascota_id || !payload?.usuario_id || !payload?.fecha || !payload?.tipo) {
    const err = new Error('mascota_id, usuario_id, fecha y tipo son requeridos');
    err.status = 400;
    throw err;
  }
  if (!TIPOS.includes(payload.tipo)) {
    const err = new Error('tipo invalido');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  await citaRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await citaRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
