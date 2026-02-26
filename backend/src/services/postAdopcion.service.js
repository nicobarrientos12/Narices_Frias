const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const postRepo = require('../repositories/postAdopcion.repository');
const adopcionRepo = require('../repositories/adopcion.repository');

function toNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : v;
}

function fileToUrl(file) {
  if (!file) return null;
  return `/uploads/${file.filename}`;
}

function normalize(payload, foto_url) {
  return {
    adopcion_id: Number(payload.adopcion_id),
    fecha: toNull(payload.fecha),
    observaciones: toNull(payload.observaciones),
    foto_url,
    estado: payload.estado ?? 1,
  };
}

async function list() {
  return postRepo.findAll();
}

async function getById(id) {
  const row = await postRepo.findById(id);
  if (!row) {
    const err = new Error('Seguimiento no encontrado');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload, req) {
  if (!payload?.adopcion_id) {
    const err = new Error('adopcion_id es requerido');
    err.status = 400;
    throw err;
  }
  const foto_url = fileToUrl(req?.file);
  const data = normalize(payload, foto_url);
  const id = await postRepo.create(data);
  return { id };
}

async function update(id, payload, req) {
  if (!payload?.adopcion_id) {
    const err = new Error('adopcion_id es requerido');
    err.status = 400;
    throw err;
  }
  const foto_url = fileToUrl(req?.file);
  const data = normalize(payload, foto_url);
  await postRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await postRepo.remove(id);
  return true;
}

async function preview(adopcionId) {
  if (!adopcionId) return [];
  const listAll = await postRepo.findAll();
  return listAll.filter((x) => String(x.adopcion_id) === String(adopcionId));
}

async function reportPdf(adopcionId) {
  if (!adopcionId) {
    const err = new Error('adopcionId es requerido');
    err.status = 400;
    throw err;
  }

  const adopcion = await adopcionRepo.findById(adopcionId);
  if (!adopcion) {
    const err = new Error('Adopción no encontrada');
    err.status = 404;
    throw err;
  }

  const listAll = await postRepo.findAll();
  const seguimientos = listAll
    .filter((x) => String(x.adopcion_id) === String(adopcionId))
    .sort((a, b) => {
      const da = new Date(a.fecha || a.fecha_creacion || 0);
      const db = new Date(b.fecha || b.fecha_creacion || 0);
      return da - db;
    });

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));

  const toDate = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d)) return '—';
    return new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })
      .format(d)
      .replace('.', '');
  };

  const colors = {
    yellow: '#FFD400',
    dark: '#111827',
    soft: '#6B7280',
    line: '#E5E7EB',
    bg: '#FFFDF0',
  };

  const pageW = doc.page.width;
  const contentW = pageW - doc.page.margins.left - doc.page.margins.right;

  const roundRect = (x, y, w, h, r, fill, stroke) => {
    doc.save();
    doc.roundedRect(x, y, w, h, r);
    if (fill) doc.fill(fill);
    if (stroke) doc.stroke(stroke);
    doc.restore();
  };

  // Minimal header (logo + wordmark)
  const logoX = doc.page.margins.left;
  const logoY = 40;
  const logoPath = path.resolve(__dirname, '..', '..', '..', 'frontend', 'src', 'assets', 'logo-naf.png');
  const hasLogo = fs.existsSync(logoPath);
  if (hasLogo) {
    doc.image(logoPath, logoX, logoY, { fit: [28, 28] });
  } else {
    doc.save();
    doc.circle(logoX + 14, logoY + 14, 14).fill(colors.yellow);
    doc.restore();
  }

  doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(14)
    .text('Narices Frías', logoX + 36, 40);
  doc.fillColor(colors.soft).font('Helvetica').fontSize(9)
    .text('Reporte post-adopción', logoX + 36, 58);

  // Meta block (solo fecha)
  const metaX = doc.page.margins.left + contentW - 160;
  doc.fillColor(colors.soft).fontSize(9)
    .text(`Generado: ${toDate(new Date())}`, metaX, 44, { width: 150, align: 'right' });

  // Divider
  doc.moveTo(doc.page.margins.left, 80).lineTo(doc.page.margins.left + contentW, 80).stroke(colors.line);

  // Summary cards
  const cardY = 105;
  const cardH = 70;
  const gap = 12;
  const cardW = (contentW - gap * 2) / 3;

  const card = (x, title, value) => {
    roundRect(x, cardY, cardW, cardH, 12, '#FFFFFF', colors.line);
    doc.fillColor(colors.soft).fontSize(10).text(title, x + 12, cardY + 12);
    doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(14).text(value, x + 12, cardY + 32);
  };

  const ultimaFecha = seguimientos.length ? toDate(seguimientos[seguimientos.length - 1].fecha) : '—';
  card(doc.page.margins.left, 'Mascota', adopcion.nombre_mascota || '—');
  card(doc.page.margins.left + cardW + gap, 'Adoptante', adopcion.nombre_dueno || '—');
  card(doc.page.margins.left + (cardW + gap) * 2, 'Última visita', ultimaFecha);

  // Datos adopción
  doc.moveDown().moveTo(doc.page.margins.left, cardY + cardH + 22).lineTo(doc.page.margins.left + contentW, cardY + cardH + 22).stroke(colors.line);
  doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(12)
    .text('Datos de la adopción', doc.page.margins.left, cardY + cardH + 34);

  const rowY = cardY + cardH + 54;
  doc.font('Helvetica').fontSize(10).fillColor(colors.soft)
    .text('Fecha solicitud:', doc.page.margins.left, rowY)
    .text('Fecha aprobación:', doc.page.margins.left + 180, rowY)
    .text('Estado:', doc.page.margins.left + 360, rowY);
  doc.fillColor(colors.dark).font('Helvetica-Bold')
    .text(toDate(adopcion.fecha_solicitud), doc.page.margins.left, rowY + 14)
    .text(toDate(adopcion.fecha_aprobacion), doc.page.margins.left + 180, rowY + 14)
    .text(adopcion.estado_llegada || '—', doc.page.margins.left + 360, rowY + 14);

  // Contacto adoptante
  doc.fillColor(colors.soft).font('Helvetica').fontSize(10)
    .text('Contacto:', doc.page.margins.left, rowY + 38);
  doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(10)
    .text(adopcion.telefono_dueno || '—', doc.page.margins.left + 62, rowY + 38);

  // Seguimientos
  let y = rowY + 72;
  doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(12)
    .text('Seguimientos registrados', doc.page.margins.left, y);
  y += 14;
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + contentW, y).stroke(colors.line);
  y += 10;

  const resolveLocalPhoto = (url) => {
    if (!url) return null;
    const clean = String(url).split('?')[0];
    if (!clean.startsWith('/uploads/')) return null;
    const file = clean.replace('/uploads/', '');
    const fullPath = path.join(__dirname, '..', 'uploads', file);
    return fs.existsSync(fullPath) ? fullPath : null;
  };

  if (!seguimientos.length) {
    doc.fillColor(colors.soft).font('Helvetica').fontSize(10)
      .text('No hay seguimientos registrados para esta adopción.', doc.page.margins.left, y);
  } else {
    for (const s of seguimientos) {
      const hasPhoto = !!resolveLocalPhoto(s.foto_url);
      const blockH = hasPhoto ? 110 : 60;
      if (y + blockH > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      roundRect(doc.page.margins.left, y, contentW, blockH, 10, '#FFFFFF', colors.line);
      doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(10)
        .text(toDate(s.fecha), doc.page.margins.left + 12, y + 10);
      doc.fillColor(colors.soft).font('Helvetica').fontSize(9)
        .text('Observaciones', doc.page.margins.left + 12, y + 26);
      doc.fillColor(colors.dark).font('Helvetica').fontSize(10)
        .text(s.observaciones || '—', doc.page.margins.left + 90, y + 24, { width: contentW - 240 });

      const photoPath = resolveLocalPhoto(s.foto_url);
      if (photoPath) {
        try {
          doc.image(photoPath, doc.page.margins.left + contentW - 100, y + 12, { fit: [80, 80], align: 'right' });
          doc.roundedRect(doc.page.margins.left + contentW - 100, y + 12, 80, 80, 8).stroke(colors.line);
        } catch {
          doc.fillColor(colors.soft).font('Helvetica').fontSize(8)
            .text('Foto no disponible', doc.page.margins.left + contentW - 120, y + 42, { width: 100, align: 'right' });
        }
      }

      y += blockH + 10;
    }
  }

  // Footer
  const footerY = doc.page.height - doc.page.margins.bottom + 10;
  doc.fillColor(colors.soft).fontSize(8)
    .text('Narices Frías · Cuidando cada historia después de la adopción', doc.page.margins.left, footerY, { align: 'center', width: contentW });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

async function adopcionesDisponibles() {
  return adopcionRepo.findDisponibles();
}

module.exports = { list, getById, create, update, remove, preview, reportPdf, adopcionesDisponibles };
