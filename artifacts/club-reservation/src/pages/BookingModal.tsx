import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export interface Booking {
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
  paymentBreakdown?: string;
  ageGroup: string;
  tlcCardNo?: string;
  handBandColor?: string;
  arrived: boolean;
}

interface PaymentEntry { mode: string; amount: number; }

interface Props {
  tableId: string;
  tableLabel: string;
  tablePrice: string;
  event: string;
  mode?: "create" | "edit";
  existingBooking?: Booking;
  onClose: () => void;
  onSuccess: () => void;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const PAYMENT_MODES = ["Cash", "Card", "UPI", "Online", "Multiple"];
const AGE_GROUPS = ["18-25", "26-35", "36-45", "45+"];
const HAND_BAND_COLORS: { key: string; bg: string; ring: string }[] = [
  { key: "Red",    bg: "#ef4444", ring: "#b91c1c" },
  { key: "Green",  bg: "#22c55e", ring: "#15803d" },
  { key: "Black",  bg: "#1f2937", ring: "#111827" },
  { key: "Pink",   bg: "#ec4899", ring: "#be185d" },
  { key: "Blue",   bg: "#3b82f6", ring: "#1d4ed8" },
  { key: "Silver", bg: "#94a3b8", ring: "#64748b" },
];

function parsePriceHint(p: string): number {
  const s = p.replace(/\n/g, " ").toUpperCase();
  const lac = s.match(/(\d+\.?\d*)\s*LAC/);
  const k = s.match(/(\d+)\s*K/);
  if (lac) return Math.round(parseFloat(lac[1]) * 100000);
  if (k) return parseInt(k[1]) * 1000;
  const n = s.match(/(\d+)/);
  return n ? parseInt(n[1]) : 0;
}

function safeBreakdown(b?: string): PaymentEntry[] {
  if (!b) return [];
  try { const r = JSON.parse(b); return Array.isArray(r) && r.length ? r : []; }
  catch { return []; }
}

export default function BookingModal({
  tableId, tableLabel, tablePrice, event,
  mode = "create", existingBooking,
  onClose, onSuccess
}: Props) {
  const isEdit = mode === "edit" && !!existingBooking;

  const initPayments = (): PaymentEntry[] => {
    if (isEdit) {
      const bd = safeBreakdown(existingBooking?.paymentBreakdown);
      if (bd.length) return bd;
      return [{ mode: existingBooking?.paymentMode || "Cash", amount: existingBooking?.advanceAmount || 0 }];
    }
    return [{ mode: "Cash", amount: 0 }];
  };

  const [phase, setPhase] = useState<"form" | "success">("form");
  const [savedBooking, setSavedBooking] = useState<Booking | null>(isEdit ? existingBooking ?? null : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [guestName, setGuestName] = useState(existingBooking?.guestName ?? "");
  const [bookingDate, setBookingDate] = useState(existingBooking?.bookingDate ?? new Date().toISOString().slice(0, 10));
  const [totalPrice, setTotalPrice] = useState(existingBooking?.totalPrice ?? parsePriceHint(tablePrice));
  const [paxCount, setPaxCount] = useState(existingBooking?.paxCount ?? 1);
  const [contactNo, setContactNo] = useState(existingBooking?.contactNo ?? "");
  const [ageGroup, setAgeGroup] = useState(existingBooking?.ageGroup ?? "26-35");
  const [tlcCardNo, setTlcCardNo] = useState(existingBooking?.tlcCardNo ?? "");
  const [handBandColor, setHandBandColor] = useState(existingBooking?.handBandColor ?? "");
  const [payments, setPayments] = useState<PaymentEntry[]>(initPayments);

  const totalAdvance = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const balance = totalPrice - totalAdvance;

  const primaryMode = payments.length === 1 ? payments[0].mode : payments.length > 1 ? "Multiple" : "Cash";

  const addPayment = () => setPayments((p) => [...p, { mode: "Cash", amount: 0 }]);
  const removePayment = (i: number) => setPayments((p) => p.filter((_, j) => j !== i));
  const setMode = (i: number, m: string) => setPayments((p) => p.map((x, j) => j === i ? { ...x, mode: m } : x));
  const setAmt = (i: number, a: number) => setPayments((p) => p.map((x, j) => j === i ? { ...x, amount: a } : x));

  const validate = () => {
    if (!guestName.trim()) return "Guest name is required";
    if (!contactNo.trim()) return "Contact number is required";
    if (totalPrice < 0) return "Total price must be positive";
    if (totalAdvance < 0) return "Advance amount must be positive";
    return "";
  };

  const submit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    const body = {
      tableId, event, guestName, bookingDate, totalPrice,
      advanceAmount: totalAdvance, paxCount, contactNo,
      paymentMode: primaryMode, paymentBreakdown: payments,
      ageGroup, tlcCardNo, handBandColor,
    };
    try {
      const url = isEdit
        ? `${BASE}/api/bookings/${existingBooking!.id}`
        : `${BASE}/api/bookings`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSavedBooking(data);
      setPhase("success");
      onSuccess();
    } catch {
      setError("Failed to save booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">{children}</label>
  );

  const Input = ({ value, onChange, placeholder, type = "text" }: any) => (
    <input type={type} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" value={value} onChange={onChange} placeholder={placeholder} />
  );

  if (phase === "success" && savedBooking) {
    const bd = safeBreakdown(savedBooking.paymentBreakdown);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b flex justify-between items-center bg-emerald-50">
            <div>
              <h2 className="text-lg font-bold text-emerald-700">{isEdit ? "✏️ Booking Updated!" : "✅ Booking Confirmed!"}</h2>
              <p className="text-xs font-mono text-indigo-700 font-bold">{savedBooking.bookingId}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
          <div className="p-4 flex flex-col items-center gap-3">
            <QRCodeSVG value={savedBooking.bookingId} size={170} />
            <p className="text-xs font-mono text-gray-400">{savedBooking.bookingId}</p>
            <div className="w-full grid grid-cols-2 gap-2 text-sm">
              {[
                ["Guest", savedBooking.guestName],
                ["Table", tableLabel.replace("\n", " ")],
                ["Date", savedBooking.bookingDate],
                ["Pax", String(savedBooking.paxCount)],
                ["Contact", savedBooking.contactNo],
                ["Age Group", savedBooking.ageGroup],
                ["TLC Card", savedBooking.tlcCardNo || "—"],
                ["Hand Band", savedBooking.handBandColor || "—"],
                ["Total", `₹${savedBooking.totalPrice.toLocaleString()}`],
                ["Advance", `₹${savedBooking.advanceAmount.toLocaleString()}`],
                ["Balance", `₹${savedBooking.balanceAmount.toLocaleString()}`],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded p-2">
                  <span className="text-xs text-gray-400 block">{k}</span>
                  <span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
              {bd.length > 0 && (
                <div className="col-span-2 bg-gray-50 rounded p-2">
                  <span className="text-xs text-gray-400 block mb-1">Payment Breakdown</span>
                  <div className="flex flex-wrap gap-2">
                    {bd.map((p, i) => (
                      <span key={i} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{p.mode}: ₹{p.amount.toLocaleString()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 w-full">
              <button onClick={() => window.print()} className="flex-1 py-2 border rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">🖨️ Print</button>
              <button onClick={onClose} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{isEdit ? "✏️ Edit Booking" : "📝 New Booking"}</h2>
            <p className="text-xs text-gray-500">Table: {tableLabel.replace("\n", " ")} {tablePrice && `· Hint: ${tablePrice.replace("\n", " ")}`}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Guest info row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Guest Name *</Label>
              <Input value={guestName} onChange={(e: any) => setGuestName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <Label>Booking Date</Label>
              <Input type="date" value={bookingDate} onChange={(e: any) => setBookingDate(e.target.value)} />
            </div>
            <div>
              <Label>No. of Pax</Label>
              <Input type="number" value={paxCount} onChange={(e: any) => setPaxCount(parseInt(e.target.value) || 1)} />
            </div>
            <div className="col-span-2">
              <Label>Contact No. *</Label>
              <Input value={contactNo} onChange={(e: any) => setContactNo(e.target.value)} placeholder="+91 XXXXXXXXXX" type="tel" />
            </div>
            <div>
              <Label>Age Group</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                {AGE_GROUPS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <Label>TLC Card No.</Label>
              <Input value={tlcCardNo} onChange={(e: any) => setTlcCardNo(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {/* Hand Band Color */}
          <div>
            <Label>Hand Band Color</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {HAND_BAND_COLORS.map(({ key, bg, ring }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHandBandColor(handBandColor === key ? "" : key)}
                  className="px-3 py-1.5 rounded-full text-white text-xs font-bold transition-all"
                  style={{
                    backgroundColor: bg,
                    outline: handBandColor === key ? `3px solid ${ring}` : "none",
                    outlineOffset: "2px",
                    opacity: handBandColor && handBandColor !== key ? 0.45 : 1,
                  }}
                >
                  {key}
                </button>
              ))}
              {handBandColor && (
                <button onClick={() => setHandBandColor("")} className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600">✕ Clear</button>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Total Price (₹)</Label>
              <Input type="number" value={totalPrice} onChange={(e: any) => setTotalPrice(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Total Advance (Auto)</Label>
              <div className="border rounded-lg px-3 py-2 text-sm font-bold bg-gray-50 text-gray-700">₹ {totalAdvance.toLocaleString()}</div>
            </div>
            <div className="col-span-2">
              <Label>Balance (Auto)</Label>
              <div className={`border rounded-lg px-3 py-2 text-sm font-bold ${balance < 0 ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>₹ {balance.toLocaleString()}</div>
            </div>
          </div>

          {/* Multiple Payment Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Payment Breakdown</Label>
              <button onClick={addPayment} className="text-xs text-indigo-600 font-bold hover:underline">+ Add Mode</button>
            </div>
            <div className="space-y-2">
              {payments.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    className="flex-1 border rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                    value={p.mode}
                    onChange={(e) => setMode(i, e.target.value)}
                  >
                    {PAYMENT_MODES.filter((m) => m !== "Multiple").map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      min={0}
                      className="w-full border rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                      value={p.amount}
                      onChange={(e) => setAmt(i, parseInt(e.target.value) || 0)}
                    />
                  </div>
                  {payments.length > 1 && (
                    <button onClick={() => removePayment(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={submit} disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Saving…" : isEdit ? "Update Booking" : "Confirm Booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
