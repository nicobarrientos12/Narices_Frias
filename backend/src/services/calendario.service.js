const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const { query } = require('../repositories/base.repository');

async function getByDate(fecha) {
  const rows = await query(
    `SELECT c.id,
            c.fecha,
            c.motivo,
            c.tipo,
            c.precio,
            m.nombre AS mascota,
            d.nombre AS dueno,
            d.telefono AS telefono,
            d.correo AS correo,
            CONCAT(u.nombre, ' ', u.primer_apellido) AS veterinario
     FROM cita c
     JOIN mascota m ON m.id = c.mascota_id
     LEFT JOIN dueno d ON d.id = COALESCE(c.dueno_id, m.dueno_id)
     JOIN usuario u ON u.id = c.usuario_id
     WHERE c.estado = 1
       AND m.estado = 1
       AND u.estado = 1
       AND (d.id IS NULL OR d.estado = 1)
       AND DATE(c.fecha) = ?
     ORDER BY c.fecha ASC`,
    [fecha]
  );
  return rows;
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

async function notifyMail(payload = {}) {
  const correo = String(payload.correo || '').trim();
  if (!correo) {
    const err = new Error('correo es requerido');
    err.status = 400;
    throw err;
  }

  const fecha = payload.fecha ? new Date(payload.fecha) : null;
  const fechaTxt = fecha && !isNaN(fecha)
    ? fecha.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';
  const horaTxt = fecha && !isNaN(fecha)
    ? fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
    : '';

  const dueno = payload.dueno || 'tutor';
  const mascota = payload.mascota || 'tu mascota';
  const motivo = payload.motivo ? `Motivo: ${payload.motivo}` : '';
  const veterinario = payload.veterinario ? `Veterinario: ${payload.veterinario}` : '';

  const subject = 'Recordatorio de cita veterinaria';
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
      <h2 style="margin:0 0 8px">Recordatorio de cita</h2>
      <p>Hola <strong>${dueno}</strong>,</p>
      <p>Te recordamos la cita de <strong>${mascota}</strong> para el <strong>${fechaTxt}</strong>${horaTxt ? ` a las <strong>${horaTxt}</strong>` : ''}.</p>
      ${motivo ? `<p>${motivo}</p>` : ''}
      ${veterinario ? `<p>${veterinario}</p>` : ''}
      <p>Atte. <strong>Narices Frías</strong></p>
    </div>
  `;

  const transporter = ensureTransporter();
  await transporter.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to: correo,
    subject,
    html,
  });

  return { message: 'Correo enviado' };
}

async function notifyWhatsApp() {
  return { message: 'OK' };
}

module.exports = { getByDate, notifyMail, notifyWhatsApp };
