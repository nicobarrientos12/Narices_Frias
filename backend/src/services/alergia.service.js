const alergiaRepo = require('../repositories/alergia.repository');

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
  return alergiaRepo.findAll();
}

async function getById(id) {
  const row = await alergiaRepo.findById(id);
  if (!row) {
    const err = new Error('Alergia no encontrada');
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
  const id = await alergiaRepo.create(data);
  return { id };
}

async function update(id, payload) {
  if (!payload?.nombre) {
    const err = new Error('nombre es requerido');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  await alergiaRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await alergiaRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
