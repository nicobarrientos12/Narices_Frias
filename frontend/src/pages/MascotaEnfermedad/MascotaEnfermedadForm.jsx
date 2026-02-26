// src/pages/MascotaEnfermedadForm.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getAllMascotas,
  getAllEnfermedades
} from '../../services/catalogosService';
import {
  crearMascotaEnfermedad,
  actualizarMascotaEnfermedad,
  getMascotaEnfermedadById
} from '../../services/mascotaEnfermedadService';
import { useNavigate, useParams } from 'react-router-dom';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

const ensureArray = (x) =>
  Array.isArray(x) ? x : Array.isArray(x?.data) ? x.data : [];

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

/* ================== helpers fecha/validación =================== */
function toDateOrNull(v) {
  if (!v) return null;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(`${s.slice(0, 10)}T00:00:00`);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function isYYYYMMDD(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
}

const MascotaEnfermedadForm = () => {
  const [form, setForm] = useState({
    mascota_id: '',
    enfermedad_id: '',
    fecha_diagnostico: '',
    observaciones: ''
  });
  const [mascotas, setMascotas] = useState([]);
  const [enfermedades, setEnfermedades] = useState([]);
  const [loadingRel, setLoadingRel] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Cargar catálogos
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [mRes, eRes] = await Promise.all([
          getAllMascotas().catch(() => []),
          getAllEnfermedades().catch(() => []),
        ]);
        if (!mounted) return;
        setMascotas(ensureArray(mRes));
        setEnfermedades(ensureArray(eRes));
      } catch (e) {
        if (!mounted) return;
        console.error(e);
        setMascotas([]);
        setEnfermedades([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Cargar relación (edición) cuando hay catálogos
  useEffect(() => {
    if (!isEdit) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingRel(true);
        setErr('');
        const d = await getMascotaEnfermedadById(id);

        // tolerante a {data:{...}} o {...}
        const data = d?.data ? d.data : d || {};

        // Resolver IDs si vinieron nombres
        let mascotaId = data?.mascota_id ?? '';
        if (!mascotaId && data?.mascota) {
          const m = ensureArray(mascotas).find(
            (x) => String(x?.nombre || '').trim().toLowerCase() === String(data.mascota).trim().toLowerCase()
          );
          if (m) mascotaId = m.id;
        }
        let enfermedadId = data?.enfermedad_id ?? '';
        if (!enfermedadId && data?.enfermedad) {
          const e = ensureArray(enfermedades).find(
            (x) => String(x?.nombre || '').trim().toLowerCase() === String(data.enfermedad).trim().toLowerCase()
          );
          if (e) enfermedadId = e.id;
        }

        if (!mounted) return;
        setForm({
          mascota_id: mascotaId || '',
          enfermedad_id: enfermedadId || '',
          fecha_diagnostico: data?.fecha_diagnostico ? String(data.fecha_diagnostico).slice(0, 10) : '',
          observaciones: data?.observaciones || ''
        });
      } catch (e) {
        if (!mounted) return;
        console.error('Error al cargar relación:', e);
        setErr(e?.response?.data?.message || e?.message || 'No se pudo cargar la relación');
      } finally {
        if (mounted) setLoadingRel(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id, mascotas.length, enfermedades.length]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // ================= Validación Front =================
  function validate() {
    const s = (v) => String(v ?? '').trim();

    // IDs requeridos en UI
    if (!s(form.mascota_id)) return 'Debes seleccionar una mascota.';
    if (!/^\d+$/.test(String(form.mascota_id))) return 'ID de mascota inválido.';
    if (!s(form.enfermedad_id)) return 'Debes seleccionar una enfermedad.';
    if (!/^\d+$/.test(String(form.enfermedad_id))) return 'ID de enfermedad inválido.';

    // Fecha de diagnóstico (requerida en el form)
    const fd = s(form.fecha_diagnostico);
    if (!fd) return 'La fecha de diagnóstico es obligatoria.';
    if (!isYYYYMMDD(fd)) return 'La fecha de diagnóstico debe tener formato YYYY-MM-DD.';
    const d = toDateOrNull(fd);
    if (!d) return 'Fecha de diagnóstico inválida.';
    // Rango razonable
    const min = new Date('2000-01-01T00:00:00');
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (d < min) return 'La fecha de diagnóstico es demasiado antigua.';
    if (d > now) return 'La fecha de diagnóstico no puede ser futura.';

    // Observaciones (opcional)
    const obs = s(form.observaciones);
    if (obs && obs.length > 2000) return 'Las observaciones no deben exceder 2000 caracteres.';
    if (obs && !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9.,;:'"º°%/()\-_\r\n\s]*$/.test(obs)) {
      return 'Las observaciones contienen caracteres no permitidos.';
    }

    return null;
  }

  function buildPayload() {
    const clean = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');
    const obs = clean(form.observaciones);
    return {
      mascota_id: Number(form.mascota_id),
      enfermedad_id: Number(form.enfermedad_id),
      fecha_diagnostico: (form.fecha_diagnostico || '').slice(0, 10) || null,
      observaciones: obs || null,
    };
  }

  const handleSubmit = async e => {
    e.preventDefault();
    if (saving || (loadingRel && isEdit)) return;
    setErr('');
    const v = validate();
    if (v) { setErr(v); return; }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await actualizarMascotaEnfermedad(id, payload);
      } else {
        await crearMascotaEnfermedad(payload);
      }
      navigate('/mascota-enfermedad');
    } catch (error) {
      console.error('Error al guardar relación:', error);
      setErr(error?.response?.data?.message || error?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white via-white to-slate-50">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="inline-block h-5 w-5 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
          <h2 className="text-2xl font-extrabold text-slate-900">
            {isEdit ? 'Editar' : 'Registrar'} Enfermedad de Mascota
          </h2>
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          {/* Mascota (AutoComplete) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Mascota <span className="text-rose-600">*</span>
            </label>
            <AutoComplete
              items={mascotas}
              value={form.mascota_id}
              onChange={(idVal) => setForm((f) => ({ ...f, mascota_id: idVal }))}
              placeholder="Buscar mascota por nombre…"
              required
              disabled={loadingRel && isEdit}
              getLabel={(m) => m?.nombre ? m.nombre : `#${m.id}`}
            />
          </div>

          {/* Enfermedad (AutoComplete) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Enfermedad <span className="text-rose-600">*</span>
            </label>
            <AutoComplete
              items={enfermedades}
              value={form.enfermedad_id}
              onChange={(idVal) => setForm((f) => ({ ...f, enfermedad_id: idVal }))}
              placeholder="Buscar enfermedad…"
              required
              disabled={loadingRel && isEdit}
              getLabel={(e) => e?.nombre ? e.nombre : `#${e.id}`}
            />
          </div>

          {/* Fecha Diagnóstico */}
          <div className="grid gap-2">
            <label htmlFor="fecha_diagnostico" className="text-sm font-medium text-slate-900">
              Fecha Diagnóstico <span className="text-rose-600">*</span>
            </label>
            <input
              id="fecha_diagnostico"
              type="date"
              name="fecha_diagnostico"
              value={form.fecha_diagnostico}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">No puede ser futura.</p>
          </div>

          {/* Observaciones */}
          <div className="grid gap-2">
            <label htmlFor="observaciones" className="text-sm font-medium text-slate-900">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              maxLength={2000}
              placeholder="Detalle, tratamiento sugerido, seguimiento, etc."
              className="min-h-[110px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Opcional. Máx. 2000 caracteres.</p>
              <p className="text-xs text-slate-400">{(form.observaciones || '').length}/2000</p>
            </div>
          </div>

          {/* Botones */}
          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/mascota-enfermedad')}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || (loadingRel && isEdit)}
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: BRAND.yellow, color: '#111827' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.yellowHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.yellow)}
            >
              {isEdit ? (saving ? 'Actualizando…' : 'Actualizar') : (saving ? 'Registrando…' : 'Registrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* Icono Chevron (no se usa en el Autocomplete, pero lo dejo por consistencia si lo necesitas en otra parte) */
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

export default MascotaEnfermedadForm;
