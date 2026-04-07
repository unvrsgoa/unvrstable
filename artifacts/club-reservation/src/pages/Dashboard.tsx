import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Booking {
  id: number;
  bookingId: string;
  tableId: string;
  event: string;
  guestName: string;
  bookingDate: string;
  totalPrice: number;
  advanceAmount: number;
  balanceAmount: number;
  paxCount: number;
  contactNo: string;
  paymentMode: string;
  ageGroup: string;
  arrived: boolean;
  createdAt: string;
}

interface Stats {
  totalBookings: number;
  totalPax: number;
  totalAdvance: number;
  totalBalance: number;
  totalAmount: number;
  arrivedCount: number;
  byMode: Record<string, number>;
}

interface Props {
  event: string;
}

export default function Dashboard({ event }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([
        fetch(`${BASE}/api/bookings?event=${event}`).then((r) => r.json()),
        fetch(`${BASE}/api/bookings/stats?event=${event}`).then((r) => r.json()),
      ]);
      setBookings(b);
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const deleteBooking = async (id: number) => {
    if (!confirm("Delete this booking?")) return;
    await fetch(`${BASE}/api/bookings/${id}`, { method: "DELETE" });
    load();
    if (selectedBooking?.id === id) setSelectedBooking(null);
  };

  const fmt = (n: number) => `₹${n.toLocaleString()}`;

  const filtered = bookings.filter((b) =>
    [b.guestName, b.bookingId, b.tableId, b.contactNo].some((f) =>
      f.toLowerCase().includes(search.toLowerCase())
    )
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-5">📊 Booking Dashboard — {event === "chetas" ? "DJ Chetas Night" : "Normal Night"}</h2>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Total Bookings", value: stats.totalBookings, color: "bg-indigo-600" },
            { label: "Arrived", value: `${stats.arrivedCount}/${stats.totalBookings}`, color: "bg-emerald-600" },
            { label: "Total Pax", value: stats.totalPax, color: "bg-blue-600" },
            { label: "Total Amount", value: fmt(stats.totalAmount), color: "bg-purple-600" },
            { label: "Advance Collected", value: fmt(stats.totalAdvance), color: "bg-amber-600" },
            { label: "Balance Pending", value: fmt(stats.totalBalance), color: "bg-red-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} text-white rounded-xl p-3 shadow`}>
              <p className="text-xs opacity-80 font-medium">{label}</p>
              <p className="text-xl font-extrabold mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payment mode breakdown */}
      {stats && Object.keys(stats.byMode).length > 0 && (
        <div className="bg-white rounded-xl shadow border p-4 mb-5">
          <h3 className="text-sm font-bold text-gray-600 mb-3">💳 Payment Mode Breakdown (Advance)</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.byMode).map(([mode, amt]) => (
              <div key={mode} className="bg-gray-50 border rounded-lg px-4 py-2">
                <span className="text-xs text-gray-500 block">{mode}</span>
                <span className="font-bold text-gray-800">{fmt(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          placeholder="Search by guest name, booking ID, table or contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={load} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">🔄 Refresh</button>
      </div>

      {/* Bookings table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p className="font-medium">{bookings.length === 0 ? "No bookings yet" : "No results match your search"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Booking ID", "Guest", "Table", "Date", "Pax", "Total", "Advance", "Balance", "Mode", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedBooking(b)}>
                    <td className="px-3 py-2 font-mono text-xs text-indigo-700 font-bold whitespace-nowrap">{b.bookingId}</td>
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{b.guestName}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{b.tableId.toUpperCase()}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{b.bookingDate}</td>
                    <td className="px-3 py-2 text-center">{b.paxCount}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmt(b.totalPrice)}</td>
                    <td className="px-3 py-2 text-emerald-700 font-semibold whitespace-nowrap">{fmt(b.advanceAmount)}</td>
                    <td className="px-3 py-2 text-red-600 font-semibold whitespace-nowrap">{fmt(b.balanceAmount)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{b.paymentMode}</td>
                    <td className="px-3 py-2">
                      {b.arrived ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">✅ Arrived</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">⏳ Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => deleteBooking(b.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking detail modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 border-b flex justify-between items-center ${selectedBooking.arrived ? "bg-emerald-50" : "bg-gray-50"}`}>
              <div>
                <p className="font-bold text-gray-800">{selectedBooking.guestName}</p>
                <p className="text-xs font-mono text-indigo-700">{selectedBooking.bookingId}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>
            <div className="p-4 flex flex-col items-center gap-3">
              <QRCodeSVG value={selectedBooking.bookingId} size={160} />
              <div className="w-full grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Table", selectedBooking.tableId.toUpperCase()],
                  ["Date", selectedBooking.bookingDate],
                  ["Pax", String(selectedBooking.paxCount)],
                  ["Contact", selectedBooking.contactNo],
                  ["Age Group", selectedBooking.ageGroup],
                  ["Mode", selectedBooking.paymentMode],
                  ["Total", `₹${selectedBooking.totalPrice.toLocaleString()}`],
                  ["Advance", `₹${selectedBooking.advanceAmount.toLocaleString()}`],
                  ["Balance", `₹${selectedBooking.balanceAmount.toLocaleString()}`],
                  ["Status", selectedBooking.arrived ? "✅ Arrived" : "⏳ Pending"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded p-2">
                    <span className="text-gray-400 block">{k}</span>
                    <span className="font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => window.print()} className="w-full py-2 rounded-lg border text-sm font-semibold text-gray-600 hover:bg-gray-50">🖨️ Print QR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
