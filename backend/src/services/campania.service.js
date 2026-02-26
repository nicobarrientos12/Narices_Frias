const campaniaRepo = require('../repositories/campania.repository');

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
    usuario_id: Number(payload.usuario_id),
    nombre: String(payload.nombre || '').trim(),
    fecha: toNull(payload.fecha),
    monto_invertido: toNumberOrNull(payload.monto_invertido),
    total_recaudado: toNumberOrNull(payload.total_recaudado),
    ganancia: toNumberOrNull(payload.ganancia),
    estado: toNumberOrNull(payload.estado) ?? 1,
  };
}

async function list() {
  return campaniaRepo.findAll();
}

async function getById(id) {
  const row = await campaniaRepo.findById(id);
  if (!row) {
    const err = new Error('Campania no encontrada');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload) {
  if (!payload?.usuario_id || !payload?.nombre) {
    const err = new Error('usuario_id y nombre son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  const id = await campaniaRepo.create(data);
  return { id };
}

async function update(id, payload) {
  if (!payload?.usuario_id || !payload?.nombre) {
    const err = new Error('usuario_id y nombre son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  await campaniaRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await campaniaRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
