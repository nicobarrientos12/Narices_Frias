import { useState } from "react";
import { login as loginService } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginService(correo, contrasena);
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-[#0f0f0f] text-white"
      style={{ fontFamily: '"Space Grotesk", "Noto Sans", sans-serif' }}
    >
      {/* Fondo: gradiente + pattern de puntos + halo amarillo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-80 bg-[radial-gradient(1200px_600px_at_120%_-10%,#f9d10622,transparent),radial-gradient(800px_400px_at_-10%_110%,#f9d1061a,transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))] mix-blend-overlay" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Header minimal */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-3">
          {/* Marca simplificada con aro y corazón tipo NAF */}
          <div className="grid place-items-center rounded-xl h-10 w-10 bg-[#f9d106] text-[#0f0f0f] shadow-[0_8px_30px_rgba(249,209,6,0.35)]">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-6-3.33-6-8a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.67-6 8-6 8z" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-lg font-extrabold tracking-tight">Narices Frías</p>
            <p className="text-xs text-neutral-300">Entidad Civil de Rescate</p>
          </div>
        </div>
      </header>

      {/* Contenido dividido */}
      <main className="relative z-10 grid min-h-[calc(100vh-84px)] grid-cols-1 lg:grid-cols-2">
        {/* Lado visual */}
        <section className="hidden lg:flex items-center justify-center p-10">
          <div className="relative w-full max-w-xl">
            {/* “Casa”/refugio en amarillo como figura hero */}
            <div className="absolute -top-10 -left-10 h-64 w-64 rounded-[2.5rem] border-4 border-[#f9d106] rotate-6 opacity-90" />
            <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-[2.5rem] border-4 border-[#f9d106] -rotate-6 opacity-60" />

            {/* Tarjeta hero */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              <div className="p-10">
                <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-[#f9d106]/30 bg-[#f9d106]/10 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-[#f9d106]" />
                  <span className="text-xs font-semibold tracking-wide text-[#f9d106]">
                    Rescate • Cuidado • Adopción
                  </span>
                </div>
                <h1 className="text-4xl font-extrabold leading-tight">
                  Donde cada <span className="text-[#f9d106]">nariz fría</span> encuentra calor
                </h1>
                <p className="mt-4 text-neutral-300">
                  Accede al panel para gestionar citas, adopciones y campañas. Diseño pensado para
                  velocidad, legibilidad y foco.
                </p>
              </div>

              {/* Imagen/cover opcional (puedes cambiarla) */}
              <div
                className="h-56 w-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    'url("https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1400&auto=format&fit=crop")',
                }}
              />
            </div>
          </div>
        </section>

        {/* Lado login */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            {/* Card de login “glass” */}
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              <div className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent px-6 py-6">
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Bienvenido a <span className="text-[#f9d106]">NAF</span>
                </h2>
                <p className="mt-1 text-sm text-neutral-300">
                  Inicia sesión para continuar
                </p>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                {/* Email */}
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-200">
                    Email
                  </span>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="nombre@correo.com"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      required
                      className="peer w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 pr-11 text-base text-white placeholder:text-neutral-400 outline-none ring-0 transition focus:border-[#f9d106] focus:shadow-[0_0_0_4px_rgba(249,209,6,0.25)]"
                    />
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 peer-focus:text-[#f9d106]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 4h16v16H4z" opacity=".1" />
                      <path d="M4 7l8 6 8-6" />
                    </svg>
                  </div>
                </label>

                {/* Password */}
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-200">
                    Contraseña
                  </span>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      required
                      className="peer w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 pr-11 text-base text-white placeholder:text-neutral-400 outline-none ring-0 transition focus:border-[#f9d106] focus:shadow-[0_0_0_4px_rgba(249,209,6,0.25)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-neutral-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f9d106]/60"
                      aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPass ? (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94L6.06 6.06" />
                          <path d="M10.58 10.58a3 3 0 1 0 4.24 4.24" />
                          <path d="M9.9 4.24A10.94 10.94 0 0 1 21 12c-.88 1.52-2.06 2.86-3.46 3.94" />
                          <path d="M6.06 6.06A10.94 10.94 0 0 0 3 12c1.64 2.83 4.94 6 9 6 1.05 0 2.06-.16 3-.46" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>

                {/* Acciones */}
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}   // antes: "/reset-password"
                  className="text-sm font-semibold text-[#f9d106] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>


                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 inline-flex w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f9d106] px-5 py-3 font-extrabold text-[#0f0f0f] shadow-[0_10px_30px_rgba(249,209,6,0.35)] transition hover:translate-y-[-1px] hover:shadow-[0_14px_36px_rgba(249,209,6,0.45)] disabled:opacity-70"
                >
                  {loading && (
                    <span className="absolute left-4 inline-flex h-5 w-5 animate-spin rounded-full border-2 border-[#0f0f0f]/30 border-t-[#0f0f0f]" />
                  )}
                  Iniciar Sesión
                </button>
              </form>

              {/* Footer mini */}
              <div className="px-6 pb-6 pt-2">
                <div className="mt-2 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <p className="pt-4 text-center text-xs text-neutral-400">
                  © {new Date().getFullYear()} Narices Frías — Amor y rescate responsable
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
