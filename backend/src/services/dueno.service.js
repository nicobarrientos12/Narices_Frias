const duenoRepo = require('../repositories/dueno.repository');

async function list() {
  return duenoRepo.findAll();
}

async function getById(id) {
  const row = await duenoRepo.findById(id);
  if (!row) {
    const err = new Error('Dueno no encontrado');
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
  const id = await duenoRepo.create(payload);
  return { id };
}

async function update(id, payload) {
  if (!payload?.nombre) {
    const err = new Error('nombre es requerido');
    err.status = 400;
    throw err;
  }
  await duenoRepo.update(id, payload);
  return { id: Number(id) };
}

async function remove(id) {
  await duenoRepo.remove(id);
  return true;
}

module.exports = { list, getById, create, update, remove };
