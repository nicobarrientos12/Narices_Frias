const mascotaRepo = require('../repositories/mascota.repository');

function fileToUrl(file) {
  if (!file) return null;
  return `/uploads/${file.filename}`;
}

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

function normalize(payload, foto_url) {
  return {
    nombre: String(payload.nombre || '').trim(),
    especie: String(payload.especie || '').trim(),
    raza: toNull(payload.raza),
    edad: toNumberOrNull(payload.edad),
    genero: toNull(payload.genero),
    esterilizado: toNull(payload.esterilizado),
    color: toNull(payload.color),
    caracteristicas: toNull(payload.caracteristicas),
    fecha_ingreso: toNull(payload.fecha_ingreso),
    estado_llegada: String(payload.estado_llegada || '').trim(),
    foto_url,
    dueno_id: toNumberOrNull(payload.dueno_id),
    estado: toNumberOrNull(payload.estado) ?? 1,
  };
}

async function list() {
  return mascotaRepo.findAll();
}

async function getById(id) {
  const row = await mascotaRepo.findById(id);
  if (!row) {
    const err = new Error('Mascota no encontrada');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload, req) {
  if (!payload?.nombre || !payload?.especie || !payload?.estado_llegada) {
    const err = new Error('nombre, especie y estado_llegada son requeridos');
    err.status = 400;
    throw err;
  }
  const foto_url = fileToUrl(req?.file);
  const data = normalize(payload, foto_url);
  const id = await mascotaRepo.create(data);
  return { id };
}

async function update(id, payload, req) {
  if (!payload?.nombre || !payload?.especie || !payload?.estado_llegada) {
    const err = new Error('nombre, especie y estado_llegada son requeridos');
    err.status = 400;
    throw err;
  }
  const foto_url = fileToUrl(req?.file);
  const data = normalize(payload, foto_url);
  await mascotaRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await mascotaRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
