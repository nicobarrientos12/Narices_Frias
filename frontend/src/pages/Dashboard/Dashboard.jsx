// src/pages/Dashboard/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  Legend
} from 'recharts';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
import logoNAF from '../../assets/logo-naf.png';

import {
  fetchOverview,
  downloadExcel,
  downloadPDF
} from '../../services/dashboardService';
import { fetchMascotas } from '../../services/mascotaService';

/* ====== PALETA NAF ====== */
const COLORS = {
  primary: "#FFD400",
  ink: "#111827",
  inkSoft: "#374151",
  line: "#E5E7EB",
  bg: "#FFFFFF",
  card: "#FFFFFF"
};
const CHART = {
  naf: COLORS.primary,
  blue: "#3B82F6",
  green: "#10B981",
  orange: "#F59E0B",
  red: "#EF4444",
  gray: "#9CA3AF",
  purple: "#8B5CF6"
};

// Helpers dinero
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmtMoney = (v) =>
  new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(toNumber(v));
const fmtDateTime = (value) => {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
const LIST_CAP = 10;
const topN = (arr = []) => arr.slice(0, LIST_CAP);
const ensureArray = (v) => {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.rows)) return v.rows;
  if (Array.isArray(v?.items)) return v.items;
  if (Array.isArray(v?.result)) return v.result;
  return [];
};

const Dashboard = () => {
  // ====== Filtros (sólo start/end para el nuevo backend) ======
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  // ====== Data del nuevo backend ======
  const [info, setInfo] = useState({
    filtros: { start: null, end: null },
    usuario: null,
    ingresos: { total_general: 0, desglose: [], por_especie: [] },
    listas: {
      proximas_citas: [],
      ultimas_mascotas: [],
      tratamientos_activos: [],
      refugio_con_enfermedades: [],
      proximas_campanias: [],
      ultimas_donaciones: []
    },
    adopciones: { aprobadas: 0, rechazadas: 0 },
    inventario: { vacunas: [], medicamentos: [] },
    alertas: { vacunas_proximas: [], tratamientos_por_vencer: [], citas_sin_contacto: [] }
  });

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState('');
  const [catalogOrder, setCatalogOrder] = useState('fecha');

  const filters = useMemo(() => {
    const f = {};
    if (start) f.start = start;
    if (end) f.end = end;
    return f;
  }, [start, end]);

  // ====== Refs para export (fallback cliente) ======
  const pageRef = useRef(null);
  const chartRefs = {
    pieDesglose: useRef(null),
    barEspecie: useRef(null),
  };

  // ====== Carga principal ======
  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await fetchOverview(filters);
      const listasRaw = data?.listas || {};
      const alertasRaw = data?.alertas || {};
      setInfo({
        filtros: data?.filtros || {},
        usuario: data?.usuario || null,
        ingresos: data?.ingresos || { total_general: 0, desglose: [], por_especie: [] },
        listas: data?.listas || {
          proximas_citas: [], ultimas_mascotas: [], tratamientos_activos: [],
          refugio_con_enfermedades: [], proximas_campanias: [], ultimas_donaciones: []
        },
        adopciones: data?.adopciones || { aprobadas: 0, rechazadas: 0 },
        inventario: data?.inventario || { vacunas: [], medicamentos: [] },
        alertas: {
          vacunas_proximas: ensureArray(alertasRaw.vacunas_proximas ?? data?.vacunas_proximas),
          tratamientos_por_vencer: ensureArray(alertasRaw.tratamientos_por_vencer ?? data?.tratamientos_por_vencer),
          citas_sin_contacto: ensureArray(alertasRaw.citas_sin_contacto ?? data?.citas_sin_contacto),
        },
      });
      setErrMsg('');
    } catch (e) {
      console.error(e);
      setErrMsg('Error cargando dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  // ====== Handlers ======
  const applyFilters = () => loadAll();

  // ====== Export (server) + fallback cliente ======
  const renderCanvas = async (node) =>
    html2canvas(node, { scale: 2, backgroundColor: '#FFFFFF', useCORS: true });

  const exportPDFClientSnapshot = async () => {
    const canvas = await renderCanvas(pageRef.current);
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = canvas.height * (imgW / canvas.width);

    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
    heightLeft -= pageH;

    while (heightLeft > 0) {
      pdf.addPage();
      position = heightLeft - imgH;
      pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    pdf.save('dashboard_naf.pdf');
  };

  const exportExcelClientSimple = async () => {
    // Resumen completo si el server export falla (con estilo)
    const wb = new ExcelJS.Workbook();
    wb.creator = 'NAF Dashboard';
    wb.created = new Date();

    const d = info || {};
    const desg = d.ingresos?.desglose || [];
    const especie = d.ingresos?.por_especie || [];
    const listas = d.listas || {};
    const invent = d.inventario || {};
    const usuario = d.usuario || {};
    const filtros = d.filtros || {};
    const fechaGen = new Date().toLocaleString('es-BO');

    const palette = {
      headerBg: 'FFD400',
      headerText: '111827',
      titleBg: '111827',
      titleText: 'FFFFFF',
      softBg: 'FFF7D1',
      line: 'E5E7EB'
    };

    const applyHeaderStyle = (row) => {
      row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: palette.headerText } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.headerBg } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: palette.line } },
          left: { style: 'thin', color: { argb: palette.line } },
          bottom: { style: 'thin', color: { argb: palette.line } },
          right: { style: 'thin', color: { argb: palette.line } },
        };
      });
    };

    const applyTableBorder = (row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: palette.line } },
          left: { style: 'thin', color: { argb: palette.line } },
          bottom: { style: 'thin', color: { argb: palette.line } },
          right: { style: 'thin', color: { argb: palette.line } },
        };
      });
    };

    const addSheet = (name, headers, rows, colWidths = []) => {
      const ws = wb.addWorksheet(name);
      ws.addRow(headers);
      applyHeaderStyle(ws.getRow(1));
      rows.forEach((r) => ws.addRow(r));
      if (colWidths.length) ws.columns = colWidths.map(w => ({ width: w }));
      ws.eachRow((row, rowNumber) => {
        if (rowNumber > 1) applyTableBorder(row);
      });
      return ws;
    };

    // Resumen
    const wsResumen = wb.addWorksheet('Resumen');
    wsResumen.columns = [{ width: 34 }, { width: 40 }];
    wsResumen.addRow(['Dashboard NAF — Export completo']);
    wsResumen.mergeCells('A1:B1');
    const titleCell = wsResumen.getCell('A1');
    titleCell.font = { bold: true, size: 14, color: { argb: palette.titleText } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.titleBg } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    wsResumen.getRow(1).height = 24;

    const resumenRows = [
      ['Generado', fechaGen],
      ['Usuario', `${usuario.nombre || ''} ${usuario.primer_apellido || ''}`.trim() || '—'],
      ['Rol', usuario.rol || '—'],
      ['Filtro inicio', filtros.start || '—'],
      ['Filtro fin', filtros.end || '—'],
      [],
      ['Total recaudado (Bs)', toNumber(d.ingresos?.total_general || 0)],
      ['Adopciones aprobadas', toNumber(d.adopciones?.aprobadas || 0)],
      ['Adopciones rechazadas', toNumber(d.adopciones?.rechazadas || 0)],
      ['Vacunas disponibles', toNumber(invent.vacunas?.length || 0)],
      ['Medicamentos disponibles', toNumber(invent.medicamentos?.length || 0)],
    ];
    resumenRows.forEach((r) => wsResumen.addRow(r));
    wsResumen.eachRow((row, idx) => {
      if (idx === 1) return;
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: palette.line } },
          left: { style: 'thin', color: { argb: palette.line } },
          bottom: { style: 'thin', color: { argb: palette.line } },
          right: { style: 'thin', color: { argb: palette.line } },
        };
      });
    });
    wsResumen.getRow(2).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.softBg } };
    });

    // Ingresos
    addSheet(
      'Ingresos',
      ['Concepto', 'Monto (Bs)'],
      [
        ...desg.map(x => [x.concepto, toNumber(x.monto)]),
        ['TOTAL GENERAL', toNumber(d.ingresos?.total_general || 0)]
      ],
      [32, 18]
    );

    // Ingresos por especie
    addSheet(
      'IngresosEspecie',
      ['Especie', 'Ingresos (Bs)'],
      especie.map(x => [x.especie, toNumber(x.ingresos)]),
      [20, 18]
    );

    // Proximas citas
    addSheet(
      'ProximasCitas',
      ['Mascota', 'Tipo', 'Dueno', 'Veterinario', 'Fecha', 'Precio (Bs)'],
      topN(listas.proximas_citas || []).map(c => [
        c.mascota || '—',
        c.tipo || '—',
        c.dueno || '—',
        c.veterinario || '—',
        fmtDateTime(c.fecha_hora),
        c.precio != null ? toNumber(c.precio) : ''
      ]),
      [20, 18, 22, 22, 24, 16]
    );

    // Ultimas mascotas
    addSheet(
      'UltimasMascotas',
      ['Nombre', 'Especie', 'Raza', 'Estado', 'Fecha ingreso'],
      topN(listas.ultimas_mascotas || []).map(m => [
        m.nombre || '—',
        m.especie || '—',
        m.raza || '—',
        m.estado_llegada || '—',
        fmtDateTime(m.fecha_ingreso)
      ]),
      [20, 18, 20, 18, 24]
    );

    // Tratamientos activos
    addSheet(
      'TratamientosActivos',
      ['Mascota', 'Diagnostico', 'Fecha inicio', 'Precio (Bs)'],
      topN(listas.tratamientos_activos || []).map(t => [
        t.mascota || '—',
        t.diagnostico || '—',
        fmtDateTime(t.fecha_inicio),
        t.precio != null ? toNumber(t.precio) : ''
      ]),
      [20, 34, 24, 16]
    );

    // Refugio con enfermedades
    addSheet(
      'Enfermedades',
      ['Mascota', 'Especie', 'Enfermedad', 'Fecha diagnostico'],
      topN(listas.refugio_con_enfermedades || []).map(r => [
        r.mascota || '—',
        r.especie || '—',
        r.enfermedad || '—',
        fmtDateTime(r.fecha_diagnostico)
      ]),
      [20, 18, 28, 24]
    );

    // Proximas campanas
    addSheet(
      'Campanas',
      ['Campana', 'Fecha', 'Inversion (Bs)', 'Recaudado (Bs)'],
      topN(listas.proximas_campanias || []).map(ca => [
        ca.nombre || '—',
        fmtDateTime(ca.fecha),
        toNumber(ca.monto_invertido),
        toNumber(ca.total_recaudado)
      ]),
      [26, 24, 18, 18]
    );

    // Ultimas donaciones
    addSheet(
      'Donaciones',
      ['Donante', 'Tipo', 'Monto (Bs)', 'Especie', 'Responsable', 'Fecha'],
      topN(listas.ultimas_donaciones || []).map(dn => [
        dn.nombre_donante || 'Anonimo',
        dn.tipo || '—',
        dn.tipo === 'Monetaria' ? toNumber(dn.monto) : '',
        dn.descripcion_especie || '—',
        dn.responsable || '—',
        fmtDateTime(dn.fecha_donacion)
      ]),
      [22, 14, 16, 28, 22, 24]
    );

    // Inventario completo
    addSheet(
      'Vacunas',
      ['Vacunas disponibles', 'Precio (Bs)'],
      (invent.vacunas || []).map(v => [v.nombre, toNumber(v.precio)]),
      [26, 16]
    );
    addSheet(
      'Medicamentos',
      ['Medicamentos disponibles', 'Precio (Bs)'],
      (invent.medicamentos || []).map(m => [m.nombre, toNumber(m.precio)]),
      [30, 16]
    );

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard_naf_completo.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    try {
      await downloadExcel(filters);
    } catch (e) {
      console.warn('Fallo export Excel server, usando fallback:', e);
      await exportExcelClientSimple();
    }
  };
  const handleExportPDF = async () => {
    try {
      await downloadPDF(filters);
    } catch (e) {
      console.warn('Fallo export PDF server, usando fallback snapshot:', e);
      await exportPDFClientSnapshot();
    }
  };

  const resolveAssetUrl = (src) => {
    if (!src) return null;
    if (src.startsWith('http')) return src;
    if (typeof window !== 'undefined') {
      return new URL(src, window.location.origin).href;
    }
    return src;
  };

  const toDataUrl = async (src) => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const loadImage = (src) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const imageToDataUrl = (img) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  };

  const buildImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const handleExportPerrosYGatosSinDueno = async () => {
    try {
      const raw = await fetchMascotas();
      const mascotas = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      const perros = mascotas.filter((m) => {
        const especie = String(m?.especie || '').toLowerCase();
        const esPerro = especie.includes('perro') || especie === 'canino';
        const sinDueno = m?.dueno_id == null || String(m?.dueno_id).trim() === '';
        return esPerro && sinDueno;
      });
      const gatos = mascotas.filter((m) => {
        const especie = String(m?.especie || '').toLowerCase();
        const esGato = especie.includes('gato') || especie === 'felino';
        const sinDueno = m?.dueno_id == null || String(m?.dueno_id).trim() === '';
        return esGato && sinDueno;
      });
      const byFechaIngreso = (a, b) => {
        const fa = a?.fecha_ingreso ? new Date(a.fecha_ingreso).getTime() : 0;
        const fb = b?.fecha_ingreso ? new Date(b.fecha_ingreso).getTime() : 0;
        if (fa !== fb) return fb - fa;
        const ea = Number.isFinite(Number(a?.edad)) ? Number(a.edad) : 9999;
        const eb = Number.isFinite(Number(b?.edad)) ? Number(b.edad) : 9999;
        return ea - eb;
      };
      const byEdad = (a, b) => {
        const ea = Number.isFinite(Number(a?.edad)) ? Number(a.edad) : 9999;
        const eb = Number.isFinite(Number(b?.edad)) ? Number(b.edad) : 9999;
        if (ea !== eb) return ea - eb;
        const fa = a?.fecha_ingreso ? new Date(a.fecha_ingreso).getTime() : 0;
        const fb = b?.fecha_ingreso ? new Date(b.fecha_ingreso).getTime() : 0;
        return fb - fa;
      };
      const sorter = catalogOrder === 'edad' ? byEdad : byFechaIngreso;
      perros.sort(sorter);
      gatos.sort(sorter);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const marginX = 14;
      const marginY = 18;
      let y = marginY;

      const title = 'Catalogo de perros y gatos sin dueno';
      const fechaGen = new Date().toLocaleDateString('es-BO');
      const total = perros.length + gatos.length;

      // Cover: bold, minimal hero
      pdf.setFillColor(17, 24, 39);
      pdf.rect(0, 0, pageW, 68, 'F');
      pdf.setFillColor(255, 210, 0);
      pdf.rect(0, 68, pageW, 6, 'F');

      const logoUrl = resolveAssetUrl(logoNAF);
      const logoImg = logoUrl ? await loadImage(logoUrl) : null;
      const logoData =
        (logoImg ? imageToDataUrl(logoImg) : null) ||
        (logoUrl ? await toDataUrl(logoUrl) : null);
      // Logo in white circle
      pdf.setFillColor(255, 255, 255);
      pdf.circle(marginX + 18, 34, 16, 'F');
      if (logoData) {
        pdf.addImage(logoData, 'PNG', marginX + 8, 24, 20, 20);
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(255, 255, 255);
      pdf.text(title, marginX + 40, 32);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(229, 231, 235);
      pdf.text('Narices Frias', marginX + 40, 44);

      // Stats chips
      const chipY = 90;
      const chipH = 8;
      const chipGap = 6;
      const chipText = (txt, x) => {
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, chipY, pdf.getTextWidth(txt) + 8, chipH, 2, 2, 'F');
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(9);
        pdf.text(txt, x + 4, chipY + 5.5);
        return x + pdf.getTextWidth(txt) + 8 + chipGap;
      };
      let chipX = marginX;
      chipX = chipText(`Generado: ${fechaGen}`, chipX);
      chipX = chipText(`Total: ${total}`, chipX);
      chipX = chipText(`Perros: ${perros.length}`, chipX);
      chipX = chipText(`Gatos: ${gatos.length}`, chipX);

      pdf.setFontSize(9);
      pdf.setTextColor(75, 85, 99);
      pdf.text(
        catalogOrder === 'edad'
          ? 'Orden: edad (asc), fecha ingreso (desc).'
          : 'Orden: fecha ingreso (desc), edad (asc).',
        marginX,
        106
      );

      // Divider
      pdf.setDrawColor(229, 231, 235);
      pdf.line(marginX, 112, pageW - marginX, 112);

      // Start content on same page for continuity
      y = 126;

      const line = () => {
        pdf.setDrawColor(230, 231, 235);
        pdf.line(marginX, y, pageW - marginX, y);
        y += 6;
      };

      const nextPageIfNeeded = (needed = 24) => {
        if (y + needed > pageH - marginY) {
          pdf.addPage();
          y = marginY;
        }
      };

      const renderSectionTitle = (label) => {
        nextPageIfNeeded(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(17, 24, 39);
        pdf.text(label, marginX, y);
        pdf.setDrawColor(229, 231, 235);
        pdf.line(marginX, y + 3, pageW - marginX, y + 3);
        y += 10;
      };

      const renderItem = async (m, idx, col = 0) => {
        const colGap = 8;
        const cardW = (pageW - marginX * 2 - colGap) / 2;
        const cardH = 44;
        const cardX = marginX + col * (cardW + colGap);
        const cardY = y;

        nextPageIfNeeded(52);

        // Card
        pdf.setDrawColor(229, 231, 235);
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(cardX, cardY, cardW, cardH, 4, 4, 'FD');

        // Accent bar
        pdf.setFillColor(255, 210, 0);
        pdf.rect(cardX, cardY, 3, cardH, 'F');

        const nombre = String(m?.nombre || 'Sin nombre');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(17, 24, 39);
        pdf.text(`${idx + 1}. ${nombre}`, cardX + 24, cardY + 10);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(75, 85, 99);
        const raza = m?.raza ? `Raza: ${m.raza}` : 'Raza: -';
        const edad = (m?.edad != null && m?.edad !== '') ? `Edad: ${m.edad}` : 'Edad: -';
        const genero = m?.genero ? `Genero: ${m.genero}` : 'Genero: -';
        const color = m?.color ? `Color: ${m.color}` : 'Color: -';
        const ingreso = m?.fecha_ingreso ? `Ingreso: ${String(m.fecha_ingreso).slice(0,10)}` : 'Ingreso: -';
        const estado = m?.estado_llegada ? `Estado: ${m.estado_llegada}` : 'Estado: -';
        pdf.text(`${raza}  |  ${edad}  |  ${genero}`, cardX + 24, cardY + 19);
        pdf.text(`${color}  |  ${ingreso}`, cardX + 24, cardY + 27);
        pdf.text(`${estado}`, cardX + 24, cardY + 35);

        // Caracteristicas (compact)
        if (m?.caracteristicas) {
          const maxW = cardW - 24;
          const text = `Caracteristicas: ${String(m.caracteristicas)}`;
          const wrapped = pdf.splitTextToSize(text, maxW);
          if (wrapped.length) {
            pdf.text(wrapped.slice(0, 1), cardX + 24, cardY + 41);
          }
        }

        // Thumbnail
        const imgUrl = buildImageUrl(m?.foto_url);
        if (imgUrl) {
          const imgData = await toDataUrl(imgUrl);
          if (imgData) {
            pdf.addImage(imgData, 'JPEG', cardX + 8, cardY + 8, 16, 16);
          } else {
            pdf.setDrawColor(229, 231, 235);
            pdf.setFillColor(249, 250, 251);
            pdf.circle(cardX + 16, cardY + 16, 8, 'FD');
          }
        } else {
          pdf.setDrawColor(229, 231, 235);
          pdf.setFillColor(249, 250, 251);
          pdf.circle(cardX + 16, cardY + 16, 8, 'FD');
        }
      };

      if (total === 0) {
        pdf.setFontSize(12);
        pdf.text('No hay perros ni gatos sin dueno registrados.', marginX, y);
      } else {
        let globalIndex = 0;
        if (perros.length) {
          renderSectionTitle('Perros');
          let col = 0;
          for (const m of perros) {
            await renderItem(m, globalIndex, col);
            globalIndex += 1;
            if (col === 1) {
              y += 50;
              col = 0;
            } else {
              col = 1;
            }
          }
          if (perros.length % 2 === 1) y += 50;
        }

        if (gatos.length) {
          renderSectionTitle('Gatos');
          let col = 0;
          for (const m of gatos) {
            await renderItem(m, globalIndex, col);
            globalIndex += 1;
            if (col === 1) {
              y += 50;
              col = 0;
            } else {
              col = 1;
            }
          }
          if (gatos.length % 2 === 1) y += 50;
        }
      }

      pdf.save('catalogo_perros_gatos_sin_dueno.pdf');
    } catch (e) {
      console.error('Error exportando catalogo de perros y gatos:', e);
      alert('No se pudo generar el catalogo de perros y gatos.');
    }
  };

  // ====== Derivados de UI ======
  const usuarioNombre = info?.usuario
    ? `${info.usuario.nombre || ''} ${info.usuario.primer_apellido || ''}`.trim()
    : '—';

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center" style={{ background: COLORS.bg, color: COLORS.ink }}>
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/10 border-t-[#FFD400]" />
          <p className="text-sm">Cargando dashboard…</p>
        </div>
      </div>
    );
  }
  if (errMsg) return <p className="p-6 text-red-600">{errMsg}</p>;

  return (
    <div
      ref={pageRef}
      className="min-h-screen"
      style={{
        fontFamily: '"Plus Jakarta Sans","Inter","Noto Sans",system-ui,sans-serif',
        background: COLORS.bg,
        color: COLORS.ink
      }}
    >
      {/* Topbar */}
      <header
        className="px-6 md:px-10 py-5 sticky top-0 z-20"
        style={{
          backdropFilter: 'saturate(180%) blur(6px)',
          background: '#FFFFFFE6',
          borderBottom: `1px solid ${COLORS.line}`
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: '#FFF2B3' }}>
              <span className="font-extrabold" style={{ color: '#1a1a1a' }}>NAF</span>
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: COLORS.ink }}>
                Dashboard — Narices Frías
              </h1>
              <p className="text-xs" style={{ color: COLORS.inkSoft }}>
                Usuario: <strong style={{ color: COLORS.ink }}>{usuarioNombre}</strong> · Rol: {info?.usuario?.rol || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="rounded-xl px-4 py-2 font-semibold transition"
              style={{ background: COLORS.card, color: COLORS.ink, border: `1px solid ${COLORS.line}` }}>
              Exportar Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="rounded-xl px-4 py-2 font-extrabold transition"
              style={{ background: COLORS.primary, color: COLORS.ink }}>
              Exportar PDF
            </button>
            <button
              onClick={handleExportPerrosYGatosSinDueno}
              className="rounded-xl px-4 py-2 font-semibold transition"
              style={{ background: COLORS.card, color: COLORS.ink, border: `1px solid ${COLORS.line}` }}>
              Catalogo perros y gatos sin dueno
            </button>
            <select
              value={catalogOrder}
              onChange={(e) => setCatalogOrder(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm font-semibold"
              style={{ background: COLORS.card, color: COLORS.ink, border: `1px solid ${COLORS.line}` }}
              title="Orden del catalogo"
            >
              <option value="fecha">Ordenar por fecha ingreso</option>
              <option value="edad">Ordenar por edad</option>
            </select>
          </div>
        </div>

        {/* Filtros (solo fecha) */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Inicio">
            <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="input" />
          </Field>
          <Field label="Fin">
            <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="input" />
          </Field>
          <div className="md:col-span-1 flex items-end justify-end">
            <button
              onClick={applyFilters}
              className="rounded-xl px-4 py-2 transition"
              style={{ background: COLORS.card, color: COLORS.ink, border: `1px solid ${COLORS.line}` }}>
              Aplicar filtros
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 md:px-10 py-8 space-y-8">
        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <KPI title="Total recaudado" value={fmtMoney(info.ingresos.total_general)} highlight />
          <KPI title="Adopciones aprobadas" value={toNumber(info.adopciones.aprobadas)} />
          <KPI title="Adopciones rechazadas" value={toNumber(info.adopciones.rechazadas)} />
          <KPI title="Vacunas disponibles" value={toNumber(info.inventario.vacunas.length)} />
        </section>


        {/* Desglose ingresos + Ingresos por especie */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Desglose de ingresos (rango)">
            <div ref={chartRefs.pieDesglose}>
              {info.ingresos.desglose.length === 0
                ? <Empty text="Sin datos." />
                : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={info.ingresos.desglose.map(d=>({name: d.concepto, value: toNumber(d.monto)}))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={100}
                        label
                      >
                        <Cell fill={CHART.naf} />
                        <Cell fill={CHART.blue} />
                        <Cell fill={CHART.green} />
                        <Cell fill={CHART.orange} />
                        <Cell fill={CHART.purple} />
                        <Cell fill={CHART.red} />
                      </Pie>
                      <Tooltip formatter={(v)=>fmtMoney(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
            </div>
          </Card>

          <Card title="Ingresos por especie">
            <div ref={chartRefs.barEspecie}>
              {info.ingresos.por_especie.length === 0 ? <Empty text="Sin datos." /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={info.ingresos.por_especie.map(x => ({ especie: x.especie, ingresos: toNumber(x.ingresos) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="especie" stroke={COLORS.inkSoft} />
                    <YAxis stroke={COLORS.inkSoft} />
                    <Tooltip formatter={(v)=>fmtMoney(v)} />
                    <Bar dataKey="ingresos" fill={CHART.naf} radius={[8,8,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </section>

        {/* Listas principales: Citas, Mascotas, Tratamientos */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card title="Próximas citas">
            {info.listas.proximas_citas.length === 0 ? <Empty text="No hay próximas citas." /> : (
              <ul className="divide-y" style={{ borderColor: COLORS.line }}>
                {topN(info.listas.proximas_citas).map(c => (
                  <li key={c.id} className="py-3 flex items-center justify-between" style={{ color: COLORS.ink }}>
                    <div>
                      <div className="font-semibold">{c.mascota} <span className="text-xs" style={{ color: COLORS.inkSoft }}>({c.tipo})</span></div>
                      <div className="text-xs" style={{ color: COLORS.inkSoft }}>
                        Dueño: {c.dueno || '—'} · Vet: {c.veterinario}
                      </div>
                    </div>
                    <div className="text-sm text-right">
                      <div style={{ color: COLORS.inkSoft }}>{fmtDateTime(c.fecha_hora)}</div>
                      {c.precio != null && <div className="font-semibold">{fmtMoney(c.precio)}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Últimas mascotas ingresadas">
            {info.listas.ultimas_mascotas.length === 0 ? <Empty text="Sin mascotas." /> : (
              <ul className="divide-y" style={{ borderColor: COLORS.line }}>
                {topN(info.listas.ultimas_mascotas).map(m => (
                  <li key={m.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl grid place-items-center font-bold"
                           style={{ background: '#F9FAFB', border: `1px solid ${COLORS.line}`, color: COLORS.ink }}>
                        {(m.nombre || '?').slice(0,1).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{m.nombre || '—'}</div>
                        <div className="text-xs" style={{ color: COLORS.inkSoft }}>
                          {m.especie || '—'} · {m.raza || '—'} · {m.estado_llegada || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: COLORS.inkSoft }}>{fmtDateTime(m.fecha_ingreso) || '—'}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Tratamientos activos">
            {info.listas.tratamientos_activos.length === 0 ? <Empty text="No hay tratamientos activos." /> : (
              <ul className="divide-y" style={{ borderColor: COLORS.line }}>
                {topN(info.listas.tratamientos_activos).map(t => (
                  <li key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{t.mascota || '—'}</div>
                      <div className="text-xs" style={{ color: COLORS.inkSoft }}>
                        {t.diagnostico || '—'}
                      </div>
                    </div>
                    <div className="text-xs text-right" style={{ color: COLORS.inkSoft }}>
                      Inicio: {fmtDateTime(t.fecha_inicio) || '—'}
                      {t.precio != null && <div className="font-semibold" style={{ color: COLORS.ink }}>{fmtMoney(t.precio)}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* Más listas: Refugio con enfermedades, Próximas campañas, Donaciones */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Refugio — Mascotas con enfermedades">
            {info.listas.refugio_con_enfermedades.length === 0 ? <Empty text="Sin registros." /> : (
              <ul className="divide-y" style={{ borderColor: COLORS.line }}>
                {topN(info.listas.refugio_con_enfermedades).map(r => (
                  <li key={`${r.id}-${r.enfermedad}`} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{r.mascota} <span className="text-xs" style={{ color: COLORS.inkSoft }}>({r.especie})</span></div>
                      <div className="text-xs" style={{ color: COLORS.inkSoft }}>Enfermedad: {r.enfermedad}</div>
                    </div>
                    <div className="text-xs" style={{ color: COLORS.inkSoft }}>{fmtDateTime(r.fecha_diagnostico) || '—'}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Próximas campañas">
            {info.listas.proximas_campanias.length === 0 ? <Empty text="No hay campañas próximas." /> : (
              <ul className="divide-y" style={{ borderColor: COLORS.line }}>
                {topN(info.listas.proximas_campanias).map(ca => (
                  <li key={ca.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{ca.nombre}</div>
                      <div className="text-xs" style={{ color: COLORS.inkSoft }}>
                        Inversión: {fmtMoney(ca.monto_invertido)} · Recaudado: {fmtMoney(ca.total_recaudado)}
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: COLORS.inkSoft }}>{fmtDateTime(ca.fecha) || '—'}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Últimas donaciones">
            {info.listas.ultimas_donaciones.length === 0 ? <Empty text="Sin donaciones." /> : (
              <ul className="divide-y" style={{ borderColor: COLORS.line }}>
                {topN(info.listas.ultimas_donaciones).map(d => (
                  <li key={d.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        {d.tipo === 'Monetaria' ? (d.nombre_donante || 'Anónimo') : (d.nombre_donante || 'Anónimo')}
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                          style={{ background:'#FFF7D1', border:`1px solid ${COLORS.primary}`, color: COLORS.ink }}>
                          {d.tipo}
                        </span>
                      </div>
                      <div className="text-xs" style={{ color: COLORS.inkSoft }}>
                        {d.tipo === 'Monetaria' ? `Monto: ${fmtMoney(d.monto)}` : `Especie: ${d.descripcion_especie || '—'}`} · Resp: {d.responsable}
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: COLORS.inkSoft }}>{fmtDateTime(d.fecha_donacion) || '—'}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* Inventario */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Vacunas disponibles">
            {info.inventario.vacunas.length === 0 ? <Empty text="Sin vacunas registradas." /> : (
              <ul className="divide-y" style={{ borderColor: COLORS.line }}>
                {info.inventario.vacunas.map(v => (
                  <li key={v.id} className="py-2 flex items-center justify-between" style={{ color: COLORS.ink }}>
                    <span>{v.nombre}</span>
                    <span className="font-semibold" style={{ color: COLORS.ink }}>{fmtMoney(v.precio)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Medicamentos disponibles">
            {info.inventario.medicamentos.length === 0 ? <Empty text="Sin medicamentos registrados." /> : (
              <ul className="divide-y" style={{ borderColor: COLORS.line }}>
                {info.inventario.medicamentos.map(m => (
                  <li key={m.id} className="py-2 flex items-center justify-between" style={{ color: COLORS.ink }}>
                    <span>{m.nombre}</span>
                    <span className="font-semibold" style={{ color: COLORS.ink }}>{fmtMoney(m.precio)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </main>

      <footer className="px-6 md:px-10 py-10 text-center" style={{ color: '#9CA3AF' }}>
        Hecho con dedicacion para Narices Frias — {new Date().getFullYear()}
      </footer>

      {/* Styles locales para inputs */}
      <style>{`
        .input{
          width:100%;
          background:#FFFFFF;
          color:#111827;
          border:1px solid #E5E7EB;
          padding:10px 12px;
          border-radius:12px;
          outline:none;
          transition:.2s ease;
        }
        .input:focus{ border-color:#FFD400; box-shadow:0 0 0 3px rgba(255,212,0,.2); }
      `}</style>
    </div>
  );
};

/* ================= Subcomponentes ================= */

const Card = ({ title, children }) => (
  <section
    className="rounded-2xl overflow-hidden bg-white"
    style={{
      border: `1px solid ${COLORS.line}`,
      boxShadow: "0 10px 30px rgba(17,24,39,0.06)"
    }}
  >
    <div className="px-5 py-4 border-b" style={{ borderColor: COLORS.line, background: "#FFFDF0" }}>
      <h2 className="text-lg font-extrabold" style={{ color: COLORS.ink }}>{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const KPI = ({ title, value, highlight }) => (
  <div
    className="relative rounded-2xl p-5"
    style={{
      background: highlight ? COLORS.primary : '#FFFFFF',
      color: COLORS.ink,
      border: `1px solid ${highlight ? '#F5D000' : COLORS.line}`,
      boxShadow: highlight ? "0 14px 36px rgba(255,212,0,0.35)" : "0 10px 30px rgba(17,24,39,0.06)"
    }}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: '#6B7280' }}>{highlight ? 'Finanzas' : 'Indicador'}</span>
      <span className="h-2 w-2 rounded-full" style={{ background: highlight ? '#111827' : COLORS.primary }} />
    </div>
    <h3 className="mt-2 text-sm font-semibold" style={{ color: COLORS.ink }}>{title}</h3>
    <p className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: COLORS.ink }}>
      {value}
    </p>
  </div>
);

const Field = ({ label, children }) => (
  <label className="text-xs space-y-1" style={{ color: COLORS.inkSoft }}>
    <div>{label}</div>
    {children}
  </label>
);

const Empty = ({ text }) => (
  <div className="grid place-items-center h-56 text-sm" style={{ color: COLORS.inkSoft }}>
    {text}
  </div>
);

export default Dashboard;






