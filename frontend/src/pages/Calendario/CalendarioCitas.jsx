// src/pages/Calendario/CalendarioCitas.jsx
import React, { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  getCitasByDate,
  notificarCorreo,
} from "../../services/calendarioService";

/** Paleta NAF */
const NAF = {
  yellow: "#FFD400",
  black: "#111111",
  grayBg: "#F8F9FA",
};

const CalendarioCitas = () => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchDay = async (date) => {
    setLoading(true);
    try {
      const fecha = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const data = await getCitasByDate(fecha);
      setCitas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error cargando citas:", e);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial para el día actual
  useEffect(() => {
    fetchDay(fechaSeleccionada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = async (date) => {
    setFechaSeleccionada(date);
    fetchDay(date);
  };

  const goToday = () => {
    const today = new Date();
    setFechaSeleccionada(today);
    fetchDay(today);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const buildMessage = (cita) => {
    const fecha = new Date(cita.fecha);
    const fechaTxt = fecha.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const horaTxt = fecha.toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dueno = cita.dueno || "tutor";
    const mascota = cita.mascota || "tu mascota";
    const motivo = cita.motivo ? ` Motivo: ${cita.motivo}.` : "";
    return `Hola ${dueno}, te recordamos la cita de ${mascota} el ${fechaTxt} a las ${horaTxt}.${motivo} Atte. Narices Fr?as.`;
  };

  const handleCorreo = async (cita) => {
    try {
      await notificarCorreo({
        correo: cita.correo,
        dueno: cita.dueno,
        mascota: cita.mascota,
        fecha: cita.fecha,
        motivo: cita.motivo,
        veterinario: cita.veterinario,
      });
      setToast({ type: "success", message: "Correo enviado correctamente." });
    } catch (e) {
      console.error(e);
      setToast({ type: "error", message: e?.message || "Error al enviar el correo." });
    }
  };

  const normalizePhone = (raw) => {
    const digits = String(raw || "").replace(/\D+/g, "");
    if (!digits) return "";
    if (digits.startsWith("591")) return digits;
    if (digits.length === 8) return `591${digits}`;
    return digits;
  };

  const handleWhatsApp = (cita) => {
    const telefono = normalizePhone(cita.telefono);
    if (!telefono) {
      setToast({ type: "error", message: "El dueño no tiene teléfono registrado." });
      return;
    }
    const text = buildMessage(cita);
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Ordena citas por hora para la línea de tiempo
  const citasOrdenadas = useMemo(() => {
    return [...citas].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
  }, [citas]);

  const prettyDate = useMemo(() => {
    const opts = { weekday: "long", day: "2-digit", month: "long", year: "numeric" };
    return fechaSeleccionada.toLocaleDateString("es-BO", opts);
  }, [fechaSeleccionada]);

  return (
    <div className="min-h-screen bg-[rgb(248,249,250)] relative">
      {/* Glow decorativo amarillo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-56 blur-3xl opacity-30"
        style={{
          background: `radial-gradient(60% 120% at 50% 0%, ${NAF.yellow}, transparent 70%)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight"
                style={{ color: NAF.black }}>
              Calendario de Citas
            </h1>
            <p className="text-sm text-gray-600">
              Selecciona un día en el calendario para ver su agenda.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={goToday}
              className="px-4 py-2 rounded-xl font-semibold border"
              style={{
                borderColor: NAF.yellow,
                background:
                  "linear-gradient(180deg, #FFF7C2, #FFE46A 60%, #FFD400)",
                color: NAF.black,
                boxShadow: "0 6px 18px rgba(255,212,0,0.3)",
              }}
            >
              Hoy
            </button>
          </div>
        </header>

        {/* Split view */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Panel Calendario */}
          <section className="lg:col-span-5">
            <div
              className="rounded-3xl p-5 shadow-xl border bg-white"
              style={{ borderColor: NAF.yellow }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Calendario</h2>
                <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ background: "#FFF3B0", color: NAF.black }}>
                  Vista mensual
                </span>
              </div>

              <Calendar
                onChange={handleDateChange}
                value={fechaSeleccionada}
                className="rounded-2xl border-0 w-full [&_.react-calendar__navigation__label]:font-bold [&_.react-calendar__tile--active]:text-black [&_.react-calendar__tile--active]:rounded-xl"
                tileClassName={({ date }) => {
                  const classes = ["transition-all duration-200"];
                  const isToday = date.toDateString() === new Date().toDateString();
                  if (isToday) classes.push("ring-2 ring-offset-2");
                  return classes.join(" ");
                }}
                tileContent={({ date, view }) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  return view === "month" && isToday ? (
                    <div className="flex justify-center mt-1">
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ background: NAF.yellow }}
                        title="Hoy"
                      />
                    </div>
                  ) : null;
                }}
              />

              {/* Leyenda */}
              <div className="mt-5 flex items-center gap-3 text-xs text-gray-600">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ background: NAF.yellow }}
                />
                <span>Día actual</span>
              </div>
            </div>
          </section>

          {/* Panel Agenda Día */}
          <section className="lg:col-span-7">
            <div className="rounded-3xl shadow-xl border bg-white overflow-hidden"
                 style={{ borderColor: NAF.yellow }}>
              {/* Encabezado fecha sticky */}
              <div className="px-6 py-5 bg-[rgba(255,212,0,0.12)] backdrop-blur-sm border-b"
                   style={{ borderColor: NAF.yellow }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900">
                      {prettyDate}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {loading ? "Cargando agenda…" : `Total: ${citas.length} cita(s)`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="px-6 py-6">
                {loading ? (
                  /* Skeleton loader */
                  <ul className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <li key={i} className="animate-pulse">
                        <div className="flex gap-4 items-start">
                          <div className="w-16 h-8 rounded-lg bg-gray-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                            <div className="h-3 bg-gray-200 rounded w-2/3" />
                          </div>
                          <div className="w-40 h-9 bg-gray-200 rounded-lg" />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : citasOrdenadas.length === 0 ? (
                  /* Estado vacío ilustrado */
                  <div className="text-center py-14">
                    <svg
                      width="120"
                      height="120"
                      viewBox="0 0 200 200"
                      className="mx-auto mb-4"
                    >
                      <path
                        d="M20 60 h160 a10 10 0 0 1 10 10 v80 a10 10 0 0 1 -10 10 H20 a10 10 0 0 1 -10 -10 V70 a10 10 0 0 1 10 -10 z"
                        fill="#FFF8D6"
                        stroke={NAF.yellow}
                        strokeWidth="4"
                      />
                      <circle cx="80" cy="110" r="10" fill={NAF.yellow} />
                      <circle cx="120" cy="110" r="10" fill={NAF.yellow} />
                      <path
                        d="M65 140 q35 18 70 0"
                        stroke={NAF.yellow}
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                    <h4 className="text-lg font-bold text-gray-800">
                      No hay citas para este día
                    </h4>
                    <p className="text-gray-500 text-sm">
                      Selecciona otra fecha en el calendario.
                    </p>
                  </div>
                ) : (
                  /* Línea de tiempo */
                  <ul className="space-y-5 relative">
                    {/* Línea vertical */}
                    <span
                      className="absolute left-8 top-0 bottom-0 w-1 rounded"
                      style={{ background: "#FFF0A6" }}
                    />
                    {citasOrdenadas.map((cita) => {
                      const hora = new Date(cita.fecha).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <li
                          key={cita.id}
                          className="pl-6"
                          style={{ scrollMarginTop: "100px" }}
                        >
                          <div className="flex gap-4 items-stretch">
                            {/* Marca/hora */}
                            <div className="relative">
                              <span
                                className="absolute -left-8 top-3 w-3 h-3 rounded-full ring-4"
                                style={{
                                  background: NAF.black,
                                  ringColor: "#FFF5B8",
                                }}
                              />
                              <div
                                className="min-w-[68px] h-9 px-3 flex items-center justify-center rounded-lg text-sm font-bold"
                                style={{
                                  background:
                                    "linear-gradient(180deg,#FFF7C2,#FFE46A 60%,#FFD400)",
                                  color: NAF.black,
                                  boxShadow:
                                    "0 6px 14px rgba(255,212,0,0.25)",
                                }}
                              >
                                {hora}
                              </div>
                            </div>

                            {/* Card cita */}
                            <div className="flex-1 rounded-2xl border bg-white p-4 shadow-sm hover:shadow-lg transition-all"
                                 style={{ borderColor: "#EFEFEF" }}>
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="space-y-1 text-[15px]">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-extrabold text-gray-900">
                                      🐾 {cita.mascota}
                                    </span>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                                          style={{ background: "#FFF3B0", color: NAF.black }}>
                                      {new Date(cita.fecha).toLocaleDateString("es-BO")}
                                    </span>
                                  </div>
                                  <div className="text-gray-700">
                                    <span className="font-semibold text-gray-900">Dueño: </span>
                                    {cita.dueno}
                                  </div>
                                  <div className="text-gray-700">
                                    <span className="font-semibold text-gray-900">Motivo: </span>
                                    {cita.motivo}
                                  </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCorreo(cita)}
                                    className="px-4 py-2 rounded-xl font-semibold border transition-all hover:-translate-y-0.5"
                                    style={{
                                      borderColor: NAF.yellow,
                                      background:
                                        "linear-gradient(180deg,#FFF7C2,#FFE46A 60%,#FFD400)",
                                      color: NAF.black,
                                      boxShadow:
                                        "0 6px 14px rgba(255,212,0,0.25)",
                                    }}
                                  >
                                    📧 Correo
                                  </button>
                                  <button
                                    onClick={() => handleWhatsApp(cita)}
                                    className="px-4 py-2 rounded-xl font-semibold text-white transition-all hover:-translate-y-0.5 shadow-lg"
                                    style={{ background: "#22C55E" }}
                                  >
                                    💬 WhatsApp
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl text-sm shadow-lg border"
          style={{
            background: toast.type === "error" ? "#FEE2E2" : "#ECFDF3",
            color: toast.type === "error" ? "#991B1B" : "#065F46",
            borderColor: toast.type === "error" ? "#FCA5A5" : "#A7F3D0",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default CalendarioCitas;
