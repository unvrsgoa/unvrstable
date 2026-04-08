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
export type Role = "admin" | "operator" | "viewer";

const SESSION_DURATION = 5 * 60 * 1000;

function isSessionValid() {
  const expiry = sessionStorage.getItem("tlc_auth_expiry");
  if (!expiry) return false;
  return Date.now() < parseInt(expiry, 10);
}

function App() {
  const [authed, setAuthed] = useState(() => isSessionValid());
  const [role, setRole] = useState<Role>(() => (sessionStorage.getItem("tlc_role") as Role) || "viewer");
  const [page, setPage] = useState<Page>("map");
  const [event, setEvent] = useState<EventKey>("chetas");
  const [remaining, setRemaining] = useState(0);

  // Feature 1: Custom name for the "normal" event
  const [normalEventName, setNormalEventName] = useState(
    () => localStorage.getItem("tlc_normal_name") || "Normal Night"
  );
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // Feature 2: Active show per event
  const [currentShowChetas, setCurrentShowChetas] = useState(
    () => localStorage.getItem("tlc_show_chetas") || "Show 1"
  );
  const [currentShowNormal, setCurrentShowNormal] = useState(
    () => localStorage.getItem("tlc_show_normal") || "Show 1"
  );

  const currentShow = event === "chetas" ? currentShowChetas : currentShowNormal;

  const setCurrentShow = (show: string) => {
    if (event === "chetas") {
      setCurrentShowChetas(show);
      localStorage.setItem("tlc_show_chetas", show);
    } else {
      setCurrentShowNormal(show);
      localStorage.setItem("tlc_show_normal", show);
    }
  };

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

  const saveNormalName = () => {
    const trimmed = nameInput.trim() || "Normal Night";
    setNormalEventName(trimmed);
    localStorage.setItem("tlc_normal_name", trimmed);
    setEditingName(false);
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
                  <div className="flex items-center gap-1">
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

                    {/* Normal event button + inline rename (admin only) */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setEvent("normal")}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all shadow-sm ${
                          event === "normal"
                            ? "bg-gray-800 text-white"
                            : "bg-white text-gray-500 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        🎵 {normalEventName}
                      </button>
                      {role === "admin" && !editingName && (
                        <button
                          onClick={() => { setNameInput(normalEventName); setEditingName(true); }}
                          className="text-gray-400 hover:text-gray-600 text-xs px-1 transition"
                          title="Rename"
                        >✏️</button>
                      )}
                    </div>

                    {/* Inline rename input */}
                    {editingName && (
                      <div className="flex items-center gap-1 ml-1">
                        <input
                          autoFocus
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveNormalName(); if (e.key === "Escape") setEditingName(false); }}
                          className="border rounded-md px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          placeholder="Event name"
                        />
                        <button onClick={saveNormalName} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-md font-bold hover:bg-indigo-700">✓</button>
                        <button onClick={() => setEditingName(false)} className="text-xs text-gray-500 hover:text-gray-700 px-1">✕</button>
                      </div>
                    )}
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
                event={event}
                onEventChange={setEvent}
                role={role}
                currentShow={currentShow}
                normalEventName={normalEventName}
              />
            )}
            {page === "dashboard" && (
              <Dashboard
                event={event}
                role={role}
                currentShow={currentShow}
                onShowChange={setCurrentShow}
                normalEventName={normalEventName}
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
