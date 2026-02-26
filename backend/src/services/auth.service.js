const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const usuarioRepo = require('../repositories/usuario.repository');
const resetRepo = require('../repositories/passwordResetToken.repository');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function ensureTransporter() {
  const smtpUser = env.SMTP_USER || '';
  const isGmail = smtpUser.toLowerCase().endsWith('@gmail.com');
  const host = env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : '');
  const port = env.SMTP_PORT || (isGmail ? 465 : 587);
  const missing = [];
  if (!host) missing.push('SMTP_HOST');
  if (!smtpUser) missing.push('SMTP_USER');
  if (!env.SMTP_PASS) missing.push('SMTP_PASS');
  if (missing.length) {
    const err = new Error(`SMTP no configurado: faltan ${missing.join(', ')}`);
    err.status = 500;
    throw err;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: smtpUser,
      pass: env.SMTP_PASS,
    },
  });
}

async function login({ correo, contrasena }) {
  if (!correo || !contrasena) {
    const err = new Error('correo y contrasena son requeridos');
    err.status = 400;
    throw err;
  }
  const usuario = await usuarioRepo.findByEmail(correo);
  if (!usuario) {
    const err = new Error('Credenciales invalidas');
    err.status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!ok) {
    const err = new Error('Credenciales invalidas');
    err.status = 401;
    throw err;
  }
  const token = jwt.sign(
    { sub: usuario.id, rol: usuario.rol, correo: usuario.correo },
    env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  const safeUser = {
    id: usuario.id,
    nombre: usuario.nombre,
    primer_apellido: usuario.primer_apellido,
    segundo_apellido: usuario.segundo_apellido,
    correo: usuario.correo,
    rol: usuario.rol,
  };
  return { message: 'Login OK', token, usuario: safeUser };
}

async function forgot({ correo }) {
  if (!correo) {
    const err = new Error('correo es requerido');
    err.status = 400;
    throw err;
  }
  const usuario = await usuarioRepo.findByEmail(correo);
  if (!usuario) {
    return { message: 'Si el correo existe, se enviara un enlace' };
  }
  const token = crypto.randomBytes(32).toString('hex');
  const token_hash = hashToken(token);
  const expires_at = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  await resetRepo.createToken({ usuario_id: usuario.id, token_hash, expires_at });

  const baseUrl = env.CORS_ORIGIN || 'http://localhost:5173';
  const link = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
  const subject = 'Recuperacion de contrasena - Narices Frias';
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
      <h2 style="margin:0 0 8px">Recuperacion de contrasena</h2>
      <p>Hola <strong>${usuario.nombre || 'usuario'}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contrasena.</p>
      <p>Haz clic en el siguiente enlace (valido por 30 minutos):</p>
      <p><a href="${link}" style="color:#111827;font-weight:bold">${link}</a></p>
      <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
      <p>Atte. <strong>Narices Frias</strong></p>
    </div>
  `;

  const transporter = ensureTransporter();
  await transporter.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to: usuario.correo,
    subject,
    html,
  });

  return { message: 'Se envio el enlace de recuperacion al correo' };
}

async function reset({ token, nueva_contrasena }) {
  if (!token || !nueva_contrasena) {
    const err = new Error('token y nueva_contrasena son requeridos');
    err.status = 400;
    throw err;
  }
  const token_hash = hashToken(token);
  const row = await resetRepo.findValidToken(token_hash);
  if (!row) {
    const err = new Error('Token invalido o expirado');
    err.status = 400;
    throw err;
  }
  const hash = await bcrypt.hash(nueva_contrasena, 10);
  await usuarioRepo.update(row.usuario_id, { contrasena: hash });
  await resetRepo.markUsed(row.id);
  return { message: 'Contrasena actualizada' };
}

module.exports = { login, forgot, reset };
