import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";

const PASS_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\sA-Za-z0-9]).{8,255}$/;

export default function ResetPasswordPage() {
  const [sp] = useSearchParams();
  const token = sp.get("token");
  const navigate = useNavigate();

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setError("Token no encontrado en la URL.");
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    if (!token) { setError("Token faltante."); return; }
    if (pwd !== pwd2) { setError("Las contraseñas no coinciden."); return; }
    if (!PASS_REGEX.test(pwd)) {
      setError("La contraseña debe tener mínimo 8 caracteres, 1 letra, 1 número y 1 carácter especial.");
      return;
    }
    setLoading(true);
    try {
      const out = await resetPassword(token, pwd);
      setMsg(out?.message || "Contraseña actualizada.");
      setTimeout(() => navigate("/login"), 2000);
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
                Restablecer contraseña
              </h2>
              <p className="mt-1 text-sm text-neutral-300">
                Ingresa tu nueva contraseña.
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
                  Nueva contraseña
                </span>
                <input
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-base text-white placeholder:text-neutral-400 outline-none ring-0 transition focus:border-[#f9d106] focus:shadow-[0_0_0_4px_rgba(249,209,6,0.25)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-200">
                  Confirmar contraseña
                </span>
                <input
                  type="password"
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-base text-white placeholder:text-neutral-400 outline-none ring-0 transition focus:border-[#f9d106] focus:shadow-[0_0_0_4px_rgba(249,209,6,0.25)]"
                />
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
                  disabled={loading || !token}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#f9d106] px-5 py-3 font-extrabold text-[#0f0f0f] shadow-[0_10px_30px_rgba(249,209,6,0.35)] transition hover:translate-y-[-1px]"
                >
                  {loading ? "Actualizando..." : "Cambiar contraseña"}
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
