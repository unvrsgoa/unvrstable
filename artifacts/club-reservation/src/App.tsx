import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReservationMap from "@/pages/ReservationMap";
import Dashboard from "@/pages/Dashboard";
import QRScanner from "@/pages/QRScanner";
import LoginPage from "@/pages/LoginPage";

const queryClient = new QueryClient();
type Page = "map" | "dashboard" | "scan";
type EventKey = "chetas" | "normal";

const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes in ms

function isSessionValid() {
  const expiry = sessionStorage.getItem("tlc_auth_expiry");
  if (!expiry) return false;
  return Date.now() < parseInt(expiry, 10);
}

function App() {
  const [authed, setAuthed] = useState(() => isSessionValid());
  const [page, setPage] = useState<Page>("map");
  const [event, setEvent] = useState<EventKey>("chetas");
  const [remaining, setRemaining] = useState(0);

  const logout = useCallback(() => {
    sessionStorage.removeItem("tlc_auth_expiry");
    setAuthed(false);
  }, []);

  const resetExpiry = useCallback(() => {
    if (sessionStorage.getItem("tlc_auth_expiry")) {
      sessionStorage.setItem("tlc_auth_expiry", String(Date.now() + SESSION_DURATION));
    }
  }, []);

  const handleLogin = () => {
    sessionStorage.setItem("tlc_auth_expiry", String(Date.now() + SESSION_DURATION));
    setAuthed(true);
  };

  // Session expiry checker — runs every 10 s
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => {
      if (!isSessionValid()) {
        logout();
      } else {
        const expiry = parseInt(sessionStorage.getItem("tlc_auth_expiry") || "0", 10);
        setRemaining(Math.max(0, Math.round((expiry - Date.now()) / 1000)));
      }
    }, 10_000);
    // Set initial remaining immediately
    const expiry = parseInt(sessionStorage.getItem("tlc_auth_expiry") || "0", 10);
    setRemaining(Math.max(0, Math.round((expiry - Date.now()) / 1000)));
    return () => clearInterval(interval);
  }, [authed, logout]);

  // Reset session on any user activity
  useEffect(() => {
    if (!authed) return;
    const events = ["click", "keydown", "mousemove", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, resetExpiry, { passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, resetExpiry));
  }, [authed, resetExpiry]);

  const fmtRemaining = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (!authed) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LoginPage onLogin={handleLogin} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-100">
          <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2 gap-3">
              <div className="flex gap-1">
                {[
                  { key: "map", icon: "🗺️", label: "Floor Map" },
                  { key: "dashboard", icon: "📊", label: "Dashboard" },
                  { key: "scan", icon: "📷", label: "Scan QR" },
                ].map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setPage(key as Page)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      page === key
                        ? "bg-indigo-600 text-white shadow"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                  >
                    <span>{icon}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {page !== "scan" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEvent("chetas")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all shadow-sm ${
                        event === "chetas"
                          ? "bg-indigo-700 text-white"
                          : "bg-white text-gray-500 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      🎧 Chetas
                    </button>
                    <button
                      onClick={() => setEvent("normal")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all shadow-sm ${
                        event === "normal"
                          ? "bg-gray-800 text-white"
                          : "bg-white text-gray-500 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      🎵 Normal
                    </button>
                  </div>
                )}

                {/* Session timer */}
                {remaining > 0 && remaining <= 120 && (
                  <span className="text-xs font-mono text-orange-500 border border-orange-200 bg-orange-50 px-2 py-1 rounded-md">
                    ⏱ {fmtRemaining()}
                  </span>
                )}

                <button
                  onClick={logout}
                  className="ml-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 transition"
                  title="Logout"
                >
                  🔒 Logout
                </button>
              </div>
            </div>
          </nav>

          <div>
            {page === "map" && <ReservationMap event={event} onEventChange={setEvent} />}
            {page === "dashboard" && <Dashboard event={event} />}
            {page === "scan" && <QRScanner />}
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
