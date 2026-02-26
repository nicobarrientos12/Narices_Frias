// src/pages/MedicamentoForm.jsx
import React, { useEffect, useState } from 'react';
import { createMedicamento, getMedicamentoById, updateMedicamento } from '../../services/medicamentoService';
import { useNavigate, useParams } from 'react-router-dom';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

const MedicamentoForm = () => {
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '' });
  const [saving, setSaving] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  useEffect(() => {
    let mounted = true;
    if (isEdit) {
      getMedicamentoById(id)
        .then(({ data }) => {
          if (!mounted) return;
          // Normaliza precio a string para input number
          const precio = (data?.precio ?? '') !== '' ? String(data.precio) : '';
          setForm({
            nombre: data?.nombre || '',
            descripcion: data?.descripcion || '',
            precio,
          });
        })
        .catch(err => console.error('Error al cargar medicamento', err));
    }
    return () => { mounted = false; };
  }, [id, isEdit]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre?.trim(),
        descripcion: form.descripcion?.trim(),
        precio: Number(form.precio),
      };
      if (isNaN(payload.precio)) {
        alert('Precio inválido');
        setSaving(false);
        return;
      }

      if (isEdit) {
        await updateMedicamento(id, payload);
      } else {
        await createMedicamento(payload);
      }
      navigate('/medicamentos');
    } catch (error) {
      console.error('Error al guardar medicamento', error);
      alert(error?.message || 'No se pudo guardar');
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
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isEdit ? 'Editar Medicamento' : 'Nuevo Medicamento'}
          </h1>
        </div>

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
              placeholder="Nombre del medicamento"
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
              onChange={handleChange}
              placeholder="Uso, presentación, dosis sugerida…"
              className="min-h-[100px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Precio */}
          <div className="grid gap-2">
            <label htmlFor="precio" className="text-sm font-medium text-slate-900">
              Precio (Bs) <span className="text-rose-600">*</span>
            </label>
            <input
              id="precio"
              type="number"
              name="precio"
              value={form.precio}
              onChange={handleChange}
              required
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">Usa punto decimal. Ej: 25.50</p>
          </div>

          {/* Botones */}
          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/medicamentos')}
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
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicamentoForm;
