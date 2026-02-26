// src/pages/HistorialClinico.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchMascotasHistorial, downloadHistorialPdf } from "../../services/historialService";

// Paleta NAF
const COLORS = {
  primary: "#FFD400",
  ink: "#111827",
  inkSoft: "#374151",
  line: "#E5E7EB",
  bg: "#FFFFFF",
  chip: "#F9FAFB",
};

const IconDownload = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden {...props}>
    <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4A1 1 0 0 1 8.707 10.293L11 12.586V4a1 1 0 0 1 1-1zm-7 14a1 1 0 1 1 2 0 2 2 0 0 0 2 2h8a2 2 0 1 0 2-2 1 1 0 1 1 2 0 4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/>
  </svg>
);

export default function HistorialClinico() {
  const [mascotas, setMascotas] = useState([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [seleccionada, setSeleccionada] = useState(null);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Cargar mascotas + dueño
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMascotasHistorial();
        setMascotas(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError("Error cargando mascotas");
      }
    })();
  }, []);

  // Limpieza del ObjectURL si se desmonta
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // Filtrado
  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mascotas;
    return (mascotas || []).filter((m) =>
      (m.nombre_mascota || "").toLowerCase().includes(q) ||
      (m.nombre_dueno || "").toLowerCase().includes(q)
    );
  }, [mascotas, search]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtradas.length / limit));
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filtradas.slice(start, start + limit);
  }, [filtradas, currentPage, limit]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  // Generar PDF
  const generarPdf = async () => {
    if (!seleccionada) {
      setError("Selecciona una mascota para generar el PDF.");
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const blob = await downloadHistorialPdf(seleccionada);
      const url = URL.createObjectURL(blob);
      // Si ya había uno previo, revocarlo
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
    } catch (e) {
      console.error(e);
      setError("Error generando PDF");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{
        fontFamily: '"Plus Jakarta Sans","Inter","Noto Sans",system-ui,sans-serif',
        backgroundColor: "#FAFAFA",
      }}
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
            <h2 className="text-xl font-extrabold" style={{ color: COLORS.ink }}>
              Historial clínico
            </h2>
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>
              Genera y previsualiza el PDF oficial
            </p>
          </div>
        </div>

        <button
          onClick={generarPdf}
          disabled={cargando || !seleccionada}
          className="inline-flex items-center gap-2 font-semibold rounded-xl px-4 py-2 transition disabled:opacity-60"
          style={{
            backgroundColor: seleccionada ? COLORS.primary : COLORS.chip,
            color: COLORS.ink,
            border: `1px solid ${seleccionada ? COLORS.primary : COLORS.line}`,
          }}
          title="Generar PDF"
        >
          <IconDownload />
          {cargando ? "Generando…" : "Generar PDF"}
        </button>
      </div>

      {/* Buscador + tamaño de página */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3" style={{ color: COLORS.ink }}>
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Buscar por mascota o dueño…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring"
            style={{ borderColor: COLORS.line, backgroundColor: COLORS.bg, boxShadow: "0 1px 0 rgba(17,24,39,0.02)" }}
          />
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg"
            style={{ background: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.inkSoft }}
          >
            {filtradas.length} resultado(s)
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
      <div
        className="overflow-x-auto rounded-2xl"
        style={{ border: `1px solid ${COLORS.line}`, backgroundColor: COLORS.bg }}
      >
        <table className="w-full hidden md:table">
          <thead style={{ background: "#FFFDF0" }}>
            <tr className="text-left text-sm font-semibold" style={{ color: COLORS.inkSoft }}>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Seleccionar</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Mascota</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Dueño</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length ? (
              pageItems.map((m) => (
                <tr key={m.id} className="align-middle text-sm transition hover:bg-[#FFFCF2]" style={{ color: COLORS.ink }}>
                  <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="selMascota"
                        checked={seleccionada === m.id}
                        onChange={() => { setSeleccionada(m.id); setPdfUrl(null); }}
                        aria-label={`Seleccionar ${m.nombre_mascota}`}
                      />
                    </label>
                  </td>
                  <td className="p-3 border-t font-semibold" style={{ borderColor: COLORS.line }}>
                    {m.nombre_mascota}
                    <div className="text-xs mt-1" style={{ color: COLORS.inkSoft }}>
                      Registro activo
                    </div>
                  </td>
                  <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>
                    <span className="font-semibold" style={{ color: COLORS.ink }}>
                      {m.nombre_dueno || "—"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-10 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                    <span className="text-2xl" aria-hidden>♡</span>
                  </div>
                  <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron mascotas</div>
                  <div className="text-sm" style={{ color: COLORS.inkSoft }}>Ajusta tu búsqueda.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Cards (mobile) */}
        <div className="md:hidden divide-y" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {pageItems.length ? (
            pageItems.map((m) => (
              <div key={m.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold" style={{ color: COLORS.ink }}>
                      {m.nombre_mascota}
                    </div>
                    <div className="mt-1 text-sm" style={{ color: COLORS.inkSoft }}>
                      Dueño: {m.nombre_dueno || "—"}
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="selMascotaM"
                      checked={seleccionada === m.id}
                      onChange={() => { setSeleccionada(m.id); setPdfUrl(null); }}
                      aria-label={`Seleccionar ${m.nombre_mascota}`}
                    />
                  </label>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                <span className="text-2xl" aria-hidden>♡</span>
              </div>
              <div className="font-bold" style={{ color: COLORS.ink }}>No se encontraron mascotas</div>
              <div className="text-sm" style={{ color: COLORS.inkSoft }}>Ajusta tu búsqueda.</div>
            </div>
          )}
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5 flex-wrap">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(page)}
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
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
            style={{ backgroundColor: COLORS.chip, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}
          >
            Siguiente »
          </button>
        </div>
      )}

      {/* Drawer de vista previa del PDF */}
      {pdfUrl && (
        <div className="fixed inset-0 z-40 flex" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div
            className="ml-auto h-full w-full sm:w-[640px] bg-white shadow-2xl flex flex-col"
            style={{ borderLeft: `1px solid ${COLORS.line}` }}
          >
            <div className="p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS.primary }} />
              <h3 className="font-bold" style={{ color: COLORS.ink }}>Vista previa del PDF</h3>
              <div className="ml-auto flex items-center gap-2">
                <a
                  href={pdfUrl}
                  download="historial_clinico.pdf"
                  className="px-3 py-2 rounded-lg font-semibold"
                  style={{ background: COLORS.primary, color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                >
                  Descargar
                </a>
                <button
                  onClick={() => { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }}
                  className="px-3 py-2 rounded-lg font-semibold"
                  style={{ background: COLORS.chip, color: COLORS.ink, border: `1px solid ${COLORS.line}` }}
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div className="p-4 grow overflow-hidden">
              <iframe
                src={pdfUrl}
                title="Historial Clínico PDF"
                className="w-full h-full rounded-lg"
                style={{ border: `1px solid ${COLORS.line}` }}
              />
            </div>
            <div className="p-3 text-xs text-center" style={{ borderTop: `1px solid ${COLORS.line}`, color: COLORS.inkSoft }}>
              Narices Frías • Entidad Civil de Rescate
            </div>
          </div>
        </div>
      )}

      {/* Toast de error */}
      {error && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm"
          style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
