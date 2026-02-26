const bcrypt = require('bcryptjs');
const usuarioRepo = require('../repositories/usuario.repository');

async function list() {
  return usuarioRepo.findAll();
}

async function getById(id) {
  const row = await usuarioRepo.findById(id);
  if (!row) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload) {
  if (!payload?.correo || !payload?.contrasena) {
    const err = new Error('correo y contrasena son requeridos');
    err.status = 400;
    throw err;
  }
  const existing = await usuarioRepo.findByEmail(payload.correo);
  if (existing) {
    const err = new Error('El correo ya existe');
    err.status = 409;
    throw err;
  }
  const hash = await bcrypt.hash(payload.contrasena, 10);
  const id = await usuarioRepo.create({ ...payload, contrasena: hash });
  return { id };
}

async function update(id, payload) {
  if (payload?.contrasena) {
    payload.contrasena = await bcrypt.hash(payload.contrasena, 10);
  }
  await usuarioRepo.update(id, payload);
  return { id: Number(id) };
}

async function remove(id) {
  await usuarioRepo.remove(id);
  return true;
}

async function listVeterinarios() {
  return usuarioRepo.findVeterinarios();
}

module.exports = { list, getById, create, update, remove, listVeterinarios };
