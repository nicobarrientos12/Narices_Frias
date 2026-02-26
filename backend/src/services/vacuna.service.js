const vacunaRepo = require('../repositories/vacuna.repository');

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
    nombre: String(payload.nombre || '').trim(),
    descripcion: toNull(payload.descripcion),
    precio: toNumberOrNull(payload.precio),
    estado: toNumberOrNull(payload.estado) ?? 1,
  };
}

async function list() {
  return vacunaRepo.findAll();
}

async function getById(id) {
  const row = await vacunaRepo.findById(id);
  if (!row) {
    const err = new Error('Vacuna no encontrada');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload) {
  if (!payload?.nombre) {
    const err = new Error('nombre es requerido');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  const id = await vacunaRepo.create(data);
  return { id };
}

async function update(id, payload) {
  if (!payload?.nombre) {
    const err = new Error('nombre es requerido');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  await vacunaRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await vacunaRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
