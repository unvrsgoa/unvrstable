import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import * as XLSX from "xlsx";
import BookingModal, { type Booking } from "./BookingModal";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Stats {
  totalBookings: number;
  totalPax: number;
  totalAdvance: number;
  totalBalance: number;
  totalAmount: number;
  arrivedCount: number;
  byMode: Record<string, number>;
  byHandBand: Record<string, number>;
}

interface Props { event: string; }

const HAND_BAND_BG: Record<string, string> = {
  Red: "#ef4444", Green: "#22c55e", Black: "#1f2937",
  Pink: "#ec4899", Blue: "#3b82f6", Silver: "#94a3b8",
};

function safeBreakdown(s?: string | null): { mode: string; amount: number }[] {
  if (!s) return [];
  try { const r = JSON.parse(s); return Array.isArray(r) ? r : []; } catch { return []; }
}

function fmt(n: number) { return `₹${n.toLocaleString()}`; }

export default function Dashboard({ event }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [wiping, setWiping] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([
        fetch(`${BASE}/api/bookings?event=${event}`).then((r) => r.json()),
        fetch(`${BASE}/api/bookings/stats?event=${event}`).then((r) => r.json()),
      ]);
      setBookings(Array.isArray(b) ? b : []);
      setStats(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [event]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const deleteBooking = async (id: number) => {
    if (!confirm("Delete this booking permanently?")) return;
    await fetch(`${BASE}/api/bookings/${id}`, { method: "DELETE" });
    load();
    if (selectedBooking?.id === id) setSelectedBooking(null);
  };

  const wipeAll = async () => {
    const eventLabel = event === "chetas" ? "DJ Chetas Night" : "Normal Night";
    if (!confirm(`⚠️ DANGER: This will permanently delete ALL ${bookings.length} booking(s) for "${eventLabel}".\n\nThis cannot be undone! Continue?`)) return;
    if (!confirm(`Final confirmation: Delete ALL data for ${eventLabel}?`)) return;
    setWiping(true);
    try {
      await fetch(`${BASE}/api/bookings/wipe?event=${event}`, { method: "DELETE" });
      load();
    } finally { setWiping(false); }
  };

  const exportToExcel = () => {
    const rows = filtered.map((b) => {
      const bd = safeBreakdown(b.paymentBreakdown);
      return {
        "Booking ID": b.bookingId,
        "Guest Name": b.guestName,
        "Table": b.tableId.toUpperCase(),
        "Booking Date": b.bookingDate,
        "Pax": b.paxCount,
        "Contact": b.contactNo,
        "Age Group": b.ageGroup,
        "TLC Card No.": b.tlcCardNo || "",
        "Hand Band Color": b.handBandColor || "",
        "Total Price (₹)": b.totalPrice,
        "Advance (₹)": b.advanceAmount,
        "Balance (₹)": b.balanceAmount,
        "Payment Breakdown": bd.length ? bd.map((p) => `${p.mode}: ₹${p.amount}`).join(" | ") : b.paymentMode,
        "Status": b.arrived ? "Arrived" : "Pending",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, `Bookings_${event}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filtered = bookings.filter((b) =>
    [b.guestName, b.bookingId, b.tableId, b.contactNo, b.tlcCardNo ?? "", b.handBandColor ?? ""].some((f) =>
      f.toLowerCase().includes(search.toLowerCase())
    )
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-2xl font-extrabold text-gray-800">
          📊 Dashboard — {event === "chetas" ? "DJ Chetas Night" : "Normal Night"}
        </h2>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-sm">
            📥 Export Excel
          </button>
          <button onClick={wipeAll} disabled={wiping || bookings.length === 0} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm disabled:opacity-40">
            🗑️ {wiping ? "Wiping…" : "Wipe All Data"}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {[
            { label: "Total Bookings", value: stats.totalBookings, color: "bg-indigo-600" },
            { label: "Arrived", value: `${stats.arrivedCount} / ${stats.totalBookings}`, color: "bg-emerald-600" },
            { label: "Total Pax", value: stats.totalPax, color: "bg-blue-600" },
            { label: "Total Amount", value: fmt(stats.totalAmount), color: "bg-purple-700" },
            { label: "Advance Collected", value: fmt(stats.totalAdvance), color: "bg-amber-600" },
            { label: "Balance Pending", value: fmt(stats.totalBalance), color: "bg-red-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} text-white rounded-xl p-3 shadow`}>
              <p className="text-xs opacity-75 font-medium">{label}</p>
              <p className="text-xl font-extrabold mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payment mode breakdown */}
      {stats && Object.keys(stats.byMode).length > 0 && (
        <div className="bg-white rounded-xl shadow border p-4 mb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">💳 Payment Summary (by Mode)</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.byMode).sort((a, b) => b[1] - a[1]).map(([mode, amt]) => (
              <div key={mode} className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 min-w-[110px]">
                <span className="text-xs font-bold text-indigo-500 block">{mode}</span>
                <span className="text-lg font-extrabold text-indigo-800">{fmt(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hand Band Summary */}
      {stats && Object.keys(stats.byHandBand).length > 0 && (
        <div className="bg-white rounded-xl shadow border p-4 mb-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">🎗️ Hand Band Summary (Color-wise)</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.byHandBand).sort((a, b) => b[1] - a[1]).map(([color, count]) => (
              <div
                key={color}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white shadow-sm"
                style={{ backgroundColor: HAND_BAND_BG[color] || "#6b7280" }}
              >
                <span className="font-bold text-sm">{color}</span>
                <span className="text-2xl font-extrabold leading-none">{count}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 border text-gray-600">
              <span className="font-bold text-sm">Total</span>
              <span className="text-2xl font-extrabold leading-none">{Object.values(stats.byHandBand).reduce((s, n) => s + n, 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search + refresh */}
      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          placeholder="Search by name, booking ID, table, contact, TLC card, hand band…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={load} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 whitespace-nowrap">🔄 Refresh</button>
      </div>

      {/* Bookings table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p className="font-medium">{bookings.length === 0 ? "No bookings yet. Book a table from the Floor Map." : "No results match your search."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["ID", "Guest", "Table", "Date", "Pax", "TLC Card", "Hand Band", "Total", "Advance", "Balance", "Payment", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => {
                  const bd = safeBreakdown(b.paymentBreakdown);
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedBooking(b)}>
                      <td className="px-3 py-2 font-mono text-xs text-indigo-700 font-bold whitespace-nowrap">{b.bookingId}</td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{b.guestName}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap uppercase">{b.tableId}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{b.bookingDate}</td>
                      <td className="px-3 py-2 text-center">{b.paxCount}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{b.tlcCardNo || "—"}</td>
                      <td className="px-3 py-2">
                        {b.handBandColor ? (
                          <span className="px-2 py-0.5 rounded-full text-white text-xs font-bold" style={{ backgroundColor: HAND_BAND_BG[b.handBandColor] || "#6b7280" }}>{b.handBandColor}</span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-semibold">{fmt(b.totalPrice)}</td>
                      <td className="px-3 py-2 text-emerald-700 font-semibold whitespace-nowrap">{fmt(b.advanceAmount)}</td>
                      <td className="px-3 py-2 text-red-600 font-semibold whitespace-nowrap">{fmt(b.balanceAmount)}</td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                        {bd.length > 1 ? (
                          <span title={bd.map((p) => `${p.mode}: ₹${p.amount}`).join("\n")} className="underline decoration-dotted cursor-help">Multiple</span>
                        ) : b.paymentMode}
                      </td>
                      <td className="px-3 py-2">
                        {b.arrived ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">✅ In</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">⏳</span>
                        )}
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingBooking(b)} className="text-indigo-500 hover:text-indigo-700 text-xs font-bold">Edit</button>
                          <button onClick={() => deleteBooking(b.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View booking modal (QR) */}
      {selectedBooking && !editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 border-b flex justify-between items-center ${selectedBooking.arrived ? "bg-emerald-50" : "bg-gray-50"}`}>
              <div>
                <p className="font-bold text-gray-800">{selectedBooking.guestName}</p>
                <p className="text-xs font-mono text-indigo-700">{selectedBooking.bookingId}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingBooking(selectedBooking); setSelectedBooking(null); }} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200">✏️ Edit</button>
                <button onClick={() => setSelectedBooking(null)} className="text-gray-400 text-2xl leading-none">×</button>
              </div>
            </div>
            <div className="p-4 flex flex-col items-center gap-3">
              <QRCodeSVG value={selectedBooking.bookingId} size={150} />
              <div className="w-full grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Table", selectedBooking.tableId.toUpperCase()],
                  ["Date", selectedBooking.bookingDate],
                  ["Pax", String(selectedBooking.paxCount)],
                  ["Contact", selectedBooking.contactNo],
                  ["Age Group", selectedBooking.ageGroup],
                  ["TLC Card", selectedBooking.tlcCardNo || "—"],
                  ["Total", fmt(selectedBooking.totalPrice)],
                  ["Advance", fmt(selectedBooking.advanceAmount)],
                  ["Balance", fmt(selectedBooking.balanceAmount)],
                  ["Status", selectedBooking.arrived ? "✅ Arrived" : "⏳ Pending"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded p-2">
                    <span className="text-gray-400 block">{k}</span>
                    <span className="font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
                {selectedBooking.handBandColor && (
                  <div className="col-span-2 bg-gray-50 rounded p-2">
                    <span className="text-gray-400 block">Hand Band</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: HAND_BAND_BG[selectedBooking.handBandColor] || "#6b7280" }} />
                      {selectedBooking.handBandColor}
                    </span>
                  </div>
                )}
                {safeBreakdown(selectedBooking.paymentBreakdown).length > 0 && (
                  <div className="col-span-2 bg-gray-50 rounded p-2">
                    <span className="text-gray-400 block mb-1">Payment Split</span>
                    <div className="flex flex-wrap gap-1">
                      {safeBreakdown(selectedBooking.paymentBreakdown).map((p, i) => (
                        <span key={i} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{p.mode}: ₹{p.amount.toLocaleString()}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => window.print()} className="w-full py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">🖨️ Print QR</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit booking modal */}
      {editingBooking && (
        <BookingModal
          mode="edit"
          existingBooking={editingBooking}
          tableId={editingBooking.tableId}
          tableLabel={editingBooking.tableId.toUpperCase()}
          tablePrice=""
          event={editingBooking.event}
          onClose={() => setEditingBooking(null)}
          onSuccess={() => { setEditingBooking(null); load(); }}
        />
      )}
    </div>
  );
}
