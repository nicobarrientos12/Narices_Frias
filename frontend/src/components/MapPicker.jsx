// src/components/MapPicker.jsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_CENTER = { lat: -17.3895, lng: -66.1568 }; // Cochabamba
const DEFAULT_ZOOM = 13;

// ===== Helpers de red =====
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastFetchAt = 0; // rate limiting simple
const MIN_INTERVAL_MS = 1200; // Nominatim ~1 req/s recomendado

async function limitedFetch(url, options) {
  const now = Date.now();
  const elapsed = now - lastFetchAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - elapsed);
  }
  lastFetchAt = Date.now();

  const res = await fetch(url, options);
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After')) || 2; // segundos
    await sleep((retryAfter + 0.5) * 1000);
    return limitedFetch(url, options); // reintento
  }
  return res;
}

// ===== Cache de reverse geocoding por coordenada redondeada =====
const addrCache = new Map(); // key: "lat,lng" redondeados

function cacheKey(lat, lng) {
  return `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
}

// -- util: pedir dirección a Nominatim con rate limit + cache
async function reverseGeocode(lat, lon) {
  const key = cacheKey(lat, lon);
  if (addrCache.has(key)) return addrCache.get(key);

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
  const res = await limitedFetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'NaricesFriasApp/1.0 (educational; contact@example.com)',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const value = data?.display_name || null;
  addrCache.set(key, value);
  return value;
}

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapPicker({
  lat,
  lng,
  onChange,          // <- onChange({ lat, lng, address })
  height = 280,
  rounded = '1rem',
}) {
  const [position, setPosition] = useState(
    lat && lng ? { lat: Number(lat), lng: Number(lng) } : DEFAULT_CENTER
  );
  const [hasCoord, setHasCoord] = useState(Boolean(lat && lng));
  const [query, setQuery] = useState('');
  const [loadingAddr, setLoadingAddr] = useState(false);
  const markerRef = useRef(null);

  useEffect(() => {
    if (lat && lng) {
      setPosition({ lat: Number(lat), lng: Number(lng) });
      setHasCoord(true);
    }
  }, [lat, lng]);

  const emitChange = useCallback(async (p, doReverse = true) => {
    setPosition(p);
    setHasCoord(true);
    let address = null;
    if (doReverse) {
      try {
        setLoadingAddr(true);
        address = await reverseGeocode(p.lat, p.lng);
      } catch {
        // silenciar
      } finally {
        setLoadingAddr(false);
      }
    }
    onChange?.({ lat: p.lat, lng: p.lng, address });
  }, [onChange]);

  const handlePick = (p) => emitChange(p, true);

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const p = marker.getLatLng();
      emitChange({ lat: p.lat, lng: p.lng }, true);
    }
  };

  const handleGeo = () => {
    if (!navigator.geolocation) return alert('Geolocalización no disponible');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        emitChange(p, true);
      },
      () => alert('No se pudo obtener tu ubicación'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // 🔎 Buscar dirección SIN <form>, con rate limit
  const doSearch = useCallback(async () => {
    const search = query.trim();
    if (!search) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        search
      )}&limit=1&addressdetails=1`;
      const res = await limitedFetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'NaricesFriasApp/1.0 (educational; contact@example.com)',
        },
      });
      if (!res.ok) throw new Error('Error Nominatim');
      const data = await res.json();
      if (data?.length) {
        const first = data[0];
        const p = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
        setPosition(p);
        setHasCoord(true);
        // del search ya tenemos display_name -> no hacemos reverse extra
        onChange?.({ lat: p.lat, lng: p.lng, address: first.display_name || null });
      } else {
        alert('No se encontró la dirección');
      }
    } catch {
      alert('Error buscando la dirección');
    }
  }, [query, onChange]);

  // Evita que Enter dispare el form padre
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
  };

  const icon = new L.Icon.Default();

  return (
    <div>
      {/* Buscador (sin <form>) */}
      <div role="search" className="mb-2 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Buscar una dirección…"
          aria-label="Buscar dirección"
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none"
        />
        <button
          type="button"
          onClick={doSearch}
          className="rounded-xl px-3 py-2 text-sm font-semibold"
          style={{ background: '#FFD200', color: '#111827' }}
          aria-label="Buscar dirección"
          title="Buscar"
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={handleGeo}
          className="rounded-xl px-3 py-2 text-sm font-semibold border"
          aria-label="Usar mi ubicación"
          title="Usar mi ubicación"
        >
          Mi ubicación
        </button>
      </div>

      {/* Mapa */}
      <div style={{ height, borderRadius: rounded, overflow: 'hidden' }}>
        <MapContainer center={position} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          {hasCoord && (
            <Marker
              position={position}
              icon={icon}
              draggable
              eventHandlers={{ dragend: handleDragEnd }}
              ref={markerRef}
            />
          )}
        </MapContainer>
      </div>

      {/* Coordenadas actuales */}
      <div className="mt-2 text-sm text-slate-600">
        Lat: <span className="font-mono">{position.lat.toFixed(6)}</span> · Lon{' '}
        <span className="font-mono">{position.lng.toFixed(6)}</span>
        {loadingAddr && <span className="ml-2 text-xs text-slate-400">(obteniendo dirección…)</span>}
      </div>
    </div>
  );
}
