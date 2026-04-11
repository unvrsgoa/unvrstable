import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import BookingModal, { type Booking } from "./BookingModal";
import leelaLogo from "@assets/image_1775535190878.png";

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

interface Props {
  event: string;
  role?: string;
  currentShow?: string;
  onShowChange?: (s: string) => void;
  normalEventName?: string;
}

const HAND_BAND_BG: Record<string, string> = {
  Red: "#ef4444", Green: "#22c55e", Black: "#1f2937",
  Pink: "#ec4899", Blue: "#3b82f6", Silver: "#94a3b8",
  Yellow: "#eab308", Orange: "#f97316", Purple: "#a855f7", Golden: "#d97706",
};

const HAND_BAND_COLORS = ["Red", "Green", "Black", "Pink", "Blue", "Silver", "Yellow", "Orange", "Purple", "Golden"];
const PAYMENT_MODES = ["Cash", "Card", "UPI", "Online", "Complimentary"];
const AGE_GROUPS = ["18-25", "26-35", "36-45", "46+"];

interface NewRow {
  guestName: string;
  tableId: string;
  bookingDate: string;
  paxCount: string;
  contactNo: string;
  tlcCardNo: string;
  handBandColor: string;
  totalPrice: string;
  advanceAmount: string;
  paymentMode: string;
  ageGroup: string;
}

function safeBreakdown(s?: string | null): { mode: string; amount: number }[] {
  if (!s) return [];
  try { const r = JSON.parse(s); return Array.isArray(r) ? r : []; } catch { return []; }
}

function fmt(n: number) { return `₹${n.toLocaleString()}`; }

export default function Dashboard({
  event,
  role = "admin",
  currentShow = "Show 1",
  onShowChange,
  normalEventName = "Normal Night",
}: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showGeneralEntry, setShowGeneralEntry] = useState(false);
  const [showCoverCharge, setShowCoverCharge] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wiping, setWiping] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Inline row entry (Excel-like)
  const [newRow, setNewRow] = useState<NewRow | null>(null);
  const [savingRow, setSavingRow] = useState(false);

  const blankRow = (): NewRow => ({
    guestName: "", tableId: "", bookingDate: new Date().toISOString().slice(0, 10),
    paxCount: "1", contactNo: "", tlcCardNo: "", handBandColor: "",
    totalPrice: "0", advanceAmount: "0", paymentMode: "Cash", ageGroup: "18-25",
  });

  const saveNewRow = async () => {
    if (!newRow) return;
    if (!newRow.guestName.trim()) { alert("Guest name is required."); return; }
    if (!newRow.tableId.trim()) { alert("Table ID is required."); return; }
    setSavingRow(true);
    try {
      const body = {
        tableId: newRow.tableId.trim().toLowerCase(),
        event,
        guestName: newRow.guestName.trim(),
        bookingDate: newRow.bookingDate,
        totalPrice: Number(newRow.totalPrice) || 0,
        advanceAmount: Number(newRow.advanceAmount) || 0,
        paxCount: Number(newRow.paxCount) || 1,
        contactNo: newRow.contactNo.trim(),
        paymentMode: newRow.paymentMode,
        paymentBreakdown: JSON.stringify([{ mode: newRow.paymentMode, amount: Number(newRow.advanceAmount) || 0 }]),
        ageGroup: newRow.ageGroup,
        tlcCardNo: newRow.tlcCardNo.trim(),
        handBandColor: newRow.handBandColor,
        showLabel: currentShow,
      };
      const res = await fetch(`${BASE}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      setNewRow(null);
      load();
    } catch {
      alert("Failed to save booking. Please try again.");
    } finally {
      setSavingRow(false);
    }
  };

  // Feature 2: show management
  const [shows, setShows] = useState<string[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  const loadShows = useCallback(async () => {
    try {
      const data = await fetch(`${BASE}/api/bookings/shows?event=${event}`).then((r) => r.json());
      setShows(Array.isArray(data) ? data : ["Show 1"]);
    } catch { setShows(["Show 1"]); }
  }, [event]);

  const load = useCallback(async () => {
    try {
      const show = encodeURIComponent(currentShow);
      const [b, s] = await Promise.all([
        fetch(`${BASE}/api/bookings?event=${event}&show=${show}`).then((r) => r.json()),
        fetch(`${BASE}/api/bookings/stats?event=${event}&show=${show}`).then((r) => r.json()),
      ]);
      setBookings(Array.isArray(b) ? b : []);
      setStats(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [event, currentShow]);

  useEffect(() => { setLoading(true); load(); loadShows(); }, [load, loadShows]);

  const deleteBooking = async (id: number) => {
    if (!confirm("Delete this booking permanently?")) return;
    await fetch(`${BASE}/api/bookings/${id}`, { method: "DELETE" });
    load();
    if (selectedBooking?.id === id) setSelectedBooking(null);
  };

  const wipeAll = async () => {
    const eventLabel = event === "chetas" ? "DJ Chetas Night" : normalEventName;
    if (!confirm(`⚠️ DANGER: This will permanently delete ALL ${bookings.length} booking(s) for "${eventLabel}" — ${currentShow}.\n\nThis cannot be undone! Continue?`)) return;
    if (!confirm(`Final confirmation: Delete ALL data for ${eventLabel} / ${currentShow}?`)) return;
    setWiping(true);
    try {
      await fetch(`${BASE}/api/bookings/wipe?event=${event}&show=${encodeURIComponent(currentShow)}`, { method: "DELETE" });
      load();
    } finally { setWiping(false); }
  };

  const switchShow = (s: string) => {
    onShowChange?.(s);
    setShowPanel(false);
  };

  const addNewShow = () => {
    const name = prompt("Enter new show name (e.g. Show 2):");
    if (!name?.trim()) return;
    const trimmed = name.trim();
    if (!shows.includes(trimmed)) setShows((prev) => [...prev, trimmed]);
    switchShow(trimmed);
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

  const handleShare = async () => {
    if (!selectedBooking || !shareCardRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: "#0a0a0f",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Canvas empty")), "image/png")
      );
      const file = new File([blob], `leela-reservation-${selectedBooking.bookingId}.png`, { type: "image/png" });
      const text =
        `*Reservation Confirmed* 🎉\n\nThank you for choosing The Leela Club. Your reservation has been successfully confirmed.\n\n` +
        `📋 *${selectedBooking.bookingId}*\n` +
        `👤 ${selectedBooking.guestName}\n` +
        `🪑 Table: ${selectedBooking.tableId.toUpperCase()}\n` +
        `👥 Pax: ${selectedBooking.paxCount}\n` +
        `📅 Date: ${selectedBooking.bookingDate}\n\n` +
        `We look forward to welcoming you. For any assistance, please contact us.`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "The Leela Club – Reservation", text });
      } else {
        // Desktop fallback: download image + open WhatsApp
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      }
    } catch (err) {
      console.error("Share failed", err);
    } finally {
      setSharing(false);
    }
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
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">
            📊 Dashboard — {event === "chetas" ? "DJ Chetas Night" : normalEventName}
          </h2>
          {/* Feature 2: show selector */}
          <div className="relative mt-1">
            <button
              onClick={() => setShowPanel((v) => !v)}
              className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              🎭 {currentShow}
              <span className="text-xs">▾</span>
            </button>
            {showPanel && (
              <div className="absolute left-0 top-7 z-50 bg-white border rounded-xl shadow-xl p-2 min-w-[180px]">
                <p className="text-xs font-bold text-gray-400 uppercase px-2 mb-1">Select Show</p>
                {shows.map((s) => (
                  <button
                    key={s}
                    onClick={() => switchShow(s)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-50 ${s === currentShow ? "bg-indigo-100 text-indigo-700" : "text-gray-700"}`}
                  >
                    {s === currentShow ? "✓ " : ""}{s}
                  </button>
                ))}
                <hr className="my-1" />
                <button
                  onClick={addNewShow}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                >
                  ＋ New Show
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Feature 3: Entry + Cover Charge (admin/operator only) */}
          {role !== "viewer" && (
            <>
              <button
                onClick={() => setShowGeneralEntry(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm"
              >
                🚪 Entry
              </button>
              <button
                onClick={() => setShowCoverCharge(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-bold hover:bg-violet-700 shadow-sm"
              >
                💳 Cover Charge
              </button>
            </>
          )}
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-sm">
            📥 Export Excel
          </button>
          {/* Feature 4: Wipe only for admin */}
          {role === "admin" && (
            <button onClick={wipeAll} disabled={wiping || bookings.length === 0} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm disabled:opacity-40">
              🗑️ {wiping ? "Wiping…" : "Wipe All Data"}
            </button>
          )}
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
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">🎗️ Hand Band Summary — Pax Count by Color</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.byHandBand).sort((a, b) => b[1] - a[1]).map(([color, pax]) => (
              <div
                key={color}
                className="flex flex-col items-center px-5 py-3 rounded-xl text-white shadow-sm min-w-[80px]"
                style={{ backgroundColor: HAND_BAND_BG[color] || "#6b7280" }}
              >
                <span className="text-3xl font-extrabold leading-none">{pax}</span>
                <span className="text-xs font-bold opacity-90 mt-0.5">{color}</span>
                <span className="text-xs opacity-70">PAX</span>
              </div>
            ))}
            <div className="flex flex-col items-center px-5 py-3 rounded-xl bg-gray-100 border text-gray-700 min-w-[80px]">
              <span className="text-3xl font-extrabold leading-none">{Object.values(stats.byHandBand).reduce((s, n) => s + n, 0)}</span>
              <span className="text-xs font-bold mt-0.5">Total</span>
              <span className="text-xs text-gray-400">PAX</span>
            </div>
          </div>
        </div>
      )}

      {/* Search + refresh + add row */}
      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          placeholder="Search by name, booking ID, table, contact, TLC card, hand band…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {role !== "viewer" && !newRow && (
          <button
            onClick={() => setNewRow(blankRow())}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 whitespace-nowrap shadow-sm"
          >
            ＋ Add Row
          </button>
        )}
        <button onClick={load} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 whitespace-nowrap">🔄 Refresh</button>
      </div>

      {/* Bookings table */}
      {!newRow && filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p className="font-medium">{bookings.length === 0 ? "No bookings yet. Book a table from the Floor Map or click Add Row." : "No results match your search."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["ID", "Guest *", "Table *", "Date", "Pax", "Contact", "TLC Card", "Hand Band", "Total ₹", "Advance ₹", "Balance ₹", "Payment", "Age", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">

                {/* Inline new-row entry */}
                {newRow && (
                  <tr className="bg-indigo-50 border-l-4 border-indigo-500">
                    {/* ID — auto */}
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs text-gray-400 italic">AUTO</span>
                    </td>
                    {/* Guest Name */}
                    <td className="px-1 py-1">
                      <input
                        autoFocus
                        className="border rounded px-2 py-1 text-xs w-28 focus:ring-1 focus:ring-indigo-400 outline-none"
                        placeholder="Guest name"
                        value={newRow.guestName}
                        onChange={(e) => setNewRow({ ...newRow, guestName: e.target.value })}
                      />
                    </td>
                    {/* Table ID */}
                    <td className="px-1 py-1">
                      <input
                        className="border rounded px-2 py-1 text-xs w-20 uppercase focus:ring-1 focus:ring-indigo-400 outline-none"
                        placeholder="e.g. t1"
                        value={newRow.tableId}
                        onChange={(e) => setNewRow({ ...newRow, tableId: e.target.value })}
                      />
                    </td>
                    {/* Date */}
                    <td className="px-1 py-1">
                      <input
                        type="date"
                        className="border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-400 outline-none"
                        value={newRow.bookingDate}
                        onChange={(e) => setNewRow({ ...newRow, bookingDate: e.target.value })}
                      />
                    </td>
                    {/* Pax */}
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        min={1}
                        className="border rounded px-2 py-1 text-xs w-14 focus:ring-1 focus:ring-indigo-400 outline-none"
                        value={newRow.paxCount}
                        onChange={(e) => setNewRow({ ...newRow, paxCount: e.target.value })}
                      />
                    </td>
                    {/* Contact */}
                    <td className="px-1 py-1">
                      <input
                        className="border rounded px-2 py-1 text-xs w-24 focus:ring-1 focus:ring-indigo-400 outline-none"
                        placeholder="Phone"
                        value={newRow.contactNo}
                        onChange={(e) => setNewRow({ ...newRow, contactNo: e.target.value })}
                      />
                    </td>
                    {/* TLC Card */}
                    <td className="px-1 py-1">
                      <input
                        className="border rounded px-2 py-1 text-xs w-20 focus:ring-1 focus:ring-indigo-400 outline-none"
                        placeholder="Card no."
                        value={newRow.tlcCardNo}
                        onChange={(e) => setNewRow({ ...newRow, tlcCardNo: e.target.value })}
                      />
                    </td>
                    {/* Hand Band */}
                    <td className="px-1 py-1">
                      <select
                        className="border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-400 outline-none"
                        value={newRow.handBandColor}
                        onChange={(e) => setNewRow({ ...newRow, handBandColor: e.target.value })}
                      >
                        <option value="">—</option>
                        {HAND_BAND_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    {/* Total */}
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        min={0}
                        className="border rounded px-2 py-1 text-xs w-20 focus:ring-1 focus:ring-indigo-400 outline-none"
                        value={newRow.totalPrice}
                        onChange={(e) => setNewRow({ ...newRow, totalPrice: e.target.value })}
                      />
                    </td>
                    {/* Advance */}
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        min={0}
                        className="border rounded px-2 py-1 text-xs w-20 focus:ring-1 focus:ring-indigo-400 outline-none"
                        value={newRow.advanceAmount}
                        onChange={(e) => setNewRow({ ...newRow, advanceAmount: e.target.value })}
                      />
                    </td>
                    {/* Balance — auto calc */}
                    <td className="px-3 py-2 text-xs font-semibold text-red-600 whitespace-nowrap">
                      ₹{Math.max(0, (Number(newRow.totalPrice) || 0) - (Number(newRow.advanceAmount) || 0)).toLocaleString()}
                    </td>
                    {/* Payment */}
                    <td className="px-1 py-1">
                      <select
                        className="border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-400 outline-none"
                        value={newRow.paymentMode}
                        onChange={(e) => setNewRow({ ...newRow, paymentMode: e.target.value })}
                      >
                        {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </td>
                    {/* Age */}
                    <td className="px-1 py-1">
                      <select
                        className="border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-400 outline-none"
                        value={newRow.ageGroup}
                        onChange={(e) => setNewRow({ ...newRow, ageGroup: e.target.value })}
                      >
                        {AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </td>
                    {/* Status placeholder */}
                    <td className="px-3 py-2 text-xs text-gray-400">—</td>
                    {/* Save / Cancel */}
                    <td className="px-2 py-1 whitespace-nowrap">
                      <div className="flex gap-1">
                        <button
                          onClick={saveNewRow}
                          disabled={savingRow}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {savingRow ? "…" : "✓ Save"}
                        </button>
                        <button
                          onClick={() => setNewRow(null)}
                          className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium hover:bg-gray-300"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {filtered.map((b) => {
                  const bd = safeBreakdown(b.paymentBreakdown);
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedBooking(b)}>
                      <td className="px-3 py-2 font-mono text-xs text-indigo-700 font-bold whitespace-nowrap">{b.bookingId}</td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{b.guestName}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap uppercase">{b.tableId}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{b.bookingDate}</td>
                      <td className="px-3 py-2 text-center">{b.paxCount}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{b.contactNo || "—"}</td>
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
                      <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{b.ageGroup || "—"}</td>
                      <td className="px-3 py-2">
                        {b.arrived ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">✅ In</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">⏳</span>
                        )}
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          {role !== "viewer" && (
                            <button onClick={() => setEditingBooking(b)} className="text-indigo-500 hover:text-indigo-700 text-xs font-bold">Edit</button>
                          )}
                          {role === "admin" && (
                            <button onClick={() => deleteBooking(b.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Del</button>
                          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>

            {/* Dark branding header */}
            <div className="bg-[#0a0a0f] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-base leading-tight">{selectedBooking.guestName}</p>
                <p className="text-xs font-mono text-[#c9a84c] mt-0.5">{selectedBooking.bookingId}</p>
              </div>
              <div className="flex items-center gap-2">
                {role !== "viewer" && (
                  <button
                    onClick={() => { setEditingBooking(selectedBooking); setSelectedBooking(null); }}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold border border-white/20 transition"
                  >✏️ Edit</button>
                )}
                <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-white text-2xl leading-none transition">×</button>
              </div>
            </div>

            {/* QR + Logo side by side */}
            <div className="bg-[#111118] px-5 py-4 flex items-center gap-4">
              {/* QR code in a white frame */}
              <div className="p-2.5 bg-white rounded-xl shadow-lg flex-shrink-0 border-2" style={{ borderColor: "#c9a84c" }}>
                <QRCodeSVG value={selectedBooking.bookingId} size={130} />
              </div>

              {/* Right side: logo + info */}
              <div className="flex flex-col items-center flex-1 gap-2">
                <img src={leelaLogo} alt="The Leela Club" className="h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(201,168,76,0.5)]" />
                <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase text-center" style={{ fontFamily: "serif" }}>The Leela Club</p>
                <div className="mt-1 text-center">
                  {selectedBooking.arrived ? (
                    <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">✅ ARRIVED</span>
                  ) : (
                    <span className="bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">⏳ PENDING</span>
                  )}
                  <p className="text-white/60 text-xs mt-1.5">{selectedBooking.paxCount} Pax • {selectedBooking.bookingDate}</p>
                </div>
              </div>
            </div>

            {/* Booking details grid */}
            <div className="p-4 flex flex-col gap-3">
              <div className="w-full grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Table", selectedBooking.tableId.toUpperCase()],
                  ["Contact", selectedBooking.contactNo],
                  ["Age Group", selectedBooking.ageGroup],
                  ["TLC Card", selectedBooking.tlcCardNo || "—"],
                  ["Total", fmt(selectedBooking.totalPrice)],
                  ["Advance", fmt(selectedBooking.advanceAmount)],
                  ["Balance", fmt(selectedBooking.balanceAmount)],
                  ["Payment", selectedBooking.paymentMode],
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
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex-1 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">🖨️ Print</button>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-60 transition flex items-center justify-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}
                >
                  {sharing ? (
                    <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Generating…</>
                  ) : (
                    <>📤 Share Details</>
                  )}
                </button>
              </div>
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
          showLabel={currentShow}
          onClose={() => setEditingBooking(null)}
          onSuccess={() => { setEditingBooking(null); load(); }}
        />
      )}

      {/* Entry booking modal */}
      {showGeneralEntry && (
        <BookingModal
          tableId="general_entry"
          tableLabel="ENTRY"
          tablePrice=""
          event={event}
          showLabel={currentShow}
          onClose={() => setShowGeneralEntry(false)}
          onSuccess={() => { setShowGeneralEntry(false); load(); }}
        />
      )}

      {/* Cover Charge booking modal */}
      {showCoverCharge && (
        <BookingModal
          tableId="cover_charge"
          tableLabel="COVER CHARGE"
          tablePrice=""
          event={event}
          showLabel={currentShow}
          onClose={() => setShowCoverCharge(false)}
          onSuccess={() => { setShowCoverCharge(false); load(); }}
        />
      )}

      {/* Hidden share card — captured by html2canvas */}
      {selectedBooking && (
        <div
          ref={shareCardRef}
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: "420px",
            backgroundColor: "#0a0a0f",
            fontFamily: "sans-serif",
            overflow: "hidden",
            borderRadius: "16px",
          }}
        >
          {/* Gold top bar */}
          <div style={{ height: "6px", background: "linear-gradient(90deg, #b8860b, #f0d080, #b8860b)" }} />

          {/* Header: logo + name */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 24px 12px", background: "#0a0a0f" }}>
            <img src={leelaLogo} alt="The Leela Club" style={{ height: "80px", objectFit: "contain", marginBottom: "8px" }} />
            <p style={{ color: "#c9a84c", fontWeight: 800, fontSize: "14px", letterSpacing: "4px", textTransform: "uppercase", margin: 0 }}>The Leela Club</p>
          </div>

          {/* Greeting */}
          <div style={{ margin: "0 20px 16px", padding: "14px 16px", backgroundColor: "#141420", borderRadius: "10px", borderLeft: "3px solid #c9a84c" }}>
            <p style={{ color: "#f0d080", fontWeight: 700, fontSize: "15px", margin: "0 0 6px" }}>Reservation Confirmed 🎉</p>
            <p style={{ color: "#94a3b8", fontSize: "11.5px", lineHeight: 1.6, margin: 0 }}>
              Thank you for choosing The Leela Club. Your reservation has been successfully confirmed.
              We look forward to welcoming you. For any assistance, please contact us.
            </p>
          </div>

          {/* QR + key details side by side */}
          <div style={{ margin: "0 20px 16px", display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ padding: "10px", backgroundColor: "#fff", borderRadius: "10px", border: "2px solid #c9a84c", flexShrink: 0 }}>
              <QRCodeCanvas value={selectedBooking.bookingId} size={120} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                ["Booking ID", selectedBooking.bookingId],
                ["Guest", selectedBooking.guestName],
                ["Table", selectedBooking.tableId.toUpperCase()],
                ["Pax", String(selectedBooking.paxCount)],
                ["Date", selectedBooking.bookingDate],
              ].map(([k, v]) => (
                <div key={k} style={{ backgroundColor: "#1a1a2e", borderRadius: "6px", padding: "6px 10px" }}>
                  <span style={{ color: "#64748b", fontSize: "9px", display: "block", textTransform: "uppercase", letterSpacing: "1px" }}>{k}</span>
                  <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "12px" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Extra details row */}
          <div style={{ margin: "0 20px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {[
              ["Contact", selectedBooking.contactNo],
              ["Payment", selectedBooking.paymentMode],
              ["Status", selectedBooking.arrived ? "✅ Arrived" : "⏳ Pending"],
            ].map(([k, v]) => (
              <div key={k} style={{ backgroundColor: "#1a1a2e", borderRadius: "6px", padding: "6px 10px" }}>
                <span style={{ color: "#64748b", fontSize: "9px", display: "block", textTransform: "uppercase", letterSpacing: "1px" }}>{k}</span>
                <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "11px" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Gold bottom bar */}
          <div style={{ height: "6px", background: "linear-gradient(90deg, #b8860b, #f0d080, #b8860b)" }} />
        </div>
      )}
    </div>
  );
}
