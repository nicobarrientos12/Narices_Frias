console.log('MONTADO: DuenoForm');
import { useState, useEffect } from 'react';
import { fetchDueno, createDueno, updateDueno } from '../../services/duenoService';
import { useNavigate, useParams } from 'react-router-dom';
import MapPicker from '../../components/MapPicker';

const BRAND = {
  yellow: '#FFD200',
  yellowHover: '#E6C000',
  yellowRing: 'rgba(255,210,0,0.45)',
};

const DuenoForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    correo: '',
    latitud: '',
    longitud: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (isEdit) {
      fetchDueno(id)
        .then((data) => {
          if (!mounted) return;
          setForm({
            nombre: data?.nombre || '',
            telefono: data?.telefono || '',
            direccion: data?.direccion || '',
            correo: data?.correo || '',
            latitud: data?.latitud ?? '',
            longitud: data?.longitud ?? '',
          });
        })
        .catch((e) => setError(e.message || 'Error cargando dueño'));
    }
    return () => { mounted = false; };
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // MapPicker -> actualiza coords y dirección (sin sobreescribir si ya hay texto)
  const handleMapChange = ({ lat, lng, address }) => {
    setForm((prev) => ({
      ...prev,
      latitud: lat,
      longitud: lng,
      direccion: prev.direccion?.trim() ? prev.direccion : (address || ''),
    }));
  };

  // === Validación en front alineada con la tabla y el validator del backend ===
  const validate = () => {
    const s = (v) => String(v ?? '').trim();

    // nombre: requerido 2..100
    if (!s(form.nombre)) return 'El nombre es obligatorio.';
    if (s(form.nombre).length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (s(form.nombre).length > 100) return 'El nombre no debe exceder 100 caracteres.';

    // telefono: opcional, máx 20, patrón permitido
    if (s(form.telefono)) {
      if (s(form.telefono).length > 20) return 'El teléfono no debe exceder 20 caracteres.';
      if (!/^[0-9+\-\s]*$/.test(s(form.telefono))) {
        return 'El teléfono solo puede contener dígitos, espacios, + y guiones.';
      }
    }

    // correo: opcional, si viene validar
    if (s(form.correo)) {
      // límite 100, formato email
      if (s(form.correo).length > 100) return 'El correo no debe exceder 100 caracteres.';
      // validación simple de email
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s(form.correo));
      if (!emailOk) return 'Correo inválido.';
    }

    // coordenadas: si viene una, debe venir la otra
    const latStr = s(form.latitud);
    const lonStr = s(form.longitud);
    const hasLat = latStr !== '';
    const hasLon = lonStr !== '';
    if (hasLat || hasLon) {
      if (!(hasLat && hasLon)) return 'Si envías coordenadas, latitud y longitud deben venir juntas.';
      const lat = Number(latStr);
      const lon = Number(lonStr);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) return 'La latitud debe estar entre -90 y 90.';
      if (!Number.isFinite(lon) || lon < -180 || lon > 180) return 'La longitud debe estar entre -180 y 180.';
    }

    return null;
  };

  // Construye payload normalizando '' -> null y números
  const buildPayload = () => {
    const t = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
    const payload = {
      nombre: t.nombre,
      telefono: t.telefono || null,
      direccion: t.direccion || null,
      correo: t.correo || null,
      latitud: t.latitud === '' ? null : Number(t.latitud),
      longitud: t.longitud === '' ? null : Number(t.longitud),
    };
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) { setError(v); return; }

    try {
      const payload = buildPayload();
      if (isEdit) await updateDueno(id, payload);
      else await createDueno(payload);
      navigate('/duenos');
    } catch (err) {
      setError(err.message || 'Error guardando dueño');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white via-white to-slate-50">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="inline-block h-5 w-5 rounded-md" style={{ backgroundColor: BRAND.yellow }} />
          <h2 className="text-2xl font-extrabold text-slate-900">
            {isEdit ? 'Editar Dueño' : 'Nuevo Dueño'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
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
              onChange={handleChange}
              required
              maxLength={100}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Teléfono */}
          <div className="grid gap-2">
            <label htmlFor="telefono" className="text-sm font-medium text-slate-900">Teléfono</label>
            <input
              id="telefono"
              name="telefono"
              placeholder="Ej: +591 700-12345"
              value={form.telefono}
              onChange={handleChange}
              maxLength={20}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
            <p className="text-xs text-slate-500">Se permiten dígitos, espacios, + y guiones (máx. 20).</p>
          </div>

          {/* Dirección */}
          <div className="grid gap-2">
            <label htmlFor="direccion" className="text-sm font-medium text-slate-900">Dirección</label>
            <input
              id="direccion"
              name="direccion"
              placeholder="Dirección / referencia"
              value={form.direccion}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Correo (opcional) */}
          <div className="grid gap-2">
            <label htmlFor="correo" className="text-sm font-medium text-slate-900">
              Correo
            </label>
            <input
              id="correo"
              type="email"
              name="correo"
              placeholder="correo@ejemplo.com"
              value={form.correo}
              onChange={handleChange}
              maxLength={100}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
              style={{ boxShadow: `0 0 0 0px ${BRAND.yellowRing}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 6px ${BRAND.yellowRing}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0px ${BRAND.yellowRing}`)}
            />
          </div>

          {/* Mapa + Lat/Lon */}
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
                <label htmlFor="latitud" className="text-xs font-medium text-slate-700">Latitud</label>
                <input
                  id="latitud"
                  name="latitud"
                  inputMode="decimal"
                  value={form.latitud ?? ''}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                  placeholder="-17.389500"
                />
              </div>
              <div>
                <label htmlFor="longitud" className="text-xs font-medium text-slate-700">Longitud</label>
                <input
                  id="longitud"
                  name="longitud"
                  inputMode="decimal"
                  value={form.longitud ?? ''}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                  placeholder="-66.156800"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Haz clic en el mapa, arrastra el marcador o busca una dirección.
              Si envías coordenadas, deben venir ambas (latitud y longitud).
            </p>
          </div>

          {/* Botones */}
          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/duenos')}
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
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DuenoForm;
