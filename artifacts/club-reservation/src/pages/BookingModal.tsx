import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

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
}

interface Props {
  tableId: string;
  tableLabel: string;
  tablePrice: string;
  event: string;
  onClose: () => void;
  onSuccess: () => void;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function parsePriceHint(p: string): number {
  const s = p.replace(/\n/g, " ").toUpperCase();
  const lac = s.match(/(\d+\.?\d*)\s*LAC/);
  const k = s.match(/(\d+)\s*K/);
  if (lac) return Math.round(parseFloat(lac[1]) * 100000);
  if (k) return parseInt(k[1]) * 1000;
  const n = s.match(/(\d+)/);
  return n ? parseInt(n[1]) : 0;
}

export default function BookingModal({ tableId, tableLabel, tablePrice, event, onClose, onSuccess }: Props) {
  const [phase, setPhase] = useState<"form" | "success">("form");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const priceHint = parsePriceHint(tablePrice);
  const [form, setForm] = useState({
    guestName: "",
    bookingDate: new Date().toISOString().slice(0, 10),
    totalPrice: priceHint,
    advanceAmount: 0,
    paxCount: 1,
    contactNo: "",
    paymentMode: "Cash",
    ageGroup: "26-35",
  });

  const balance = form.totalPrice - form.advanceAmount;

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.guestName.trim()) { setError("Guest name is required"); return; }
    if (!form.contactNo.trim()) { setError("Contact number is required"); return; }
    if (form.totalPrice < 0 || form.advanceAmount < 0) { setError("Amounts must be positive"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, balance, tableId, event }),
      });
      if (!res.ok) throw new Error("Failed to create booking");
      const data = await res.json();
      setBooking(data);
      setPhase("success");
      onSuccess();
    } catch {
      setError("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const printQR = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "form" ? (
          <>
            <div className="p-5 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-800">📝 New Booking</h2>
                <p className="text-sm text-gray-500">Table: {tableLabel.replace("\n", " ")} · Price hint: {tablePrice.replace("\n", " ")}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Guest Name *</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" value={form.guestName} onChange={(e) => set("guestName", e.target.value)} placeholder="Full name" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Booking Date</label>
                <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" value={form.bookingDate} onChange={(e) => set("bookingDate", e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">No. of Pax</label>
                <input type="number" min={1} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" value={form.paxCount} onChange={(e) => set("paxCount", parseInt(e.target.value) || 1)} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Total Price (₹)</label>
                <input type="number" min={0} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" value={form.totalPrice} onChange={(e) => set("totalPrice", parseInt(e.target.value) || 0)} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Advance (₹)</label>
                <input type="number" min={0} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" value={form.advanceAmount} onChange={(e) => set("advanceAmount", parseInt(e.target.value) || 0)} />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Balance (Auto)</label>
                <div className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm font-bold ${balance < 0 ? "text-red-600 bg-red-50" : "text-emerald-700 bg-emerald-50"}`}>₹ {balance.toLocaleString()}</div>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Contact No. *</label>
                <input type="tel" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" value={form.contactNo} onChange={(e) => set("contactNo", e.target.value)} placeholder="+91 XXXXXXXXXX" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Payment Mode</label>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" value={form.paymentMode} onChange={(e) => set("paymentMode", e.target.value)}>
                  {["Cash", "Card", "UPI", "Online", "Multiple"].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Age Group</label>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" value={form.ageGroup} onChange={(e) => set("ageGroup", e.target.value)}>
                  {["18-25", "26-35", "36-45", "45+"].map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>

              {error && <p className="col-span-2 text-red-500 text-sm">{error}</p>}

              <div className="col-span-2 flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-2 rounded-lg border text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={submit} disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? "Booking…" : "Confirm Booking"}
                </button>
              </div>
            </div>
          </>
        ) : booking ? (
          <>
            <div className="p-5 border-b flex justify-between items-center bg-emerald-50">
              <div>
                <h2 className="text-lg font-bold text-emerald-700">✅ Booking Confirmed!</h2>
                <p className="text-sm text-emerald-600 font-mono font-bold">{booking.bookingId}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-5 flex flex-col items-center gap-4 print:p-0">
              <div className="p-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm print:border-none">
                <QRCodeSVG value={booking.bookingId} size={180} />
              </div>
              <p className="text-xs text-gray-400 font-mono">{booking.bookingId}</p>

              <div className="w-full bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Guest", booking.guestName],
                  ["Table", tableLabel.replace("\n", " ")],
                  ["Date", booking.bookingDate],
                  ["Pax", String(booking.paxCount)],
                  ["Contact", booking.contactNo],
                  ["Age Group", booking.ageGroup],
                  ["Total", `₹${booking.totalPrice.toLocaleString()}`],
                  ["Advance", `₹${booking.advanceAmount.toLocaleString()}`],
                  ["Balance", `₹${booking.balanceAmount.toLocaleString()}`],
                  ["Payment", booking.paymentMode],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="text-xs text-gray-400 block">{k}</span>
                    <span className="font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 w-full print:hidden">
                <button onClick={printQR} className="flex-1 py-2 rounded-lg border text-sm font-semibold text-gray-600 hover:bg-gray-50">🖨️ Print</button>
                <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700">Done</button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
