import { useState } from "react";

const VALID_ID = "TLC@BRYN";
const VALID_PW = "TLC@BRYN2026";

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (userId === VALID_ID && password === VALID_PW) {
        sessionStorage.setItem("tlc_auth", "1");
        onLogin();
      } else {
        setError("Invalid credentials. Access denied.");
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-900/20 blur-[80px]" />
      </div>

      <div className={`relative w-full max-w-sm ${shake ? "animate-shake" : ""}`}>
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-900/60 border border-indigo-500/40 mb-4 shadow-lg shadow-indigo-900/40">
            <span className="text-3xl">🎧</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-widest uppercase">DJ Chetas Night</h1>
          <p className="text-indigo-400 text-xs tracking-widest uppercase mt-1 font-semibold">Reservation Management</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-bold text-lg mb-1">Staff Login</h2>
          <p className="text-gray-500 text-xs mb-6">Authorised personnel only</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">User ID</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">👤</span>
                <input
                  type="text"
                  autoComplete="username"
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); setError(""); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Enter User ID"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔒</span>
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-11 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Enter Password"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition text-sm"
                >
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2">
                <span className="text-red-400 text-sm">⚠️</span>
                <p className="text-red-400 text-xs font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-extrabold text-sm tracking-wider uppercase transition-all shadow-lg shadow-indigo-900/40 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Verifying…
                </span>
              ) : "🔓 Login"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          🔐 Secure access — TLC Entertainment © 2026
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}
