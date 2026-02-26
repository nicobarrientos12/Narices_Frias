// src/pages/Campania/CampaniaForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchCampania,
  createCampania,
  updateCampania,
} from '../../services/campaniaService';
import { fetchUsuarios } from '../../services/usuarioService';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

const s = (v) => String(v ?? '').trim();

// validaciones cliente
const moneyOk = (v) => {
  if (v === '' || v === null || v === undefined) return false;
  const n = Number(v);
  if (!Number.isFinite(n)) return false;
  return n >= 0 && /^\d+(\.\d{1,2})?$/.test(String(v));
};
const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

export default function CampaniaForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();

  const [form, setForm] = useState({
    usuario_id: '',
    nombre: '',
    fecha: '',
    monto_invertido: '',
    total_recaudado: '',
  });

  const [usuarios, setUsuarios] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // cargar usuarios para combo (responsable)
  useEffect(() => {
    let mounted = true;
    fetchUsuarios()
      .then((rows) => {
        if (!mounted) return;
        setUsuarios(Array.isArray(rows) ? rows : []);
      })
      .catch(() => setUsuarios([]));
    return () => { mounted = false; };
  }, []);

  // cargar campaña si es edición
  useEffect(() => {
    let mounted = true;
    if (isEdit) {
      fetchCampania(id)
        .then((data) => {
          if (!mounted || !data) return;
          setForm({
            usuario_id: data.usuario_id?.toString() ?? '',
            nombre: data.nombre ?? '',
            fecha: data.fecha ?? '',
            // si backend devuelve números, mantenerlos como string para inputs controlados
            monto_invertido: data.monto_invertido != null ? String(data.monto_invertido) : '',
            total_recaudado: data.total_recaudado != null ? String(data.total_recaudado) : '',
          });
        })
        .catch((e) => setError(e?.message || 'Error al cargar campaña'));
    }
    return () => { mounted = false; };
  }, [id, isEdit]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const ganancia = useMemo(() => {
    const inv = Number(form.monto_invertido);
    const rec = Number(form.total_recaudado);
    if (!Number.isFinite(inv) || !Number.isFinite(rec)) return 0;
    return Number((rec - inv).toFixed(2));
  }, [form.monto_invertido, form.total_recaudado]);

  // Validación cliente
  function validate() {
    // usuario_id
    if (!s(form.usuario_id)) return 'El responsable (usuario) es obligatorio.';
    const uid = Number(form.usuario_id);
    if (!Number.isFinite(uid) || uid <= 0) return 'Selecciona un responsable válido.';

    // nombre
    if (!s(form.nombre)) return 'El nombre es obligatorio.';
    if (s(form.nombre).length < 3 || s(form.nombre).length > 150)
      return 'El nombre debe tener entre 3 y 150 caracteres.';

    // fecha (opcional)
    if (s(form.fecha) && !dateRegex.test(s(form.fecha)))
      return 'La fecha debe tener formato YYYY-MM-DD.';

    // montos (>=0 con 2 decimales)
    if (!moneyOk(s(form.monto_invertido)))
      return 'El monto invertido es obligatorio, numérico, ≥ 0 y con máximo 2 decimales.';
    if (!moneyOk(s(form.total_recaudado)))
      return 'El total recaudado es obligatorio, numérico, ≥ 0 y con máximo 2 decimales.';

    return null;
  }

  const buildPayload = () => {
    const payload = {
      usuario_id: Number(form.usuario_id),
      nombre: s(form.nombre),
      fecha: s(form.fecha) || null,
      monto_invertido: Number(Number(form.monto_invertido).toFixed(2)),
      total_recaudado: Number(Number(form.total_recaudado).toFixed(2)),
      // ganancia NO se envía; la calcula la DB
    };
    return payload;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    const v = validate();
    if (v) { setError(v); return; }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await updateCampania(id, payload);
      } else {
        await createCampania(payload);
      }
      nav('/campanias');
    } catch (er) {
      setError(er?.message || 'Error al guardar campaña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white via-white to-slate-50">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="inline-block h-5 w-5 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
          <h2 className="text-2xl font-extrabold text-slate-900">
            {isEdit ? 'Editar Campaña' : 'Nueva Campaña'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Responsable */}
          <div className="grid gap-2">
            <label htmlFor="usuario_id" className="text-sm font-medium text-slate-900">
              Responsable (Usuario) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <select
                id="usuario_id"
                name="usuario_id"
                value={form.usuario_id}
                onChange={onChange}
                required
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm shadow-sm outline-none transition-all focus:border-slate-400"
                style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
              >
                <option value="">Seleccionar responsable</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>
                    {[u.nombre, u.primer_apellido].filter(Boolean).join(' ')}
                  </option>
                ))}
              </select>
              <ChevronDownIcon />
            </div>
          </div>

          {/* Nombre */}
          <div className="grid gap-2">
            <label htmlFor="nombre" className="text-sm font-medium text-slate-900">
              Nombre de la campaña <span className="text-rose-600">*</span>
            </label>
            <input
              id="nombre"
              name="nombre"
              placeholder="Ej: Campaña Vacunación Septiembre"
              value={form.nombre}
              onChange={onChange}
              required
              maxLength={150}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Fecha */}
          <div className="grid gap-2">
            <label htmlFor="fecha" className="text-sm font-medium text-slate-900">
              Fecha (opcional)
            </label>
            <input
              id="fecha"
              name="fecha"
              type="date"
              value={form.fecha}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Monto invertido */}
          <div className="grid gap-2">
            <label htmlFor="monto_invertido" className="text-sm font-medium text-slate-900">
              Monto invertido (Bs) <span className="text-rose-600">*</span>
            </label>
            <input
              id="monto_invertido"
              name="monto_invertido"
              inputMode="decimal"
              placeholder="0.00"
              value={form.monto_invertido}
              onChange={onChange}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">Número ≥ 0 con hasta 2 decimales.</p>
          </div>

          {/* Total recaudado */}
          <div className="grid gap-2">
            <label htmlFor="total_recaudado" className="text-sm font-medium text-slate-900">
              Total recaudado (Bs) <span className="text-rose-600">*</span>
            </label>
            <input
              id="total_recaudado"
              name="total_recaudado"
              inputMode="decimal"
              placeholder="0.00"
              value={form.total_recaudado}
              onChange={onChange}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">Número ≥ 0 con hasta 2 decimales.</p>
          </div>

          {/* Ganancia (solo lectura) */}
          <div className="md:col-span-2 grid gap-1">
            <div className="flex items-center justify-between rounded-xl border px-4 py-3"
                 style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFDF0' }}>
              <div className="text-sm text-slate-600">Ganancia estimada (vista):</div>
              <div className="text-lg font-extrabold text-slate-900">Bs {ganancia.toFixed(2)}</div>
            </div>
            <p className="text-xs text-slate-500">
              * La base de datos recalcula la ganancia real automáticamente.
            </p>
          </div>

          {/* Footer */}
          <div className="md:col-span-2 mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => nav('/campanias')}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-50"
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
}

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
