// src/pages/Cita/CitaList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCitas, deleteCita } from "../../services/citaService";

// Paleta NAF
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

// Utils
function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d)) return "—";
  const date = new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d).replace(".", "");
  const time = new Intl.DateTimeFormat("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${date} · ${time}`;
}

function formatMoney(value) {
  const num = Number(value);
  if (isNaN(num)) return value || "—";
  try {
    return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 2 }).format(num);
  } catch {
    return `Bs ${num.toFixed(2)}`;
  }
}

function TipoBadge({ tipo }) {
  const t = (tipo || "").toString().trim().toLowerCase();
  let bg = "#F3F4F6", border = "#E5E7EB", text = COLORS.inkSoft, label = tipo || "—";
  if (["presencial"].includes(t)) { bg = "#ECFDF5"; border = "#A7F3D0"; text = "#065F46"; }
  if (["virtual", "online"].includes(t)) { bg = "#EFF6FF"; border = "#BFDBFE"; text = "#1E3A8A"; }
  if (["control", "vacunación"].some(s => t.includes(s))) { bg = "#FFFBEB"; border = "#FDE68A"; text = "#92400E"; }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
          style={{ backgroundColor: bg, color: text, borderColor: border }}>
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: text }} />
      {label}
    </span>
  );
}

export default function CitaList() {
  const [citas, setCitas] = useState([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    fetchCitas()
      .then((data) => setCitas(data || []))
      .catch((err) => console.error('Error al cargar citas:', err))
      .finally(() => setLoading(false));
  };

  const handleDelete = (id, mascota) => {
    if (confirm(`¿Eliminar la cita de "${mascota}"?`)) {
      deleteCita(id).then(load).catch(err => {
        console.error('Error al eliminar cita:', err);
        alert(err.message || 'Error al eliminar');
      });
    }
  };

  // Filtrado por búsqueda (mascota, dueño, veterinario, motivo)
  const filteredCitas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return citas;
    return citas.filter((c) =>
      (c.nombre_mascota || "").toLowerCase().includes(q) ||
      (c.nombre_dueno || "").toLowerCase().includes(q) ||
      (c.nombre_veterinario || "").toLowerCase().includes(q) ||
      (c.motivo || "").toLowerCase().includes(q)
    );
  }, [citas, search]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredCitas.length / limit));
  const paginatedCitas = filteredCitas.slice(
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
            <h2 className="text-xl font-extrabold" style={{ color: COLORS.ink }}>Citas médicas</h2>
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>Agenda de atención del refugio</p>
          </div>
        </div>

        <Link
          to="/citas/nueva"
          className="inline-flex items-center gap-2 font-semibold rounded-xl px-4 py-2 transition"
          style={{ backgroundColor: COLORS.primary, color: COLORS.ink }}
        >
          <IconPlus /> Nueva cita
        </Link>
      </div>

      {/* Buscador + tamaño de página */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3" style={{ color: COLORS.ink }}>
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Buscar por mascota, dueño, veterinario o motivo…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring"
            style={{ borderColor: COLORS.line, backgroundColor: COLORS.bg, boxShadow: "0 1px 0 rgba(17,24,39,0.02)" }}
          />
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg"
            style={{ background: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.inkSoft }}
          >
            {filteredCitas.length} resultado(s)
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
              <th className="border-b p-3" style={{ borderColor: COLORS.line }}>Fecha</th>
              <th className="border-b p-3" style={{ borderColor: COLORS.line }}>Mascota</th>
              <th className="border-b p-3" style={{ borderColor: COLORS.line }}>Dueño</th>
              <th className="border-b p-3" style={{ borderColor: COLORS.line }}>Veterinario</th>
              <th className="border-b p-3" style={{ borderColor: COLORS.line }}>Motivo</th>
              <th className="border-b p-3" style={{ borderColor: COLORS.line }}>Tipo</th>
              <th className="border-b p-3" style={{ borderColor: COLORS.line }}>Precio</th>
              <th className="border-b p-3 text-center" style={{ borderColor: COLORS.line }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>
                  Cargando citas…
                </td>
              </tr>
            ) : paginatedCitas.length ? (
              paginatedCitas.map((c) => (
                <tr key={c.id} className="align-middle text-sm transition hover:bg-[#FFFCF2]" style={{ color: COLORS.ink }}>
                  <td className="border-t p-3" style={{ borderColor: COLORS.line, color: COLORS.inkSoft }}>
                    {formatDateTime(c.fecha)}
                  </td>
                  <td className="border-t p-3 font-semibold" style={{ borderColor: COLORS.line }}>
                    {c.nombre_mascota || "—"}
                  </td>
                  <td className="border-t p-3" style={{ borderColor: COLORS.line }}>
                    {c.nombre_dueno || "—"}
                  </td>
                  <td className="border-t p-3" style={{ borderColor: COLORS.line }}>
                    {c.nombre_veterinario || "—"}
                  </td>
                  <td className="border-t p-3" style={{ borderColor: COLORS.line }}>
                    {c.motivo || "—"}
                  </td>
                  <td className="border-t p-3" style={{ borderColor: COLORS.line }}>
                    <TipoBadge tipo={c.tipo} />
                  </td>
                  <td className="border-t p-3" style={{ borderColor: COLORS.line }}>
                    {formatMoney(c.precio)}
                  </td>
                  <td className="border-t p-3 text-center" style={{ borderColor: COLORS.line }}>
                    <div className="inline-flex gap-1.5">
                      <Link
                        to={`/citas/editar/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                        style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                        title="Editar"
                      >
                        <IconEdit /> Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id, c.nombre_mascota)}
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
                <td colSpan="8" className="p-10 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                    <span className="text-2xl" aria-hidden>♡</span>
                  </div>
                  <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron citas</div>
                  <div className="text-sm" style={{ color: COLORS.inkSoft }}>Crea una nueva para empezar.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Cards (mobile) */}
        <div className="md:hidden divide-y" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {loading ? (
            <div className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>Cargando citas…</div>
          ) : paginatedCitas.length ? (
            paginatedCitas.map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold" style={{ color: COLORS.ink }}>
                      {c?.nombre_mascota || "—"}
                    </div>
                    <div className="text-sm" style={{ color: COLORS.inkSoft }}>
                      {formatDateTime(c?.fecha)}
                    </div>
                  </div>
                  <TipoBadge tipo={c?.tipo} />
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[13px]" style={{ color: COLORS.inkSoft }}>Dueño</span>
                    <span style={{ color: COLORS.ink }}>{c?.nombre_dueno || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[13px]" style={{ color: COLORS.inkSoft }}>Veterinario</span>
                    <span style={{ color: COLORS.ink }}>{c?.nombre_veterinario || "—"}</span>
                  </div>
                  {c?.motivo && (
                    <div className="flex justify-between">
                      <span className="text-[13px]" style={{ color: COLORS.inkSoft }}>Motivo</span>
                      <span className="text-right" style={{ color: COLORS.ink }}>{c.motivo}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[13px]" style={{ color: COLORS.inkSoft }}>Precio</span>
                    <span style={{ color: COLORS.ink }}>{formatMoney(c?.precio)}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/citas/editar/${c.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                    style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                  >
                    <IconEdit /> Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id, c.nombre_mascota)}
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
              <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron citas</div>
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
