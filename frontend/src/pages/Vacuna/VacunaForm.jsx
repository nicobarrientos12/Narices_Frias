import React, { useState, useEffect } from 'react';
import {
  fetchVacunaById,
  createVacuna,
  updateVacuna
} from '../../services/vacunaService';
import { useNavigate, useParams } from 'react-router-dom';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

export default function VacunaForm() {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    estado: 1, // valor interno, no se muestra al usuario
  });
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();

  // tolerante a diferentes estructuras del service: res || {data:{...}} || {...}
  function unwrapVacuna(resp) {
    if (!resp) return {};
    if (resp.data && typeof resp.data === 'object') return resp.data;
    return resp;
  }

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    fetchVacunaById(id)
      .then(res => {
        if (!mounted) return;
        const v = unwrapVacuna(res) || {};
        const { nombre, descripcion, precio, estado } = v;
        setForm({
          nombre: nombre || '',
          descripcion: descripcion || '',
          precio: precio != null ? String(precio) : '',
          estado: typeof estado === 'number' ? estado : 1,
        });
      })
      .catch((e) => setErr(e?.response?.data?.message || e?.message || 'Error al cargar vacuna'));
    return () => { mounted = false; };
  }, [id]);

  const onChange = e => {
    const { name, value } = e.target;
    // para precio, permitimos solo número y 2 decimales en la UI
    if (name === 'precio') {
      // permitimos vacío, dígitos y un punto con hasta dos decimales
      if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
        setForm(f => ({ ...f, [name]: value }));
      }
      return;
    }
    setForm(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const nombre = (form.nombre || '').trim();
    if (!nombre) return 'El nombre es obligatorio.';
    if (nombre.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (nombre.length > 100) return 'El nombre no debe exceder 100 caracteres.';

    const precioStr = String(form.precio || '').trim();
    if (!precioStr) return 'El precio es obligatorio.';
    if (!/^\d+(\.\d{1,2})?$/.test(precioStr)) return 'El precio debe ser numérico con máximo 2 decimales.';
    const precio = Number(precioStr);
    if (!Number.isFinite(precio)) return 'Precio inválido.';
    if (precio < 0) return 'El precio no puede ser negativo.';
    if (precio > 1_000_000) return 'El precio excede el máximo permitido.';

    const desc = String(form.descripcion || '');
    if (desc.length > 2000) return 'La descripción no debe exceder 2000 caracteres.';

    return null;
  };

  const onSubmit = async e => {
    e.preventDefault();
    setErr('');
    const v = validate();
    if (v) { setErr(v); return; }

    // normalizamos precio a número con 2 decimales
    const precio = Math.round(Number(form.precio) * 100) / 100;

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || null,
      precio,
      estado: form.estado, // siempre se envía, aunque no se muestre
    };

    try {
      if (id) {
        await updateVacuna(id, payload);
      } else {
        await createVacuna(payload);
      }
      navigate('/vacuna');
    } catch (error) {
      setErr(error?.response?.data?.message || error?.message || 'Error al guardar vacuna');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white via-white to-slate-50">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="inline-block h-5 w-5 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
          <h2 className="text-2xl font-extrabold text-slate-900">
            {id ? 'Editar Vacuna' : 'Nueva Vacuna'}
          </h2>
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="grid gap-5">
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
              onChange={onChange}
              required
              placeholder="Nombre de la vacuna"
              maxLength={100}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
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
              onChange={onChange}
              placeholder="Detalle, presentación, indicaciones…"
              maxLength={2000}
              className="min-h-[100px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <div className="text-xs text-slate-500 text-right">
              {(form.descripcion?.length || 0)}/2000
            </div>
          </div>

          {/* Precio */}
          <div className="grid gap-2">
            <label htmlFor="precio" className="text-sm font-medium text-slate-900">
              Precio (Bs.) <span className="text-rose-600">*</span>
            </label>
            <input
              id="precio"
              type="text"
              inputMode="decimal"
              name="precio"
              value={form.precio}
              onChange={onChange}
              placeholder="0.00"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">Usa punto decimal. Ej: 30.50 (máx. 2 decimales).</p>
          </div>

          {/* Botones */}
          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/vacuna')}
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
        </form>
      </div>
    </div>
  );
}
