import { useState, useEffect, useCallback } from "react";

type TableStatus = "available" | "sold_out";

interface ApiTable {
  id: string;
  status: string;
  price: string;
}

interface TableDef {
  id: string;
  label: string;
  bgColor: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

// Total virtual canvas: 750 wide, 970 tall
const W = 750;
const H = 970;

function pct(val: number, total: number) {
  return `${((val / total) * 100).toFixed(3)}%`;
}

const GOLD = "#283593";
const GOLD_STANDY = "#1565C0";
const VIP_GOLD = "#C62828";
const VIP_BOOTH = "#B8860B";
const F_TABLE = "#C2185B";
const S_TABLE = "#2E7D32";
const D_TABLE = "#4527A0";
const PLATINUM = "#546E7A";

const LAYOUT: TableDef[] = [
  { id: "platinum1", label: "PLATINUM 1", bgColor: PLATINUM, left: 145, top: 55, width: 125, height: 35 },
  { id: "platinum2", label: "PLATINUM 2", bgColor: PLATINUM, left: 480, top: 55, width: 125, height: 35 },
  { id: "gold1", label: "GOLD-1",      bgColor: GOLD,     left: 18,  top: 130, width: 68, height: 45 },
  { id: "gold2", label: "GOLD-2",      bgColor: GOLD,     left: 95,  top: 130, width: 68, height: 45 },
  { id: "gold3", label: "GOLD-3\nVIP", bgColor: VIP_GOLD, left: 175, top: 130, width: 68, height: 45 },
  { id: "gold4", label: "GOLD-4\nVIP", bgColor: VIP_GOLD, left: 477, top: 130, width: 68, height: 45 },
  { id: "gold5", label: "GOLD-5",      bgColor: GOLD,     left: 554, top: 130, width: 68, height: 45 },
  { id: "gold6", label: "GOLD-6",      bgColor: GOLD,     left: 631, top: 130, width: 68, height: 45 },
  { id: "vipl1", label: "VIP-L1", bgColor: VIP_BOOTH, left: 18, top: 194, width: 88, height: 50 },
  { id: "vipl2", label: "VIP-L2", bgColor: VIP_BOOTH, left: 18, top: 258, width: 88, height: 50 },
  { id: "vipl3", label: "VIP-L3", bgColor: VIP_BOOTH, left: 18, top: 322, width: 88, height: 50 },
  { id: "vipl4", label: "VIP-L4", bgColor: VIP_BOOTH, left: 18, top: 386, width: 88, height: 50 },
  { id: "vipl5", label: "VIP-L5", bgColor: VIP_BOOTH, left: 18, top: 450, width: 88, height: 50 },
  { id: "vipl6", label: "VIP-L6", bgColor: VIP_BOOTH, left: 18, top: 514, width: 88, height: 50 },
  { id: "vipl7", label: "VIP-L7", bgColor: VIP_BOOTH, left: 18, top: 578, width: 88, height: 50 },
  { id: "vipr1", label: "VIP-R1", bgColor: VIP_BOOTH, left: 627, top: 194, width: 88, height: 50 },
  { id: "vipr2", label: "VIP-R2", bgColor: VIP_BOOTH, left: 627, top: 258, width: 88, height: 50 },
  { id: "vipr3", label: "VIP-R3", bgColor: VIP_BOOTH, left: 627, top: 322, width: 88, height: 50 },
  { id: "vipr4", label: "VIP-R4", bgColor: VIP_BOOTH, left: 627, top: 386, width: 88, height: 50 },
  { id: "vipr5", label: "VIP-R5", bgColor: VIP_BOOTH, left: 627, top: 450, width: 88, height: 50 },
  { id: "vipr6", label: "VIP-R6", bgColor: VIP_BOOTH, left: 627, top: 514, width: 88, height: 50 },
  { id: "f7",  label: "F-7",  bgColor: F_TABLE, left: 188, top: 194, width: 48, height: 40 },
  { id: "f12", label: "F-12", bgColor: F_TABLE, left: 245, top: 194, width: 48, height: 40 },
  { id: "f8",  label: "F-8",  bgColor: F_TABLE, left: 188, top: 250, width: 48, height: 40 },
  { id: "f9",  label: "F-9",  bgColor: F_TABLE, left: 188, top: 308, width: 48, height: 40 },
  { id: "f10", label: "F-10", bgColor: F_TABLE, left: 188, top: 365, width: 48, height: 40 },
  { id: "f11", label: "F-11", bgColor: F_TABLE, left: 188, top: 422, width: 48, height: 40 },
  { id: "f6",  label: "F-6",  bgColor: F_TABLE, left: 126, top: 293, width: 48, height: 40 },
  { id: "f5",  label: "F-5",  bgColor: F_TABLE, left: 126, top: 349, width: 48, height: 40 },
  { id: "f4",  label: "F-4",  bgColor: F_TABLE, left: 126, top: 405, width: 48, height: 40 },
  { id: "f3",  label: "F-3",  bgColor: F_TABLE, left: 126, top: 497, width: 48, height: 40 },
  { id: "f2",  label: "F-2",  bgColor: F_TABLE, left: 126, top: 555, width: 48, height: 40 },
  { id: "f1",  label: "F-1",  bgColor: F_TABLE, left: 126, top: 615, width: 48, height: 40 },
  { id: "f20", label: "F-20", bgColor: F_TABLE, left: 558, top: 293, width: 48, height: 40 },
  { id: "f21", label: "F-21", bgColor: F_TABLE, left: 558, top: 349, width: 48, height: 40 },
  { id: "f22", label: "F-22", bgColor: F_TABLE, left: 558, top: 405, width: 48, height: 40 },
  { id: "f23", label: "F-23", bgColor: F_TABLE, left: 558, top: 497, width: 48, height: 40 },
  { id: "f24", label: "F-24", bgColor: F_TABLE, left: 558, top: 555, width: 48, height: 40 },
  { id: "f25", label: "F-25", bgColor: F_TABLE, left: 558, top: 615, width: 48, height: 40 },
  { id: "f14", label: "F-14", bgColor: F_TABLE, left: 420, top: 194, width: 48, height: 40 },
  { id: "f15", label: "F-15", bgColor: F_TABLE, left: 480, top: 194, width: 48, height: 40 },
  { id: "f16", label: "F-16", bgColor: F_TABLE, left: 480, top: 250, width: 48, height: 40 },
  { id: "f17", label: "F-17", bgColor: F_TABLE, left: 480, top: 308, width: 48, height: 40 },
  { id: "f18", label: "F-18", bgColor: F_TABLE, left: 480, top: 365, width: 48, height: 40 },
  { id: "f19", label: "F-19", bgColor: F_TABLE, left: 480, top: 422, width: 48, height: 40 },
  { id: "s1",  label: "S1",   bgColor: S_TABLE, left: 302, top: 417, width: 54, height: 44 },
  { id: "s2",  label: "S2",   bgColor: S_TABLE, left: 375, top: 417, width: 54, height: 44 },
  { id: "s5",  label: "S5",   bgColor: S_TABLE, left: 338, top: 471, width: 54, height: 44 },
  { id: "s3",  label: "S3",   bgColor: S_TABLE, left: 302, top: 526, width: 54, height: 44 },
  { id: "s4",  label: "S4",   bgColor: S_TABLE, left: 375, top: 526, width: 54, height: 44 },
  { id: "d1",  label: "D-1",  bgColor: D_TABLE, left: 145, top: 706, width: 54, height: 44 },
  { id: "d2",  label: "D-2",  bgColor: D_TABLE, left: 203, top: 706, width: 54, height: 44 },
  { id: "d3",  label: "D-3",  bgColor: D_TABLE, left: 261, top: 706, width: 54, height: 44 },
  { id: "d4",  label: "D-4",  bgColor: D_TABLE, left: 319, top: 706, width: 54, height: 44 },
  { id: "d5",  label: "D-5",  bgColor: D_TABLE, left: 377, top: 706, width: 54, height: 44 },
  { id: "d6",  label: "D-6",  bgColor: D_TABLE, left: 435, top: 706, width: 54, height: 44 },
  { id: "d7",  label: "D-7",  bgColor: D_TABLE, left: 493, top: 706, width: 54, height: 44 },
  { id: "d8",  label: "D-8",  bgColor: D_TABLE, left: 551, top: 706, width: 54, height: 44 },
  { id: "d9",  label: "D-9",  bgColor: D_TABLE, left: 493, top: 778, width: 54, height: 44 },
  { id: "d10", label: "D-10", bgColor: D_TABLE, left: 551, top: 778, width: 54, height: 44 },
  { id: "rd1", label: "RD-1", bgColor: "#8B6914", left: 252, top: 835, width: 108, height: 64 },
];

const CHETAS_LAYOUT: TableDef[] = [
  { id: "goldstandy1", label: "GOLD\nSTANDY 1", bgColor: GOLD_STANDY, left: 249, top: 130, width: 100, height: 45 },
  { id: "goldstandy2", label: "GOLD\nSTANDY 2", bgColor: GOLD_STANDY, left: 373, top: 130, width: 100, height: 45 },
];

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

type EventKey = keyof typeof EVENT_CONFIG;

export default function ReservationMap() {
  const [event, setEvent] = useState<EventKey>("chetas");
  const [tableData, setTableData] = useState<Record<string, ApiTable>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState>({ tableId: null, value: "" });
  const [selected, setSelected] = useState<string | null>(null);

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

  const switchEvent = (ev: EventKey) => {
    if (ev !== event) setEvent(ev);
  };

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
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      {/* Event selector */}
      <div className="flex justify-center gap-3 mb-5">
        <button
          onClick={() => switchEvent("chetas")}
          className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wide transition-all shadow ${
            event === "chetas"
              ? "bg-indigo-700 text-white shadow-indigo-300 scale-105"
              : "bg-white text-gray-500 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          🎧 DJ Chetas Night
        </button>
        <button
          onClick={() => switchEvent("normal")}
          className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wide transition-all shadow ${
            event === "normal"
              ? "bg-gray-800 text-white shadow-gray-400 scale-105"
              : "bg-white text-gray-500 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          🎵 Normal Night
        </button>
      </div>

      <div className="text-center mb-5">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 uppercase">
          {EVENT_CONFIG[event].label}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Table Reservation Management &mdash; Click any table to select, then toggle status or edit price
        </p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4 mb-4 flex-wrap">
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
            <button
              className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
              onClick={() => setSelected(null)}
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Floor Map */}
      <div className="flex justify-center">
        <div
          className="relative bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden"
          style={{ width: "min(92vw, 700px)" }}
        >
          <div style={{ paddingBottom: `${(970 / 750) * 100}%`, position: "relative" }}>
            <div className="absolute inset-0">
              {/* LED screen */}
              <div
                className="absolute flex items-center justify-center border border-gray-300 rounded bg-white text-gray-500 font-semibold"
                style={{ top: pct(8, H), left: pct(210, W), width: pct(330, W), height: pct(30, H), fontSize: "min(1.6vw, 12px)" }}
              >
                LED screen
              </div>

              {/* DJ table */}
              <div
                className="absolute flex items-center justify-center border border-gray-400 rounded bg-white text-gray-600 font-semibold"
                style={{ top: pct(55, H), left: pct(290, W), width: pct(170, W), height: pct(35, H), fontSize: "min(1.6vw, 12px)" }}
              >
                DJ table
              </div>

              {/* Performance stage */}
              <div
                className="absolute flex items-center justify-center bg-gray-100 border border-gray-300 rounded"
                style={{ top: pct(124, H), left: "50%", transform: "translateX(-50%)", width: pct(42, W), height: pct(218, H) }}
              >
                <span
                  className="text-gray-500 font-bold tracking-widest select-none"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "min(1.1vw, 9px)", letterSpacing: "0.08em" }}
                >
                  PERFORMANCE STAGE
                </span>
              </div>

              {/* Lift stage circle */}
              <div
                className="absolute flex items-center justify-center rounded-full bg-gray-100 border border-gray-300 text-gray-500 font-semibold text-center select-none"
                style={{ top: pct(290, H), left: "50%", transform: "translateX(-50%)", width: pct(110, W), height: pct(110, H), fontSize: "min(1.4vw, 11px)" }}
              >
                LIFT<br />STAGE
              </div>

              {/* D zone border */}
              <div
                className="absolute border-2 border-dashed border-gray-400 rounded-lg pointer-events-none"
                style={{ top: pct(683, H), left: pct(145, W), width: pct(460, W), height: pct(128, H) }}
              />

              {/* Lift box */}
              <div
                className="absolute flex items-center justify-center border border-gray-400 rounded bg-white text-gray-500 font-semibold"
                style={{ top: pct(653, H), right: pct(6, W), width: pct(35, W), height: pct(80, H), fontSize: "min(1.2vw, 10px)" }}
              >
                <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>LIFT</span>
              </div>

              {/* Tables */}
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
                        backgroundColor: isSold ? "#6b7280" : t.bgColor,
                        opacity: isSold ? 0.7 : 1,
                        boxShadow: isSel ? "0 0 0 3px #fbbf24" : "inset 0 1px 0 rgba(255,255,255,0.2)",
                      }}
                    >
                      <span
                        className="text-white font-bold leading-tight text-center"
                        style={{ fontSize: "min(1.4vw, 10px)", lineHeight: 1.2, padding: "1px 2px" }}
                      >
                        {t.label.split("\n").map((line, i) => (
                          <span key={i} style={{ display: "block" }}>{line}</span>
                        ))}
                      </span>
                      {isSold && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <line x1="10" y1="10" x2="90" y2="90" stroke="white" strokeWidth="4" opacity="0.6" />
                          <line x1="90" y1="10" x2="10" y2="90" stroke="white" strokeWidth="4" opacity="0.6" />
                        </svg>
                      )}
                    </div>
                    <div
                      className="absolute w-full text-center font-medium text-gray-700"
                      style={{ top: "calc(100% + 2px)", fontSize: "min(1.2vw, 9px)", lineHeight: 1.3 }}
                    >
                      {priceLines.map((line, i) => <div key={i}>{line}</div>)}
                    </div>
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
  );
}
