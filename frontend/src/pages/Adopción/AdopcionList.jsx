// src/pages/Adopcion/AdopcionList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdopciones, deleteAdopcion } from "../../services/adopcionService";

/**
 * Paleta tomada del logo NAF:
 * - Primario: Amarillo cálido
 * - Oscuro: casi negro para texto
 * - Neutros: grises suaves
 */
const COLORS = {
  primary: "#FFD400",
  primaryDark: "#E6C000",
  ink: "#111827",
  inkSoft: "#374151",
  line: "#E5E7EB",
  bg: "#FFFFFF",
  chip: "#F9FAFB",
};

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d)) return "—";
  const date = new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${date.replace(".", "")} · ${time}`;
}

function EstadoBadge({ value }) {
  const val = (value || "").toString().toLowerCase();

  let bg = "#F3F4F6"; // gris claro
  let border = "#E5E7EB";
  let text = COLORS.inkSoft;

  if (["aprobada", "aprobado", "completada", "completado", "entregada", "entregado"].some(s => val.includes(s))) {
    bg = "#ECFDF5"; border = "#A7F3D0"; text = "#065F46"; // verde
  } else if (["pendiente", "proceso", "revisión", "revision"].some(s => val.includes(s))) {
    bg = "#FFFBEB"; border = "#FDE68A"; text = "#92400E"; // ámbar
  } else if (["rechazada", "cancelada", "cancelado"].some(s => val.includes(s))) {
    bg = "#FEF2F2"; border = "#FECACA"; text = "#991B1B"; // rojo
  } else if (val) {
    bg = "#FFFBE6"; border = "#FFE58F"; text = "#7A5E00";
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{ backgroundColor: bg, color: text, borderColor: border }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: text }} />
      {value || "—"}
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
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0L14.13 4.7l3.75 3.75 2.83-1.41z"/>
  </svg>
);

const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden {...props}>
    <path d="M9 3a1 1 0 0 0-1 1v1H4a1 1 0 1 0 0 2h1v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7h1a1 1 0 1 0 0-2h-4V4a1 1 0 0 0-1-1H9zm2 2h2v1h-2V5zM8 7h8v12H8V7zm2 2a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0V10a1 1 0 0 0-1-1zm4 0a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0V10a1 1 0 0 0-1-1z"/>
  </svg>
);

export default function AdopcionList() {
  const [adopciones, setAdopciones] = useState([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      // ⬇️ nuestro service devuelve el JSON directo (no { data })
      const lista = await fetchAdopciones();
      setAdopciones(lista || []);
    } catch (err) {
      console.error("Error al cargar adopciones:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombreMascota) => {
    if (confirm(`¿Eliminar la adopción de "${nombreMascota}"?`)) {
      await deleteAdopcion(id);
      load();
    }
  };

  const filteredAdopciones = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return adopciones;
    return adopciones.filter(
      (a) =>
        (a.nombre_mascota || "").toLowerCase().includes(q) ||
        (a.nombre_dueno || "").toLowerCase().includes(q)
    );
  }, [adopciones, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAdopciones.length / limit));
  const paginatedAdopciones = filteredAdopciones.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages]); // eslint-disable-line

  return (
    <div
      className="p-6"
      style={{ fontFamily: '"Plus Jakarta Sans", "Inter", "Noto Sans", system-ui, sans-serif', backgroundColor: "#FAFAFA" }}
    >
      {/* Brand bar */}
      <div
        className="mb-5 rounded-2xl px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.line}` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ backgroundColor: COLORS.primary }}
            aria-hidden
            title="Narices Frías"
          >
            <span className="font-extrabold" style={{ color: COLORS.ink }}>
              naf
            </span>
          </span>
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: COLORS.ink }}>Adopciones</h2>
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>
              Registros del refugio — Narices Frías
            </p>
          </div>
        </div>

        <Link
          to="/adopciones/nueva"
          className="inline-flex items-center gap-2 font-semibold rounded-xl px-4 py-2 transition"
          style={{ backgroundColor: COLORS.primary, color: COLORS.ink }}
        >
          <IconPlus />
          Nueva adopción
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3" style={{ color: COLORS.ink }}>
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Buscar por mascota o persona adoptante…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring"
            style={{ borderColor: COLORS.line, backgroundColor: COLORS.bg, boxShadow: "0 1px 0 rgba(17,24,39,0.02)" }}
          />
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg"
            style={{ background: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.inkSoft }}
          >
            {filteredAdopciones.length} resultado(s)
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
                style={
                  active
                    ? { backgroundColor: COLORS.primary, color: COLORS.ink }
                    : { backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }
                }
              >
                {num} / pág
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla / Cards */}
      <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${COLORS.line}`, backgroundColor: COLORS.bg }}>
        {/* Tabla para ≥ md */}
        <table className="w-full hidden md:table">
          <thead style={{ background: "#FFFDF0" }}>
            <tr className="text-left text-sm font-semibold" style={{ color: COLORS.inkSoft }}>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Mascota</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Adoptante</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Fecha de solicitud</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Fecha de aprobación</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Estado</th>
              <th className="p-3 border-b text-center" style={{ borderColor: COLORS.line }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>Cargando adopciones…</td></tr>
            ) : paginatedAdopciones.length ? (
              paginatedAdopciones.map((a) => (
                <tr key={a.id} className="align-middle text-sm transition hover:bg-[#FFFCF2]" style={{ color: COLORS.ink }}>
                  <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                    <div className="font-semibold">{a.nombre_mascota || "—"}</div>
                    {a.raza || a.especie ? (
                      <div className="text-xs" style={{ color: COLORS.inkSoft }}>
                        {[a.especie, a.raza].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                    <div className="font-medium">{a.nombre_dueno || "—"}</div>
                    {a.telefono_dueno ? <div className="text-xs" style={{ color: COLORS.inkSoft }}>{a.telefono_dueno}</div> : null}
                  </td>
                  <td className="p-3 border-t" style={{ borderColor: COLORS.line, color: COLORS.inkSoft }}>
                    {formatDateTime(a.fecha_solicitud)}
                  </td>
                  <td className="p-3 border-t" style={{ borderColor: COLORS.line, color: COLORS.inkSoft }}>
                    {formatDateTime(a.fecha_aprobacion)}
                  </td>
                  <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                    <EstadoBadge value={a.estado_llegada} />
                  </td>
                  <td className="p-3 border-t text-center" style={{ borderColor: COLORS.line }}>
                    <div className="inline-flex gap-1.5">
                      <Link
                        to={`/adopciones/editar/${a.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                        style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                        title="Editar"
                      >
                        <IconEdit /> Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(a.id, a.nombre_mascota)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                        style={{ backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}
                        title="Eliminar"
                      >
                        <IconTrash /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-10 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                    <span className="text-2xl" aria-hidden>♡</span>
                  </div>
                  <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron adopciones</div>
                  <div className="text-sm" style={{ color: COLORS.inkSoft }}>Prueba cambiar la búsqueda o crea una nueva adopción.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Cards para < md */}
        <div className="md:hidden divide-y" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {loading ? (
            <div className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>Cargando adopciones…</div>
          ) : paginatedAdopciones.length ? (
            paginatedAdopciones.map((a) => (
              <div key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold" style={{ color: COLORS.ink }}>{a.nombre_mascota || "—"}</div>
                    <div className="text-sm" style={{ color: COLORS.inkSoft }}>
                      Adoptante: <span className="font-medium" style={{ color: COLORS.ink }}>{a.nombre_dueno || "—"}</span>
                    </div>
                  </div>
                  <EstadoBadge value={a.estado_llegada} />
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[13px]" style={{ color: COLORS.inkSoft }}>Solicitud</span>
                    <span style={{ color: COLORS.inkSoft }}>{formatDateTime(a.fecha_solicitud)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[13px]" style={{ color: COLORS.inkSoft }}>Aprobación</span>
                    <span style={{ color: COLORS.inkSoft }}>{formatDateTime(a.fecha_aprobacion)}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/adopciones/editar/${a.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                    style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                  >
                    <IconEdit /> Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(a.id, a.nombre_mascota)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                    style={{ backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}
                  >
                    <IconTrash /> Eliminar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                <span className="text-2xl" aria-hidden>♡</span>
              </div>
              <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron adopciones</div>
              <div className="text-sm" style={{ color: COLORS.inkSoft }}>Prueba cambiar la búsqueda o crea una nueva adopción.</div>
            </div>
          )}
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
            style={{ backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}
          >
            « Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const active = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className="px-3 py-1.5 rounded-xl font-semibold"
                style={
                  active
                    ? { backgroundColor: COLORS.primary, color: COLORS.ink }
                    : { backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }
                }
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
            style={{ backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}
          >
            Siguiente »
          </button>
        </div>
      )}
    </div>
  );
}
