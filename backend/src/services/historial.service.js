const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const historialRepo = require('../repositories/historial.repository');

function toNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : v;
}

function normalize(payload) {
  return {
    mascota_id: Number(payload.mascota_id),
    fecha: toNull(payload.fecha),
    descripcion: toNull(payload.descripcion),
    usuario_id: Number(payload.usuario_id),
    estado: payload.estado ?? 1,
  };
}

async function list() {
  return historialRepo.findAll();
}

async function getById(id) {
  const row = await historialRepo.findById(id);
  if (!row) {
    const err = new Error('Historial no encontrado');
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(payload) {
  if (!payload?.mascota_id || !payload?.usuario_id) {
    const err = new Error('mascota_id y usuario_id son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  const id = await historialRepo.create(data);
  return { id };
}

async function update(id, payload) {
  if (!payload?.mascota_id || !payload?.usuario_id) {
    const err = new Error('mascota_id y usuario_id son requeridos');
    err.status = 400;
    throw err;
  }
  const data = normalize(payload);
  await historialRepo.update(id, data);
  return { id: Number(id) };
}

async function remove(id) {
  await historialRepo.remove(id);
  return true;
}

async function reportPdf(mascotaId) {
  if (!mascotaId) {
    const err = new Error('mascotaId es requerido');
    err.status = 400;
    throw err;
  }

  const data = await historialRepo.reportData(mascotaId);
  if (!data?.mascota) {
    const err = new Error('Mascota no encontrada');
    err.status = 404;
    throw err;
  }

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));

  const colors = {
    dark: '#111827',
    soft: '#6B7280',
    line: '#E5E7EB',
    yellow: '#FFD400',
  };

  const pageW = doc.page.width;
  const contentW = pageW - doc.page.margins.left - doc.page.margins.right;

  const toDate = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d)) return '—';
    return new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })
      .format(d)
      .replace('.', '');
  };

  const toMoney = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    try {
      return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 2 }).format(n);
    } catch {
      return `Bs ${n.toFixed(2)}`;
    }
  };

  const ensureSpace = (h) => {
    if (doc.y + h > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      doc.y = doc.page.margins.top;
    }
  };

  // Header (minimal + logo)
  const logoPath = path.resolve(__dirname, '..', '..', '..', 'frontend', 'src', 'assets', 'logo-naf.png');
  const hasLogo = fs.existsSync(logoPath);
  const logoX = doc.page.margins.left;
  const logoY = 40;
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
    .text('Historial clínico por mascota', logoX + 36, 58);

  const metaX = doc.page.margins.left + contentW - 170;
  doc.fillColor(colors.soft).fontSize(9)
    .text(`Generado: ${toDate(new Date())}`, metaX, 44, { width: 160, align: 'right' });

  doc.moveTo(doc.page.margins.left, 80).lineTo(doc.page.margins.left + contentW, 80).stroke(colors.line);

  // Basic info
  doc.y = 92;
  doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(16)
    .text(data.mascota.nombre || 'Mascota', doc.page.margins.left, doc.y);
  doc.fillColor(colors.soft).font('Helvetica').fontSize(9)
    .text(`${data.mascota.especie || '—'} · ${data.mascota.raza || '—'}`, doc.page.margins.left, doc.y + 18);

  doc.y += 30;

  // ===== Resumen en tarjetas (datos básicos) =====
  const cardGap = 10;
  const cardH = 46;
  const cardW = (contentW - cardGap * 3) / 4;
  const baseY = doc.y;
  const labels = [
    { label: 'Edad', value: data.mascota.edad ?? '—' },
    { label: 'Sexo', value: data.mascota.genero || '—' },
    { label: 'Esterilizado', value: data.mascota.esterilizado || '—' },
    { label: 'Estado', value: data.mascota.estado_llegada || '—' },
  ];
  labels.forEach((c, i) => {
    const x = doc.page.margins.left + i * (cardW + cardGap);
    doc.roundedRect(x, baseY, cardW, cardH, 8).stroke(colors.line);
    doc.fillColor(colors.soft).font('Helvetica').fontSize(8)
      .text(c.label, x + 10, baseY + 8);
    doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(11)
      .text(String(c.value), x + 10, baseY + 22, { width: cardW - 20 });
  });

  doc.y = baseY + cardH + 16;
  doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + contentW, doc.y).stroke(colors.line);
  doc.y += 12;

  // ===== Contadores de salud (pill row) =====
  const counts = [
    { label: 'Citas', value: data.citas.length },
    { label: 'Vacunas', value: data.vacunas.length },
    { label: 'Tratamientos', value: data.tratamientos.length },
    { label: 'Enfermedades', value: data.enfermedades.length },
    { label: 'Alergias', value: data.alergias.length },
  ];
  const pillGap = 8;
  const pillW = (contentW - pillGap * 4) / 5;
  const pillH = 30;
  const pillY = doc.y;
  counts.forEach((c, i) => {
    const x = doc.page.margins.left + i * (pillW + pillGap);
    doc.roundedRect(x, pillY, pillW, pillH, 999).stroke(colors.line);
    doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(10)
      .text(String(c.value), x + 10, pillY + 9);
    doc.fillColor(colors.soft).font('Helvetica').fontSize(9)
      .text(c.label, x + 26, pillY + 9, { width: pillW - 30 });
  });
  doc.y = pillY + pillH + 18;

  const section = (title) => {
    ensureSpace(30);
    doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(12)
      .text(title, doc.page.margins.left, doc.y);
    doc.y += 12;
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + contentW, doc.y).stroke(colors.line);
    doc.y += 8;
  };

  const item = (text) => {
    ensureSpace(16);
    doc.fillColor(colors.dark).font('Helvetica').fontSize(10)
      .text(`• ${text}`, doc.page.margins.left, doc.y);
    doc.y += 14;
  };

  // Citas
  section('Citas veterinarias');
  if (!data.citas.length) {
    doc.fillColor(colors.soft).font('Helvetica').fontSize(10).text('Sin registros.', doc.page.margins.left, doc.y);
    doc.y += 14;
  } else {
    data.citas.slice(0, 50).forEach((c) => {
      const linea = `${toDate(c.fecha)} · ${c.tipo || 'Cita'} · Vet: ${c.veterinario || '—'}${c.motivo ? ` · ${c.motivo}` : ''}`;
      item(linea);
    });
  }

  // Vacunas
  section('Vacunas');
  if (!data.vacunas.length) {
    doc.fillColor(colors.soft).font('Helvetica').fontSize(10).text('Sin registros.', doc.page.margins.left, doc.y);
    doc.y += 14;
  } else {
    data.vacunas.slice(0, 50).forEach((v) => {
      const linea = `${v.vacuna || 'Vacuna'} · ${toDate(v.fecha_aplicacion)}${v.proxima_aplicacion ? ` · Próx: ${toDate(v.proxima_aplicacion)}` : ''} · Vet: ${v.veterinario || '—'}`;
      item(linea);
    });
  }

  // Enfermedades
  section('Enfermedades');
  if (!data.enfermedades.length) {
    doc.fillColor(colors.soft).font('Helvetica').fontSize(10).text('Sin registros.', doc.page.margins.left, doc.y);
    doc.y += 14;
  } else {
    data.enfermedades.slice(0, 50).forEach((e) => {
      const linea = `${e.enfermedad || 'Enfermedad'} · ${toDate(e.fecha_diagnostico)}${e.observaciones ? ` · ${e.observaciones}` : ''}`;
      item(linea);
    });
  }

  // Alergias
  section('Alergias');
  if (!data.alergias.length) {
    doc.fillColor(colors.soft).font('Helvetica').fontSize(10).text('Sin registros.', doc.page.margins.left, doc.y);
    doc.y += 14;
  } else {
    data.alergias.slice(0, 50).forEach((a) => {
      const linea = `${a.alergia || 'Alergia'}${a.observaciones ? ` · ${a.observaciones}` : ''}`;
      item(linea);
    });
  }

  // Tratamientos + medicamentos
  section('Tratamientos y medicamentos');
  if (!data.tratamientos.length) {
    doc.fillColor(colors.soft).font('Helvetica').fontSize(10).text('Sin registros.', doc.page.margins.left, doc.y);
    doc.y += 14;
  } else {
    const medsByTrat = data.medicamentos.reduce((acc, m) => {
      const key = String(m.tratamiento_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {});

    data.tratamientos.slice(0, 50).forEach((t) => {
      const head = `${t.diagnostico || 'Tratamiento'} · ${toDate(t.fecha_inicio)}${t.fecha_fin ? ` → ${toDate(t.fecha_fin)}` : ''} · Vet: ${t.veterinario || '—'} · ${toMoney(t.precio)}`;
      item(head);
      const meds = medsByTrat[String(t.id)] || [];
      meds.forEach((m) => {
        ensureSpace(14);
        doc.fillColor(colors.soft).font('Helvetica').fontSize(9)
          .text(`   - ${m.medicamento || 'Medicamento'}${m.dosis ? ` · ${m.dosis}` : ''}${m.frecuencia ? ` · ${m.frecuencia}` : ''}${m.duracion ? ` · ${m.duracion}` : ''}`, doc.page.margins.left, doc.y);
        doc.y += 12;
      });
    });
  }

  // Historial clínico
  section('Notas clínicas');
  if (!data.historial.length) {
    doc.fillColor(colors.soft).font('Helvetica').fontSize(10).text('Sin registros.', doc.page.margins.left, doc.y);
    doc.y += 14;
  } else {
    data.historial.slice(0, 80).forEach((h) => {
      const linea = `${toDate(h.fecha)} · Vet: ${h.veterinario || '—'}${h.descripcion ? ` · ${h.descripcion}` : ''}`;
      item(linea);
    });
  }

  // Footer
  const footerY = doc.page.height - doc.page.margins.bottom + 10;
  doc.fillColor(colors.soft).fontSize(8)
    .text('Narices Frías · Historial clínico', doc.page.margins.left, footerY, { align: 'center', width: contentW });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

async function listMascotas() {
  return historialRepo.listMascotas();
}

module.exports = { list, getById, create, update, remove, reportPdf, listMascotas };
