// src/pages/MascotaAlergia/MascotaAlergiaForm.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllMascotas } from '../../services/catalogosService';
import { getAlergias } from '../../services/AlergiaService';
import {
  crearMascotaAlergia,
  actualizarMascotaAlergia,
  getMascotaAlergiaById,
} from '../../services/mascotaAlergiaService';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

const ensureArray = (x) =>
  Array.isArray(x) ? x : Array.isArray(x?.data) ? x.data : [];

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

const MascotaAlergiaForm = () => {
  const [form, setForm] = useState({
    mascota_id: '',
    alergia_id: '',
    observaciones: '',
  });
  const [mascotas, setMascotas] = useState([]);
  const [alergias, setAlergias] = useState([]);
  const [loadingRel, setLoadingRel] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [mRes, aRes] = await Promise.all([
          getAllMascotas().catch(() => []),
          getAlergias().catch(() => []),
        ]);
        if (!mounted) return;
        setMascotas(ensureArray(mRes));
        setAlergias(Array.isArray(aRes) ? aRes : []);
      } catch (e) {
        if (!mounted) return;
        console.error(e);
        setMascotas([]);
        setAlergias([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingRel(true);
        setErr('');
        const d = await getMascotaAlergiaById(id);
        const data = d?.data ? d.data : d || {};

        let mascotaId = data?.mascota_id ?? '';
        if (!mascotaId && data?.mascota) {
          const m = ensureArray(mascotas).find(
            (x) => String(x?.nombre || '').trim().toLowerCase() === String(data.mascota).trim().toLowerCase()
          );
          if (m) mascotaId = m.id;
        }
        let alergiaId = data?.alergia_id ?? '';
        if (!alergiaId && data?.alergia) {
          const a = Array.isArray(alergias) ? alergias : [];
          const found = a.find(
            (x) => String(x?.nombre || '').trim().toLowerCase() === String(data.alergia).trim().toLowerCase()
          );
          if (found) alergiaId = found.id;
        }

        if (!mounted) return;
        setForm({
          mascota_id: mascotaId || '',
          alergia_id: alergiaId || '',
          observaciones: data?.observaciones || '',
        });
      } catch (e) {
        if (!mounted) return;
        console.error('Error al cargar relacion:', e);
        setErr(e?.response?.data?.message || e?.message || 'No se pudo cargar la relacion');
      } finally {
        if (mounted) setLoadingRel(false);
      }
    })();
    return () => { mounted = false; };
  }, [isEdit, id, mascotas.length, alergias.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  function validate() {
    const s = (v) => String(v ?? '').trim();
    if (!s(form.mascota_id)) return 'Debes seleccionar una mascota.';
    if (!/^\d+$/.test(String(form.mascota_id))) return 'ID de mascota invalido.';
    if (!s(form.alergia_id)) return 'Debes seleccionar una alergia.';
    if (!/^\d+$/.test(String(form.alergia_id))) return 'ID de alergia invalido.';
    const obs = s(form.observaciones);
    if (obs && obs.length > 2000) return 'Las observaciones no deben exceder 2000 caracteres.';
    if (obs && !/^[A-Za-z0-9.,;:'"\/()\-_\r\n\s]*$/.test(obs)) {
      return 'Las observaciones contienen caracteres no permitidos.';
    }
    return null;
  }

  function buildPayload() {
    const clean = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');
    const obs = clean(form.observaciones);
    return {
      mascota_id: Number(form.mascota_id),
      alergia_id: Number(form.alergia_id),
      observaciones: obs || null,
    };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || (loadingRel && isEdit)) return;
    setErr('');
    const v = validate();
    if (v) { setErr(v); return; }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await actualizarMascotaAlergia(id, payload);
      } else {
        await crearMascotaAlergia(payload);
      }
      navigate('/mascota-alergia');
    } catch (error) {
      console.error('Error al guardar relacion:', error);
      setErr(error?.response?.data?.message || error?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white via-white to-slate-50">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="inline-block h-5 w-5 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
          <h2 className="text-2xl font-extrabold text-slate-900">
            {isEdit ? 'Editar' : 'Registrar'} Alergia de Mascota
          </h2>
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Mascota <span className="text-rose-600">*</span>
            </label>
            <AutoComplete
              items={mascotas}
              value={form.mascota_id}
              onChange={(idVal) => setForm((f) => ({ ...f, mascota_id: idVal }))}
              placeholder="Buscar mascota por nombre..."
              required
              disabled={loadingRel && isEdit}
              getLabel={(m) => m?.nombre ? m.nombre : `#${m.id}`}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Alergia <span className="text-rose-600">*</span>
            </label>
            <AutoComplete
              items={alergias}
              value={form.alergia_id}
              onChange={(idVal) => setForm((f) => ({ ...f, alergia_id: idVal }))}
              placeholder="Buscar alergia..."
              required
              disabled={loadingRel && isEdit}
              getLabel={(a) => a?.nombre ? a.nombre : `#${a.id}`}
            />
          </div>

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
              placeholder="Detalle, sintomas, recomendaciones, etc."
              className="min-h-[110px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Opcional. Max. 2000 caracteres.</p>
              <p className="text-xs text-slate-400">{(form.observaciones || '').length}/2000</p>
            </div>
          </div>

          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/mascota-alergia')}
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
              {isEdit ? (saving ? 'Actualizando...' : 'Actualizar') : (saving ? 'Registrando...' : 'Registrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MascotaAlergiaForm;
