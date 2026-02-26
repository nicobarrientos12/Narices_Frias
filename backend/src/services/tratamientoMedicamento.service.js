const tratamientoMedRepo = require('../repositories/tratamientoMedicamento.repository');

function toNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : v;
}

function normalize(payload) {
  return {
    tratamiento_id: Number(payload.tratamiento_id),
    medicamento_id: Number(payload.medicamento_id),
    dosis: toNull(payload.dosis),
    frecuencia: toNull(payload.frecuencia),
    duracion: toNull(payload.duracion),
    estado: payload.estado ?? 1,
  };
}

async function list() {
  return tratamientoMedRepo.findAll();
}

async function getById(id) {
  const row = await tratamientoMedRepo.findById(id);
  if (!row) {
    const err = new Error('Tratamiento-medicamento no encontrado');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload) {
  if (!payload?.tratamiento_id || !payload?.medicamento_id) {
    const err = new Error('tratamiento_id y medicamento_id son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  const id = await tratamientoMedRepo.create(data);
  return { id };
}

async function update(id, payload) {
  if (!payload?.tratamiento_id || !payload?.medicamento_id) {
    const err = new Error('tratamiento_id y medicamento_id son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  await tratamientoMedRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await tratamientoMedRepo.remove(id);
  return true;
}

async function bulkCreate(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const tratamiento_id = Number(payload?.tratamiento_id);
  if (!tratamiento_id || !items.length) {
    const err = new Error('tratamiento_id e items son requeridos');
    err.status = 400;
    throw err;
  }
  let created = 0;
  for (const it of items) {
    if (!it?.medicamento_id) continue;
    await tratamientoMedRepo.create({
      tratamiento_id,
      medicamento_id: Number(it.medicamento_id),
      dosis: it.dosis ?? null,
      frecuencia: it.frecuencia ?? null,
      duracion: it.duracion ?? null,
      estado: 1,
    });
    created += 1;
  }
  return { created };
}

module.exports = { list, getById, create, update, remove, bulkCreate };
