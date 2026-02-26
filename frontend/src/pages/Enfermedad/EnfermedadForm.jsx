// src/pages/EnfermedadForm.jsx
import React, { useState, useEffect } from 'react';
import { crearEnfermedad, actualizarEnfermedad, getEnfermedadById } from '../../services/enfermedadService';
import { useNavigate, useParams } from 'react-router-dom';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

// helpers de normalización
const clean = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');

export default function EnfermedadForm() {
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    getEnfermedadById(id)
      .then((raw) => {
        if (!mounted) return;
        const data = raw?.data ? raw.data : raw || {};
        setForm({
          nombre: data.nombre ?? '',
          descripcion: data.descripcion ?? '',
        });
      })
      .catch((e) => {
        if (!mounted) return;
        setErr(e?.response?.data?.message || e?.message || 'Error al cargar enfermedad');
      });
    return () => { mounted = false; };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // ==================== Validación Front ====================
  function validate() {
    const nombre = clean(form.nombre);
    if (!nombre) return 'El nombre es obligatorio.';
    if (nombre.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (nombre.length > 100) return 'El nombre no debe exceder 100 caracteres.';
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9.,;:()\/\-\s]+$/.test(nombre)) {
      return 'El nombre contiene caracteres no permitidos.';
    }

    const desc = String(form.descripcion ?? '');
    if (desc && desc.length > 2000) return 'La descripción no debe exceder 2000 caracteres.';
    if (desc && !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9.,;:'"º°%/()\-_\r\n\s]*$/.test(desc)) {
      return 'La descripción contiene caracteres no permitidos.';
    }

    return null;
  }

  function buildPayload() {
    const nombre = clean(form.nombre);
    const desc = String(form.descripcion ?? '').trim().replace(/\s+$/gm, ''); // respeta saltos de línea
    return {
      nombre,
      descripcion: desc ? desc : null,
      // si manejaras "estado" en updates, aquí podrías incluirlo:
      // estado: 1,
    };
  }

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
        await actualizarEnfermedad(id, payload);
      } else {
        await crearEnfermedad(payload);
      }
      navigate('/enfermedades');
    } catch (error) {
      setErr(error?.response?.data?.message || error?.message || 'Error al guardar enfermedad');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white via-white to-slate-50">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="inline-block h-5 w-5 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
          <h2 className="text-2xl font-extrabold text-slate-900">
            {isEdit ? 'Editar Enfermedad' : 'Registrar Enfermedad'}
          </h2>
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          {/* Nombre */}
          <div className="grid gap-2">
            <label htmlFor="nombre" className="text-sm font-medium text-slate-900">
              Nombre <span className="text-rose-600">*</span>
            </label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="Nombre de la enfermedad"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">2–100 caracteres. Permite letras, números y .,;:/()-</p>
          </div>

          {/* Descripción */}
          <div className="grid gap-2">
            <label htmlFor="descripcion" className="text-sm font-medium text-slate-900">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              maxLength={2000}
              placeholder="Detalle de la enfermedad"
              className="min-h-[120px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Opcional. Máx. 2000 caracteres.</p>
              <p className="text-xs text-slate-400">{(form.descripcion || '').length}/2000</p>
            </div>
          </div>

          {/* Botones */}
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/enfermedades')}
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
              {isEdit ? (saving ? 'Actualizando…' : 'Actualizar') : (saving ? 'Registrando…' : 'Registrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
