const donacionRepo = require('../repositories/donacion.repository');

const TIPOS = ['Monetaria', 'Especie'];

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
    nombre_donante: toNull(payload.nombre_donante),
    tipo: String(payload.tipo || '').trim(),
    monto: toNumberOrNull(payload.monto),
    descripcion_especie: toNull(payload.descripcion_especie),
    fecha_donacion: toNull(payload.fecha_donacion),
    estado: toNumberOrNull(payload.estado) ?? 1,
  };
}

function validate(payload) {
  if (!payload?.usuario_id || !payload?.tipo) {
    const err = new Error('usuario_id y tipo son requeridos');
    err.status = 400;
    throw err;
  }
  if (!TIPOS.includes(payload.tipo)) {
    const err = new Error('tipo invalido');
    err.status = 400;
    throw err;
  }
  if (payload.tipo === 'Monetaria' && (payload.monto === undefined || payload.monto === null)) {
    const err = new Error('monto es requerido para donacion Monetaria');
    err.status = 400;
    throw err;
  }
  if (payload.tipo === 'Especie' && !payload.descripcion_especie) {
    const err = new Error('descripcion_especie es requerida para donacion Especie');
    err.status = 400;
    throw err;
  }
}

async function list() {
  return donacionRepo.findAll();
}

async function getById(id) {
  const row = await donacionRepo.findById(id);
  if (!row) {
    const err = new Error('Donacion no encontrada');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload) {
  validate(payload);
  const data = normalize(payload);
  const id = await donacionRepo.create(data);
  return { id };
}

async function update(id, payload) {
  validate(payload);
  const data = normalize(payload);
  await donacionRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await donacionRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
