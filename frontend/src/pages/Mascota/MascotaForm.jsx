console.log('MONTADO: MascotaForm');
// src/pages/Mascota/MascotaForm.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapPicker from '../../components/MapPicker';
import {
  fetchMascota,
  createMascota,
  updateMascota,
} from '../../services/mascotaService';
import {
  fetchDuenos as apiFetchDuenos,
  createDueno as apiCreateDueno,
  updateDueno as apiUpdateDueno,
  fetchDueno as apiFetchDueno,
} from '../../services/duenoService';

/* =================== Utils =================== */
// ID seguro desde distintas respuestas del backend
function safeGetId(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return obj.id || obj.ID || obj.insertId || obj.data?.id || obj.result?.id || null;
}

// Si el backend no devuelve id, intenta encontrarlo en el listado
async function ensureSavedId(result, payloadMatch, fetchListFn) {
  let id = safeGetId(result);
  if (id) return id;
  try {
    const list = await fetchListFn();
    const byMatch = list.filter((d) => {
      const sameName = String(d?.nombre ?? '').trim().toLowerCase() === String(payloadMatch?.nombre ?? '').trim().toLowerCase();
      const sameCorreo = payloadMatch?.correo && String(d?.correo ?? '').trim().toLowerCase() === String(payloadMatch?.correo ?? '').trim().toLowerCase();
      const sameTel = payloadMatch?.telefono && String(d?.telefono ?? '').trim() === String(payloadMatch?.telefono ?? '').trim();
      return sameName && (sameCorreo || sameTel);
    });
    if (byMatch.length) {
      byMatch.sort((a, b) => Number(b.id) - Number(a.id));
      return byMatch[0].id;
    }
    if (list.length) {
      list.sort((a, b) => Number(b.id) - Number(a.id));
      return list[0].id;
    }
  } catch {}
  return null;
}

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

const GENEROS = ['Macho', 'Hembra'];
const ESTADOS = ['En refugio', 'Adoptado', 'Externo'];
const ESPECIES = ['Perro', 'Gato'];

/* ---------- Helpers de fecha ---------- */
function normalizeDateYMD(v) {
  if (!v) return '';
  const s = String(v).trim();
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/;
  const mYmd = s.match(ymd);
  if (mYmd) return `${mYmd[1]}-${mYmd[2]}-${mYmd[3]}`;
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const mDmy = s.match(dmy);
  if (mDmy) return `${mDmy[3]}-${mDmy[2]}-${mDmy[1]}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return '';
}
function todayYMD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/* ---------- Fake Razas API (con fallback local) ---------- */
const LOCAL_RAZAS = {
  Perro: [
    'Mestizo', 'Labrador', 'Pastor Alemán', 'Bulldog', 'Poodle',
    'Rottweiler', 'Chihuahua', 'Husky Siberiano', 'Beagle', 'Golden Retriever'
  ],
  Gato: [
    'Mestizo', 'Siames', 'Persa', 'Bengalí', 'Maine Coon',
    'Azul Ruso', 'Esfinge', 'Angora', 'British Shorthair', 'Bombay'
  ],
};

async function fetchRazasByEspecie(especie) {
  if (!especie) return [];
  const base = import.meta?.env?.VITE_FAKE_RAZAS_URL; // opcional
  if (base) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 4000); // timeout 4s
      const res = await fetch(`${base}?especie=${encodeURIComponent(especie)}`, { signal: ac.signal });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data?.razas) ? data.razas : Array.isArray(data) ? data : [];
        return arr.map((r) => String(r).trim()).filter(Boolean);
      }
    } catch {
      // fall-through a listas locales
    }
  }
  return LOCAL_RAZAS[especie] || [];
}

/* =================== Componente =================== */
const MascotaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    especie: '',
    raza: '',
    edad: '',
    genero: '',
    color: '',
    caracteristicas: '',
    fecha_ingreso: '',
    estado_llegada: '',
    dueno_id: '',
  });

  const [foto, setFoto] = useState(null);
  const [duenos, setDuenos] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [err, setErr] = useState('');

  // Razas dinámicas
  const [razas, setRazas] = useState([]);
  const [razaManual, setRazaManual] = useState('');

  // Modal Dueño
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [ownerEditingId, setOwnerEditingId] = useState(null);
  const [ownerModalInitial, setOwnerModalInitial] = useState(null);

  // Load dueños
  const loadDuenos = async () => {
    try {
      const data = await apiFetchDuenos();
      setDuenos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando dueños:', e);
      setDuenos([]);
    }
  };
  useEffect(() => { loadDuenos(); }, []);

  // Default "hoy" al crear
  useEffect(() => {
    if (!id) {
      setForm((prev) => ({ ...prev, fecha_ingreso: todayYMD() }));
    }
  }, [id]);

  // Cargar mascota (edición)
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await fetchMascota(id);
        setForm({
          nombre: data?.nombre ?? '',
          especie: data?.especie ?? '',
          raza: data?.raza ?? '',
          edad: data?.edad ?? '',
          genero: data?.genero ?? '',
          color: data?.color ?? '',
          caracteristicas: data?.caracteristicas ?? '',
          fecha_ingreso: data?.fecha_ingreso ?? '',
          estado_llegada: data?.estado_llegada ?? '',
          dueno_id: data?.dueno_id ?? '',
        });
        // asegurar dueños
        if (data?.dueno_id && !duenos.find(d => String(d.id) === String(data.dueno_id))) {
          const det = await apiFetchDueno(data.dueno_id).catch(() => null);
          if (det?.id) setDuenos(prev => (prev.find(p => String(p.id) === String(det.id)) ? prev : [det, ...prev]));
        }
      } catch (e) {
        console.error('Error cargando mascota:', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // cargar razas al cambiar especie
  useEffect(() => {
    (async () => {
      if (!form.especie) { setRazas([]); return; }
      const list = await fetchRazasByEspecie(form.especie);
      setRazas(list);
      // si la raza actual no pertenece a la lista (y no es "Otra"), límpiala
      if (form.raza && !list.includes(form.raza)) {
        // si venía manual, mantenla en razaManual
        setRazaManual(form.raza);
        setForm((p) => ({ ...p, raza: '' }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.especie]);

  // Vista previa foto
  useEffect(() => {
    if (!foto) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(foto);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const fechaIngresoValue = useMemo(() => normalizeDateYMD(form?.fecha_ingreso), [form?.fecha_ingreso]);

  /* ---------- Handlers ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      let next = { ...prev, [name]: value };
      if (name === 'estado_llegada' && value === 'En refugio') next.dueno_id = '';
      if (name === 'fecha_ingreso') next.fecha_ingreso = value;
      return next;
    });
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) { setFoto(null); return; }
    const okType = ['image/png', 'image/jpg', 'image/jpeg'].includes(f.type);
    const okSize = f.size <= 5 * 1024 * 1024;
    if (!okType) { setErr('La imagen debe ser PNG o JPG/JPEG.'); e.target.value = ''; return; }
    if (!okSize) { setErr('La imagen supera el tamaño máximo (5MB).'); e.target.value = ''; return; }
    setErr(''); setFoto(f);
  };

  /* ---------- Validaciones ---------- */
  function validate() {
    const vStr = (s) => String(s ?? '').trim();
    if (!vStr(form.nombre)) return 'El nombre es obligatorio.';
    if (vStr(form.nombre).length > 100) return 'El nombre no debe exceder 100 caracteres.';

    if (!vStr(form.especie)) return 'Selecciona la especie (Perro o Gato).';
    if (!ESPECIES.includes(form.especie)) return 'Especie inválida.';

    // raza puede venir de select o manual:
    const razaFinal = getRazaFinal();
    if (vStr(razaFinal).length > 100) return 'La raza no debe exceder 100 caracteres.';

    if (vStr(form.color).length > 50) return 'El color no debe exceder 50 caracteres.';

    if (vStr(form.edad)) {
      const n = Number(form.edad);
      if (!Number.isInteger(n) || n < 0) return 'La edad debe ser un entero ≥ 0.';
    }
    if (vStr(form.genero) && !GENEROS.includes(form.genero)) {
      return 'El género debe ser "Macho" u "Hembra".';
    }
    if (!vStr(form.estado_llegada)) return 'El estado de llegada es obligatorio.';
    if (!ESTADOS.includes(form.estado_llegada)) return 'Estado de llegada inválido.';
    if (form.estado_llegada !== 'En refugio') {
      if (!vStr(form.dueno_id)) return 'El dueño es obligatorio para "Adoptado" o "Externo".';
    }
    const norm = normalizeDateYMD(form.fecha_ingreso);
    if (vStr(form.fecha_ingreso) && !norm) return 'La fecha de ingreso debe tener formato YYYY-MM-DD.';
    return null;
  }

  function getRazaFinal() {
    // Si seleccionó "Otra…" usamos razaManual; si no, usamos form.raza
    return form.raza === '__OTHER__' ? String(razaManual ?? '').trim() : String(form.raza ?? '').trim();
  }

  function buildFormData() {
    const fd = new FormData();
    const edadNum = String(form.edad).trim() === '' ? null : Number(form.edad);
    const dueno = String(form.dueno_id).trim() === '' ? null : Number(form.dueno_id);
    const normDate = normalizeDateYMD(form.fecha_ingreso) || null;

    const fields = {
      nombre: String(form.nombre ?? '').trim(),
      especie: String(form.especie ?? '').trim(),
      raza: getRazaFinal() || null,
      edad: Number.isInteger(edadNum) ? edadNum : null,
      genero: String(form.genero ?? '').trim() || null,
      color: String(form.color ?? '').trim() || null,
      caracteristicas: String(form.caracteristicas ?? '').trim() || null,
      fecha_ingreso: normDate,
      estado_llegada: form.estado_llegada,
      dueno_id: dueno,
    };

    Object.entries(fields).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') fd.append(k, '');
      else fd.append(k, v);
    });

    if (foto) fd.append('foto', foto);
    return fd;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    const v = validate();
    if (v) { setErr(v); return; }
    const data = buildFormData();

    try {
      if (id) await updateMascota(id, data);
      else await createMascota(data);
      navigate('/mascotas');
    } catch (error) {
      console.error('Error guardando mascota:', error);
      setErr(error?.response?.data?.message || error?.message || 'No se pudo guardar la mascota.');
    }
  };

  // Modales dueño
  const openCreateOwner = () => { setOwnerEditingId(null); setOwnerModalInitial(null); setOwnerModalOpen(true); };
  const openEditOwner = async () => {
    const currentId = form.dueno_id;
    if (!currentId) return;
    try {
      const det = await apiFetchDueno(currentId);
      setOwnerEditingId(currentId);
      setOwnerModalInitial({
        nombre: det?.nombre || '',
        telefono: det?.telefono || '',
        direccion: det?.direccion || '',
        correo: det?.correo || '',
        latitud: det?.latitud ?? '',
        longitud: det?.longitud ?? '',
      });
      setOwnerModalOpen(true);
    } catch (e) {
      console.error('No se pudo cargar el dueño para editar:', e);
      setOwnerEditingId(currentId);
      setOwnerModalInitial(null);
      setOwnerModalOpen(true);
    }
  };
  const onOwnerSaved = async (savedId) => {
    await loadDuenos();
    setForm(prev => ({ ...prev, dueno_id: savedId }));
    setOwnerModalOpen(false);
    setOwnerEditingId(null);
    setOwnerModalInitial(null);
  };

  /* =================== Render =================== */
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white via-white to-slate-50">
      <div className="w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block h-5 w-5 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
            <h2 className="text-2xl font-extrabold text-slate-900">
              {id ? 'Editar Mascota' : 'Registrar Mascota'}
            </h2>
          </div>
          <StatusPill value={form.estado_llegada} />
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <Field label="Nombre" htmlFor="nombre" required>
              <InputFocus
                id="nombre"
                name="nombre"
                placeholder="Nombre"
                value={form.nombre || ''}
                onChange={handleChange}
                required
                maxLength={100}
              />
            </Field>

            {/* Especie como checkboxes exclusivos */}
            <Field label="Especie">
              <div className="flex items-center gap-3">
                {ESPECIES.map((esp) => (
                  <label key={esp} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer select-none ${form.especie === esp ? 'border-slate-400 bg-slate-50' : 'border-slate-300 bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={form.especie === esp}
                      onChange={() => {
                        setForm((p) => ({
                          ...p,
                          especie: p.especie === esp ? '' : esp,
                          raza: '', // reset raza al cambiar especie
                        }));
                        setRazaManual('');
                      }}
                    />
                    {esp}
                  </label>
                ))}
              </div>
            </Field>

            {/* Raza dependiente */}
            <Field label="Raza">
              {form.especie ? (
                <div className="grid gap-2">
                  <div className="relative">
                    <SelectFocus
                      value={form.raza}
                      onChange={(e) => setForm((p) => ({ ...p, raza: e.target.value }))}
                    >
                      <option value="">Selecciona raza…</option>
                      {razas.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      <option value="__OTHER__">Otra…</option>
                    </SelectFocus>
                    <ChevronDownIcon />
                  </div>
                  {form.raza === '__OTHER__' && (
                    <InputFocus
                      placeholder="Escribe la raza"
                      value={razaManual}
                      onChange={(e) => setRazaManual(e.target.value)}
                      maxLength={100}
                    />
                  )}
                </div>
              ) : (
                <InputFocus value="" placeholder="Selecciona una especie primero" disabled />
              )}
            </Field>

            <Field label="Edad" htmlFor="edad">
              <InputFocus
                id="edad"
                name="edad"
                type="number"
                placeholder="Edad"
                value={form.edad ?? ''}
                onChange={handleChange}
                min={0}
                step={1}
              />
            </Field>

            <Field label="Género" htmlFor="genero">
              <div className="relative">
                <SelectFocus
                  id="genero"
                  name="genero"
                  value={form.genero || ''}
                  onChange={handleChange}
                >
                  <option value="">Género</option>
                  {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                </SelectFocus>
                <ChevronDownIcon />
              </div>
            </Field>

            <Field label="Color" htmlFor="color">
              <InputFocus
                id="color"
                name="color"
                placeholder="Color"
                value={form.color || ''}
                onChange={handleChange}
                maxLength={50}
              />
            </Field>

            <Field className="xl:col-span-3" label="Características" htmlFor="caracteristicas">
              <TextareaFocus
                id="caracteristicas"
                name="caracteristicas"
                placeholder="Características (comportamiento, signos, señas particulares...)"
                value={form.caracteristicas || ''}
                onChange={handleChange}
              />
            </Field>
          </div>

          {/* Gestión y estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <Field label="Fecha de ingreso" htmlFor="fecha_ingreso">
              <InputFocus
                id="fecha_ingreso"
                name="fecha_ingreso"
                type="date"
                value={fechaIngresoValue}
                onChange={handleChange}
              />
            </Field>

            <Field label="Estado de llegada" htmlFor="estado_llegada" required>
              <div className="relative">
                <SelectFocus
                  id="estado_llegada"
                  name="estado_llegada"
                  value={form.estado_llegada || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">Estado Llegada</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </SelectFocus>
                <ChevronDownIcon />
              </div>
            </Field>

            {/* Dueño con Autocomplete + Acciones CRUD inline */}
            <Field label="Dueño">
              <OwnerAutocomplete
                duenos={duenos}
                value={form.dueno_id}
                onChange={(val) => setForm(prev => ({ ...prev, dueno_id: val }))}
                disabled={form.estado_llegada === 'En refugio'}
                required={form.estado_llegada !== 'En refugio'}
                onCreateNew={openCreateOwner}
                onEditSelected={openEditOwner}
              />
              <p className="mt-1 text-xs text-slate-500">
                {form.estado_llegada === 'En refugio'
                  ? 'Opcional cuando la mascota está en refugio.'
                  : 'Obligatorio para estados "Adoptado" o "Externo".'}
              </p>
            </Field>
          </div>

          {/* Foto (opcional) */}
          <div className="grid gap-2">
            <label htmlFor="foto" className="text-sm font-medium text-slate-900">Foto (opcional)</label>
            <label
              htmlFor="foto"
              className="group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-slate-50"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
            >
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" className="opacity-80" fill="currentColor">
                  <path d="M9 2l2 2h6a2 2 0 012 2v2H5V6a2 2 0 012-2h2l2-2zM5 10h14v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8zm7 1a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                <div className="text-sm">
                  <div className="font-medium text-slate-900">Seleccionar imagen</div>
                  <div className="text-xs text-slate-500">PNG, JPG/JPEG. Máx. 5MB.</div>
                </div>
              </div>
              <span
                className="rounded-lg px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: BRAND.yellow, color: '#111827' }}
              >
                Buscar…
              </span>
              <input id="foto" type="file" accept="image/png,image/jpg,image/jpeg" onChange={handleFile} className="hidden" />
            </label>

            {previewUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
                />
                <span className="text-xs text-slate-600 truncate">
                  {foto?.name}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/mascotas')}
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
              {id ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>

      {/* === MODAL DUEÑO (crear/editar) === */}
      {ownerModalOpen && (
        <OwnerFullModal
          onClose={() => { setOwnerModalOpen(false); setOwnerEditingId(null); setOwnerModalInitial(null); }}
          onSaved={onOwnerSaved}
          editingId={ownerEditingId}
          initialData={ownerModalInitial}
        />
      )}
    </div>
  );
};

/* ---------- Owner Autocomplete con acciones ---------- */
function OwnerAutocomplete({
  duenos, value, onChange, disabled, required,
  onCreateNew, onEditSelected,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selected = useMemo(
    () => duenos.find((d) => String(d.id) === String(value)) || null,
    [duenos, value]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return duenos.slice(0, 50);
    return duenos.filter((d) => {
      const name = `${d?.nombre ?? ''} ${d?.primer_apellido ?? ''} ${d?.segundo_apellido ?? ''}`.toLowerCase();
      const ci = String(d?.carnet_identidad ?? '').toLowerCase();
      return name.includes(s) || ci.includes(s);
    }).slice(0, 50);
  }, [duenos, q]);

  return (
    <div className="grid gap-2">
      {selected && !disabled && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium bg-slate-50 border-slate-200 text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-current/60" />
            {`${selected.nombre ?? ''} ${selected.primer_apellido ?? ''} ${selected.segundo_apellido ?? ''}`.trim() || 'Dueño'}
          </span>
          <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold underline decoration-dotted text-slate-700">Cambiar</button>
          <span className="text-slate-300">•</span>
          <button type="button" onClick={onEditSelected} className="text-xs font-semibold underline decoration-dotted text-slate-700">Editar dueño</button>
        </div>
      )}

      <div ref={wrapperRef} className="relative">
        <input
          type="text"
          disabled={disabled}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={disabled ? 'No requerido (En refugio)' : 'Buscar por nombre o CI…'}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
          style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
          onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
        />
        {open && !disabled && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-64 overflow-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100">
              <button type="button" className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-slate-50" onClick={() => { setOpen(false); onCreateNew(); }}>
                + Nuevo dueño
              </button>
            </div>

            {filtered.length ? (
              filtered.map((d) => {
                const label = `${d?.nombre ?? ''} ${d?.primer_apellido ?? ''} ${d?.segundo_apellido ?? ''}`.trim() || 'Sin nombre';
                const ci = d?.carnet_identidad ? ` · CI: ${d.carnet_identidad}` : '';
                return (
                  <button
                    key={d.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                    onClick={() => { onChange(d.id); setQ(''); setOpen(false); }}
                  >
                    <span className="font-medium text-slate-900">{label}</span>
                    <span className="text-slate-500">{ci}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500">
                Sin resultados. <button type="button" className="underline" onClick={() => { setOpen(false); onCreateNew(); }}>Crear nuevo</button>
              </div>
            )}
          </div>
        )}
      </div>

      {required && <input type="hidden" required value={selected ? 'ok' : ''} onChange={() => {}} />}
    </div>
  );
}

/* ---------- Modal Dueño FULL (crear/editar) ---------- */
function OwnerFullModal({ onClose, onSaved, editingId, initialData }) {
  const isEdit = Boolean(editingId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    correo: '',
    latitud: '',
    longitud: '',
  });

  useEffect(() => {
    if (isEdit && initialData) {
      setForm({
        nombre: initialData?.nombre || '',
        telefono: initialData?.telefono || '',
        direccion: initialData?.direccion || '',
        correo: initialData?.correo || '',
        latitud: initialData?.latitud ?? '',
        longitud: initialData?.longitud ?? '',
      });
    }
  }, [isEdit, initialData]);

  const s = (v) => String(v ?? '').trim();

  const validate = () => {
    if (!s(form.nombre)) return 'El nombre es obligatorio.';
    if (s(form.nombre).length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (s(form.nombre).length > 100) return 'El nombre no debe exceder 100 caracteres.';
    if (s(form.telefono)) {
      if (s(form.telefono).length > 20) return 'El teléfono no debe exceder 20 caracteres.';
      if (!/^[0-9+\-\s]*$/.test(s(form.telefono))) return 'El teléfono solo puede contener dígitos, espacios, + y guiones.';
    }
    if (s(form.correo)) {
      if (s(form.correo).length > 100) return 'El correo no debe exceder 100 caracteres.';
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s(form.correo));
      if (!emailOk) return 'Correo inválido.';
    }
    const hasLat = s(form.latitud) !== '';
    const hasLon = s(form.longitud) !== '';
    if (hasLat || hasLon) {
      if (!(hasLat && hasLon)) return 'Si envías coordenadas, latitud y longitud deben venir juntas.';
      const lat = Number(s(form.latitud));
      const lon = Number(s(form.longitud));
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) return 'La latitud debe estar entre -90 y 90.';
      if (!Number.isFinite(lon) || lon < -180 || lon > 180) return 'La longitud debe estar entre -180 y 180.';
    }
    return null;
  };

  const buildPayload = () => ({
    nombre: s(form.nombre),
    telefono: s(form.telefono) || null,
    direccion: s(form.direccion) || null,
    correo: s(form.correo) || null,
    latitud: s(form.latitud) === '' ? null : Number(s(form.latitud)),
    longitud: s(form.longitud) === '' ? null : Number(s(form.longitud)),
  });

  const handleMapChange = ({ lat, lng, address }) => {
    setForm((prev) => ({
      ...prev,
      latitud: lat,
      longitud: lng,
      direccion: s(prev.direccion) ? prev.direccion : (address || ''),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) { setError(v); return; }

    setSaving(true);
    try {
      const payload = buildPayload();
      let savedId = null;
      if (isEdit) {
        await apiUpdateDueno(editingId, payload);
        savedId = editingId;
      } else {
        const created = await apiCreateDueno(payload);
        savedId = await ensureSavedId(created, payload, apiFetchDuenos);
      }
      if (!savedId) throw new Error('No se pudo determinar el ID del dueño guardado.');
      onSaved(savedId);
    } catch (e) {
      setError(e?.message || 'No se pudo guardar el dueño.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={saving ? undefined : onClose} />
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="inline-block h-5 w-5 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
            <h3 className="text-lg font-extrabold text-slate-900">{isEdit ? 'Editar dueño' : 'Nuevo dueño'}</h3>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="text-slate-600 hover:text-slate-900" aria-label="Cerrar" title="Cerrar">✕</button>
        </div>

        {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Nombre <span className="text-rose-600">*</span></label>
            <input
              value={form.nombre}
              onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              maxLength={100}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Teléfono</label>
            <input
              value={form.telefono}
              onChange={(e) => setForm(prev => ({ ...prev, telefono: e.target.value }))}
              maxLength={20}
              placeholder="Ej: +591 700-12345"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Dirección</label>
            <input
              value={form.direccion}
              onChange={(e) => setForm(prev => ({ ...prev, direccion: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Correo</label>
            <input
              type="email"
              value={form.correo}
              onChange={(e) => setForm(prev => ({ ...prev, correo: e.target.value }))}
              maxLength={100}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          <div className="grid gap-2">
            <MapPicker
              lat={form.latitud || undefined}
              lng={form.longitud || undefined}
              onChange={handleMapChange}
              height={260}
              rounded="0.75rem"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Latitud</label>
                <input
                  inputMode="decimal"
                  value={form.latitud ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, latitud: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                  placeholder="-17.389500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Longitud</label>
                <input
                  inputMode="decimal"
                  value={form.longitud ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, longitud: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                  placeholder="-66.156800"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">Haz clic en el mapa, arrastra el marcador o busca una dirección. Si envías coordenadas, deben venir ambas (latitud y longitud).</p>
          </div>

          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition active:scale-[0.98]" style={{ backgroundColor: BRAND.yellow, color: '#111827', opacity: saving ? 0.8 : 1 }}>
              {saving ? (isEdit ? 'Actualizando…' : 'Guardando…') : (isEdit ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */
function Field({ label, htmlFor, children, className = '', required = false }) {
  return (
    <div className={`grid gap-2 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-900">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}
function InputFocus(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400 ${props.className || ''}`}
      style={{ ...(props.style || {}), boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
      onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
      onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
    />
  );
}
function TextareaFocus(props) {
  return (
    <textarea
      {...props}
      className={`min-h-[110px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400 ${props.className || ''}`}
      style={{ ...(props.style || {}), boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
      onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
      onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
    />
  );
}
function SelectFocus({ children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm shadow-sm outline-none focus:border-slate-400 ${props.className || ''}`}
      style={{ ...(props.style || {}), boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
      onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
      onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
    >
      {children}
    </select>
  );
}
const ChevronDownIcon = () => (
  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 opacity-60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.18l3.71-2.95a.75.75 0 1 1 .94 1.17l-4.2 3.34a.75.75 0 0 1-.94 0l-4.2-3.34a.75.75 0 0 1-.02-1.06z" clipRule="evenodd" />
  </svg>
);
const StatusPill = ({ value }) => {
  const map = {
    '': 'bg-gray-100 text-gray-700 border-gray-200',
    'En refugio': 'bg-[#FFF7CC] text-[#7A6400] border-[#FCE680]',
    'Adoptado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Externo': 'bg-sky-50 text-sky-700 border-sky-200',
  };
  const cls = map[value] || map[''];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current/60" />
      {value || 'Sin estado'}
    </span>
  );
};

export default MascotaForm;
