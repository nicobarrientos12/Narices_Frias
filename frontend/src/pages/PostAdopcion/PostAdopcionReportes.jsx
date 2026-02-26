// src/pages/PostAdopcionReportes.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdopcionesDisponibles,
  fetchPreview,
  downloadPDF,
} from "../../services/postAdopcionService";

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
    <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4A1 1 0 0 1 8.707 10.293L11 12.586V4a1 1 0 0 1 1-1zm-7 14a1 1 0 1 1 2 0 2 2 0 0 0 2 2h8a2 2 0 1 0 2-2 1 1 0 1 1 2 0 4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
  </svg>
);

export default function PostAdopcionReportes() {
  const [adopciones, setAdopciones] = useState([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [seleccionada, setSeleccionada] = useState(null);

  const [preview, setPreview] = useState([]);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [sinReportes, setSinReportes] = useState(false);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [cargandoPdf, setCargandoPdf] = useState(false);
  const [error, setError] = useState(null);

  // Limpia URL blob al desmontar
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // Cargar adopciones
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAdopcionesDisponibles();
        setAdopciones(data || []);
        if (data && data.length) setSeleccionada(data[0].id);
      } catch (e) {
        setError(e?.message || "Error cargando adopciones");
      }
    })();
  }, []);

  // Cargar vista previa
  useEffect(() => {
    if (!seleccionada) {
      setPreview([]);
      setSinReportes(false);
      return;
    }
    setLoadingPrev(true);
    (async () => {
      try {
        const data = await fetchPreview(seleccionada);
        if (data && data.length) {
          setPreview(data);
          setSinReportes(false);
        } else {
          setPreview([]);
          setSinReportes(true);
        }
      } catch (e) {
        setError(e?.message || "Error cargando reportes");
      } finally {
        setLoadingPrev(false);
      }
    })();
  }, [seleccionada]);

  // Filtrado + paginación
  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return adopciones;
    return (adopciones || []).filter(
      (a) =>
        (a.mascota || "").toLowerCase().includes(q) ||
        (a.dueno || "").toLowerCase().includes(q)
    );
  }, [adopciones, search]);

  const totalPages = Math.max(1, Math.ceil(filtradas.length / limit));
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filtradas.slice(start, start + limit);
  }, [filtradas, currentPage, limit]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages]);

  // Generar PDF
  const generarPdf = async () => {
    if (!seleccionada || !preview.length) {
      setError("Selecciona una adopción con reportes.");
      return;
    }
    setError(null);
    setCargandoPdf(true);
    try {
      const blob = await downloadPDF(seleccionada);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (e) {
      setError(e?.message || "Error generando PDF");
    } finally {
      setCargandoPdf(false);
    }
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{
        fontFamily:
          '"Plus Jakarta Sans","Inter","Noto Sans",system-ui,sans-serif',
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
              Reportes post-adopción
            </h2>
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>
              Genera y previsualiza el PDF oficial
            </p>
          </div>
        </div>

        <button
          onClick={generarPdf}
          disabled={cargandoPdf || !seleccionada || !preview.length}
          className="inline-flex items-center gap-2 font-semibold rounded-xl px-4 py-2 transition disabled:opacity-60"
          style={{
            backgroundColor:
              seleccionada && preview.length ? COLORS.primary : COLORS.chip,
            color: COLORS.ink,
            border: `1px solid ${
              seleccionada && preview.length ? COLORS.primary : COLORS.line
            }`,
          }}
          title="Generar PDF"
        >
          <IconDownload />
          {cargandoPdf ? "Generando…" : "Generar PDF"}
        </button>
      </div>

      {/* Buscador + paginación */}
      <div
        className="mb-4 flex flex-col md:flex-row md:items-center gap-3"
        style={{ color: COLORS.ink }}
      >
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Buscar por mascota o adoptante…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring"
            style={{
              borderColor: COLORS.line,
              backgroundColor: COLORS.bg,
              boxShadow: "0 1px 0 rgba(17,24,39,0.02)",
            }}
          />
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg"
            style={{
              background: COLORS.chip,
              border: `1px solid ${COLORS.line}`,
              color: COLORS.inkSoft,
            }}
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
                onClick={() => {
                  setLimit(num);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-full text-sm font-semibold transition"
                style={
                  active
                    ? { backgroundColor: COLORS.primary, color: COLORS.ink }
                    : {
                        backgroundColor: COLORS.chip,
                        color: COLORS.inkSoft,
                        border: `1px solid ${COLORS.line}`,
                      }
                }
              >
                {num} / pág
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla */}
      <div
        className="overflow-x-auto rounded-2xl"
        style={{ border: `1px solid ${COLORS.line}`, backgroundColor: COLORS.bg }}
      >
        <table className="w-full hidden md:table">
          <thead style={{ background: "#FFFDF0" }}>
            <tr
              className="text-left text-sm font-semibold"
              style={{ color: COLORS.inkSoft }}
            >
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>
                Seleccionar
              </th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>
                Mascota
              </th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>
                Adoptante
              </th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length ? (
              pageItems.map((a) => (
                <tr
                  key={a.id}
                  className="align-middle text-sm transition hover:bg-[#FFFCF2]"
                  style={{ color: COLORS.ink }}
                >
                  <td
                    className="p-3 border-t"
                    style={{ borderColor: COLORS.line }}
                  >
                    <input
                      type="radio"
                      name="selAdop"
                      checked={seleccionada === a.id}
                      onChange={() => {
                        setSeleccionada(a.id);
                        if (pdfUrl) {
                          URL.revokeObjectURL(pdfUrl);
                          setPdfUrl(null);
                        }
                      }}
                    />
                  </td>
                  <td
                    className="p-3 border-t font-semibold"
                    style={{ borderColor: COLORS.line }}
                  >
                    {a.mascota}
                  </td>
                  <td
                    className="p-3 border-t"
                    style={{ borderColor: COLORS.line }}
                  >
                    <span className="font-semibold" style={{ color: COLORS.ink }}>
                      {a.dueno}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-10 text-center">
                  <div
                    className="mx-auto w-16 h-16 rounded-2xl mb-3 flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <span className="text-2xl" aria-hidden>
                      ♡
                    </span>
                  </div>
                  <div className="font-bold" style={{ color: COLORS.ink }}>
                    No se encontraron adopciones
                  </div>
                  <div className="text-sm" style={{ color: COLORS.inkSoft }}>
                    Ajusta tu búsqueda.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer de vista previa PDF */}
      {pdfUrl && (
        <div
          className="fixed inset-0 z-40 flex"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="ml-auto h-full w-full sm:w-[640px] bg-white shadow-2xl flex flex-col"
            style={{ borderLeft: `1px solid ${COLORS.line}` }}
          >
            <div
              className="p-4 flex items-center gap-3 border-b"
              style={{ borderColor: COLORS.line }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: COLORS.primary }}
              />
              <h3 className="font-bold" style={{ color: COLORS.ink }}>
                Vista previa del PDF
              </h3>
              <button
                onClick={() => {
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl(null);
                }}
                className="ml-auto px-3 py-2 rounded-lg font-semibold"
                style={{
                  background: COLORS.chip,
                  color: COLORS.ink,
                  border: `1px solid ${COLORS.line}`,
                }}
              >
                Cerrar
              </button>
            </div>
            <div className="p-4 grow overflow-hidden">
              <iframe
                src={pdfUrl}
                title="Reporte Post-Adopción PDF"
                className="w-full h-full rounded-lg"
                style={{ border: `1px solid ${COLORS.line}` }}
              />
            </div>
            <div
              className="p-3 border-t text-xs text-center"
              style={{ borderColor: COLORS.line, color: COLORS.inkSoft }}
            >
              Narices Frías • Entidad Civil de Rescate
            </div>
          </div>
        </div>
      )}

      {/* Estados secundarios */}
      {loadingPrev && (
        <div className="mt-4 text-sm" style={{ color: COLORS.inkSoft }}>
          Cargando vista previa…
        </div>
      )}
      {sinReportes && (
        <div className="mt-4 text-sm" style={{ color: COLORS.inkSoft }}>
          Esta adopción no tiene reportes todavía.
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm"
          style={{
            background: "#FEE2E2",
            color: "#991B1B",
            border: "1px solid #FCA5A5",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
