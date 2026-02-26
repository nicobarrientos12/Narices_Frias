const tratamientoRepo = require('../repositories/tratamiento.repository');

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
    diagnostico: toNull(payload.diagnostico),
    fecha_inicio: toNull(payload.fecha_inicio),
    fecha_fin: toNull(payload.fecha_fin),
    precio: toNumberOrNull(payload.precio),
    observaciones: toNull(payload.observaciones),
    usuario_id: Number(payload.usuario_id),
    estado: toNumberOrNull(payload.estado) ?? 1,
  };
}

async function list() {
  return tratamientoRepo.findAll();
}

async function getById(id) {
  const row = await tratamientoRepo.findById(id);
  if (!row) {
    const err = new Error('Tratamiento no encontrado');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload) {
  if (!payload?.mascota_id || !payload?.usuario_id) {
    const err = new Error('mascota_id y usuario_id son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  const id = await tratamientoRepo.create(data);
  return { id };
}

async function update(id, payload) {
  if (!payload?.mascota_id || !payload?.usuario_id) {
    const err = new Error('mascota_id y usuario_id son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  await tratamientoRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await tratamientoRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
