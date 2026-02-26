// src/pages/Cita/CitaForm.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCita, createCita, updateCita } from '../../services/citaService';

// Catálogos (usamos wrappers defensivos abajo)
import { getAllMascotas } from '../../services/catalogosService';
import { fetchDuenos } from '../../services/duenoService';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

const TIPOS = ['Consulta', 'Vacunación', 'Cirugía', 'Control'];

/* ================= Helpers fecha/normalización ================ */
// para input type="datetime-local" => 'YYYY-MM-DDTHH:mm'
function toInputLocal(dt) {
  if (!dt) return '';
  const s = String(dt);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
  const m1 = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?/);
  if (m1) return `${m1[1]}T${m1[2]}`;
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// convierte cualquier entrada a 'YYYY-MM-DD HH:mm:ss'
function toSQLDateTime(v) {
  if (!v) return null;
  const s = String(v).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const sec = m[4] ? m[4] : '00';
    return `${m[1]} ${m[2]}:${m[3]}:${sec}`;
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/* ==================== Normalizadores + helpers ================= */
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
const authHeaders = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// Normaliza arrays: [], {data:[]}, {data:{data:[]}}, {items:[]}, {rows:[]}, {result:[]}
function normListDeep(x) {
  if (Array.isArray(x)) return x;
  if (!x) return [];
  if (Array.isArray(x.data)) return x.data;
  if (x.data && Array.isArray(x.data.data)) return x.data.data;
  if (Array.isArray(x.items)) return x.items;
  if (Array.isArray(x.rows)) return x.rows;
  if (Array.isArray(x.result)) return x.result;
  return [];
}

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

/* =========================== Form ============================= */
const CitaForm = () => {
  const { id } = useParams();
  const nav = useNavigate();

  const [mascotas, setMascotas] = useState([]);
  const [duenos, setDuenos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [err, setErr] = useState('');
  const prevMascotaIdRef = useRef('');

  const [form, setForm] = useState({
    fecha: '',
    mascota_id: '',
    dueno_id: '',
    usuario_id: '',
    motivo: '',
    precio: '',
    tipo: '',
    observaciones: ''
  });

  const selectedMascota = useMemo(
    () => mascotas.find((m) => String(m?.id) === String(form.mascota_id)) || null,
    [mascotas, form.mascota_id]
  );

  const autoDuenoId = selectedMascota?.dueno_id ?? selectedMascota?.duenoId ?? selectedMascota?.dueno?.id ?? '';
  const hasAutoDueno = String(autoDuenoId || '').trim() !== '';

  // Auto-asignar dueno segun la mascota seleccionada
  useEffect(() => {
    if (hasAutoDueno) {
      if (String(form.dueno_id) !== String(autoDuenoId)) {
        setForm((f) => ({ ...f, dueno_id: String(autoDuenoId) }));
      }
    } else {
      if (prevMascotaIdRef.current !== String(form.mascota_id)) {
        setForm((f) => ({ ...f, dueno_id: '' }));
      }
    }
    prevMascotaIdRef.current = String(form.mascota_id);
  }, [hasAutoDueno, autoDuenoId, form.mascota_id, form.dueno_id]);

  /* =================== Cargas con fallback ===================== */
  const loadMascotas = async () => {
    try {
      const raw = await getAllMascotas();
      return normListDeep(raw);
    } catch {
      return [];
    }
  };

  const loadDuenos = async () => {
    try {
      const raw = await fetchDuenos();
      return normListDeep(raw);
    } catch {
      return [];
    }
  };

  // Intento 1: /usuarios/veterinarios
  // Intento 2: /usuarios?rol=veterinario
  // Intento 3: /usuarios y filtrar en front por rol/roles
  const loadVeterinarios = async () => {
    const tryFetch = async (url) => {
      const res = await fetch(url, { headers: { ...authHeaders() }, credentials: 'include' });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      return normListDeep(json);
    };

    // 1) endpoint dedicado
    try {
      return await tryFetch(`${API_BASE}/usuarios/veterinarios`);
    } catch {
      // 2) query por rol
      try {
        return await tryFetch(`${API_BASE}/usuarios?rol=veterinario`);
      } catch {
        // 3) traer todos y filtrar en front
        try {
          const all = await tryFetch(`${API_BASE}/usuarios`);
          const vets = all.filter(u => {
            const r1 = (u.rol || u.role || '').toString().toLowerCase();
            const rMany = Array.isArray(u.roles) ? u.roles.map(r => (r.slug || r.nombre || r).toString().toLowerCase()) : [];
            return r1 === 'veterinario' || rMany.includes('veterinario');
          });
          return vets;
        } catch {
          return [];
        }
      }
    }
  };

  // Cargar catálogos al montar
  useEffect(() => {
    (async () => {
      try {
        const [mList, dList, vList] = await Promise.all([
          loadMascotas(),
          loadDuenos(),
          loadVeterinarios(),
        ]);
        setMascotas(mList || []);
        setDuenos(dList || []);
        setUsuarios(vList || []);
      } catch (e) {
        console.error(e);
        setMascotas([]); setDuenos([]); setUsuarios([]);
        setErr('No se pudieron cargar los catálogos.');
      }
    })();
  }, []);

  // Cargar cita (edición)
  useEffect(() => {
    if (!id) return;
    fetchCita(id)
      .then((data) => {
        setForm({
          fecha: toInputLocal(data?.fecha),
          mascota_id: data?.mascota_id ?? '',
          dueno_id: data?.dueno_id ?? '',
          usuario_id: data?.usuario_id ?? '',
          motivo: data?.motivo ?? '',
          precio: data?.precio != null ? String(data.precio) : '',
          tipo: data?.tipo ?? '',
          observaciones: data?.observaciones ?? ''
        });
      })
      .catch(err => console.error('Error al cargar cita:', err));
  }, [id]);

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  /* ======================= Validación front ===================== */
  function validate() {
    const s = (v) => String(v ?? '').trim();

    // fecha requerida y válida
    if (!s(form.fecha)) return 'La fecha y hora son obligatorias.';
    const sql = toSQLDateTime(form.fecha);
    if (!sql) return 'Formato de fecha/hora inválido.';
    const d = new Date(sql.replace(' ', 'T'));
    const min = new Date('2000-01-01T00:00:00');
    const max = new Date(); max.setFullYear(max.getFullYear() + 10);
    if (d < min || d > max) return 'La fecha/hora está fuera de un rango válido.';

    // mascota y usuario requeridos
    if (!s(form.mascota_id)) return 'Selecciona una mascota.';
    if (!s(form.usuario_id)) return 'Selecciona un veterinario.';

    // tipo requerido y válido
    if (!s(form.tipo) || !TIPOS.includes(form.tipo)) return 'Selecciona un tipo de cita válido.';

    // precio opcional, >=0 y máx 2 decimales
    if (s(form.precio)) {
      if (!/^\d+(\.\d{1,2})?$/.test(s(form.precio))) return 'El precio debe tener como máximo 2 decimales.';
      const num = Number(form.precio);
      if (!Number.isFinite(num) || num < 0) return 'El precio debe ser un número mayor o igual a 0.';
    }

    // longitudes razonables
    if (s(form.motivo).length > 500) return 'El motivo no debe exceder 500 caracteres.';
    if (s(form.observaciones).length > 2000) return 'Las observaciones no deben exceder 2000 caracteres.';

    return null;
  }

  function buildPayload() {
    return {
      fecha: toSQLDateTime(form.fecha),                  // 'YYYY-MM-DD HH:mm:ss'
      mascota_id: Number(form.mascota_id),
      dueno_id: String(form.dueno_id).trim() ? Number(form.dueno_id) : null,
      usuario_id: Number(form.usuario_id),
      motivo: form.motivo?.trim() || null,
      precio: String(form.precio).trim() ? Number(form.precio) : null,
      tipo: form.tipo,  
      observaciones: form.observaciones?.trim() || null,
    };
  }

  const onSubmit = (e) => {
    e.preventDefault();
    setErr('');
    const v = validate();
    if (v) { setErr(v); return; }
    const payload = buildPayload();

    const action = id ? updateCita(id, payload) : createCita(payload);
    action
      .then(() => nav('/citas'))
      .catch(err => {
        console.error('Error al guardar cita:', err);
        setErr(err?.response?.data?.message || err?.message || 'Error al guardar');
      });
  };

  /* ============================ UI ============================== */
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white via-white to-slate-50">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="inline-block h-5 w-5 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
          <h2 className="text-2xl font-extrabold text-slate-900">
            {id ? 'Editar Cita' : 'Nueva Cita'}
          </h2>
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Fecha */}
          <div className="grid gap-2">
            <label htmlFor="fecha" className="text-sm font-medium text-slate-900">Fecha y hora <span className="text-rose-600">*</span></label>
            <input
              type="datetime-local"
              id="fecha"
              name="fecha"
              value={form.fecha}
              onChange={onChange}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Tipo */}
          <div className="grid gap-2">
            <label htmlFor="tipo" className="text-sm font-medium text-slate-900">Tipo <span className="text-rose-600">*</span></label>
            <div className="relative">
              <select
                id="tipo"
                name="tipo"
                value={form.tipo}
                onChange={onChange}
                required
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm shadow-sm outline-none focus:border-slate-400"
                style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
              >
                <option value="">Tipo de cita</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDownIcon />
            </div>
          </div>

          {/* Mascota (autocomplete) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Mascota <span className="text-rose-600">*</span></label>
            <AutoComplete
              items={mascotas}
              value={form.mascota_id}
              onChange={(idVal) => setForm((f) => ({ ...f, mascota_id: idVal }))}
              placeholder="Buscar mascota por nombre…"
              required
              disabled={false}
              getLabel={(m) => (m?.nombre ? m.nombre : `#${m.id}`)}
            />
          </div>

          {/* Dueno (opcional) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Dueno (opcional)</label>
            <AutoComplete
              items={duenos}
              value={form.dueno_id}
              onChange={(idVal) => setForm((f) => ({ ...f, dueno_id: idVal }))}
              placeholder={hasAutoDueno ? "Asignado automaticamente" : "Sin dueno asignado"}
              required={false}
              disabled
              getLabel={(d) => {
                const full = `${d?.nombre ?? ''} ${d?.primer_apellido ?? ''} ${d?.segundo_apellido ?? ''}`.trim() || 'Sin nombre';
                const ci = d?.carnet_identidad ? ` - CI: ${d.carnet_identidad}` : '';
                return `${full}${ci}`;
              }}
            />
            <p className="text-xs text-slate-500">
              {hasAutoDueno ? 'El dueno se asigna automaticamente segun la mascota.' : 'Este campo es solo informativo.'}
            </p>
          </div>

          {/* Veterinario (autocomplete) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Veterinario <span className="text-rose-600">*</span></label>
            <AutoComplete
              items={usuarios}
              value={form.usuario_id}
              onChange={(idVal) => setForm((f) => ({ ...f, usuario_id: idVal }))}
              placeholder="Buscar veterinario…"
              required
              disabled={false}
              getLabel={(u) => `${u?.nombre ?? ''} ${u?.primer_apellido ?? ''}`.trim() || 'Usuario'}
            />
          </div>

          {/* Motivo */}
          <div className="grid gap-2">
            <label htmlFor="motivo" className="text-sm font-medium text-slate-900">Motivo</label>
            <input
              id="motivo"
              type="text"
              name="motivo"
              placeholder="Motivo"
              value={form.motivo}
              onChange={onChange}
              maxLength={500}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Precio */}
          <div className="grid gap-2">
            <label htmlFor="precio" className="text-sm font-medium text-slate-900">Precio</label>
            <input
              id="precio"
              type="number"
              name="precio"
              placeholder="0.00"
              value={form.precio}
              onChange={onChange}
              step="0.01"
              min="0"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">Deja vacío si no corresponde. Máximo 2 decimales.</p>
          </div>

          {/* Observaciones */}
          <div className="col-span-1 md:col-span-2 grid gap-2">
            <label htmlFor="observaciones" className="text-sm font-medium text-slate-900">Observaciones</label>
            <textarea
              id="observaciones"
              name="observaciones"
              placeholder="Observaciones"
              value={form.observaciones}
              onChange={onChange}
              maxLength={2000}
              className="min-h-[100px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Footer */}
          <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => nav('/citas')}
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
};

/* Icono flecha para selects */
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

export default CitaForm;
