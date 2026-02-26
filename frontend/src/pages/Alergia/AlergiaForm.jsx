import React, { useState, useEffect } from 'react';
import { createAlergia, updateAlergia, getAlergiaById } from '../../services/AlergiaService';
import { useNavigate, useParams } from 'react-router-dom';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

// mismo patrón de nombre que en el backend (permite acentos y algunos símbolos comunes)
const NOMBRE_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9()\-.,'º°/ ]+$/;

const AlergiaForm = () => {
  const [form, setForm] = useState({ nombre: '', descripcion: '', estado: 1 });
  const [err, setErr] = useState('');
  const [descCount, setDescCount] = useState(0);
  const navigate = useNavigate();
  const { id } = useParams();

  // Tolerante a diferentes formatos de respuesta del service
  const unwrap = (resp) => {
    if (!resp) return {};
    if (resp.data && typeof resp.data === 'object') return resp.data;
    return resp;
  };

  useEffect(() => {
    if (!id) return;
    getAlergiaById(id)
      .then((data) => {
        const x = unwrap(data) || {};
        const nombre = (x.nombre ?? '').toString();
        const descripcion = (x.descripcion ?? '').toString();
        setForm({
          nombre,
          descripcion,
          estado: typeof x.estado === 'number' ? x.estado : 1,
        });
        setDescCount(descripcion.length);
      })
      .catch(err => setErr(err?.response?.data?.message || err?.message || 'Error al cargar alergia'));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Normaliza espacios sucesivos en tiempo real visualmente (sin cortar al usuario)
    if (name === 'nombre') {
      // Permitimos el input, validamos al enviar; no bloqueamos caracteres aquí,
      // solo actualizamos estado.
      setForm(f => ({ ...f, nombre: value }));
      return;
    }
    if (name === 'descripcion') {
      setForm(f => ({ ...f, descripcion: value }));
      setDescCount(value.length);
      return;
    }
    setForm(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    setErr('');
    const rawNombre = (form.nombre ?? '').trim();
    const nombre = rawNombre.replace(/\s+/g, ' '); // compacta espacios

    if (!nombre) return 'El nombre es obligatorio.';
    if (nombre.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (nombre.length > 100) return 'El nombre no debe exceder 100 caracteres.';
    if (!NOMBRE_REGEX.test(nombre)) return 'El nombre contiene caracteres no permitidos.';

    const desc = (form.descripcion ?? '');
    if (desc.length > 2000) return 'La descripción no debe exceder 2000 caracteres.';

    return null;
  };

  const buildPayload = () => {
    const nombre = (form.nombre ?? '').trim().replace(/\s+/g, ' ');
    const descripcion = (form.descripcion ?? '').trim();
    return {
      nombre,
      descripcion: descripcion === '' ? null : descripcion,
      estado: typeof form.estado === 'number' ? form.estado : 1, // se envía aunque no haya control visible
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }

    const payload = buildPayload();

    try {
      if (id) await updateAlergia(id, payload);
      else await createAlergia(payload);
      navigate('/alergias');
    } catch (error) {
      setErr(error?.response?.data?.message || error?.message || 'Error al guardar alergia');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white via-white to-slate-50">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="inline-block h-5 w-5 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
          <h2 className="text-2xl font-extrabold text-slate-900">
            {id ? 'Editar' : 'Registrar'} Alergia
          </h2>
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="Ej. 'Alergia a pulgas', 'Alergia al polen'"
              maxLength={100}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">
              2–100 caracteres. Permite letras, números, espacios y ()-.,’º°/.
            </p>
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
              placeholder="Síntomas, desencadenantes, recomendaciones…"
              maxLength={2000}
              className="min-h-[110px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <div className="text-xs text-slate-500 text-right">
              {descCount}/2000
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/alergias')}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
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
              {id ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlergiaForm;
