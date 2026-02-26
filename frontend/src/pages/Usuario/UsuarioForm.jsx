// src/pages/Usuario/UsuarioForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUsuario, createUsuario, updateUsuario } from '../../services/usuarioService';
import MapPicker from '../../components/MapPicker';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

// helpers front
const s = (v) => String(v ?? '').trim();
const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’\-\s]+$/;
const ciRegex   = /^[A-Za-z0-9\-\/\.]+$/;
// con caracter especial:
const passRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\sA-Za-z0-9]).{8,255}$/;
// si prefieres sin especial: /^(?=.*[A-Za-z])(?=.*\d).{8,255}$/

const roles = ['Administrador', 'Veterinario', 'Voluntario'];

const UsuarioForm = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    carnet_identidad: '',
    direccion: '',
    latitud: '',
    longitud: '',
    correo: '',
    contrasena: '',
    rol: ''
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (isEdit) {
      fetchUsuario(id)
        .then((data) => {
          if (!mounted) return;
          setForm({
            nombre: data?.nombre || '',
            primer_apellido: data?.primer_apellido || '',
            segundo_apellido: data?.segundo_apellido || '',
            carnet_identidad: data?.carnet_identidad || '',
            direccion: data?.direccion || '',
            latitud: data?.latitud ?? '',
            longitud: data?.longitud ?? '',
            correo: data?.correo || '',
            contrasena: '',
            rol: data?.rol || ''
          });
        })
        .catch((e) => setError(e?.message || 'Error al cargar usuario'));
    }
    return () => { mounted = false; };
  }, [id, isEdit]);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onMapChange = ({ lat, lng, address }) => {
    setForm(prev => ({
      ...prev,
      latitud: lat,
      longitud: lng,
      direccion: s(prev.direccion) ? prev.direccion : (address || ''),
    }));
  };

  // ======= Validación cliente =======
  function validate() {
    // nombre y apellidos
    if (!s(form.nombre)) return 'El nombre es obligatorio.';
    if (s(form.nombre).length < 2 || s(form.nombre).length > 45) return 'El nombre debe tener entre 2 y 45 caracteres.';
    if (!nameRegex.test(s(form.nombre))) return 'El nombre solo puede contener letras, espacios, apóstrofes y guiones.';

    if (!s(form.primer_apellido)) return 'El primer apellido es obligatorio.';
    if (s(form.primer_apellido).length < 2 || s(form.primer_apellido).length > 45) return 'El primer apellido debe tener entre 2 y 45 caracteres.';
    if (!nameRegex.test(s(form.primer_apellido))) return 'El primer apellido solo puede contener letras, espacios, apóstrofes y guiones.';

    if (s(form.segundo_apellido)) {
      if (s(form.segundo_apellido).length > 45) return 'El segundo apellido no debe exceder 45 caracteres.';
      if (!nameRegex.test(s(form.segundo_apellido))) return 'El segundo apellido solo puede contener letras, espacios, apóstrofes y guiones.';
    }

    // CI (obligatorio según tu form)
    if (!s(form.carnet_identidad)) return 'El Carnet de Identidad es obligatorio.';
    if (s(form.carnet_identidad).length > 25) return 'El Carnet de Identidad no debe exceder 25 caracteres.';
    if (!ciRegex.test(s(form.carnet_identidad))) return 'El CI solo puede contener letras, números, y los símbolos - / .';

    // correo
    if (!s(form.correo)) return 'El correo es obligatorio.';
    if (s(form.correo).length > 100) return 'El correo no debe exceder 100 caracteres.';
    // validación básica de email (el backend también valida con Joi)
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s(form.correo));
    if (!emailOk) return 'El correo no tiene un formato válido.';

    // contraseña
    if (!isEdit) {
      if (!s(form.contrasena)) return 'La contraseña es obligatoria al crear.';
      if (!passRegex.test(s(form.contrasena))) {
        return 'La contraseña debe tener mínimo 8 caracteres e incluir al menos 1 letra, 1 número y 1 carácter especial.';
      }
    } else {
      if (s(form.contrasena) && !passRegex.test(s(form.contrasena))) {
        return 'Si decides actualizarla, la contraseña debe incluir al menos 1 letra, 1 número y 1 carácter especial.';
      }
    }

    // rol
    if (!s(form.rol)) return 'El rol es obligatorio.';
    if (!roles.includes(s(form.rol))) return `El rol debe ser uno de: ${roles.join(', ')}.`;

    // dirección (opcional)
    if (s(form.direccion) && s(form.direccion).length > 1000) return 'La dirección no debe exceder 1000 caracteres.';

    // coordenadas (opcional pero ambas o ninguna)
    const latRaw = s(form.latitud);
    const lonRaw = s(form.longitud);
    const hasLat = latRaw !== '';
    const hasLon = lonRaw !== '';
    if (hasLat ^ hasLon) return 'Si envías latitud debes enviar longitud y viceversa.';
    if (hasLat && hasLon) {
      const lat = Number(latRaw);
      const lon = Number(lonRaw);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) return 'Latitud fuera de rango (-90 a 90).';
      if (!Number.isFinite(lon) || lon < -180 || lon > 180) return 'Longitud fuera de rango (-180 a 180).';
      // limitar a 6 decimales opcionalmente (solo en payload)
    }

    return null;
  }

  const passStrength = useMemo(() => {
    const p = s(form.contrasena);
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return Math.min(score, 5);
  }, [form.contrasena]);

  const buildPayload = () => {
    const t = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? s(v) : v])
    );
    const lat = t.latitud === '' ? null : Number(t.latitud);
    const lon = t.longitud === '' ? null : Number(t.longitud);
    const payload = {
      nombre: t.nombre,
      primer_apellido: t.primer_apellido,
      segundo_apellido: t.segundo_apellido || null,
      carnet_identidad: t.carnet_identidad || null,
      direccion: t.direccion || null,
      correo: t.correo,
      rol: t.rol,
      latitud: Number.isFinite(lat) ? Number(lat.toFixed(6)) : null,
      longitud: Number.isFinite(lon) ? Number(lon.toFixed(6)) : null,
    };
    if (t.contrasena) payload.contrasena = t.contrasena; // solo si el user escribió algo
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
        await updateUsuario(id, payload); // PUT
      } else {
        await createUsuario(payload);     // POST
      }
      nav('/usuarios');
    } catch (er) {
      setError(er?.message || 'Error al guardar');
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
            {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nombre */}
          <div className="grid gap-2">
            <label htmlFor="nombre" className="text-sm font-medium text-slate-900">
              Nombre <span className="text-rose-600">*</span>
            </label>
            <input
              id="nombre"
              name="nombre"
              placeholder="Nombre"
              value={form.nombre}
              onChange={onChange}
              required
              maxLength={45}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Primer Apellido */}
          <div className="grid gap-2">
            <label htmlFor="primer_apellido" className="text-sm font-medium text-slate-900">
              Primer Apellido <span className="text-rose-600">*</span>
            </label>
            <input
              id="primer_apellido"
              name="primer_apellido"
              placeholder="Primer Apellido"
              value={form.primer_apellido}
              onChange={onChange}
              required
              maxLength={45}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Segundo Apellido */}
          <div className="grid gap-2">
            <label htmlFor="segundo_apellido" className="text-sm font-medium text-slate-900">
              Segundo Apellido
            </label>
            <input
              id="segundo_apellido"
              name="segundo_apellido"
              placeholder="Segundo Apellido"
              value={form.segundo_apellido}
              onChange={onChange}
              maxLength={45}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* CI */}
          <div className="grid gap-2">
            <label htmlFor="carnet_identidad" className="text-sm font-medium text-slate-900">
              Carnet de Identidad <span className="text-rose-600">*</span>
            </label>
            <input
              id="carnet_identidad"
              name="carnet_identidad"
              placeholder="CI"
              value={form.carnet_identidad}
              onChange={onChange}
              required
              maxLength={25}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">Solo letras, números y los símbolos -, / y .</p>
          </div>

          {/* Correo */}
          <div className="grid gap-2">
            <label htmlFor="correo" className="text-sm font-medium text-slate-900">
              Correo <span className="text-rose-600">*</span>
            </label>
            <input
              id="correo"
              type="email"
              name="correo"
              placeholder="Correo"
              value={form.correo}
              onChange={onChange}
              required
              maxLength={100}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Contraseña */}
          <div className="grid gap-2">
            <label htmlFor="contrasena" className="text-sm font-medium text-slate-900">
              {isEdit ? 'Nueva contraseña (opcional)' : <>Contraseña <span className="text-rose-600">*</span></>}
            </label>
            <input
              id="contrasena"
              type="password"
              name="contrasena"
              placeholder={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              value={form.contrasena}
              onChange={onChange}
              {...(!isEdit && { required: true })}
              maxLength={255}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <div className="flex items-center justify-between text-xs">
              <p className="text-slate-500">
                Min. 8 caracteres, incluye letra, número y símbolo.
              </p>
              {s(form.contrasena) && (
                <span className="text-slate-500">Fuerza: {passStrength}/5</span>
              )}
            </div>
          </div>

          {/* Rol */}
          <div className="grid gap-2">
            <label htmlFor="rol" className="text-sm font-medium text-slate-900">
              Rol <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <select
                id="rol"
                name="rol"
                value={form.rol}
                onChange={onChange}
                required
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm shadow-sm outline-none transition-all focus:border-slate-400"
                style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
                onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
              >
                <option value="">Seleccionar rol</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDownIcon />
            </div>
          </div>

          {/* Dirección + Mapa */}
          <div className="md:col-span-2 grid gap-2">
            <label className="text-sm font-medium text-slate-900">Ubicación (OpenStreetMap)</label>
            <MapPicker
              lat={form.latitud || undefined}
              lng={form.longitud || undefined}
              onChange={onMapChange}
              height={260}
              rounded="0.75rem"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label htmlFor="latitud" className="text-xs font-medium text-slate-700">Latitud</label>
                <input
                  id="latitud"
                  name="latitud"
                  inputMode="decimal"
                  value={form.latitud ?? ''}
                  onChange={onChange}
                  placeholder="-17.389500"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="longitud" className="text-xs font-medium text-slate-700">Longitud</label>
                <input
                  id="longitud"
                  name="longitud"
                  inputMode="decimal"
                  value={form.longitud ?? ''}
                  onChange={onChange}
                  placeholder="-66.156800"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="direccion" className="text-xs font-medium text-slate-700">Dirección</label>
                <input
                  id="direccion"
                  name="direccion"
                  value={form.direccion}
                  onChange={onChange}
                  maxLength={1000}
                  placeholder="Dirección / referencia"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                />
              </div>
            </div>
            {(form.latitud !== '' && form.longitud !== '') && (
              <div className="text-sm">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${form.latitud},${form.longitud}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline"
                  title="Abrir en Google Maps"
                >
                  Abrir en Google Maps
                </a>
              </div>
            )}
            <p className="text-xs text-slate-500">
              Coordenadas opcionales. Si envías una, debes enviar la otra. Latitud [-90, 90], Longitud [-180, 180].
            </p>
          </div>

          {/* Footer */}
          <div className="md:col-span-2 mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => nav('/usuarios')}
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
};

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

export default UsuarioForm;
