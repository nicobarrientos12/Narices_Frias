// src/pages/EnfermedadList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllEnfermedades, eliminarEnfermedad } from "../../services/enfermedadService";

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

export default function EnfermedadList() {
  const [enfermedades, setEnfermedades] = useState([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const cargarEnfermedades = async () => {
    try {
      setLoading(true);
      const data = await getAllEnfermedades();
      setEnfermedades(data || []);
    } catch (err) {
      console.error("Error al cargar enfermedades:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarEnfermedades(); }, []);

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar la enfermedad "${nombre}"?`)) return;
    try {
      await eliminarEnfermedad(id);
      cargarEnfermedades();
    } catch (err) {
      console.error("Error al eliminar enfermedad:", err);
    }
  };

  // Filtrado con memo
  const filteredEnfermedades = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enfermedades;
    return enfermedades.filter(
      (e) =>
        (e.nombre || "").toLowerCase().includes(q) ||
        (e.descripcion || "").toLowerCase().includes(q)
    );
  }, [enfermedades, search]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredEnfermedades.length / limit));
  const paginatedEnfermedades = filteredEnfermedades.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [totalPages]);

  return (
    <div
      className="p-6"
      style={{ fontFamily: '"Plus Jakarta Sans","Inter","Noto Sans",system-ui,sans-serif', backgroundColor: "#FAFAFA" }}
    >
      {/* Brand bar */}
      <div
        className="mb-5 rounded-2xl px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.line}` }}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ backgroundColor: COLORS.primary }} aria-hidden title="Narices Frías">
            <span className="font-extrabold" style={{ color: COLORS.ink }}>naf</span>
          </span>
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: COLORS.ink }}>Enfermedades</h2>
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>Catálogo de condiciones registradas</p>
          </div>
        </div>

        <Link
          to="/enfermedades/nueva"
          className="inline-flex items-center gap-2 font-semibold rounded-xl px-4 py-2 transition"
          style={{ backgroundColor: COLORS.primary, color: COLORS.ink }}
        >
          <IconPlus /> Nueva enfermedad
        </Link>
      </div>

      {/* Buscador + tamaño de página */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3" style={{ color: COLORS.ink }}>
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre o descripción…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring"
            style={{ borderColor: COLORS.line, backgroundColor: COLORS.bg, boxShadow: "0 1px 0 rgba(17,24,39,0.02)" }}
          />
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg"
            style={{ background: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.inkSoft }}
          >
            {filteredEnfermedades.length} resultado(s)
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

      {/* Tabla (desktop) */}
      <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${COLORS.line}`, backgroundColor: COLORS.bg }}>
        <table className="w-full hidden md:table">
          <thead style={{ background: "#FFFDF0" }}>
            <tr className="text-left text-sm font-semibold" style={{ color: COLORS.inkSoft }}>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Nombre</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Descripción</th>
              <th className="p-3 border-b text-center" style={{ borderColor: COLORS.line }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>
                  Cargando enfermedades…
                </td>
              </tr>
            ) : paginatedEnfermedades.length ? (
              paginatedEnfermedades.map((e) => (
                <tr key={e.id} className="align-middle text-sm transition hover:bg-[#FFFCF2]" style={{ color: COLORS.ink }}>
                  <td className="p-3 border-t font-semibold" style={{ borderColor: COLORS.line }}>
                    {e?.nombre || "—"}
                  </td>
                  <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                    <div className="relative group">
                      <p className="text-[13px] leading-5 line-clamp-2" style={{ color: COLORS.inkSoft }}>
                        {e?.descripcion || "—"}
                      </p>
                      {e?.descripcion && e.descripcion.length > 120 && (
                        <span className="absolute opacity-0 group-hover:opacity-100 transition text-xs mt-1 block" style={{ color: COLORS.inkSoft }}>
                          {e.descripcion}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 border-t text-center" style={{ borderColor: COLORS.line }}>
                    <div className="inline-flex gap-1.5">
                      <button
                        onClick={() => navigate(`/enfermedades/editar/${e.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                        style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                        title="Editar"
                      >
                        <IconEdit /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(e.id, e.nombre)}
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
                <td colSpan="3" className="p-10 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                    <span className="text-2xl" aria-hidden>♡</span>
                  </div>
                  <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron enfermedades</div>
                  <div className="text-sm" style={{ color: COLORS.inkSoft }}>Crea una nueva para empezar.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Cards (mobile) */}
        <div className="md:hidden divide-y" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {loading ? (
            <div className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>Cargando enfermedades…</div>
          ) : paginatedEnfermedades.length ? (
            paginatedEnfermedades.map((e) => (
              <div key={e.id} className="p-4">
                <div className="text-base font-bold" style={{ color: COLORS.ink }}>
                  {e?.nombre || "—"}
                </div>
                {e?.descripcion && (
                  <div className="mt-1 text-sm" style={{ color: COLORS.inkSoft }}>
                    {e.descripcion}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/enfermedades/editar/${e.id}`)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                    style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                  >
                    <IconEdit /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(e.id, e.nombre)}
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
              <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron enfermedades</div>
              <div className="text-sm" style={{ color: COLORS.inkSoft }}>Crea una nueva para empezar.</div>
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
