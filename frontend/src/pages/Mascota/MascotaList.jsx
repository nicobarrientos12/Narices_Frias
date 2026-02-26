// src/pages/MascotaList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMascotas, deleteMascota } from "../../services/mascotaService";

// Paleta NAF
const COLORS = {
  primary: "#FFD400",
  ink: "#111827",
  inkSoft: "#374151",
  line: "#E5E7EB",
  bg: "#FFFFFF",
  chip: "#F9FAFB",
};

// Utils
function apiImage(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base =
    import.meta?.env?.VITE_API_BASE?.replace(/\/api\/?$/, "") ||
    import.meta?.env?.VITE_API_URL ||
    "http://localhost:3001";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}
function initials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("");
}
function formatAge(value) {
  if (!value && value !== 0) return "—";
  const s = String(value).trim();
  if (/\b(año|años|mes|meses|sem|semanas)\b/i.test(s)) return s;
  const n = Number(s);
  if (!isNaN(n)) return `${n} ${n === 1 ? "año" : "años"}`;
  return s;
}
function EstadoBadge({ value }) {
  const val = (value || "").toString().toLowerCase();
  let bg = "#F3F4F6", border = "#E5E7EB", text = COLORS.inkSoft, label = value || "—";
  if (["rescat", "ingreso", "en tránsito"].some(k => val.includes(k))) { bg="#EFF6FF"; border="#BFDBFE"; text="#1E3A8A"; }
  if (["adopt", "alta"].some(k => val.includes(k))) { bg="#ECFDF5"; border="#A7F3D0"; text="#065F46"; }
  if (["observ", "trat", "crítico"].some(k => val.includes(k))) { bg="#FFFBEB"; border="#FDE68A"; text="#92400E"; }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{ backgroundColor: bg, color: text, borderColor: border }}>
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: text }} />
      {label}
    </span>
  );
}
function GeneroChip({ genero }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold"
      style={{
        backgroundColor: COLORS.chip,
        border: `1px solid ${COLORS.line}`,
        color: "#1F2937"
      }}>
      {genero || "—"}
    </span>
  );
}

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

export default function MascotaList() {
  const [mascotas, setMascotas] = useState([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchMascotas(); // service debe devolver array ya parseado
      setMascotas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando mascotas:', e);
      setMascotas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar a "${nombre}"?`)) return;
    try {
      await deleteMascota(id);
      load();
    } catch (e) {
      console.error('Error al eliminar:', e);
    }
  };

  // Búsqueda
  const filteredMascotas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mascotas;
    return mascotas.filter(m =>
      (m.nombre || "").toLowerCase().includes(q) ||
      (m.estado_llegada || "").toLowerCase().includes(q) ||
      (m.caracteristicas || "").toLowerCase().includes(q)
    );
  }, [mascotas, search]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredMascotas.length / limit));
  const paginatedMascotas = filteredMascotas.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [totalPages, currentPage]);

  return (
    <div className="p-6"
         style={{ fontFamily: '"Plus Jakarta Sans","Inter","Noto Sans",system-ui,sans-serif', backgroundColor: "#FAFAFA" }}>
      {/* Brand bar */}
      <div className="mb-5 rounded-2xl px-4 py-3 flex items-center justify-between"
           style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.line}` }}>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ backgroundColor: COLORS.primary }} aria-hidden title="Narices Frías">
            <span className="font-extrabold" style={{ color: COLORS.ink }}>naf</span>
          </span>
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: COLORS.ink }}>Mascotas</h2>
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>Registro general del refugio</p>
          </div>
        </div>

        <Link to="/mascotas/nueva"
              className="inline-flex items-center gap-2 font-semibold rounded-xl px-4 py-2 transition"
              style={{ backgroundColor: COLORS.primary, color: COLORS.ink }}>
          <IconPlus /> Nueva
        </Link>
      </div>

      {/* Buscador + tamaño de página */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3" style={{ color: COLORS.ink }}>
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre, estado o características…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring"
            style={{ borderColor: COLORS.line, backgroundColor: COLORS.bg, boxShadow: "0 1px 0 rgba(17,24,39,0.02)" }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg"
                style={{ background: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.inkSoft }}>
            {filteredMascotas.length} resultado(s)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[5, 10, 25, 50, 100].map((num) => {
            const active = limit === num;
            return (
              <button key={num} onClick={() => { setLimit(num); setCurrentPage(1); }}
                      className="px-3 py-1.5 rounded-full text-sm font-semibold transition"
                      style={active
                        ? { backgroundColor: COLORS.primary, color: COLORS.ink }
                        : { backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}>
                {num} / pág
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla (desktop) */}
      <div className="overflow-x-auto rounded-2xl"
           style={{ border: `1px solid ${COLORS.line}`, backgroundColor: COLORS.bg }}>
        <table className="w-full hidden md:table">
          <thead style={{ background: "#FFFDF0" }}>
            <tr className="text-left text-sm font-semibold" style={{ color: COLORS.inkSoft }}>
              <th className="p-3 border-b w-20" style={{ borderColor: COLORS.line }}>Foto</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Nombre</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Género</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Estado llegada</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Edad</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Características</th>
              <th className="p-3 border-b text-center" style={{ borderColor: COLORS.line }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>Cargando mascotas…</td></tr>
            ) : paginatedMascotas.length ? (
              paginatedMascotas.map((m) => {
                const src = apiImage(m.foto_url);
                return (
                  <tr key={m.id} className="align-middle text-sm transition hover:bg-[#FFFCF2]" style={{ color: COLORS.ink }}>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                      {src ? (
                        <img src={src} alt={m.nombre}
                             className="h-12 w-12 object-cover rounded-xl mx-auto" />
                      ) : (
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center font-bold mx-auto"
                             style={{ backgroundColor: COLORS.chip, border: `1px solid ${COLORS.line}` }}>
                          {initials(m.nombre)}
                        </div>
                      )}
                    </td>
                    <td className="p-3 border-t font-semibold" style={{ borderColor: COLORS.line }}>
                      {m?.nombre || "—"}
                    </td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                      <GeneroChip genero={m?.genero} />
                    </td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                      <EstadoBadge value={m?.estado_llegada} />
                    </td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line, color: COLORS.inkSoft }}>
                      {formatAge(m?.edad)}
                    </td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                      <p className="text-[13px] leading-5 line-clamp-2" style={{ color: COLORS.inkSoft }}>
                        {m?.caracteristicas || "—"}
                      </p>
                    </td>
                    <td className="p-3 border-t text-center" style={{ borderColor: COLORS.line }}>
                      <div className="inline-flex gap-1.5">
                        <Link to={`/mascotas/editar/${m.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                              style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                              title="Editar">
                          <IconEdit /> Editar
                        </Link>
                        <button onClick={() => handleDelete(m.id, m.nombre)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                                style={{ backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}
                                title="Eliminar">
                          <IconTrash /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-10 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                    <span className="text-2xl" aria-hidden>♡</span>
                  </div>
                  <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron mascotas</div>
                  <div className="text-sm" style={{ color: COLORS.inkSoft }}>Crea una nueva para empezar.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Cards (mobile) */}
        <div className="md:hidden divide-y" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {loading ? (
            <div className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>Cargando mascotas…</div>
          ) : paginatedMascotas.length ? (
            paginatedMascotas.map((m) => {
              const src = apiImage(m.foto_url);
              return (
                <div key={m.id} className="p-4">
                  <div className="flex items-center gap-3">
                    {src ? (
                      <img src={src} alt={m.nombre}
                           className="h-12 w-12 object-cover rounded-xl" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center font-bold"
                           style={{ backgroundColor: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.ink }}>
                        {initials(m.nombre)}
                      </div>
                    )}
                    <div>
                      <div className="text-base font-bold" style={{ color: COLORS.ink }}>
                        {m?.nombre || "—"}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <GeneroChip genero={m?.genero} />
                        <EstadoBadge value={m?.estado_llegada} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[13px]" style={{ color: COLORS.inkSoft }}>Edad</span>
                      <span style={{ color: COLORS.inkSoft }}>{formatAge(m?.edad)}</span>
                    </div>
                    {m?.caracteristicas && (
                      <div className="text-[13px]" style={{ color: COLORS.inkSoft }}>
                        {m.caracteristicas}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link to={`/mascotas/editar/${m.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                          style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}>
                      <IconEdit /> Editar
                    </Link>
                    <button onClick={() => handleDelete(m.id, m.nombre)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                            style={{ backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}>
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
              <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron mascotas</div>
              <div className="text-sm" style={{ color: COLORS.inkSoft }}>Crea una nueva para empezar.</div>
            </div>
          )}
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5 flex-wrap">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
                  style={{ backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}>
            « Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const active = page === currentPage;
            return (
              <button key={page} onClick={() => setCurrentPage(page)}
                      className="px-3 py-1.5 rounded-xl font-semibold"
                      style={active
                        ? { backgroundColor: COLORS.primary, color: COLORS.ink }
                        : { backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}>
                {page}
              </button>
            );
          })}

          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
                  style={{ backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}>
            Siguiente »
          </button>
        </div>
      )}
    </div>
  );
}
