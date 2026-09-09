import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReservationMap from "@/pages/ReservationMap";
import Dashboard from "@/pages/Dashboard";
import QRScanner from "@/pages/QRScanner";
import LoginPage from "@/pages/LoginPage";
import PublicMapView from "@/pages/PublicMapView";

const queryClient = new QueryClient();
type Page = "map" | "dashboard" | "scan";
export type Role = "admin" | "operator" | "viewer";

const SESSION_DURATION = 5 * 60 * 1000;

function isSessionValid() {
  const expiry = sessionStorage.getItem("tlc_auth_expiry");
  if (!expiry) return false;
  return Date.now() < parseInt(expiry, 10);
}

const isPublicView = new URLSearchParams(window.location.search).has("public");

function App() {
  const [authed, setAuthed] = useState(() => isSessionValid());
  const [role, setRole] = useState<Role>(() => (sessionStorage.getItem("tlc_role") as Role) || "viewer");
  const [page, setPage] = useState<Page>("map");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [remaining, setRemaining] = useState(0);

  const logout = useCallback(() => {
    sessionStorage.removeItem("tlc_auth_expiry");
    sessionStorage.removeItem("tlc_role");
    setAuthed(false);
  }, []);

  const resetExpiry = useCallback(() => {
    if (sessionStorage.getItem("tlc_auth_expiry")) {
      sessionStorage.setItem("tlc_auth_expiry", String(Date.now() + SESSION_DURATION));
    }
  }, []);

  const handleLogin = (r: Role) => {
    sessionStorage.setItem("tlc_auth_expiry", String(Date.now() + SESSION_DURATION));
    sessionStorage.setItem("tlc_role", r);
    setRole(r);
    setAuthed(true);
  };

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
    const expiry = parseInt(sessionStorage.getItem("tlc_auth_expiry") || "0", 10);
    setRemaining(Math.max(0, Math.round((expiry - Date.now()) / 1000)));
    return () => clearInterval(interval);
  }, [authed, logout]);

  useEffect(() => {
    if (!authed) return;
    const evts = ["click", "keydown", "mousemove", "touchstart", "scroll"];
    evts.forEach((ev) => window.addEventListener(ev, resetExpiry, { passive: true }));
    return () => evts.forEach((ev) => window.removeEventListener(ev, resetExpiry));
  }, [authed, resetExpiry]);

  const fmtRemaining = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const roleBadgeClass = role === "admin"
    ? "bg-yellow-100 text-yellow-700 border-yellow-300"
    : role === "operator"
    ? "bg-blue-100 text-blue-700 border-blue-300"
    : "bg-gray-100 text-gray-600 border-gray-300";

  if (isPublicView) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <PublicMapView />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

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

              <div className="flex items-center gap-2 flex-wrap">
                {page !== "scan" && (
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">Booking date</p>
                    <p className="text-sm font-extrabold text-gray-800">{selectedDate}</p>
                  </div>
                )}

                {/* Role badge */}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border hidden sm:inline ${roleBadgeClass}`}>
                  {role === "admin" ? "👑 Admin" : role === "operator" ? "🔧 Operator" : "👁 View"}
                </span>

                {remaining > 0 && remaining <= 120 && (
                  <span className="text-xs font-mono text-orange-500 border border-orange-200 bg-orange-50 px-2 py-1 rounded-md">
                    ⏱ {fmtRemaining()}
                  </span>
                )}

                <button
                  onClick={logout}
                  className="ml-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 transition"
                >
                  🔒 Logout
                </button>
              </div>
            </div>
          </nav>

          <div>
            {page === "map" && (
              <ReservationMap
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                role={role}
              />
            )}
            {page === "dashboard" && (
              <Dashboard
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                role={role}
              />
            )}
            {page === "scan" && <QRScanner />}
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
