import React, { useEffect, useMemo, useState } from "react";
import { fetchDuenos, deleteDueno } from "../../services/duenoService";
import { Link, useNavigate } from "react-router-dom";

const COLORS = {
  primary: "#FFD400",
  ink: "#111827",
  inkSoft: "#374151",
  line: "#E5E7EB",
  bg: "#FFFFFF",
  chip: "#F9FAFB",
};

const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden {...props}>
    <path d="M11 11V5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6z" />
  </svg>
);
const IconEdit = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden {...props}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0L14.13 4.7l3.75 3.75 2.83-1.41z"/>
  </svg>
);
const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden {...props}>
    <path d="M9 3a1 1 0 0 0-1 1v1H4a1 1 0 1 0 0 2h1v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7h1a1 1 0 1 0 0-2h-4V4a1 1 0 0 0-1-1H9zm2 2h2v1h-2V5zM8 7h8v12H8V7zm2 2a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0V10a1 1 0 0 0-1-1zm4 0a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0V10a1 1 0 0 0-1-1z"/>
  </svg>
);

function initiales(nombre = "") {
  const parts = nombre.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("");
}

// Helpers: enlaces a Google Maps (prioriza coords; si no hay, usa dirección)
const gmapsLink = (lat, lon, addr) => {
  if (lat != null && lon != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  }
  if (addr) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  }
  return null;
};

export default function DuenoList() {
  const [duenos, setDuenos] = useState([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadDuenos(); }, []);

  const loadDuenos = async () => {
    try {
      setLoading(true);
      const data = await fetchDuenos();
      setDuenos(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (confirm(`¿Eliminar a "${nombre}"?`)) {
      await deleteDueno(id);
      loadDuenos();
    }
  };

  const filteredDuenos = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return duenos;
    return duenos.filter((d) =>
      (d.nombre || "").toLowerCase().includes(q) ||
      (d.telefono || "").toLowerCase().includes(q) ||
      (d.correo || "").toLowerCase().includes(q) ||
      (d.direccion || "").toLowerCase().includes(q)
    );
  }, [duenos, search]);

  const totalPages = Math.max(1, Math.ceil(filteredDuenos.length / limit));
  const paginatedDuenos = filteredDuenos.slice((currentPage - 1) * limit, currentPage * limit);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [totalPages]);

  return (
    <div className="p-6" style={{ fontFamily: '"Plus Jakarta Sans","Inter","Noto Sans",system-ui,sans-serif', backgroundColor: "#FAFAFA" }}>
      {/* Brand bar */}
      <div className="mb-5 rounded-2xl px-4 py-3 flex items-center justify-between" style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.line}` }}>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl" style={{ backgroundColor: COLORS.primary }} aria-hidden title="Narices Frías">
            <span className="font-extrabold" style={{ color: COLORS.ink }}>naf</span>
          </span>
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: COLORS.ink }}>Gestión de dueños</h2>
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>Contactos de adoptantes y tutores</p>
          </div>
        </div>

        <Link to="/duenos/new" className="inline-flex items-center gap-2 font-semibold rounded-xl px-4 py-2 transition" style={{ backgroundColor: COLORS.primary, color: COLORS.ink }}>
          <IconPlus /> Nuevo dueño
        </Link>
      </div>

      {/* Buscador + tamaño de página */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3" style={{ color: COLORS.ink }}>
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, correo o dirección…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring"
            style={{ borderColor: COLORS.line, backgroundColor: COLORS.bg, boxShadow: "0 1px 0 rgba(17,24,39,0.02)" }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg" style={{ background: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.inkSoft }}>
            {filteredDuenos.length} resultado(s)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[5, 10, 25, 50, 100].map((num) => {
            const active = limit === num;
            return (
              <button
                key={num}
                onClick={() => { setLimit(num); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-full text-sm font-semibold transition"
                style={active
                  ? { backgroundColor: COLORS.primary, color: COLORS.ink }
                  : { backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}
              >
                {num} / pág
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla (desktop) */}
      <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${COLORS.line}`, backgroundColor: COLORS.bg }}>
        <table className="w-full hidden md:table">
          <thead style={{ background: "#FFFDF0" }}>
            <tr className="text-left text-sm font-semibold" style={{ color: COLORS.inkSoft }}>
              <th className="px-3 py-3 border-b" style={{ borderColor: COLORS.line }}>Dueño</th>
              <th className="px-3 py-3 border-b" style={{ borderColor: COLORS.line }}>Teléfono</th>
              <th className="px-3 py-3 border-b" style={{ borderColor: COLORS.line }}>Correo</th>
              <th className="px-3 py-3 border-b" style={{ borderColor: COLORS.line }}>Ubicación</th>
              <th className="px-3 py-3 border-b text-center" style={{ borderColor: COLORS.line }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>
                  Cargando dueños…
                </td>
              </tr>
            ) : paginatedDuenos.length ? (
              paginatedDuenos.map((d) => {
                const link = gmapsLink(d.latitud, d.longitud, d.direccion);
                return (
                  <tr key={d.id} className="align-middle text-sm transition hover:bg-[#FFFCF2]" style={{ color: COLORS.ink }}>
                    <td className="px-3 py-3 border-t" style={{ borderColor: COLORS.line }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
                             style={{ backgroundColor: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.ink }}>
                          {initiales(d.nombre)}
                        </div>
                        <div>
                          <div className="font-semibold">{d?.nombre || "—"}</div>
                          {d?.direccion ? <div className="text-xs" style={{ color: COLORS.inkSoft }}>{d.direccion}</div> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 border-t" style={{ borderColor: COLORS.line }}>
                      {d?.telefono ? <a href={`tel:${d.telefono}`} className="font-medium" style={{ color: COLORS.ink }}>{d.telefono}</a> : "—"}
                    </td>
                    <td className="px-3 py-3 border-t" style={{ borderColor: COLORS.line }}>
                      {d?.correo ? <a href={`mailto:${d.correo}`} className="font-medium" style={{ color: COLORS.ink }}>{d.correo}</a> : "—"}
                    </td>
                    <td className="px-3 py-3 border-t" style={{ borderColor: COLORS.line }}>
                      {(d?.latitud != null && d?.longitud != null) || d?.direccion ? (
                        <div className="flex items-center gap-2">
                          {d?.latitud != null && d?.longitud != null && (
                            <span className="text-xs font-mono text-slate-600">
                              {Number(d.latitud).toFixed(5)}, {Number(d.longitud).toFixed(5)}
                            </span>
                          )}
                          {link && (
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold"
                              style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                              title="Abrir en Google Maps"
                            >
                              Google Maps
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 border-t text-center" style={{ borderColor: COLORS.line }}>
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => navigate(`/duenos/edit/${d.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                          style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                          title="Editar"
                        >
                          <IconEdit /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.nombre)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                          style={{ backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}
                          title="Eliminar"
                        >
                          <IconTrash /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="p-10 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                    <span className="text-2xl" aria-hidden>♡</span>
                  </div>
                  <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron dueños</div>
                  <div className="text-sm" style={{ color: COLORS.inkSoft }}>Crea uno nuevo para empezar.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Cards (mobile) */}
        <div className="md:hidden divide-y" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {loading ? (
            <div className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>Cargando dueños…</div>
          ) : paginatedDuenos.length ? (
            paginatedDuenos.map((d) => {
              const link = gmapsLink(d.latitud, d.longitud, d.direccion);
              return (
                <div key={d.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                         style={{ backgroundColor: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.ink }}>
                      {initiales(d.nombre)}
                    </div>
                    <div>
                      <div className="text-base font-bold" style={{ color: COLORS.ink }}>
                        {d?.nombre || "—"}
                      </div>
                      {d?.direccion && <div className="text-sm" style={{ color: COLORS.inkSoft }}>{d.direccion}</div>}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[13px]" style={{ color: COLORS.inkSoft }}>Teléfono</span>
                      <span>{d?.telefono ? <a href={`tel:${d.telefono}`} style={{ color: COLORS.ink }}>{d.telefono}</a> : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[13px]" style={{ color: COLORS.inkSoft }}>Correo</span>
                      <span className="text-right">{d?.correo ? <a href={`mailto:${d.correo}`} style={{ color: COLORS.ink }}>{d.correo}</a> : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[13px]" style={{ color: COLORS.inkSoft }}>Ubicación</span>
                      <span className="text-right">
                        {(d?.latitud != null && d?.longitud != null) || d?.direccion ? (
                          <>
                            {d?.latitud != null && d?.longitud != null && (
                              <span className="font-mono">
                                {Number(d.latitud).toFixed(4)}, {Number(d.longitud).toFixed(4)}
                              </span>
                            )}{' '}
                            {link && <a href={link} target="_blank" rel="noreferrer noopener" className="underline">Google Maps</a>}
                          </>
                        ) : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => navigate(`/duenos/edit/${d.id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                      style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                    >
                      <IconEdit /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(d.id, d.nombre)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                      style={{ backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}
                    >
                      <IconTrash /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                <span className="text-2xl" aria-hidden>♡</span>
              </div>
              <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron dueños</div>
              <div className="text-sm" style={{ color: COLORS.inkSoft }}>Crea uno nuevo para empezar.</div>
            </div>
          )}
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5 flex-wrap">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
                  style={{ backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}>
            « Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const active = page === currentPage;
            return (
              <button key={page} onClick={() => setCurrentPage(page)} className="px-3 py-1.5 rounded-xl font-semibold"
                      style={active
                        ? { backgroundColor: COLORS.primary, color: COLORS.ink }
                        : { backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}>
                {page}
              </button>
            );
          })}

          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
                  style={{ backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}>
            Siguiente »
          </button>
        </div>
      )}
    </div>
  );
}
