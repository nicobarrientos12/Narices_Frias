const mascotaVacunasRepo = require('../repositories/mascotaVacunas.repository');

function toNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : v;
}

function normalize(payload) {
  return {
    mascota_id: Number(payload.mascota_id),
    vacuna_id: Number(payload.vacuna_id),
    fecha_aplicacion: toNull(payload.fecha_aplicacion),
    proxima_aplicacion: toNull(payload.proxima_aplicacion),
    usuario_id: Number(payload.usuario_id),
    estado: payload.estado ?? 1,
  };
}

async function list() {
  return mascotaVacunasRepo.findAll();
}

async function getById(id) {
  const row = await mascotaVacunasRepo.findById(id);
  if (!row) {
    const err = new Error('Aplicacion no encontrada');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload) {
  if (!payload?.mascota_id || !payload?.vacuna_id || !payload?.usuario_id) {
    const err = new Error('mascota_id, vacuna_id y usuario_id son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  const id = await mascotaVacunasRepo.create(data);
  return { id };
}

async function update(id, payload) {
  if (!payload?.mascota_id || !payload?.vacuna_id || !payload?.usuario_id) {
    const err = new Error('mascota_id, vacuna_id y usuario_id son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  await mascotaVacunasRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await mascotaVacunasRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
