// src/pages/Campania/CampaniaList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCampanias, deleteCampania } from '../../services/campaniaService';
import { fetchUsuarios } from '../../services/usuarioService';

const COLORS = {
  primary: '#FFD400',
  ink: '#111827',
  inkSoft: '#374151',
  line: '#E5E7EB',
  bg: '#FFFFFF',
  chip: '#F9FAFB',
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

function currency(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Bs ${x.toFixed(2)}`;
}

export default function CampaniaList() {
  const [rows, setRows] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filters, setFilters] = useState({ usuario_id: '', desde: '', hasta: '' });
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // cargar usuarios para combo de filtro
  useEffect(() => {
    fetchUsuarios().then((u) => setUsuarios(Array.isArray(u) ? u : [])).catch(() => setUsuarios([]));
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters.usuario_id, filters.desde, filters.hasta]);

  const load = async () => {
    try {
      setErr('');
      setLoading(true);
      const list = await fetchCampanias({
        usuario_id: filters.usuario_id || undefined,
        desde: filters.desde || undefined,
        hasta: filters.hasta || undefined,
      });
      setRows(Array.isArray(list) ? list : []);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
      setErr(e?.message || 'Error al cargar campañas');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar la campaña "${nombre}"?`)) return;
    try {
      await deleteCampania(id);
      load();
    } catch (e) {
      alert(e?.message || 'No se pudo eliminar la campaña');
    }
  };

  // Búsqueda local por nombre / responsable
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const nombre = (r?.nombre || '').toLowerCase();
      const resp = (r?.responsable || '').toLowerCase();
      return nombre.includes(q) || resp.includes(q);
    });
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / limit));
  const paginated = filteredRows.slice((currentPage - 1) * limit, currentPage * limit);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [totalPages, currentPage]);

  return (
    <div
      className="p-6"
      style={{ fontFamily: '"Plus Jakarta Sans","Inter","Noto Sans",system-ui,sans-serif', backgroundColor: '#FAFAFA' }}
    >
      {/* Brand bar */}
      <div
        className="mb-5 rounded-2xl px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.line}` }}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl" style={{ backgroundColor: COLORS.primary }}>
            <span className="font-extrabold" style={{ color: COLORS.ink }}>naf</span>
          </span>
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: COLORS.ink }}>Campañas</h2>
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>Recaudaciones y actividades</p>
          </div>
        </div>

        <Link
          to="/campanias/nueva"
          className="inline-flex items-center gap-2 font-semibold rounded-xl px-4 py-2 transition"
          style={{ backgroundColor: COLORS.primary, color: COLORS.ink }}
        >
          <IconPlus /> Nueva campaña
        </Link>
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3" style={{ color: COLORS.ink }}>
        {/* Responsable */}
        <div className="relative">
          <select
            value={filters.usuario_id}
            onChange={(e) => setFilters((f) => ({ ...f, usuario_id: e.target.value }))}
            className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm shadow-sm outline-none transition-all focus:border-slate-400"
          >
            <option value="">Todos los responsables</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>
                {[u.nombre, u.primer_apellido].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-60">▾</span>
        </div>

        {/* Desde */}
        <div>
          <input
            type="date"
            value={filters.desde}
            onChange={(e) => setFilters((f) => ({ ...f, desde: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
            placeholder="Desde"
          />
        </div>

        {/* Hasta */}
        <div>
          <input
            type="date"
            value={filters.hasta}
            onChange={(e) => setFilters((f) => ({ ...f, hasta: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
            placeholder="Hasta"
          />
        </div>

        {/* Buscador local */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por campaña o responsable…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring"
            style={{ borderColor: COLORS.line, backgroundColor: COLORS.bg, boxShadow: '0 1px 0 rgba(17,24,39,0.02)' }}
          />
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg"
            style={{ background: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.inkSoft }}
          >
            {filteredRows.length} resultado(s)
          </span>
        </div>
      </div>

      {/* Tabla (desktop) */}
      <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${COLORS.line}`, backgroundColor: COLORS.bg }}>
        <table className="w-full hidden md:table">
          <thead style={{ background: '#FFFDF0' }}>
            <tr className="text-left text-sm font-semibold" style={{ color: COLORS.inkSoft }}>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>#</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Campaña</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Responsable</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Fecha</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Invertido</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Recaudado</th>
              <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>Ganancia</th>
              <th className="p-3 border-b text-center" style={{ borderColor: COLORS.line }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>Cargando campañas…</td></tr>
            ) : paginated.length ? (
              paginated.map((r) => {
                const inv = Number(r.monto_invertido || 0);
                const rec = Number(r.total_recaudado || 0);
                const gan = Number.isFinite(Number(r.ganancia)) ? Number(r.ganancia) : rec - inv;
                return (
                  <tr key={r.id} className="align-middle text-sm transition hover:bg-[#FFFCF2]" style={{ color: COLORS.ink }}>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>{r.id}</td>
                    <td className="p-3 border-t font-semibold" style={{ borderColor: COLORS.line }}>{r.nombre || '—'}</td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>{r.responsable || '—'}</td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>{r.fecha || '—'}</td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>{currency(inv)}</td>
                    <td className="p-3 border-t" style={{ borderColor: COLORS.line }}>{currency(rec)}</td>
                    <td className="p-3 border-t font-bold" style={{ borderColor: COLORS.line }}>
                      {currency(gan)}
                    </td>
                    <td className="p-3 border-t text-center" style={{ borderColor: COLORS.line }}>
                      <div className="inline-flex gap-1.5">
                        <Link
                          to={`/campanias/editar/${r.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                          style={{ backgroundColor: '#FFF7D1', color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                          title="Editar"
                        >
                          <IconEdit /> Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(r.id, r.nombre)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold"
                          style={{ backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5' }}
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
                    <span className="text-2xl" aria-hidden>🎗️</span>
                  </div>
                  <div className="font-bold" style={{ color: COLORS.ink }}>No hay campañas</div>
                  <div className="text-sm" style={{ color: COLORS.inkSoft }}>Crea una nueva para empezar.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Cards (mobile) */}
        <div className="md:hidden divide-y" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {loading ? (
            <div className="p-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>Cargando campañas…</div>
          ) : paginated.length ? (
            paginated.map((r) => {
              const inv = Number(r.monto_invertido || 0);
              const rec = Number(r.total_recaudado || 0);
              const gan = Number.isFinite(Number(r.ganancia)) ? Number(r.ganancia) : rec - inv;
              return (
                <div key={r.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center font-bold"
                      style={{ backgroundColor: COLORS.chip, border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
                    >
                      {String(r.nombre || '?').slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold" style={{ color: COLORS.ink }}>{r.nombre || '—'}</div>
                      <div className="text-sm" style={{ color: COLORS.inkSoft }}>Resp.: {r.responsable || '—'}</div>
                      <div className="text-sm" style={{ color: COLORS.inkSoft }}>Fecha: {r.fecha || '—'}</div>

                      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div className="rounded-lg px-2 py-1 text-center" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                          <div className="text-xs text-slate-600">Invertido</div>
                          <div className="font-semibold">{currency(inv)}</div>
                        </div>
                        <div className="rounded-lg px-2 py-1 text-center" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                          <div className="text-xs text-slate-600">Recaudado</div>
                          <div className="font-semibold">{currency(rec)}</div>
                        </div>
                        <div className="rounded-lg px-2 py-1 text-center" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                          <div className="text-xs text-slate-600">Ganancia</div>
                          <div className="font-semibold">{currency(gan)}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Link
                          to={`/campanias/editar/${r.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                          style={{ backgroundColor: '#FFF7D1', color: COLORS.ink, border: `1px solid ${COLORS.primary}` }}
                        >
                          <IconEdit /> Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(r.id, r.nombre)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold"
                          style={{ backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5' }}
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
                <span className="text-2xl" aria-hidden>🎗️</span>
              </div>
              <div className="font-bold" style={{ color: COLORS.ink }}>No hay campañas</div>
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
