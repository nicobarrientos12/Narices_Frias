// src/pages/MascotaAlergia/MascotaAlergiaList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getAllMascotaAlergias,
  eliminarMascotaAlergia,
} from "../../services/mascotaAlergiaService";

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

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d)) return "-";
  const date = new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  return date.replace(".", "");
}

export default function MascotaAlergiaList() {
  const [relaciones, setRelaciones] = useState([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState({});
  const navigate = useNavigate();

  const cargarRelaciones = async () => {
    try {
      setLoading(true);
      const data = await getAllMascotaAlergias();
      setRelaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar relaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarRelaciones(); }, []);

  const handleDelete = async (id, mascota, alergia) => {
    if (!window.confirm(`Eliminar la relacion "${mascota} - ${alergia}"?`)) return;
    try {
      await eliminarMascotaAlergia(id);
      cargarRelaciones();
    } catch (err) {
      console.error("Error al eliminar relacion:", err);
    }
  };

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const groupedRelaciones = useMemo(() => {
    const map = new Map();
    for (const r of relaciones) {
      const key = r.mascota_id ?? r.mascota ?? r.id;
      if (!map.has(key)) {
        map.set(key, {
          key,
          mascota: r.mascota || '-',
          items: [],
        });
      }
      map.get(key).items.push({
        id: r.id,
        alergia: r.alergia || '-',
        fecha_creacion: r.fecha_creacion || null,
        observaciones: r.observaciones || '',
      });
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.mascota || '').localeCompare(b.mascota || '', 'es')
    );
  }, [relaciones]);

  const buildDescripcion = (group) => {
    return group.items.map((it) => {
      const parts = [];
      if (it.fecha_creacion) parts.push(`fecha: ${formatDate(it.fecha_creacion)}`);
      if (it.observaciones) parts.push(`obs: ${it.observaciones}`);
      return parts.length ? `${it.alergia} (${parts.join(', ')})` : `${it.alergia}`;
    }).join(' | ');
  };

  const filteredRelaciones = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupedRelaciones;
    return groupedRelaciones.filter((g) =>
      (g.mascota || '').toLowerCase().includes(q) ||
      buildDescripcion(g).toLowerCase().includes(q)
    );
  }, [groupedRelaciones, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRelaciones.length / limit));
  const paginatedRelaciones = filteredRelaciones.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [totalPages]);

  return (
    <div
      className="p-6"
      style={{ fontFamily: '"Plus Jakarta Sans","Inter","Noto Sans",system-ui,sans-serif', backgroundColor: "#FAFAFA" }}
    >
      <div
        className="mb-5 rounded-2xl px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.line}` }}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ backgroundColor: COLORS.primary }} aria-hidden title="Narices Frias">
            <span className="font-extrabold" style={{ color: COLORS.ink }}>naf</span>
          </span>
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: COLORS.ink }}>Alergias de mascotas</h2>
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>Relaciones mascota - alergia</p>
          </div>
        </div>

        <Link
          to="/mascota-alergia/nueva"
          className="inline-flex items-center gap-2 font-semibold rounded-xl px-4 py-2 transition"
          style={{ backgroundColor: COLORS.primary, color: COLORS.ink }}
        >
          <IconPlus /> Nueva relacion
        </Link>
      </div>

      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3" style={{ color: COLORS.ink }}>
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Buscar por mascota, alergia u observaciones..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring"
            style={{ borderColor: COLORS.line, backgroundColor: COLORS.bg, boxShadow: "0 1px 0 rgba(17,24,39,0.02)" }}
          />
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg"
            style={{ background: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.inkSoft }}
          >
            {filteredRelaciones.length} resultado(s)
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
                {num} / pag
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${COLORS.line}`, backgroundColor: COLORS.bg }}>
        <table className="w-full hidden md:table">
          <thead style={{ background: "#FFFDF0" }}>
            <tr className="text-left text-sm font-semibold" style={{ color: COLORS.inkSoft }}>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Mascota</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Alergias</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Historial</th>
              <th className="p-3 border-b text-center" style={{ borderColor: COLORS.line }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>
                  Cargando relaciones...
                </td>
              </tr>
            ) : paginatedRelaciones.length ? (
              paginatedRelaciones.map((g) => (
                <React.Fragment key={g.key}>
                  <tr className="align-middle text-sm transition hover:bg-[#FFFCF2]" style={{ color: COLORS.ink }}>
                    <td className="p-3 border-t font-semibold" style={{ borderColor: COLORS.line }}>
                      {g?.mascota || "-"}
                    </td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                      {g.items.length}
                    </td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                      {buildDescripcion(g) || "-"}
                    </td>
                    <td className="p-3 border-t text-center" style={{ borderColor: COLORS.line }}>
                      <button
                        onClick={() => toggleGroup(g.key)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                        style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                      >
                        {openGroups[g.key] ? 'Ocultar' : 'Ver detalle'}
                      </button>
                    </td>
                  </tr>
                  {openGroups[g.key] && (
                    <tr>
                      <td colSpan="4" className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                        <div className="grid gap-2">
                          {g.items.map((it) => (
                            <div key={it.id} className="flex items-center gap-3 flex-wrap">
                              <div className="font-semibold">{it.alergia}</div>
                              <div className="text-xs" style={{ color: COLORS.inkSoft }}>
                                {it.fecha_creacion ? `Fecha: ${formatDate(it.fecha_creacion)}` : 'Fecha: -'}
                              </div>
                              {it.observaciones && (
                                <div className="text-xs" style={{ color: COLORS.inkSoft }}>
                                  Obs: {it.observaciones}
                                </div>
                              )}
                              <div className="ml-auto inline-flex gap-1.5">
                                <button
                                  onClick={() => navigate(`/mascota-alergia/editar/${it.id}`)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                                  style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                                  title="Editar"
                                >
                                  <IconEdit /> Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(it.id, g.mascota, it.alergia)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                                  style={{ backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}
                                  title="Eliminar"
                                >
                                  <IconTrash /> Eliminar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-10 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                    <span className="text-2xl" aria-hidden>?</span>
                  </div>
                  <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron relaciones</div>
                  <div className="text-sm" style={{ color: COLORS.inkSoft }}>Crea una nueva para empezar.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="md:hidden divide-y" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {loading ? (
            <div className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>Cargando relaciones...</div>
          ) : paginatedRelaciones.length ? (
            paginatedRelaciones.map((g) => (
              <div key={g.key} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold" style={{ color: COLORS.ink }}>
                      {g?.mascota || "-"}
                    </div>
                    <div className="text-sm" style={{ color: COLORS.inkSoft }}>
                      Alergias: {g.items.length}
                    </div>
                    <div className="mt-2 text-xs" style={{ color: COLORS.inkSoft }}>
                      {buildDescripcion(g) || "-"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => toggleGroup(g.key)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                    style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                  >
                    {openGroups[g.key] ? 'Ocultar detalle' : 'Ver detalle'}
                  </button>
                </div>

                {openGroups[g.key] && (
                  <div className="mt-3 grid gap-2">
                    {g.items.map((it) => (
                      <div key={it.id} className="rounded-xl border p-3" style={{ borderColor: COLORS.line }}>
                        <div className="font-semibold" style={{ color: COLORS.ink }}>{it.alergia}</div>
                        <div className="mt-2 text-xs" style={{ color: COLORS.inkSoft }}>
                          {it.fecha_creacion ? `Fecha: ${formatDate(it.fecha_creacion)}` : 'Fecha: -'}
                        </div>
                        {it.observaciones && (
                          <div className="mt-1 text-xs" style={{ color: COLORS.inkSoft }}>
                            Obs: {it.observaciones}
                          </div>
                        )}
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => navigate(`/mascota-alergia/editar/${it.id}`)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                            style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                          >
                            <IconEdit /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(it.id, g.mascota, it.alergia)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                            style={{ backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}
                          >
                            <IconTrash /> Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                <span className="text-2xl" aria-hidden>?</span>
              </div>
              <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron relaciones</div>
              <div className="text-sm" style={{ color: COLORS.inkSoft }}>Crea una nueva para empezar.</div>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
            style={{ backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}
          >
            {'<'} Anterior
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
            Siguiente {'>'}
          </button>
        </div>
      )}
    </div>
  );
}
