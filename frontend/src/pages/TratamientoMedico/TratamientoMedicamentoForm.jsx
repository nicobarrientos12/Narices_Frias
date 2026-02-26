import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getAllTratamientos } from '../../services/tratamientoService';
import { getMedicamentos } from '../../services/medicamentoService';
import {
  getTratamientoMedicamentoById,
  crearTratamientoMedicamento,
  actualizarTratamientoMedicamento,
  crearTratamientoMedicamentosMasivo
} from '../../services/tratamientoMedicamentoService';
import { useNavigate, useParams } from 'react-router-dom';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

const ensureArray = (x) => Array.isArray(x) ? x : (Array.isArray(x?.data) ? x.data : []);
const addIfMissing = (items, id, labelKey = 'nombre', fallbackPrefix = '#') => {
  if (id === '' || id === null || id === undefined) return items;
  const exists = Array.isArray(items) && items.some(it => String(it.id) === String(id));
  if (exists) return items;
  const ph = { id };
  ph[labelKey] = `${fallbackPrefix}${id}`;
  return [...(Array.isArray(items) ? items : []), ph];
};

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

/* =================== Utils =================== */
const fmtFecha = (value) => {
  const d = new Date(value);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('es-BO');
};

const s = (v) => String(v ?? '').trim();
const validId = (v) => /^\d+$/.test(String(v));

function validFreeText100(val, label) {
  if (!val) return null;
  if (val.length > 100) return `${label}: máximo 100 caracteres.`;
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9%µμ./,;:()\-\s]+$/.test(val)) {
    return `${label}: usa caracteres válidos (letras, números, espacios y símbolos .,;:%()-/ µ).`;
  }
  return null;
}

const TratamientoMedicamentoForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  // En edición seguimos usando un único registro; en nuevo, usamos "items" múltiples
  const [form, setForm] = useState({
    tratamiento_id: '',
    medicamento_id: '',   // solo para modo edición
    dosis: '',
    frecuencia: '',
    duracion: '',
    items: [               // para modo NUEVO (varios)
      { tempId: 1, medicamento_id: '', dosis: '', frecuencia: '', duracion: '' }
    ]
  });

  const [tratamientos, setTratamientos] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [loadErr, setLoadErr] = useState(null);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadErr(null);
        setLoadingCats(true);
        const [tArr, mArr] = await Promise.all([
          getAllTratamientos().catch(() => []),
          getMedicamentos().catch(() => []),
        ]);
        if (!mounted) return;
        setTratamientos(ensureArray(tArr));
        setMedicamentos(ensureArray(mArr));
      } catch (e) {
        if (!mounted) return;
        console.error('Error cargando catálogos', e);
        setLoadErr(e?.message || 'Error cargando catálogos');
        setTratamientos([]);
        setMedicamentos([]);
      } finally {
        if (mounted) setLoadingCats(false);
      }

      if (isEdit) {
        try {
          const raw = await getTratamientoMedicamentoById(id);
          const data = raw?.data ? raw.data : raw || {};
          if (!mounted) return;
          setForm(f => ({
            ...f,
            tratamiento_id: data?.tratamiento_id || '',
            medicamento_id: data?.medicamento_id || '',
            dosis: data?.dosis || '',
            frecuencia: data?.frecuencia || '',
            duracion: data?.duracion || ''
          }));
          setTratamientos(curr => addIfMissing(curr, data?.tratamiento_id, 'diagnostico', '#'));
          setMedicamentos(curr => addIfMissing(curr, data?.medicamento_id, 'nombre', '#'));
        } catch (e) {
          if (!mounted) return;
          console.error('Error cargando asociación', e);
          setLoadErr(prev => prev || 'Error cargando la asociación a editar');
        }
      }
    })();

    return () => { mounted = false; };
  }, [id, isEdit]);

  /* ======== helpers UI multi ======== */
  const addRow = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, { tempId: Date.now(), medicamento_id: '', dosis: '', frecuencia: '', duracion: '' }]
    }));
  };

  const removeRow = (tempId) => {
    setForm(f => ({
      ...f,
      items: f.items.filter(it => it.tempId !== tempId)
    }));
  };

  const updateRow = (tempId, patch) => {
    setForm(f => ({
      ...f,
      items: f.items.map(it => it.tempId === tempId ? { ...it, ...patch } : it)
    }));
  };

  /* ===================== Validación ====================== */
  function validateEditar() {
    if (!s(form.tratamiento_id)) return 'Debes seleccionar un tratamiento.';
    if (!validId(form.tratamiento_id)) return 'Tratamiento inválido.';
    if (!s(form.medicamento_id)) return 'Debes seleccionar un medicamento.';
    if (!validId(form.medicamento_id)) return 'Medicamento inválido.';
    const anyFilled = [form.dosis, form.frecuencia, form.duracion].some(v => s(v).length > 0);
    if (!anyFilled) return 'Completa al menos uno de: Dosis, Frecuencia o Duración.';
    const e1 = validFreeText100(s(form.dosis), 'Dosis'); if (e1) return e1;
    const e2 = validFreeText100(s(form.frecuencia), 'Frecuencia'); if (e2) return e2;
    const e3 = validFreeText100(s(form.duracion), 'Duración'); if (e3) return e3;
    return null;
  }

  function validateNuevoMultiple() {
    if (!s(form.tratamiento_id)) return 'Debes seleccionar un tratamiento.';
    if (!validId(form.tratamiento_id)) return 'Tratamiento inválido.';

    const cleaned = form.items
      .map(r => ({
        ...r,
        medicamento_id: s(r.medicamento_id),
        dosis: s(r.dosis),
        frecuencia: s(r.frecuencia),
        duracion: s(r.duracion)
      }));

    if (!cleaned.length) return 'Agrega al menos un medicamento.';
    // cada fila: medicamento + al menos uno de los 3 campos
    for (let i = 0; i < cleaned.length; i++) {
      const row = cleaned[i];
      const idx = i + 1;
      if (!row.medicamento_id || !validId(row.medicamento_id)) {
        return `Fila ${idx}: selecciona un medicamento válido.`;
      }
      const anyFilled = [row.dosis, row.frecuencia, row.duracion].some(v => v.length > 0);
      if (!anyFilled) return `Fila ${idx}: completa al menos Dosis, Frecuencia o Duración.`;
      const e1 = validFreeText100(row.dosis, 'Dosis'); if (e1) return `Fila ${idx}: ${e1}`;
      const e2 = validFreeText100(row.frecuencia, 'Frecuencia'); if (e2) return `Fila ${idx}: ${e2}`;
      const e3 = validFreeText100(row.duracion, 'Duración'); if (e3) return `Fila ${idx}: ${e3}`;
    }

    return null;
  }

  function buildPayloadEditar() {
    const clean = (v) => s(v).replace(/\s+/g, ' ');
    const opt = (v) => (clean(v) ? clean(v) : null);
    return {
      tratamiento_id: Number(form.tratamiento_id),
      medicamento_id: Number(form.medicamento_id),
      dosis: opt(form.dosis),
      frecuencia: opt(form.frecuencia),
      duracion: opt(form.duracion),
    };
  }

  function buildPayloadMultiple() {
    const clean = (v) => s(v).replace(/\s+/g, ' ');
    const opt = (v) => (clean(v) ? clean(v) : null);
    return {
      tratamiento_id: Number(form.tratamiento_id),
      items: form.items.map(r => ({
        medicamento_id: Number(r.medicamento_id),
        dosis: opt(r.dosis),
        frecuencia: opt(r.frecuencia),
        duracion: opt(r.duracion),
      }))
    };
  }

  const handleSubmit = async e => {
    e.preventDefault();
    if (saving) return;
    setErr('');

    if (isEdit) {
      const v = validateEditar();
      if (v) { setErr(v); return; }
    } else {
      const v = validateNuevoMultiple();
      if (v) { setErr(v); return; }
    }

    setSaving(true);
    try {
      if (isEdit) {
        const payload = buildPayloadEditar();
        await actualizarTratamientoMedicamento(id, payload);
      } else {
        const payload = buildPayloadMultiple();
        await crearTratamientoMedicamentosMasivo(payload);
      }
      navigate('/tratamiento-medicamento');
    } catch (err) {
      console.error('Error al guardar:', err);
      setErr(err?.response?.data?.message || err?.message || 'No se pudo guardar');
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
            {isEdit ? 'Editar Asociación' : 'Nueva Asociación (varios medicamentos)'}
          </h2>
        </div>

        {(loadErr || err) && (
          <div className="mb-4 rounded-lg px-3 py-2 text-sm"
               style={{ background:'#FEF2F2', color:'#991B1B', border:'1px solid #FCA5A5' }}>
            {err || loadErr}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          {/* Tratamiento (AutoComplete) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Tratamiento <span className="text-rose-600">*</span>
            </label>
            <AutoComplete
              items={tratamientos}
              value={form.tratamiento_id}
              onChange={(v) => setForm(f => ({ ...f, tratamiento_id: v }))}
              placeholder={loadingCats ? 'Cargando…' : 'Buscar tratamiento…'}
              required
              disabled={loadingCats || !tratamientos.length}
              getLabel={(t) => {
                const base = t?.diagnostico ? t.diagnostico : `#${t.id}`;
                const extra = t?.fecha_inicio ? ` (${fmtFecha(t.fecha_inicio)})` : '';
                return `${base}${extra}`;
              }}
            />
          </div>

          {isEdit ? (
            <>
              {/* --- MODO EDICIÓN: UN SOLO REGISTRO --- */}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">
                  Medicamento <span className="text-rose-600">*</span>
                </label>
                <AutoComplete
                  items={medicamentos}
                  value={form.medicamento_id}
                  onChange={(v) => setForm(f => ({ ...f, medicamento_id: v }))}
                  placeholder={loadingCats ? 'Cargando…' : 'Buscar medicamento…'}
                  required
                  disabled={loadingCats || !medicamentos.length}
                  getLabel={(m) => m?.nombre ? m.nombre : `#${m.id}`}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">Dosis</label>
                <input
                  type="text"
                  name="dosis"
                  value={form.dosis}
                  onChange={(e) => setForm(f => ({ ...f, dosis: e.target.value }))}
                  placeholder="Ej: 1 ml/kg"
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
                  style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">Frecuencia</label>
                <input
                  type="text"
                  name="frecuencia"
                  value={form.frecuencia}
                  onChange={(e) => setForm(f => ({ ...f, frecuencia: e.target.value }))}
                  placeholder="Ej: cada 8 horas"
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
                  style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">Duración</label>
                <input
                  type="text"
                  name="duracion"
                  value={form.duracion}
                  onChange={(e) => setForm(f => ({ ...f, duracion: e.target.value }))}
                  placeholder="Ej: 7 días"
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
                  style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
                />
              </div>

              <div className="text-xs text-slate-500 -mt-2">
                * Debes completar al menos uno de los campos: Dosis, Frecuencia o Duración.
              </div>
            </>
          ) : (
            <>
              {/* --- MODO NUEVO: VARIAS FILAS --- */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-900">Medicamentos del tratamiento</label>
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                  >
                    + Agregar medicamento
                  </button>
                </div>

                {form.items.map((row, idx) => (
                  <div key={row.tempId} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-slate-700">Medicamento #{idx + 1}</div>
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.tempId)}
                          className="text-xs text-rose-700 hover:underline"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="grid gap-1.5">
                        <span className="text-xs font-medium text-slate-900">
                          Seleccionar medicamento <span className="text-rose-600">*</span>
                        </span>
                        <AutoComplete
                          items={medicamentos}
                          value={row.medicamento_id}
                          onChange={(v) => updateRow(row.tempId, { medicamento_id: v })}
                          placeholder={loadingCats ? 'Cargando…' : 'Buscar medicamento…'}
                          required
                          disabled={loadingCats || !medicamentos.length}
                          getLabel={(m) => m?.nombre ? m.nombre : `#${m.id}`}
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className="text-xs font-medium text-slate-900">Dosis</label>
                        <input
                          type="text"
                          value={row.dosis}
                          onChange={(e) => updateRow(row.tempId, { dosis: e.target.value })}
                          placeholder="Ej: 1 ml/kg"
                          maxLength={100}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
                          style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                          onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                          onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className="text-xs font-medium text-slate-900">Frecuencia</label>
                        <input
                          type="text"
                          value={row.frecuencia}
                          onChange={(e) => updateRow(row.tempId, { frecuencia: e.target.value })}
                          placeholder="Ej: cada 8 horas"
                          maxLength={100}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
                          style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                          onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                          onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className="text-xs font-medium text-slate-900">Duración</label>
                        <input
                          type="text"
                          value={row.duracion}
                          onChange={(e) => updateRow(row.tempId, { duracion: e.target.value })}
                          placeholder="Ej: 7 días"
                          maxLength={100}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
                          style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                          onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                          onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
                        />
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      * Completa al menos uno de: Dosis, Frecuencia o Duración.
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/tratamiento-medicamento')}
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
              {isEdit
                ? (saving ? 'Actualizando…' : 'Actualizar')
                : (saving ? 'Registrando…' : 'Registrar todo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TratamientoMedicamentoForm;
