const medicamentoRepo = require('../repositories/medicamento.repository');

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
  return medicamentoRepo.findAll();
}

async function getById(id) {
  const row = await medicamentoRepo.findById(id);
  if (!row) {
    const err = new Error('Medicamento no encontrado');
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
  const id = await medicamentoRepo.create(data);
  return { id };
}

async function update(id, payload) {
  if (!payload?.nombre) {
    const err = new Error('nombre es requerido');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  await medicamentoRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await medicamentoRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
