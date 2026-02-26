import { useState } from "react";
import { forgotPassword } from "../../services/authService";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    setLoading(true);
    try {
      const out = await forgotPassword(correo);
      setMsg(out?.message || "Si el correo existe, enviaremos instrucciones.");
      // opcional: redirigir al login en 3s
      // setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error");
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0f0f0f] text-white"
         style={{ fontFamily: '"Space Grotesk", "Noto Sans", sans-serif' }}>
      {/* Fondo igual que login */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-80 bg-[radial-gradient(1200px_600px_at_120%_-10%,#f9d10622,transparent),radial-gradient(800px_400px_at_-10%_110%,#f9d1061a,transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))] mix-blend-overlay" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-3">
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

      <main className="relative z-10 grid min-h-[calc(100vh-84px)] grid-cols-1 place-items-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent px-6 py-6">
              <h2 className="text-2xl font-extrabold tracking-tight">
                Recuperar contraseña
              </h2>
              <p className="mt-1 text-sm text-neutral-300">
                Ingresa tu correo y te enviaremos un enlace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
              {error && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}
              {msg && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {msg}
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-200">
                  Correo
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
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 peer-focus:text-[#f9d106]"
                       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16v16H4z" opacity=".1" />
                    <path d="M4 7l8 6 8-6" />
                  </svg>
                </div>
              </label>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-sm font-semibold text-neutral-300 hover:underline"
                >
                  Volver al login
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#f9d106] px-5 py-3 font-extrabold text-[#0f0f0f] shadow-[0_10px_30px_rgba(249,209,6,0.35)] transition hover:translate-y-[-1px]"
                >
                  {loading ? "Enviando..." : "Enviar enlace"}
                </button>
              </div>
            </form>

            <div className="px-6 pb-6 pt-2">
              <div className="mt-2 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <p className="pt-4 text-center text-xs text-neutral-400">
                © {new Date().getFullYear()} Narices Frías
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
