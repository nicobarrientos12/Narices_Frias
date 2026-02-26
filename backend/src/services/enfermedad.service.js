const enfermedadRepo = require('../repositories/enfermedad.repository');

function toNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : v;
}

function normalize(payload) {
  return {
    nombre: String(payload.nombre || '').trim(),
    descripcion: toNull(payload.descripcion),
    estado: payload.estado ?? 1,
  };
}

async function list() {
  return enfermedadRepo.findAll();
}

async function getById(id) {
  const row = await enfermedadRepo.findById(id);
  if (!row) {
    const err = new Error('Enfermedad no encontrada');
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
  const id = await enfermedadRepo.create(data);
  return { id };
}

async function update(id, payload) {
  if (!payload?.nombre) {
    const err = new Error('nombre es requerido');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  await enfermedadRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await enfermedadRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
