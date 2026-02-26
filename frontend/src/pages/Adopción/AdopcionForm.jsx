// src/pages/Adopcion/AdopcionForm.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { createAdopcion, fetchAdopcion, updateAdopcion } from '../../services/adopcionService';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
const authHeaders = () => {
  const t = localStorage.getItem('token') || '';
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// ---------- helpers ----------
const toYMD = (v) => {
  if (!v) return '';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const ensureArray = (x) => Array.isArray(x) ? x : (Array.isArray(x?.data) ? x.data : []);

function StatusPill({ value }) {
  const map = {
    '': 'bg-gray-100 text-gray-700 border-gray-200',
    'En revisión': 'bg-[#FFF7CC] text-[#7A6400] border-[#FCE680]',
    'Aprobada': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Rechazada': 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const cls = map[value] ?? map[''];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current/60" />
      {value || 'Sin estado'}
    </span>
  );
}

// ---------- AutoComplete (chip + buscador) ----------
function AutoComplete({ items, value, onChange, getLabel, placeholder, required, disabled }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selected = useMemo(
    () => items.find((it) => String(it.id) === String(value)) || null,
    [items, value]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items.slice(0, 50);
    return items.filter((it) => (getLabel(it) || '').toLowerCase().includes(s)).slice(0, 50);
  }, [items, q, getLabel]);

  if (selected && !open) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium bg-slate-50 border-slate-200 text-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-current/60" />
          {getLabel(selected)}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs font-semibold underline decoration-dotted text-slate-700"
          >
            Cambiar
          </button>
        )}
        {required && !selected && <span className="text-xs text-rose-600">*</span>}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        disabled={disabled}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
        style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
        onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
      />
      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-64 overflow-auto">
          {filtered.length ? (
            filtered.map((it) => (
              <button
                key={it.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => { onChange(it.id); setQ(''); setOpen(false); }}
              >
                {getLabel(it)}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">Sin resultados</div>
          )}
        </div>
      )}
      {required && (
        <input type="hidden" required value={selected ? 'ok' : ''} onChange={() => {}} />
      )}
    </div>
  );
}

const AdopcionForm = () => {
  const { id } = useParams();
  const nav = useNavigate();

  const [mascotas, setMascotas] = useState([]);
  const [duenos, setDuenos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [err, setErr] = useState('');
  const [duenoLocked, setDuenoLocked] = useState(false);
  const prevMascotaIdRef = useRef('');

  const [form, setForm] = useState({
    mascota_id: '',
    dueno_id: '',
    fecha_solicitud: '',
    fecha_aprobacion: '',
    estado_llegada: '',
    observaciones: '',
    usuario_id: ''
  });

  const selectedMascota = useMemo(
    () => mascotas.find((m) => String(m?.id) === String(form.mascota_id)) || null,
    [mascotas, form.mascota_id]
  );

  // Auto-asignar dueÃ±o segÃºn la mascota seleccionada
  useEffect(() => {
    const autoDuenoId = selectedMascota?.dueno_id ?? selectedMascota?.duenoId ?? selectedMascota?.dueno?.id ?? '';
    const hasAuto = String(autoDuenoId || '').trim() !== '';
    setDuenoLocked(hasAuto);

    if (hasAuto) {
      if (String(form.dueno_id) !== String(autoDuenoId)) {
        setForm((f) => ({ ...f, dueno_id: String(autoDuenoId) }));
      }
    } else {
      if (prevMascotaIdRef.current !== String(form.mascota_id)) {
        setForm((f) => ({ ...f, dueno_id: '' }));
      }
    }
    prevMascotaIdRef.current = String(form.mascota_id);
  }, [selectedMascota, form.mascota_id, form.dueno_id]);

  // Cargar catálogos (con token)
  useEffect(() => {
    axios.get(`${apiBase}/mascotas`, { headers: authHeaders(), withCredentials:true })
      .then(r => setMascotas(ensureArray(r.data)))
      .catch(() => setMascotas([]));

    axios.get(`${apiBase}/duenos`, { headers: authHeaders(), withCredentials:true })
      .then(r => setDuenos(ensureArray(r.data)))
      .catch(() => setDuenos([]));

    // Veterinarios/responsables con fallbacks
    const loadUsuarios = async () => {
      const fetchList = async (url) => {
        const res = await fetch(url, { headers: { ...authHeaders() }, credentials: 'include' });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        return ensureArray(data);
      };
      try {
        setUsuarios(await fetchList(`${apiBase}/usuarios/veterinarios`));
      } catch {
        try {
          setUsuarios(await fetchList(`${apiBase}/usuarios?rol=Veterinario`));
        } catch {
          try {
            const all = await fetchList(`${apiBase}/usuarios`);
            setUsuarios(all.filter(u => String(u?.rol || '').toLowerCase() === 'veterinario'));
          } catch {
            setUsuarios([]);
          }
        }
      }
    };
    loadUsuarios();
  }, []);

  // Cargar registro si edita
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await fetchAdopcion(id); // devuelve el objeto directamente
        setForm({
          mascota_id: data?.mascota_id ?? '',
          dueno_id: data?.dueno_id ?? '',
          fecha_solicitud: toYMD(data?.fecha_solicitud) || '',
          fecha_aprobacion: toYMD(data?.fecha_aprobacion) || '',
          estado_llegada: data?.estado_llegada || '',
          observaciones: data?.observaciones || '',
          usuario_id: data?.usuario_id || '',
        });
      } catch (e) {
        console.error('No se pudo cargar la adopción', e);
        setErr('No se pudo cargar la adopción.');
      }
    })();
  }, [id]);

  // ------- Validación Front -------
  function validate() {
    const s = (v) => String(v ?? '').trim();

    // IDs
    if (!/^\d+$/.test(s(form.mascota_id))) return 'Selecciona una mascota válida.';
    if (!/^\d+$/.test(s(form.dueno_id))) return 'Selecciona un adoptante válido.';
    if (!/^\d+$/.test(s(form.usuario_id))) return 'Selecciona un usuario responsable válido.';

    // Estado
    if (!['En revisión', 'Aprobada', 'Rechazada'].includes(s(form.estado_llegada))) {
      return 'Selecciona un estado válido.';
    }

    // Fechas (YYYY-MM-DD)
    const fs = toYMD(form.fecha_solicitud);
    if (!fs) return 'La fecha de solicitud es obligatoria y debe tener formato YYYY-MM-DD.';
    const min = new Date('2000-01-01T00:00:00');
    const max = new Date(); max.setFullYear(max.getFullYear() + 10);
    const dFS = new Date(fs + 'T00:00:00');
    if (dFS < min || dFS > max) return 'La fecha de solicitud está fuera de un rango válido.';

    const fa = toYMD(form.fecha_aprobacion) || null;

    if (form.estado_llegada === 'Aprobada') {
      if (!fa) return 'La fecha de aprobación es obligatoria cuando el estado es Aprobada.';
      const dFA = new Date(fa + 'T00:00:00');
      if (dFA < dFS) return 'La fecha de aprobación no puede ser anterior a la solicitud.';
      if (dFA > max) return 'La fecha de aprobación está fuera de un rango válido.';
    } else {
      // En revisión / Rechazada -> fecha_aprobacion debe ir vacía
      if (fa) return 'La fecha de aprobación debe estar vacía salvo cuando el estado sea Aprobada.';
    }

    // Observaciones (opcional)
    const obs = s(form.observaciones);
    if (obs && obs.length > 2000) return 'Observaciones: máximo 2000 caracteres.';
    if (obs && !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9.,;:'"º°%/()\-_\r\n\s]*$/.test(obs)) {
      return 'Observaciones contiene caracteres no permitidos.';
    }

    return null;
  }

  function buildPayload() {
    const clean = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');
    const estado = form.estado_llegada;
    const fs = toYMD(form.fecha_solicitud);
    const fa = toYMD(form.fecha_aprobacion) || null;

    return {
      mascota_id: Number(form.mascota_id),
      dueno_id: Number(form.dueno_id),
      fecha_solicitud: fs,
      fecha_aprobacion: estado === 'Aprobada' ? fa : null,
      estado_llegada: estado,
      observaciones: clean(form.observaciones) || null,
      usuario_id: Number(form.usuario_id),
    };
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    const v = validate();
    if (v) { setErr(v); return; }

    const datos = buildPayload();
    try {
      if (id) await updateAdopcion(id, datos);
      else await createAdopcion(datos);
      nav('/adopciones');
    } catch (error) {
      console.error('Error guardando adopción:', error);
      setErr(error?.response?.data?.message || error?.message || 'No se pudo guardar.');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-white via-white to-slate-50">
      <div className="mx-auto max-w-5xl p-4 sm:p-6 md:p-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              {id ? 'Editar Adopción' : 'Nueva Adopción'}
            </h2>
            <p className="text-sm text-slate-600">
              Completa los datos para gestionar el proceso de adopción.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill value={form.estado_llegada} />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/5">
          <div className="border-b border-slate-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span aria-hidden className="inline-block h-4 w-4 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Información de adopción</h3>
                  <p className="text-sm text-slate-600">
                    Campos obligatorios marcados con <span className="text-rose-600">*</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-4 sm:p-6">
            {err && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {err}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Mascota (AutoComplete) */}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">
                  Mascota <span className="text-rose-600">*</span>
                </label>
                <AutoComplete
                  items={mascotas}
                  value={form.mascota_id}
                  onChange={(idVal) => setForm(f => ({ ...f, mascota_id: idVal }))}
                  placeholder="Buscar mascota…"
                  required
                  disabled={false}
                  getLabel={(m) => m?.nombre ? m.nombre : `#${m.id}`}
                />
                <p className="text-xs text-slate-500">Lista cargada desde la API de mascotas.</p>
              </div>

              {/* Adoptante (AutoComplete) */}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">
                  Adoptante <span className="text-rose-600">*</span>
                </label>
                <AutoComplete
                  items={duenos}
                  value={form.dueno_id}
                  onChange={(idVal) => setForm(f => ({ ...f, dueno_id: idVal }))}
                  placeholder={duenoLocked ? "Asignado automaticamente" : "Buscar adoptante..."}
                  required
                  disabled={duenoLocked}
                  getLabel={(d) => d?.nombre ? d.nombre : `#${d.id}`}
                />
                {duenoLocked && (
                  <p className="text-xs text-slate-500">El adoptante se asigna automaticamente segun la mascota.</p>
                )}
              </div>

              {/* Fecha solicitud (DATE) */}
              <div className="grid gap-2">
                <label htmlFor="fecha_solicitud" className="text-sm font-medium text-slate-900">
                  Fecha de solicitud <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  id="fecha_solicitud"
                  name="fecha_solicitud"
                  value={form.fecha_solicitud}
                  onChange={(e) => setForm(f => ({ ...f, fecha_solicitud: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
                  style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
                />
              </div>

              {/* Fecha aprobación (DATE, depende de estado) */}
              <div className="grid gap-2">
                <label htmlFor="fecha_aprobacion" className="text-sm font-medium text-slate-900">
                  Fecha de aprobación
                </label>
                <input
                  type="date"
                  id="fecha_aprobacion"
                  name="fecha_aprobacion"
                  value={form.fecha_aprobacion}
                  onChange={(e) => setForm(f => ({ ...f, fecha_aprobacion: e.target.value }))}
                  disabled={form.estado_llegada !== 'Aprobada'}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400 disabled:opacity-60"
                  style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
                />
                <p className="text-xs text-slate-500">Solo aplica cuando el estado es “Aprobada”.</p>
              </div>

              {/* Estado */}
              <div className="grid gap-2">
                <label htmlFor="estado_llegada" className="text-sm font-medium text-slate-900">
                  Estado <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <select
                    id="estado_llegada"
                    name="estado_llegada"
                    value={form.estado_llegada}
                    onChange={(e) => setForm(f => ({ ...f, estado_llegada: e.target.value, ...(e.target.value !== 'Aprobada' ? { fecha_aprobacion: '' } : {}) }))}
                    required
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm shadow-sm outline-none focus:border-slate-400"
                    style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                    onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                    onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
                  >
                    <option value="">Seleccionar Estado</option>
                    <option value="En revisión">En revisión</option>
                    <option value="Aprobada">Aprobada</option>
                    <option value="Rechazada">Rechazada</option>
                  </select>
                  <ChevronDownIcon />
                </div>
              </div>

              {/* Usuario (AutoComplete) */}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">
                  Responsable (usuario) <span className="text-rose-600">*</span>
                </label>
                <AutoComplete
                  items={usuarios}
                  value={form.usuario_id}
                  onChange={(idVal) => setForm(f => ({ ...f, usuario_id: idVal }))}
                  placeholder="Buscar responsable…"
                  required
                  disabled={false}
                  getLabel={(u) => `${u?.nombre ?? ''} ${u?.primer_apellido ?? ''}`.trim() || `#${u.id}`}
                />
              </div>
            </div>

            {/* Observaciones */}
            <div className="mt-5 grid gap-2">
              <label htmlFor="observaciones" className="text-sm font-medium text-slate-900">Observaciones</label>
              <textarea
                id="observaciones"
                name="observaciones"
                placeholder="Notas, condiciones de adopción, seguimiento, etc."
                value={form.observaciones}
                onChange={(e) => setForm(f => ({ ...f, observaciones: e.target.value }))}
                maxLength={2000}
                className="min-h-[110px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
                style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">Opcional. Máx. 2000 caracteres.</p>
                <span className="text-xs text-slate-500">{(form.observaciones || '').length}/2000</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-600">
                Los cambios se guardarán al {id ? 'actualizar' : 'crear'} la adopción.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => nav('/adopciones')}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition active:scale-[0.98]"
                  style={{ backgroundColor: BRAND.yellow, color: '#111827' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.yellowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.yellow)}
                >
                  {id ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ChevronDownIcon = () => (
  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 opacity-60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.18l3.71-2.95a.75.75 0 1 1 .94 1.17l-4.2 3.34a.75.75 0 0 1-.94 0l-4.2-3.34a.75.75 0 0 1-.02-1.06z" clipRule="evenodd" />
  </svg>
);

export default AdopcionForm;
