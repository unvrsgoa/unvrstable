import { useState, useEffect, useCallback } from "react";
import BookingModal, { type Booking } from "./BookingModal";
import venueImage from "@assets/Untitled_design_(20)_1776353813183.png";
import soldOutImg from "@assets/Untitled_(1)_1776301600692.png";

type EventKey = "chetas" | "normal";

type TableStatus = "available" | "sold_out";

interface ApiTable {
  id: string;
  status: string;
  price: string;
}

interface TableDef {
  fontSize?: string;
  id: string;
  label: string;
  bgColor: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

// Canvas matches actual image aspect ratio: 3645×4977 → W=750, H=1024 (ratio 1.3654)
const W = 750;
const H = 1024;

function pct(val: number, total: number) {
  return `${((val / total) * 100).toFixed(3)}%`;
}

const GOLD = "transparent";
const GOLD_STANDY = "transparent";
const VIP_GOLD = "transparent";
const VIP_BOOTH = "transparent";
const F_TABLE = "transparent";
const S_TABLE = "transparent";
const D_TABLE = "transparent";
const PLATINUM = "transparent";

// Pixel-accurate coordinates — image 3645×4977, canvas W=750 H=1024 (same ratio 1.3654)
// All Y values traced proportionally: yCanvas = (yImage/4977) * 1024
// Image zones: header 0–87 | top tables 88–236 | side walls 237–875 | bottom 875–1024
const LAYOUT: TableDef[] = [
  // ── PLATINUM (wide sections flanking the centre LED) ──
  { id: "platinum1", label: "PLATINUM 1", bgColor: PLATINUM, left: 138, top: 96,  width: 116, height: 62 },
  { id: "platinum2", label: "PLATINUM 2", bgColor: PLATINUM, left: 516, top: 96,  width: 116, height: 62 },

  // ── GOLD row — 3 left + 3 right ──
  { id: "gold1", label: "GOLD 1",      bgColor: GOLD,     left:  60, top: 184, width: 82, height: 55 },
  { id: "gold2", label: "GOLD 2",      bgColor: GOLD,     left: 147, top: 184, width: 82, height: 55 },
  { id: "gold3", label: "GOLD\nVIP 3", bgColor: VIP_GOLD, left: 234, top: 184, width: 82, height: 55 },
  { id: "gold4", label: "GOLD\nVIP 4", bgColor: VIP_GOLD, left: 467, top: 184, width: 72, height: 55 },
  { id: "gold5", label: "GOLD 5",      bgColor: GOLD,     left: 544, top: 184, width: 72, height: 55 },
  { id: "gold6", label: "GOLD 6",      bgColor: GOLD,     left: 621, top: 184, width: 72, height: 55 },

  // ── VIP LEFT — 7 sections × 87 px = 609 px total (y 252–846) ──
  { id: "vipl1", label: "VIP L1", bgColor: VIP_BOOTH, left: 30, top: 252, width: 124, height: 87 },
  { id: "vipl2", label: "VIP L2", bgColor: VIP_BOOTH, left: 30, top: 339, width: 124, height: 87 },
  { id: "vipl3", label: "VIP L3", bgColor: VIP_BOOTH, left: 30, top: 426, width: 124, height: 87 },
  { id: "vipl4", label: "VIP L4", bgColor: VIP_BOOTH, left: 30, top: 513, width: 124, height: 87 },
  { id: "vipl5", label: "VIP L5", bgColor: VIP_BOOTH, left: 30, top: 600, width: 124, height: 87 },
  { id: "vipl6", label: "VIP L6", bgColor: VIP_BOOTH, left: 30, top: 687, width: 124, height: 87 },
  { id: "vipl7", label: "VIP L7", bgColor: VIP_BOOTH, left: 30, top: 774, width: 124, height: 87 },

  // ── VIP RIGHT — 6 sections × 87 px = 522 px total (y 222–744) ──
  { id: "vipr1", label: "VIP R1", bgColor: VIP_BOOTH, left: 605, top: 252, width: 124, height: 87 },
  { id: "vipr2", label: "VIP R2", bgColor: VIP_BOOTH, left: 605, top: 339, width: 124, height: 87 },
  { id: "vipr3", label: "VIP R3", bgColor: VIP_BOOTH, left: 605, top: 426, width: 124, height: 87 },
  { id: "vipr4", label: "VIP R4", bgColor: VIP_BOOTH, left: 605, top: 513, width: 124, height: 87 },
  { id: "vipr5", label: "VIP R5", bgColor: VIP_BOOTH, left: 605, top: 600, width: 124, height: 87 },
  { id: "vipr6", label: "VIP R6", bgColor: VIP_BOOTH, left: 605, top: 687, width: 124, height: 87 },

  // ── F-TABLES LEFT ──
  { id: "f7",  label: "F7",  bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 235, top: 268, width: 40, height: 40 },
  { id: "f12", label: "F12", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 287, top: 263, width: 40, height: 40 },
  { id: "f8",  label: "F8",  bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 235, top: 329, width: 40, height: 40 },
  { id: "f6",  label: "F6",  bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 173, top: 368, width: 40, height: 40 },
  { id: "f9",  label: "F9",  bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 235, top: 396, width: 40, height: 40 },
  { id: "f5",  label: "F5",  bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 173, top: 427, width: 40, height: 40 },
  { id: "f10", label: "F10", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 235, top: 470, width: 40, height: 40 },
  { id: "f4",  label: "F4",  bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 173, top: 485, width: 40, height: 40 },
  { id: "f11", label: "F11", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 235, top: 543, width: 40, height: 40 },
  { id: "f3",  label: "F3",  bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 170, top: 630, width: 40, height: 40 },
  { id: "f2",  label: "F2",  bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 170, top: 688, width: 40, height: 40 },
  { id: "f1",  label: "F1",  bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 170, top: 746, width: 40, height: 40 },

  // ── F-TABLES RIGHT (mirror) ──
  { id: "f14", label: "F14", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 449, top: 263, width: 40, height: 40 },
  { id: "f15", label: "F15", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 506, top: 263, width: 40, height: 40 },
  { id: "f16", label: "F16", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 506, top: 334, width: 40, height: 40 },
  { id: "f17", label: "F17", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 506, top: 401, width: 40, height: 40 },
  { id: "f20", label: "F20", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 558, top: 353, width: 40, height: 40 },
  { id: "f18", label: "F18", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 506, top: 475, width: 40, height: 40 },
  { id: "f21", label: "F21", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 558, top: 419, width: 40, height: 40 },
  { id: "f19", label: "F19", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 506, top: 548, width: 40, height: 40 },
  { id: "f22", label: "F22", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 558, top: 485, width: 40, height: 40 },
  { id: "f23", label: "F23", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 558, top: 611, width: 40, height: 40 },
  { id: "f24", label: "F24", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 558, top: 669, width: 40, height: 40 },
  { id: "f25", label: "F25", bgColor: F_TABLE, fontSize: "min(1.2vw,9px)", left: 558, top: 727, width: 40, height: 40 },

  // ── S-TABLES (centre floor 4-row × 2-col) ──
  { id: "s1", label: "S1", bgColor: S_TABLE, fontSize: "min(1.2vw,9px)", left: 316, top: 516, width: 42, height: 40 },
  { id: "s2", label: "S2", bgColor: S_TABLE, fontSize: "min(1.2vw,9px)", left: 365, top: 516, width: 42, height: 40 },
  { id: "s3", label: "S3", bgColor: S_TABLE, fontSize: "min(1.2vw,9px)", left: 414, top: 516, width: 42, height: 40 },
  { id: "s4", label: "S4", bgColor: S_TABLE, fontSize: "min(1.2vw,9px)", left: 316, top: 568, width: 42, height: 40 },
  { id: "s5", label: "S5", bgColor: S_TABLE, fontSize: "min(1.2vw,9px)", left: 365, top: 568, width: 42, height: 40 },
  { id: "s6", label: "S6", bgColor: S_TABLE, fontSize: "min(1.2vw,9px)", left: 414, top: 568, width: 42, height: 40 },

  // ── D-TABLES — row of 8 across the bottom ──
  { id: "d1",  label: "D1",  bgColor: D_TABLE, fontSize: "min(1.2vw,9px)", left: 259, top: 807, width: 38, height: 38 },
  { id: "d2",  label: "D2",  bgColor: D_TABLE, fontSize: "min(1.2vw,9px)", left: 302, top: 807, width: 38, height: 38 },
  { id: "d3",  label: "D3",  bgColor: D_TABLE, fontSize: "min(1.2vw,9px)", left: 345, top: 807, width: 38, height: 38 },
  { id: "d4",  label: "D4",  bgColor: D_TABLE, fontSize: "min(1.2vw,9px)", left: 388, top: 807, width: 38, height: 38 },
  { id: "d5",  label: "D5",  bgColor: D_TABLE, fontSize: "min(1.2vw,9px)", left: 431, top: 807, width: 38, height: 38 },
  { id: "d6",  label: "D6",  bgColor: D_TABLE, fontSize: "min(1.2vw,9px)", left: 474, top: 807, width: 38, height: 38 },
  { id: "d7",  label: "D7",  bgColor: D_TABLE, fontSize: "min(1.2vw,9px)", left: 517, top: 807, width: 38, height: 38 },
  { id: "d8",  label: "D8",  bgColor: D_TABLE, fontSize: "min(1.2vw,9px)", left: 560, top: 807, width: 38, height: 38 },
  // D9 & D10 — lower-right pocket
  { id: "d9",  label: "D9",  bgColor: D_TABLE, fontSize: "min(1.2vw,9px)", left: 518, top: 866, width: 38, height: 38 },
  { id: "d10", label: "D10", bgColor: D_TABLE, fontSize: "min(1.2vw,9px)", left: 562, top: 866, width: 38, height: 38 },

  // ── ROYAL DIAMOND 1 ──
  { id: "rd1", label: "ROYAL\nDIAMOND 1", bgColor: "transparent", left: 240, top: 892, width: 110, height: 95 },
];

const CHETAS_LAYOUT: TableDef[] = [];

interface EditState {
  tableId: string | null;
  value: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchTables(event: string): Promise<ApiTable[]> {
  const res = await fetch(`${BASE}/api/tables?event=${event}`);
  if (!res.ok) throw new Error("Failed to fetch tables");
  return res.json();
}

async function patchTable(id: string, data: { status?: string; price?: string }, event: string): Promise<ApiTable> {
  const res = await fetch(`${BASE}/api/tables/${id}?event=${event}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update table");
  return res.json();
}

const EVENT_CONFIG = {
  chetas: { label: "DJ CHETAS NIGHT", subtitle: "Special Event — Table Reservation Management" },
  normal: { label: "NORMAL NIGHT",    subtitle: "Regular Night — Table Reservation Management" },
} as const;

interface Props {
  event: EventKey;
  onEventChange: (ev: EventKey) => void;
  role?: string;
  currentShow?: string;
  normalEventName?: string;
}

export default function ReservationMap({ event, onEventChange, role = "admin", currentShow = "Show 1", normalEventName = "Normal Night" }: Props) {
  const [tableData, setTableData] = useState<Record<string, ApiTable>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState>({ tableId: null, value: "" });
  const [selected, setSelected] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const loadTables = useCallback(async (ev: EventKey) => {
    try {
      const rows = await fetchTables(ev);
      const map: Record<string, ApiTable> = {};
      rows.forEach((r) => { map[r.id] = r; });
      setTableData(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setTableData({});
    setSelected(null);
    setEditing({ tableId: null, value: "" });
    loadTables(event);
    const interval = setInterval(() => loadTables(event), 5000);
    return () => clearInterval(interval);
  }, [event, loadTables]);

  const toggleStatus = async (id: string) => {
    const current = tableData[id];
    if (!current) return;
    const next = current.status === "available" ? "sold_out" : "available";
    setTableData((prev) => ({ ...prev, [id]: { ...current, status: next } }));
    try {
      const updated = await patchTable(id, { status: next }, event);
      setTableData((prev) => ({ ...prev, [id]: updated }));
    } catch {
      setTableData((prev) => ({ ...prev, [id]: current }));
    }
  };

  const markAllAvailable = async () => {
    const soldIds = activeLayout
      .map((t) => t.id)
      .filter((id) => tableData[id]?.status === "sold_out");
    if (soldIds.length === 0) return;
    if (!confirm(`Mark all ${soldIds.length} sold-out table(s) as Available?`)) return;
    // Optimistic update
    setTableData((prev) => {
      const next = { ...prev };
      soldIds.forEach((id) => { next[id] = { ...next[id], status: "available" }; });
      return next;
    });
    try {
      await Promise.all(soldIds.map((id) => patchTable(id, { status: "available" }, event)));
      await loadTables(event);
    } catch {
      await loadTables(event);
    }
  };

  const startEdit = (id: string, price: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing({ tableId: id, value: price });
  };

  const commitEdit = async () => {
    const { tableId, value } = editing;
    setEditing({ tableId: null, value: "" });
    if (!tableId) return;
    const current = tableData[tableId];
    if (!current) return;
    setTableData((prev) => ({ ...prev, [tableId]: { ...current, price: value } }));
    try {
      const updated = await patchTable(tableId, { price: value }, event);
      setTableData((prev) => ({ ...prev, [tableId]: updated }));
    } catch {
      setTableData((prev) => ({ ...prev, [tableId]: current }));
    }
  };

  const handleTableClick = (id: string) => {
    setSelected(id === selected ? null : id);
    setBookingToEdit(null);
  };

  const openEditBooking = async () => {
    if (!selected) return;
    setLoadingEdit(true);
    try {
      const res = await fetch(`${BASE}/api/bookings/by-table/${selected}?event=${event}&show=${encodeURIComponent(currentShow)}`);
      const data = await res.json();
      setBookingToEdit(data || null);
    } catch { setBookingToEdit(null); }
    finally { setLoadingEdit(false); }
  };

  const activeLayout = event === "chetas" ? [...LAYOUT, ...CHETAS_LAYOUT] : LAYOUT;
  const layoutIds = new Set(activeLayout.map((t) => t.id));
  const availableCount = Object.values(tableData).filter((t) => layoutIds.has(t.id) && t.status === "available").length;
  const soldOutCount = Object.values(tableData).filter((t) => layoutIds.has(t.id) && t.status === "sold_out").length;
  const selectedLayout = activeLayout.find((t) => t.id === selected);
  const selectedData = selected ? tableData[selected] : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Loading table map…</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      {/* Event selector */}
      <div className="flex justify-center gap-3 mb-5">
        <button
          onClick={() => onEventChange("chetas")}
          className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wide transition-all shadow ${
            event === "chetas"
              ? "bg-indigo-700 text-white shadow-indigo-300 scale-105"
              : "bg-white text-gray-500 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          🎧 DJ Chetas Night
        </button>
        <button
          onClick={() => onEventChange("normal")}
          className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wide transition-all shadow ${
            event === "normal"
              ? "bg-gray-800 text-white shadow-gray-400 scale-105"
              : "bg-white text-gray-500 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          🎵 {normalEventName}
        </button>
      </div>

      <div className="text-center mb-5">
        <p className="text-sm text-gray-500">
          Floor Tables: Up to 6 persons &bull; Gold &amp; VIP Tables: Up to 8 persons &bull; Platinum Tables: Up to 12 persons
        </p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4 mb-4 flex-wrap items-center">
        <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm border">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold">{availableCount} Available</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm border">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm font-semibold">{soldOutCount} Sold Out</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm border">
          <span className="text-sm font-semibold">{activeLayout.length} Total Tables</span>
        </div>
        {role !== "viewer" && soldOutCount > 0 && (
          <button
            onClick={markAllAvailable}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-sm transition"
          >
            ✅ Mark All Available
          </button>
        )}
      </div>

      {/* Action panel */}
      {selectedLayout && selectedData && (
        <div className="flex justify-center mb-4">
          <div className="bg-white rounded-xl shadow-md border px-6 py-4 flex items-center gap-4 flex-wrap justify-center">
            <div>
              <span className="text-xs text-gray-400 block">Selected</span>
              <span className="font-bold text-gray-800 text-lg">{selectedLayout.label.replace("\n", " ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Price:</span>
              {editing.tableId === selectedLayout.id ? (
                <input
                  className="border rounded px-2 py-1 text-sm w-28 font-semibold focus:ring-2 focus:ring-blue-400 outline-none"
                  value={editing.value}
                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                  onBlur={commitEdit}
                  onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                  autoFocus
                />
              ) : (
                <button
                  className="text-sm font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800"
                  onClick={(e) => startEdit(selectedLayout.id, selectedData.price, e)}
                  title="Click to edit price"
                >
                  {selectedData.price.replace("\n", " ")}
                </button>
              )}
            </div>
            <button
              className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition shadow-sm ${
                selectedData.status === "available"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
              onClick={() => toggleStatus(selectedLayout.id)}
            >
              {selectedData.status === "available" ? "Mark Sold Out" : "Mark Available"}
            </button>
            {role !== "viewer" && (
              <button
                className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                onClick={() => setShowBooking(true)}
              >
                📝 Book Table
              </button>
            )}
            {role !== "viewer" && selectedData.status === "sold_out" && (
              <button
                className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm disabled:opacity-50"
                onClick={openEditBooking}
                disabled={loadingEdit}
              >
                {loadingEdit ? "Loading…" : "✏️ Edit Booking"}
              </button>
            )}
            <button
              className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
              onClick={() => setSelected(null)}
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Floor Map — 3D venue image with interactive table overlays */}
      <div className="flex justify-center">
        <div
          className="relative rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: "min(92vw, 750px)" }}
        >
          <div style={{ paddingBottom: `${(H / W) * 100}%`, position: "relative" }}>
            {/* Floor plan image — buttons are overlaid at traced positions */}
            <img
              src={venueImage}
              alt="The Leela Club — Floor Plan"
              className="absolute w-full h-full"
              style={{ objectFit: "fill", zIndex: 0, display: "block", top: 0, left: "5px" }}
              draggable={false}
            />

            {/* Table buttons overlaid on the image */}
            <div className="absolute inset-0" style={{ zIndex: 1 }}>
              {activeLayout.map((t) => {
                const data = tableData[t.id];
                const isSold = data?.status === "sold_out";
                const isSel = selected === t.id;
                const priceLines = (data?.price ?? "").split("\n");

                return (
                  <div
                    key={t.id}
                    className="absolute cursor-pointer"
                    style={{ top: pct(t.top, H), left: pct(t.left, W), width: pct(t.width, W), height: pct(t.height, H) }}
                    onClick={() => handleTableClick(t.id)}
                  >
                    <div
                      className="absolute inset-0 rounded-md flex flex-col items-center justify-center transition-all"
                      style={{
                        backgroundColor: "transparent",
                        boxShadow: isSel ? "0 0 8px 3px rgba(251,191,36,0.5)" : "none",
                        backdropFilter: "none",
                        outline: "none",
                        border: "none",
                      }}
                    >
                      <span
                        className="text-white font-bold leading-tight text-center drop-shadow opacity-0"
                        style={{ fontSize: t.fontSize ?? "min(1.4vw, 10px)", lineHeight: 1.2, padding: "1px 2px" }}
                      >
                        {t.label.split("\n").map((line, i) => (
                          <span key={i} style={{ display: "block" }}>{line}</span>
                        ))}
                      </span>
                      {isSold && (
                        <img
                          src={soldOutImg}
                          alt="Sold Out"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          style={{ padding: "2px" }}
                        />
                      )}
                    </div>
                    {!isSold && (
                      <div
                        className="absolute w-full text-center font-bold"
                        style={{
                          ...(t.id.startsWith("vipl")
                            ? { top: "50%", transform: "translateY(-50%)" }
                            : t.id.startsWith("vipr")
                            ? { top: "50%", transform: "translateY(-50%)" }
                            : t.id.startsWith("f")
                            ? { top: "calc(100% + 2px)" }
                            : { top: "calc(100% + 2px)" }),
                          fontSize: "min(1.6vw, 11px)",
                          lineHeight: 1.3,
                          color: "#FFD700",
                          fontWeight: 900,
                          textShadow: "0 0 4px #000, 0 0 4px #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {priceLines.map((line, i) => <div key={i}>{line}</div>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-5 mt-6 flex-wrap">
        {[
          { color: PLATINUM, label: "Platinum Tables" },
          { color: GOLD, label: "Gold Tables" },
          { color: VIP_GOLD, label: "VIP Gold" },
          { color: VIP_BOOTH, label: "VIP Booths" },
          { color: F_TABLE, label: "F-Series" },
          { color: S_TABLE, label: "S-Series" },
          { color: D_TABLE, label: "D-Series" },
          { color: "#6b7280", label: "Sold Out" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-600 font-medium">{label}</span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-3">
        Changes sync live across all devices &bull; Auto-refreshes every 5 seconds
      </p>

    </div>

    {showBooking && selectedLayout && selectedData && (
      <BookingModal
        tableId={selectedLayout.id}
        tableLabel={selectedLayout.label}
        tablePrice={selectedData.price}
        event={event}
        showLabel={currentShow}
        onClose={() => setShowBooking(false)}
        onSuccess={() => {
          setShowBooking(false);
          if (selectedData.status === "available") toggleStatus(selectedLayout.id);
        }}
      />
    )}

    {bookingToEdit && selectedLayout && (
      <BookingModal
        mode="edit"
        existingBooking={bookingToEdit}
        tableId={selectedLayout.id}
        tableLabel={selectedLayout.label}
        tablePrice=""
        event={event}
        showLabel={currentShow}
        onClose={() => setBookingToEdit(null)}
        onSuccess={() => setBookingToEdit(null)}
      />
    )}
    </>
  );
}
