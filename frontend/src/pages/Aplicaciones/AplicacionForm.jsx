// src/pages/AplicacionForm.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getAllMascotas,      // servicio robusto con fallbacks
  getAllVacunas        // servicio robusto con fallbacks
} from '../../services/catalogosService';
import {
  crearAplicacion,
  actualizarAplicacion,
  getAplicacionFlexible
} from '../../services/mascotaVacunaService';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

const getUsuarioId = () => {
  try {
    const u = JSON.parse(localStorage.getItem('usuario') || 'null');
    return u?.id || 1;
  } catch {
    return 1;
  }
};

// ===================== Helpers ======================
const YMD = /^\d{4}-\d{2}-\d{2}$/;
function toYMD(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'string' && YMD.test(v)) return v;
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
const ensureArray = (x) => Array.isArray(x) ? x : (Array.isArray(x?.data) ? x.data : []);
const mapNombreToId = (arr, name) => {
  if (!name) return '';
  const it = (arr || []).find(x => String(x.nombre).toLowerCase() === String(name).toLowerCase());
  return it?.id || '';
};

// ===================== AutoComplete ======================
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

// ===================== Form ======================
const AplicacionForm = () => {
  const [form, setForm] = useState({
    mascota_id: '',
    vacuna_id: '',
    fecha_aplicacion: '',
    proxima_aplicacion: '',
    usuario_id: getUsuarioId(),
  });
  const [mascotas, setMascotas] = useState([]);
  const [vacunas, setVacunas]   = useState([]);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [errorEdit, setErrorEdit] = useState('');
  const [err, setErr] = useState('');

  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams(); // por si navegas con ?mascota=x&vacuna=y
  const qpMascota = searchParams.get('mascota') || '';
  const qpVacuna  = searchParams.get('vacuna') || '';

  // Cargar catálogos
  useEffect(() => {
    getAllMascotas().then(res => setMascotas(ensureArray(res))).catch(console.error);
    getAllVacunas().then(res => setVacunas(ensureArray(res))).catch(console.error);
  }, []);

  // Edición: intenta por id; si falla, intenta por nombres (querystring o lo que venga)
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoadingEdit(true);
      setErrorEdit('');
      try {
        const data = await getAplicacionFlexible({ id, mascota: qpMascota, vacuna: qpVacuna });
        // aceptar backend que devuelva id o nombres
        const mascotaId = data.mascota_id || mapNombreToId(mascotas, data.mascota);
        const vacunaId  = data.vacuna_id  || mapNombreToId(vacunas,  data.vacuna);

        setForm({
          mascota_id: mascotaId || '',
          vacuna_id:  vacunaId  || '',
          fecha_aplicacion: data?.fecha_aplicacion ? String(data.fecha_aplicacion).slice(0,10) : '',
          proxima_aplicacion: data?.proxima_aplicacion ? String(data.proxima_aplicacion).slice(0,10) : '',
          usuario_id: data?.usuario_id || getUsuarioId(),
        });
      } catch (e) {
        console.error('No se pudo cargar la aplicación para editar', e);
        setErrorEdit('No se encontró la aplicación. Revisa el ID o agrega ?mascota= & ?vacuna=');
      } finally {
        setLoadingEdit(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mascotas.length, vacunas.length, qpMascota, qpVacuna]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // ============== Validación front ==============
  function validate() {
    const s = (v) => String(v ?? '').trim();

    if (!s(form.mascota_id)) return 'Selecciona la mascota.';
    if (!s(form.vacuna_id)) return 'Selecciona la vacuna.';
    if (!s(form.fecha_aplicacion)) return 'La fecha de aplicación es obligatoria.';

    const fa = toYMD(form.fecha_aplicacion);
    if (!fa) return 'Fecha de aplicación inválida.';
    const dFA = new Date(fa + 'T00:00:00');

    const min = new Date('2000-01-01T00:00:00');
    const max = new Date(); max.setFullYear(max.getFullYear() + 10);
    if (dFA < min || dFA > max) return 'La fecha de aplicación está fuera de un rango válido.';

    if (s(form.proxima_aplicacion)) {
      const fp = toYMD(form.proxima_aplicacion);
      if (!fp) return 'Próxima aplicación inválida.';
      const dFP = new Date(fp + 'T00:00:00');
      if (dFP < dFA) return 'La próxima aplicación no puede ser anterior a la aplicación.';
      if (dFP > max) return 'La próxima aplicación está demasiado en el futuro.';
    }

    // usuario_id opcional (numérico si viene)
    if (s(form.usuario_id) && !/^\d+$/.test(s(form.usuario_id))) {
      return 'Veterinario inválido.';
    }

    return null;
  }

  function buildPayload() {
    return {
      mascota_id: Number(form.mascota_id),
      vacuna_id: Number(form.vacuna_id),
      fecha_aplicacion: toYMD(form.fecha_aplicacion),
      proxima_aplicacion: toYMD(form.proxima_aplicacion) || null,
      usuario_id: String(form.usuario_id).trim() ? Number(form.usuario_id) : null,
    };
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setErr('');
    const v = validate();
    if (v) { setErr(v); return; }

    const payload = buildPayload();
    try {
      if (id) {
        await actualizarAplicacion(id, payload);
      } else {
        await crearAplicacion(payload);
      }
      navigate('/vacunas');
    } catch (err) {
      console.error('Error al guardar aplicación:', err);
      setErr(err?.response?.data?.message || err?.message || '❌ No se pudo guardar.');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white via-white to-slate-50">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="inline-block h-5 w-5 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
          <h2 className="text-2xl font-extrabold text-slate-900">
            {id ? 'Editar Aplicación' : 'Nueva Aplicación'}
          </h2>
        </div>

        {(errorEdit || err) && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorEdit || err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Mascota */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Mascota <span className="text-rose-600">*</span>
            </label>
            <AutoComplete
              items={mascotas}
              value={form.mascota_id}
              onChange={(idVal) => setForm((f) => ({ ...f, mascota_id: idVal }))}
              placeholder="Buscar mascota…"
              required
              disabled={loadingEdit && !!id}
              getLabel={(m) => m?.nombre ? m.nombre : `#${m.id}`}
            />
          </div>

          {/* Vacuna */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Vacuna <span className="text-rose-600">*</span>
            </label>
            <AutoComplete
              items={vacunas}
              value={form.vacuna_id}
              onChange={(idVal) => setForm((f) => ({ ...f, vacuna_id: idVal }))}
              placeholder="Buscar vacuna…"
              required
              disabled={loadingEdit && !!id}
              getLabel={(v) => v?.nombre || v?.vacuna || `#${v.id}`}
            />
          </div>

          {/* Fecha de aplicación */}
          <div className="grid gap-2">
            <label htmlFor="fecha_aplicacion" className="text-sm font-medium text-slate-900">
              Fecha de aplicación <span className="text-rose-600">*</span>
            </label>
            <input
              id="fecha_aplicacion"
              type="date"
              name="fecha_aplicacion"
              value={form.fecha_aplicacion}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Próxima aplicación (opcional) */}
          <div className="grid gap-2">
            <label htmlFor="proxima_aplicacion" className="text-sm font-medium text-slate-900">Próxima aplicación</label>
            <input
              id="proxima_aplicacion"
              type="date"
              name="proxima_aplicacion"
              value={form.proxima_aplicacion}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">Si se define, debe ser igual o posterior a la aplicación.</p>
          </div>

          {/* Footer */}
          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => navigate('/vacunas')}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingEdit && !!id}
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition active:scale-[0.98]"
              style={{ backgroundColor: BRAND.yellow, color: '#111827' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.yellowHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.yellow)}
            >
              {id ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AplicacionForm;
