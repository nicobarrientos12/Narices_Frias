const mascotaAlergiaRepo = require('../repositories/mascotaAlergia.repository');

function toNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : v;
}

function normalize(payload) {
  return {
    mascota_id: Number(payload.mascota_id),
    alergia_id: Number(payload.alergia_id),
    observaciones: toNull(payload.observaciones),
    estado: payload.estado ?? 1,
  };
}

async function list() {
  return mascotaAlergiaRepo.findAll();
}

async function getById(id) {
  const row = await mascotaAlergiaRepo.findById(id);
  if (!row) {
    const err = new Error('Mascota-Alergia no encontrada');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload) {
  if (!payload?.mascota_id || !payload?.alergia_id) {
    const err = new Error('mascota_id y alergia_id son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  const id = await mascotaAlergiaRepo.create(data);
  return { id };
}

async function update(id, payload) {
  if (!payload?.mascota_id || !payload?.alergia_id) {
    const err = new Error('mascota_id y alergia_id son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  await mascotaAlergiaRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await mascotaAlergiaRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
