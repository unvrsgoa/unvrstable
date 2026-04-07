import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReservationMap from "@/pages/ReservationMap";
import Dashboard from "@/pages/Dashboard";
import QRScanner from "@/pages/QRScanner";

const queryClient = new QueryClient();
type Page = "map" | "dashboard" | "scan";
type EventKey = "chetas" | "normal";

function App() {
  const [page, setPage] = useState<Page>("map");
  const [event, setEvent] = useState<EventKey>("chetas");

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
