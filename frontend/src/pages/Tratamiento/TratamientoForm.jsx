// src/pages/Tratamientos/TratamientoForm.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTratamientoById,
  crearTratamiento,
  actualizarTratamiento
} from '../../services/tratamientoService';
import { getAllMascotas } from '../../services/catalogosService';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

// ===== helpers locales para veterinarios (mismo patrón auth) =====
const API_BASE =
  import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/api`
    : (import.meta.env.VITE_API_ROOT || 'http://localhost:3001/api');

const getToken = () => localStorage.getItem('token');
const withAuth = (extra = {}) => {
  const t = getToken();
  return { ...extra, ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};
const handle401 = () => {
  try {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  } finally {
    if (typeof window !== 'undefined' && window.location?.pathname !== '/login') {
      window.location.replace('/login');
    }
  }
};
async function fetchJSON(url) {
  const res = await fetch(url, { credentials: 'include', headers: withAuth() });
  if (res.status === 401) { handle401(); throw new Error('No autorizado'); }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) return data.data;
  return data;
}

// Fallbacks: 1) /usuarios/veterinarios  2) /usuarios?rol=Veterinario  3) /usuarios (filtra en front)
const getVeterinarios = async () => {
  const first = import.meta.env.VITE_API_VETS || `${API_BASE}/usuarios/veterinarios`;
  // 1)
  try {
    const arr = await fetchJSON(first);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    // 2)
    try {
      const arr2 = await fetchJSON(`${API_BASE}/usuarios?rol=Veterinario`);
      if (Array.isArray(arr2) && arr2.length) return arr2;
    } catch (_) { /* noop */ }
    // 3)
    const all = await fetchJSON(`${API_BASE}/usuarios`);
    return (Array.isArray(all) ? all : []).filter(
      u => String(u?.rol || '').toLowerCase() === 'veterinario'
    );
  }
};
// ================================================================

const ensureArray = (x) => Array.isArray(x) ? x : (Array.isArray(x?.data) ? x.data : []);
const addIfMissing = (items, id, labelKey = 'nombre', prefix = '#') => {
  if (id === '' || id === null || id === undefined) return items;
  const exists = Array.isArray(items) && items.some(it => String(it.id) === String(id));
  if (exists) return items;
  const placeholder = { id };
  placeholder[labelKey] = `${prefix}${id}`;
  return [...(Array.isArray(items) ? items : []), placeholder];
};

function toDateOrNull(v) {
  if (!v) return null;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(`${s.slice(0,10)}T00:00:00`);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/* =================== Autocomplete genérico ==================== */
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
    return items.filter((it) => getLabel(it).toLowerCase().includes(s)).slice(0, 50);
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

const TratamientoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    mascota_id: '',
    usuario_id: '',
    diagnostico: '',
    fecha_inicio: '',
    fecha_fin: '',
    precio: '',
    observaciones: ''
  });
  const [mascotas, setMascotas] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const isEdit = Boolean(id);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingCats(true);
        const [mArr, vArr] = await Promise.all([
          getAllMascotas().catch(() => []),
          getVeterinarios().catch(() => []),
        ]);
        if (!mounted) return;
        setMascotas(ensureArray(mArr));
        setVeterinarios(ensureArray(vArr));
      } catch (e) {
        console.error('Error cargando catálogos', e);
        if (!mounted) return;
        setMascotas([]);
        setVeterinarios([]);
      } finally {
        if (mounted) setLoadingCats(false);
      }

      if (isEdit) {
        try {
          const t = await getTratamientoById(id);
          const data = t?.data ? t.data : t || {}; // tolerante a {data: {...}}
          if (!mounted) return;
          setForm({
            mascota_id: data?.mascota_id ?? '',
            usuario_id: data?.usuario_id ?? '',
            diagnostico: data?.diagnostico ?? '',
            fecha_inicio: data?.fecha_inicio ? String(data.fecha_inicio).slice(0,10) : '',
            fecha_fin: data?.fecha_fin ? String(data.fecha_fin).slice(0,10) : '',
            precio: data?.precio != null ? String(data.precio) : '',
            observaciones: data?.observaciones ?? ''
          });
          // Asegura que los IDs existan en catálogos (placeholder si no están)
          setMascotas(curr => addIfMissing(curr, data?.mascota_id, 'nombre', '#'));
          setVeterinarios(curr => addIfMissing(curr, data?.usuario_id, 'nombre', '#'));
        } catch (e) {
          console.error('Error cargando tratamiento', e);
          setErr(e?.response?.data?.message || e?.message || 'No se pudo cargar el tratamiento');
        }
      }
    })();

    return () => { mounted = false; };
  }, [id, isEdit]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  /* ===================== Validación Front ====================== */
  function validate() {
    const s = (v) => String(v ?? '').trim();

    // IDs requeridos y numéricos
    if (!s(form.mascota_id)) return 'Debes seleccionar una mascota.';
    if (!/^\d+$/.test(String(form.mascota_id))) return 'ID de mascota inválido.';
    if (!s(form.usuario_id)) return 'Debes seleccionar un veterinario.';
    if (!/^\d+$/.test(String(form.usuario_id))) return 'ID de veterinario inválido.';

    // Diagnóstico
    const diag = s(form.diagnostico).replace(/\s+/g, ' ');
    if (!diag) return 'El diagnóstico es obligatorio.';
    if (diag.length < 3) return 'El diagnóstico debe tener al menos 3 caracteres.';
    if (diag.length > 500) return 'El diagnóstico no debe exceder 500 caracteres.';
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9()\-.,;:'"º°/%\s]+$/.test(diag)) {
      return 'El diagnóstico contiene caracteres no permitidos.';
    }

    // Fechas
    const fi = s(form.fecha_inicio);
    if (!fi) return 'La fecha de inicio es obligatoria.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fi)) return 'La fecha de inicio debe tener formato YYYY-MM-DD.';

    const ff = s(form.fecha_fin);
    if (ff && !/^\d{4}-\d{2}-\d{2}$/.test(ff)) return 'La fecha de fin debe tener formato YYYY-MM-DD.';

    const di = toDateOrNull(fi);
    const df = toDateOrNull(ff || null);
    if (!di) return 'Fecha de inicio inválida.';
    // Rango razonable (2000 .. +10 años)
    const min = new Date('2000-01-01T00:00:00');
    const max = new Date(); max.setFullYear(max.getFullYear() + 10);
    if (di < min || di > max) return 'La fecha de inicio está fuera de un rango válido.';
    if (df) {
      if (df < min || df > max) return 'La fecha de fin está fuera de un rango válido.';
      if (df < di) return 'La fecha de fin no puede ser anterior a la fecha de inicio.';
    }

    // Precio opcional
    if (s(form.precio)) {
      if (!/^\d+(\.\d{1,2})?$/.test(s(form.precio))) return 'El precio debe ser numérico con hasta 2 decimales.';
      const p = Number(form.precio);
      if (!Number.isFinite(p) || p < 0) return 'El precio no puede ser negativo.';
      // límite razonable
      if (p > 99999999.99) return 'El precio es demasiado grande.';
    }

    // Observaciones
    const obs = s(form.observaciones);
    if (obs && obs.length > 2000) return 'Las observaciones no deben exceder 2000 caracteres.';
    if (obs && !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9()\-.,;:'"º°/%\s]+$/.test(obs)) {
      return 'Las observaciones contienen caracteres no permitidos.';
    }

    return null;
  }

  function buildPayload() {
    const clean = (v) => (v ?? '').trim().replace(/\s+/g, ' ');
    return {
      mascota_id: Number(form.mascota_id),
      usuario_id: Number(form.usuario_id),
      diagnostico: clean(form.diagnostico),
      fecha_inicio: (form.fecha_inicio || '').slice(0, 10) || null, // 'YYYY-MM-DD'
      fecha_fin: (form.fecha_fin || '').slice(0, 10) || null,
      precio: String(form.precio).trim() === '' ? null : Number(form.precio),
      observaciones: clean(form.observaciones) || null,
    };
  }

  const handleSubmit = async e => {
    e.preventDefault();
    if (saving) return;
    setErr('');
    const v = validate();
    if (v) { setErr(v); return; }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) await actualizarTratamiento(id, payload);
      else await crearTratamiento(payload);
      navigate('/tratamientos');
    } catch (error) {
      console.error('Error al guardar tratamiento:', error);
      setErr(error?.response?.data?.message || error?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  // Labels para Autocomplete
  const petLabel = (m) => m?.nombre ? m.nombre : `#${m.id}`;
  const vetLabel = (u) => {
    const n = u?.nombre || `#${u.id}`;
    const a = u?.primer_apellido || '';
    return `${n}${a ? ' ' + a : ''}`;
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white via-white to-slate-50">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="inline-block h-5 w-5 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
          <h2 className="text-2xl font-extrabold text-slate-900">
            {isEdit ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
          </h2>
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Mascota (AutoComplete) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Mascota <span className="text-rose-600">*</span>
            </label>
            <AutoComplete
              items={mascotas}
              value={form.mascota_id}
              onChange={(v) => setForm(f => ({ ...f, mascota_id: v }))}
              placeholder={loadingCats ? 'Cargando…' : 'Buscar mascota…'}
              required
              disabled={loadingCats || !mascotas.length}
              getLabel={petLabel}
            />
          </div>

          {/* Veterinario (AutoComplete) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Veterinario <span className="text-rose-600">*</span>
            </label>
            <AutoComplete
              items={veterinarios}
              value={form.usuario_id}
              onChange={(v) => setForm(f => ({ ...f, usuario_id: v }))}
              placeholder={loadingCats ? 'Cargando…' : 'Buscar veterinario…'}
              required
              disabled={loadingCats || !veterinarios.length}
              getLabel={vetLabel}
            />
          </div>

          {/* Diagnóstico */}
          <div className="md:col-span-2 grid gap-2">
            <label htmlFor="diagnostico" className="text-sm font-medium text-slate-900">
              Diagnóstico <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="diagnostico"
              name="diagnostico"
              value={form.diagnostico}
              onChange={handleChange}
              placeholder="Diagnóstico"
              required
              maxLength={500}
              className="min-h-[110px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">3–500 caracteres. Evita caracteres especiales no estándar.</p>
          </div>

          {/* Fecha inicio */}
          <div className="grid gap-2">
            <label htmlFor="fecha_inicio" className="text-sm font-medium text-slate-900">
              Fecha inicio <span className="text-rose-600">*</span>
            </label>
            <input
              id="fecha_inicio"
              type="date"
              name="fecha_inicio"
              value={form.fecha_inicio}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Fecha fin */}
          <div className="grid gap-2">
            <label htmlFor="fecha_fin" className="text-sm font-medium text-slate-900">
              Fecha fin
            </label>
            <input
              id="fecha_fin"
              type="date"
              name="fecha_fin"
              value={form.fecha_fin}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">Déjala vacía si el tratamiento sigue en curso.</p>
          </div>

          {/* Precio */}
          <div className="grid gap-2">
            <label htmlFor="precio" className="text-sm font-medium text-slate-900">
              Precio (Bs)
            </label>
            <input
              id="precio"
              type="number"
              name="precio"
              value={form.precio}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">Usa punto decimal. Máximo 2 decimales.</p>
          </div>

          {/* Observaciones */}
          <div className="md:col-span-2 grid gap-2">
            <label htmlFor="observaciones" className="text-sm font-medium text-slate-900">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              placeholder="Indicaciones adicionales, controles, notas…"
              maxLength={2000}
              className="min-h-[110px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500 text-right">{(form.observaciones || '').length}/2000</p>
          </div>

          {/* Footer */}
          <div className="md:col-span-2 mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/tratamientos')}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: BRAND.yellow, color: '#111827' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.yellowHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.yellow)}
            >
              {isEdit ? (saving ? 'Actualizando…' : 'Actualizar') : (saving ? 'Creando…' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* Icono Chevron (ya no se usa, pero lo dejo por si lo necesitas en otra parte)
const ChevronDownIcon = () => (
  <svg
    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 opacity-60"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.18l3.71-2.95a.75.75 0 1 1 .94 1.17l-4.2 3.34a.75.75 0 0 1-.94 0l-4.2-3.34a.75.75 0 0 1-.02-1.06z" clipRule="evenodd" />
  </svg>
);
*/

export default TratamientoForm;
