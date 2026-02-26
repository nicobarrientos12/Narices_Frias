// src/pages/PostAdopcionForm.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchSeguimiento,
  createSeguimiento,
  updateSeguimiento,
  fetchAdopcionesDisponibles,
} from '../../services/postAdopcionService';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
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

const PostAdopcionForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fecha: '',
    observaciones: '',
    adopcion_id: '',
    foto_url: null, // File | null
  });

  const [saving, setSaving] = useState(false);
  const [adopciones, setAdopciones] = useState([]);
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState(null);

  // Cargar adopciones + registro si es edición
  useEffect(() => {
    let mounted = true;

    fetchAdopcionesDisponibles()
      .then((data) => { if (mounted) setAdopciones(ensureArray(data)); })
      .catch(() => setAdopciones([]));

    if (isEdit) {
      fetchSeguimiento(id)
        .then((data) => {
          if (!mounted) return;
          setForm({
            fecha: toYMD(data?.fecha) || '',
            observaciones: data?.observaciones || '',
            adopcion_id: data?.adopcion_id || '',
            foto_url: null, // se vuelve a adjuntar si se desea
          });
        })
        .catch((e) => { if (mounted) setErr(e?.message || 'Error al cargar seguimiento'); });
    }

    return () => { mounted = false; };
  }, [id, isEdit]);

  // Previsualización y revoke
  useEffect(() => {
    if (form.foto_url instanceof File) {
      const url = URL.createObjectURL(form.foto_url);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [form.foto_url]);

  // -------- Validación front --------
  function validate() {
    const s = (v) => String(v ?? '').trim();

    // adopcion_id
    if (!/^\d+$/.test(s(form.adopcion_id))) return 'Selecciona una adopción válida.';

    // fecha: requerida, formato y no futura
    const f = toYMD(form.fecha);
    if (!f) return 'La fecha es obligatoria y debe tener formato YYYY-MM-DD.';
    const d = new Date(f + 'T00:00:00');
    const min = new Date('2000-01-01T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    if (d < min) return 'La fecha está fuera de un rango válido.';
    if (d > today) return 'La fecha no puede ser futura.';

    // observaciones: opcional pero recomendable
    const obs = s(form.observaciones);
    if (obs && obs.length < 3) return 'Las observaciones deben tener al menos 3 caracteres o deja vacío.';
    if (obs && obs.length > 2000) return 'Observaciones: máximo 2000 caracteres.';
    if (obs && !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9.,;:'"º°%/()\-_\r\n\s]*$/.test(obs)) {
      return 'Observaciones contiene caracteres no permitidos.';
    }

    // archivo: opcional, pero validar tamaño y tipo
    if (form.foto_url instanceof File) {
      const file = form.foto_url;
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxBytes) return 'La imagen supera el tamaño máximo de 5MB.';
      const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!okTypes.includes(file.type)) return 'Formato de imagen no permitido. Usa JPG, PNG o WEBP.';
    }

    return null;
  }

  function buildPayload() {
    const clean = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');
    const base = {
      fecha: toYMD(form.fecha),
      observaciones: clean(form.observaciones) || null,
      adopcion_id: Number(form.adopcion_id),
    };

    if (form.foto_url instanceof File) {
      const fd = new FormData();
      Object.entries(base).forEach(([k, v]) => fd.append(k, v ?? ''));
      fd.append('foto_url', form.foto_url);
      return fd; // multipart/form-data
    }
    return base; // application/json
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'foto_url') {
      setForm((f) => ({ ...f, foto_url: files?.[0] || null }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setErr('');
    const v = validate();
    if (v) { setErr(v); return; }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await updateSeguimiento(id, payload);
      } else {
        await createSeguimiento(payload);
      }
      navigate('/post-adopcion');
    } catch (err) {
      setErr(err?.response?.data?.message || err?.message || 'No se pudo guardar');
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
            {isEdit ? 'Editar Seguimiento' : 'Nuevo Seguimiento'}
          </h2>
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          {/* Adopción (AutoComplete) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Adopción <span className="text-rose-600">*</span>
            </label>
            <AutoComplete
              items={adopciones}
              value={form.adopcion_id}
              onChange={(idVal) => setForm(f => ({ ...f, adopcion_id: idVal }))}
              placeholder="Buscar adopción (Mascota — Adoptante)…"
              required
              disabled={false}
              getLabel={(a) => {
                const mascota = a?.mascota || a?.nombre_mascota || `#${a?.mascota_id ?? ''}`;
                const dueno = a?.dueno || a?.nombre_dueno || '';
                return `${mascota}${dueno ? ` — ${dueno}` : ''}`;
              }}
            />
          </div>

          {/* Fecha */}
          <div className="grid gap-2">
            <label htmlFor="fecha" className="text-sm font-medium text-slate-900">
              Fecha <span className="text-rose-600">*</span>
            </label>
            <input
              id="fecha"
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">No puede ser una fecha futura.</p>
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
              placeholder="Estado, comportamiento, recomendaciones..."
              className="min-h-[110px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              maxLength={2000}
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Opcional. 3–2000 caracteres si lo completas.</span>
              <span className="text-xs text-slate-400">{(form.observaciones || '').length}/2000</span>
            </div>
          </div>

          {/* Foto (opcional) */}
          <div className="grid gap-2">
            <label htmlFor="foto_url" className="text-sm font-medium text-slate-900">
              Foto (opcional)
            </label>
            <label
              htmlFor="foto_url"
              className="group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-slate-50"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
            >
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" className="opacity-80" fill="currentColor">
                  <path d="M9 2l2 2h6a2 2 0 012 2v2H5V6a2 2 0 012-2h2l2-2zM5 10h14v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8zm7 1a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                <div className="text-sm">
                  <div className="font-medium text-slate-900">Seleccionar imagen</div>
                  <div className="text-xs text-slate-500">JPG, PNG o WEBP • máx. 5MB</div>
                </div>
              </div>
              <span
                className="rounded-lg px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: BRAND.yellow, color: '#111827' }}
              >
                Buscar…
              </span>
              <input
                id="foto_url"
                type="file"
                name="foto_url"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleChange}
                className="hidden"
              />
            </label>

            {preview && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
                />
                <span className="text-xs text-slate-600 truncate">{form.foto_url?.name}</span>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/post-adopcion')}
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
              {isEdit ? (saving ? 'Guardando…' : 'Actualizar') : (saving ? 'Guardando…' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* Chevron para el <select> (solo presentación) */
const ChevronDownIcon = () => (
  <svg
    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 opacity-60"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.18l3.71-2.95a.75.75 0 1 1 .94 1.17l-4.2 3.34a.75.75 0 0 1-.94 0l-4.2-3.34a.75.75 0 0 1-.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

export default PostAdopcionForm;
