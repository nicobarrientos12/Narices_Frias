// src/pages/Donacion/DonacionForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchDonacion,
  createDonacion,
  updateDonacion,
} from '../../services/donacionService';
import { fetchUsuarios } from '../../services/usuarioService';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

const s = (v) => String(v ?? '').trim();
const tipos = ['Monetaria', 'Especie'];
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const moneyOk = (v) => {
  if (v === '' || v === null || v === undefined) return false;
  const n = Number(v);
  if (!Number.isFinite(n)) return false;
  return n >= 0 && /^\d+(\.\d{1,2})?$/.test(String(v));
};

export default function DonacionForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();

  const [usuarios, setUsuarios] = useState([]);

  const [form, setForm] = useState({
    usuario_id: '',
    nombre_donante: '',
    tipo: '',
    monto: '',
    descripcion_especie: '',
    fecha_donacion: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // cargar usuarios
  useEffect(() => {
    let mounted = true;
    fetchUsuarios()
      .then((rows) => mounted && setUsuarios(Array.isArray(rows) ? rows : []))
      .catch(() => setUsuarios([]));
    return () => { mounted = false; };
  }, []);

  // cargar donación si edita
  useEffect(() => {
    let mounted = true;
    if (isEdit) {
      fetchDonacion(id)
        .then((d) => {
          if (!mounted || !d) return;
          setForm({
            usuario_id: d.usuario_id != null ? String(d.usuario_id) : '',
            nombre_donante: d.nombre_donante || '',
            tipo: d.tipo || '',
            monto: d.monto != null ? String(d.monto) : '',
            descripcion_especie: d.descripcion_especie || '',
            fecha_donacion: d.fecha_donacion || '',
          });
        })
        .catch((e) => setError(e?.message || 'Error al cargar donación'));
    }
    return () => { mounted = false; };
  }, [id, isEdit]);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // coherencia UI: si cambia tipo, blanquea el campo contrario
  useEffect(() => {
    setForm((p) => {
      if (p.tipo === 'Monetaria') return { ...p, descripcion_especie: '' };
      if (p.tipo === 'Especie') return { ...p, monto: '' };
      return p;
    });
  }, [form.tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  const montoFmt = useMemo(() => {
    const m = Number(form.monto);
    return Number.isFinite(m) ? m.toFixed(2) : '0.00';
  }, [form.monto]);

  // Validación cliente (refleja el CHECK de la base)
  function validate() {
    // responsable
    if (!s(form.usuario_id)) return 'El responsable (usuario) es obligatorio.';
    const uid = Number(form.usuario_id);
    if (!Number.isFinite(uid) || uid <= 0) return 'Selecciona un responsable válido.';

    // tipo
    if (!s(form.tipo)) return 'El tipo de donación es obligatorio.';
    if (!tipos.includes(form.tipo)) return 'Tipo de donación inválido.';

    // nombre donante (opcional)
    if (s(form.nombre_donante) && s(form.nombre_donante).length > 150)
      return 'El nombre del donante no debe exceder 150 caracteres.';

    // fecha (opcional)
    if (s(form.fecha_donacion) && !dateRegex.test(s(form.fecha_donacion)))
      return 'La fecha debe tener formato YYYY-MM-DD.';

    // coherencia: Monetaria => monto requerido y desc null; Especie => desc requerida y monto null
    if (form.tipo === 'Monetaria') {
      if (!moneyOk(s(form.monto))) return 'El monto es obligatorio (≥ 0, hasta 2 decimales).';
      if (s(form.descripcion_especie)) return 'Para donación monetaria, la descripción en especie debe estar vacía.';
    }

    if (form.tipo === 'Especie') {
      if (!s(form.descripcion_especie)) return 'La descripción del bien en especie es obligatoria.';
      if (s(form.descripcion_especie).length > 2000) return 'La descripción no debe exceder 2000 caracteres.';
      if (s(form.monto)) return 'Para donación en especie, el monto debe estar vacío.';
    }

    return null;
  }

  const buildPayload = () => {
    return {
      usuario_id: Number(form.usuario_id),
      nombre_donante: s(form.nombre_donante) || null, // puede ser null (anónimo)
      tipo: form.tipo, // 'Monetaria' | 'Especie'
      monto: form.tipo === 'Monetaria' ? Number(Number(form.monto).toFixed(2)) : null,
      descripcion_especie: form.tipo === 'Especie' ? s(form.descripcion_especie) : null,
      fecha_donacion: s(form.fecha_donacion) || null,
    };
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
      if (isEdit) await updateDonacion(id, payload);
      else await createDonacion(payload);
      nav('/donaciones');
    } catch (er) {
      setError(er?.message || 'Error al guardar donación');
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
            {isEdit ? 'Editar Donación' : 'Nueva Donación'}
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

          {/* Tipo */}
          <div className="grid gap-2">
            <label htmlFor="tipo" className="text-sm font-medium text-slate-900">
              Tipo de donación <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <select
                id="tipo"
                name="tipo"
                value={form.tipo}
                onChange={onChange}
                required
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm shadow-sm outline-none transition-all focus:border-slate-400"
                style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
              >
                <option value="">Seleccionar tipo</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDownIcon />
            </div>
          </div>

          {/* Donante (opcional) */}
          <div className="grid gap-2 md:col-span-2">
            <label htmlFor="nombre_donante" className="text-sm font-medium text-slate-900">
              Nombre del donante (opcional)
            </label>
            <input
              id="nombre_donante"
              name="nombre_donante"
              placeholder="Ej: Juan Pérez / Anónimo"
              value={form.nombre_donante}
              onChange={onChange}
              maxLength={150}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Monetaria: Monto */}
          {form.tipo === 'Monetaria' && (
            <div className="grid gap-2">
              <label htmlFor="monto" className="text-sm font-medium text-slate-900">
                Monto (Bs) <span className="text-rose-600">*</span>
              </label>
              <input
                id="monto"
                name="monto"
                inputMode="decimal"
                placeholder="0.00"
                value={form.monto}
                onChange={onChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
                style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
              />
              <p className="text-xs text-slate-500">Número ≥ 0 con hasta 2 decimales. Valor actual: Bs {montoFmt}</p>
            </div>
          )}

          {/* Especie: Descripción */}
          {form.tipo === 'Especie' && (
            <div className="grid gap-2 md:col-span-2">
              <label htmlFor="descripcion_especie" className="text-sm font-medium text-slate-900">
                Descripción del bien donado <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="descripcion_especie"
                name="descripcion_especie"
                rows={4}
                placeholder="Ej: 50 kg de alimento para perros, 10 mantas..."
                value={form.descripcion_especie}
                onChange={onChange}
                required
                maxLength={2000}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
              />
            </div>
          )}

          {/* Fecha */}
          <div className="grid gap-2">
            <label htmlFor="fecha_donacion" className="text-sm font-medium text-slate-900">
              Fecha (opcional)
            </label>
            <input
              id="fecha_donacion"
              name="fecha_donacion"
              type="date"
              value={form.fecha_donacion}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Footer */}
          <div className="md:col-span-2 mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => nav('/donaciones')}
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
