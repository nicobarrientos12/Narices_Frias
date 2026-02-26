const mascotaEnfRepo = require('../repositories/mascotaEnfermedad.repository');

function toNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : v;
}

function normalize(payload) {
  return {
    mascota_id: Number(payload.mascota_id),
    enfermedad_id: Number(payload.enfermedad_id),
    fecha_diagnostico: toNull(payload.fecha_diagnostico),
    observaciones: toNull(payload.observaciones),
    estado: payload.estado ?? 1,
  };
}

async function list() {
  return mascotaEnfRepo.findAll();
}

async function getById(id) {
  const row = await mascotaEnfRepo.findById(id);
  if (!row) {
    const err = new Error('Mascota-Enfermedad no encontrada');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload) {
  if (!payload?.mascota_id || !payload?.enfermedad_id) {
    const err = new Error('mascota_id y enfermedad_id son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  const id = await mascotaEnfRepo.create(data);
  return { id };
}

async function update(id, payload) {
  if (!payload?.mascota_id || !payload?.enfermedad_id) {
    const err = new Error('mascota_id y enfermedad_id son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  await mascotaEnfRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await mascotaEnfRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
