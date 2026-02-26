// src/pages/Usuario/UsuarioList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchUsuarios, deleteUsuario } from "../../services/usuarioService";

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

function Pill({ children, tone = "neutral", title }) {
  const tones = {
    neutral: { bg: COLORS.chip, text: COLORS.inkSoft, border: COLORS.line },
    success: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
    warning: { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
    info: { bg: "#EFF6FF", text: "#1E3A8A", border: "#BFDBFE" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      title={title}
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: t.bg, color: t.text, border: `1px solid ${t.border}` }}
    >
      {children}
    </span>
  );
}

function initials({ nombre = "", primer_apellido = "", segundo_apellido = "" }) {
  const raw = [nombre, primer_apellido || segundo_apellido].filter(Boolean).join(" ");
  return raw
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function fullName(u) {
  return [u?.nombre, u?.primer_apellido, u?.segundo_apellido].filter(Boolean).join(" ");
}

function roleTone(rol = "") {
  const r = rol.toString().toLowerCase();
  if (["admin", "administrador", "superadmin"].some((k) => r.includes(k))) return "warning";
  if (["veterinario", "vet"].some((k) => r.includes(k))) return "info";
  if (["voluntario", "staff", "editor"].some((k) => r.includes(k))) return "neutral";
  return "neutral";
}

const gmapsLink = (lat, lon, addr) => {
  if (lat != null && lon != null) return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  if (addr) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  return null;
};

export default function UsuarioList() {
  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const list = await fetchUsuarios(); // el service ya normaliza: array directo
      setUsuarios(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Error al cargar usuarios");
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar al usuario "${nombre}"?`)) return;
    try {
      await deleteUsuario(id);
      // recarga lista
      load();
    } catch (e) {
      alert(e?.message || "No se pudo eliminar");
    }
  };

  const filteredUsuarios = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => {
      const name = fullName(u).toLowerCase();
      return (
        name.includes(q) ||
        (u?.correo || "").toLowerCase().includes(q) ||
        (u?.rol || "").toLowerCase().includes(q) ||
        (u?.carnet_identidad || "").toLowerCase().includes(q) ||
        (u?.direccion || "").toLowerCase().includes(q)
      );
    });
  }, [usuarios, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsuarios.length / limit));
  const paginatedUsuarios = filteredUsuarios.slice((currentPage - 1) * limit, currentPage * limit);
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
                style={{ backgroundColor: COLORS.primary }}>
            <span className="font-extrabold" style={{ color: COLORS.ink }}>naf</span>
          </span>
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: COLORS.ink }}>Usuarios</h2>
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>Accesos del sistema</p>
          </div>
        </div>

        <Link
          to="/usuarios/nuevo"
          className="inline-flex items-center gap-2 font-semibold rounded-xl px-4 py-2 transition"
          style={{ backgroundColor: COLORS.primary, color: COLORS.ink }}
        >
          <IconPlus /> Nuevo usuario
        </Link>
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}

      {/* Buscador + tamaño de página */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3" style={{ color: COLORS.ink }}>
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre, correo, rol, CI o dirección…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring"
            style={{ borderColor: COLORS.line, backgroundColor: COLORS.bg, boxShadow: "0 1px 0 rgba(17,24,39,0.02)" }}
          />
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg"
            style={{ background: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.inkSoft }}
          >
            {filteredUsuarios.length} resultado(s)
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
              <th className="p-3 border-b w-20" style={{ borderColor: COLORS.line }}>Avatar</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Nombre</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Apellidos</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>CI</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Correo</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Rol</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Ubicación</th>
              <th className="p-3 border-b text-center" style={{ borderColor: COLORS.line }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>Cargando usuarios…</td></tr>
            ) : paginatedUsuarios.length ? (
              paginatedUsuarios.map((u) => {
                const gmap = gmapsLink(u.latitud, u.longitud, u.direccion);
                return (
                  <tr key={u.id} className="align-middle text-sm transition hover:bg-[#FFFCF2]" style={{ color: COLORS.ink }}>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center font-bold"
                        style={{ backgroundColor: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
                        aria-label={fullName(u)}
                      >
                        {initials(u)}
                      </div>
                    </td>
                    <td className="p-3 border-t font-semibold" style={{ borderColor: COLORS.line }}>
                      {u?.nombre || "—"}
                    </td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                      {[u?.primer_apellido, u?.segundo_apellido].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                      {u?.carnet_identidad || "—"}
                    </td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                      {u?.correo ? (
                        <a href={`mailto:${u.correo}`} className="underline decoration-dotted" style={{ color: COLORS.inkSoft }}>
                          {u.correo}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                      <Pill tone={roleTone(u?.rol)} title="Rol de usuario">{u?.rol || "—"}</Pill>
                    </td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                      {(u?.latitud != null && u?.longitud != null) || u?.direccion ? (
                        <div className="flex items-center gap-2">
                          {u?.latitud != null && u?.longitud != null && (
                            <span className="text-xs font-mono text-slate-600">
                              {Number(u.latitud).toFixed(5)}, {Number(u.longitud).toFixed(5)}
                            </span>
                          )}
                          {gmap && (
                            <a
                              href={gmap}
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
                    <td className="p-3 border-t text-center" style={{ borderColor: COLORS.line }}>
                      <div className="inline-flex gap-1.5">
                        <Link
                          to={`/usuarios/editar/${u.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                          style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                          title="Editar"
                        >
                          <IconEdit /> Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(u.id, fullName(u))}
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
                <td colSpan="8" className="p-10 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                    <span className="text-2xl" aria-hidden>♡</span>
                  </div>
                  <div className="font-bold" style={{ color: COLORS.ink }}>No hay usuarios</div>
                  <div className="text-sm" style={{ color: COLORS.inkSoft }}>Crea uno nuevo para empezar.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Cards (mobile) */}
        <div className="md:hidden divide-y" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {loading ? (
            <div className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>Cargando usuarios…</div>
          ) : paginatedUsuarios.length ? (
            paginatedUsuarios.map((u) => {
              const gmap = gmapsLink(u.latitud, u.longitud, u.direccion);
              return (
                <div key={u.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center font-bold"
                      style={{ backgroundColor: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
                    >
                      {initials(u)}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold" style={{ color: COLORS.ink }}>
                        {fullName(u) || "—"}
                      </div>
                      <div className="text-sm" style={{ color: COLORS.inkSoft }}>
                        CI: {u?.carnet_identidad || "—"}
                      </div>
                      <div className="text-sm" style={{ color: COLORS.inkSoft }}>
                        {u?.correo ? <a href={`mailto:${u.correo}`} className="underline decoration-dotted">{u.correo}</a> : "—"}
                      </div>
                      <div className="mt-2">
                        <Pill tone={roleTone(u?.rol)}>{u?.rol || "—"}</Pill>
                      </div>

                      <div className="mt-2 text-sm">
                        {(u?.latitud != null && u?.longitud != null) || u?.direccion ? (
                          <>
                            {u?.latitud != null && u?.longitud != null && (
                              <span className="font-mono">
                                {Number(u.latitud).toFixed(4)}, {Number(u.longitud).toFixed(4)}
                              </span>
                            )}{" "}
                            {gmap && <a href={gmap} target="_blank" rel="noreferrer noopener" className="underline">Google Maps</a>}
                          </>
                        ) : "—"}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Link
                          to={`/usuarios/editar/${u.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                          style={{ backgroundColor: "#FFF7D1", color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                        >
                          <IconEdit /> Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(u.id, fullName(u))}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                          style={{ backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}
                        >
                          <IconTrash /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                <span className="text-2xl" aria-hidden>♡</span>
              </div>
              <div className="font-bold" style={{ color: COLORS.ink }}>No hay usuarios</div>
              <div className="text-sm" style={{ color: COLORS.inkSoft }}>Crea uno nuevo para empezar.</div>
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
