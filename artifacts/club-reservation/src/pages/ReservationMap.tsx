import { useState, useRef } from "react";

type TableStatus = "available" | "sold_out";

interface TableDef {
  id: string;
  label: string;
  price: string;
  status: TableStatus;
  bgColor: string;
  // Position as percentage of container (0-100)
  top: number;
  left: number;
  width: number;
  height: number;
  textSize?: "xs" | "sm" | "base";
}

// Total virtual canvas: 750 wide, 970 tall → positions are % of those
const W = 750;
const H = 970;

function pct(val: number, total: number) {
  return `${((val / total) * 100).toFixed(3)}%`;
}

const GOLD = "#283593";
const VIP_GOLD = "#C62828";
const VIP_BOOTH = "#B8860B";
const F_TABLE = "#C2185B";
const S_TABLE = "#2E7D32";
const D_TABLE = "#4527A0";

// Coordinates derived from image analysis (pixel positions in a ~750x970 canvas)
const TABLES: TableDef[] = [
  // GOLD row top
  { id: "gold1", label: "GOLD-1", price: "1.5 LAC", status: "available", bgColor: GOLD, left: 18, top: 130, width: 68, height: 45 },
  { id: "gold2", label: "GOLD-2", price: "2 LAC",   status: "available", bgColor: GOLD, left: 95, top: 130, width: 68, height: 45 },
  { id: "gold3", label: "GOLD-3\nVIP", price: "3 LAC", status: "available", bgColor: VIP_GOLD, left: 175, top: 130, width: 68, height: 45 },
  { id: "gold4", label: "GOLD-4\nVIP", price: "3 LAC", status: "available", bgColor: VIP_GOLD, left: 477, top: 130, width: 68, height: 45 },
  { id: "gold5", label: "GOLD-5", price: "2 LAC",   status: "available", bgColor: GOLD, left: 554, top: 130, width: 68, height: 45 },
  { id: "gold6", label: "GOLD-6", price: "1.5 LAC", status: "available", bgColor: GOLD, left: 631, top: 130, width: 68, height: 45 },

  // VIP Left column
  { id: "vipl1", label: "VIP-L1", price: "1.5 LAC", status: "available", bgColor: VIP_BOOTH, left: 18, top: 194, width: 88, height: 50 },
  { id: "vipl2", label: "VIP-L2", price: "1.5 LAC", status: "available", bgColor: VIP_BOOTH, left: 18, top: 258, width: 88, height: 50 },
  { id: "vipl3", label: "VIP-L3", price: "1 LAC",   status: "available", bgColor: VIP_BOOTH, left: 18, top: 322, width: 88, height: 50 },
  { id: "vipl4", label: "VIP-L4", price: "1 LAC",   status: "available", bgColor: VIP_BOOTH, left: 18, top: 386, width: 88, height: 50 },
  { id: "vipl5", label: "VIP-L5", price: "1 LAC",   status: "available", bgColor: VIP_BOOTH, left: 18, top: 450, width: 88, height: 50 },
  { id: "vipl6", label: "VIP-L6", price: "1 LAC",   status: "available", bgColor: VIP_BOOTH, left: 18, top: 514, width: 88, height: 50 },
  { id: "vipl7", label: "VIP-L7", price: "1 LAC",   status: "available", bgColor: VIP_BOOTH, left: 18, top: 578, width: 88, height: 50 },

  // VIP Right column
  { id: "vipr1", label: "VIP-R1", price: "1.5 LAC", status: "available", bgColor: VIP_BOOTH, left: 627, top: 194, width: 88, height: 50 },
  { id: "vipr2", label: "VIP-R2", price: "1.5 LAC", status: "available", bgColor: VIP_BOOTH, left: 627, top: 258, width: 88, height: 50 },
  { id: "vipr3", label: "VIP-R3", price: "1 LAC",   status: "available", bgColor: VIP_BOOTH, left: 627, top: 322, width: 88, height: 50 },
  { id: "vipr4", label: "VIP-R4", price: "1 LAC",   status: "available", bgColor: VIP_BOOTH, left: 627, top: 386, width: 88, height: 50 },
  { id: "vipr5", label: "VIP-R5", price: "1 LAC",   status: "available", bgColor: VIP_BOOTH, left: 627, top: 450, width: 88, height: 50 },
  { id: "vipr6", label: "VIP-R6", price: "1 LAC",   status: "available", bgColor: VIP_BOOTH, left: 627, top: 514, width: 88, height: 50 },

  // F left column (near performance stage)
  { id: "f7",  label: "F-7",  price: "70K", status: "available", bgColor: F_TABLE, left: 188, top: 194, width: 48, height: 40 },
  { id: "f12", label: "F-12", price: "70K", status: "available", bgColor: F_TABLE, left: 245, top: 194, width: 48, height: 40 },
  { id: "f8",  label: "F-8",  price: "70K", status: "available", bgColor: F_TABLE, left: 188, top: 250, width: 48, height: 40 },
  { id: "f9",  label: "F-9",  price: "50K", status: "available", bgColor: F_TABLE, left: 188, top: 308, width: 48, height: 40 },
  { id: "f10", label: "F-10", price: "50K", status: "available", bgColor: F_TABLE, left: 188, top: 365, width: 48, height: 40 },
  { id: "f11", label: "F-11", price: "50K", status: "available", bgColor: F_TABLE, left: 188, top: 422, width: 48, height: 40 },

  // F left column (near VIP left)
  { id: "f6",  label: "F-6",  price: "50K", status: "available", bgColor: F_TABLE, left: 126, top: 293, width: 48, height: 40 },
  { id: "f5",  label: "F-5",  price: "50K", status: "available", bgColor: F_TABLE, left: 126, top: 349, width: 48, height: 40 },
  { id: "f4",  label: "F-4",  price: "50K", status: "available", bgColor: F_TABLE, left: 126, top: 405, width: 48, height: 40 },
  { id: "f3",  label: "F-3",  price: "50K", status: "available", bgColor: F_TABLE, left: 126, top: 497, width: 48, height: 40 },
  { id: "f2",  label: "F-2",  price: "50K", status: "available", bgColor: F_TABLE, left: 126, top: 555, width: 48, height: 40 },
  { id: "f1",  label: "F-1",  price: "50K", status: "available", bgColor: F_TABLE, left: 126, top: 615, width: 48, height: 40 },

  // F right column (near VIP right)
  { id: "f20", label: "F-20", price: "50K", status: "available", bgColor: F_TABLE, left: 558, top: 293, width: 48, height: 40 },
  { id: "f21", label: "F-21", price: "50K", status: "available", bgColor: F_TABLE, left: 558, top: 349, width: 48, height: 40 },
  { id: "f22", label: "F-22", price: "50K", status: "available", bgColor: F_TABLE, left: 558, top: 405, width: 48, height: 40 },
  { id: "f23", label: "F-23", price: "50K", status: "available", bgColor: F_TABLE, left: 558, top: 497, width: 48, height: 40 },
  { id: "f24", label: "F-24", price: "50K", status: "available", bgColor: F_TABLE, left: 558, top: 555, width: 48, height: 40 },
  { id: "f25", label: "F-25", price: "50K", status: "available", bgColor: F_TABLE, left: 558, top: 615, width: 48, height: 40 },

  // F right column (near performance stage)
  { id: "f14", label: "F-14", price: "70K", status: "available", bgColor: F_TABLE, left: 420, top: 194, width: 48, height: 40 },
  { id: "f15", label: "F-15", price: "70K", status: "available", bgColor: F_TABLE, left: 480, top: 194, width: 48, height: 40 },
  { id: "f16", label: "F-16", price: "70K", status: "available", bgColor: F_TABLE, left: 480, top: 250, width: 48, height: 40 },
  { id: "f17", label: "F-17", price: "50K", status: "available", bgColor: F_TABLE, left: 480, top: 308, width: 48, height: 40 },
  { id: "f18", label: "F-18", price: "50K", status: "available", bgColor: F_TABLE, left: 480, top: 365, width: 48, height: 40 },
  { id: "f19", label: "F-19", price: "50K", status: "available", bgColor: F_TABLE, left: 480, top: 422, width: 48, height: 40 },
  { id: "f26", label: "F-26", price: "70K", status: "available", bgColor: F_TABLE, left: 540, top: 700, width: 48, height: 40 },

  // S center tables
  { id: "s1",  label: "S1",   price: "50K", status: "available", bgColor: S_TABLE, left: 302, top: 417, width: 54, height: 44 },
  { id: "s2",  label: "S2",   price: "50K", status: "available", bgColor: S_TABLE, left: 375, top: 417, width: 54, height: 44 },
  { id: "s5",  label: "S5",   price: "50K", status: "available", bgColor: S_TABLE, left: 338, top: 471, width: 54, height: 44 },
  { id: "s3",  label: "S3",   price: "50K", status: "available", bgColor: S_TABLE, left: 302, top: 526, width: 54, height: 44 },
  { id: "s4",  label: "S4",   price: "50K", status: "available", bgColor: S_TABLE, left: 375, top: 526, width: 54, height: 44 },

  // D bottom tables
  { id: "d01", label: "D-01", price: "80K", status: "available", bgColor: D_TABLE, left: 212, top: 706, width: 68, height: 50 },
  { id: "d02", label: "D-02", price: "80K", status: "available", bgColor: D_TABLE, left: 296, top: 706, width: 68, height: 50 },
  { id: "d03", label: "D-03", price: "80K", status: "available", bgColor: D_TABLE, left: 380, top: 706, width: 68, height: 50 },

  // Royal Diamond
  { id: "rd1", label: "RD-1",  price: "Royal Diamond\n1 LAC", status: "available", bgColor: "#8B6914", left: 252, top: 790, width: 108, height: 64 },
];

interface EditState {
  tableId: string | null;
  value: string;
}

export default function ReservationMap() {
  const [tables, setTables] = useState<TableDef[]>(TABLES);
  const [editing, setEditing] = useState<EditState>({ tableId: null, value: "" });
  const [selected, setSelected] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleStatus = (id: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "available" ? "sold_out" : "available" }
          : t
      )
    );
  };

  const startEdit = (id: string, price: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing({ tableId: id, value: price });
  };

  const commitEdit = () => {
    if (editing.tableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === editing.tableId ? { ...t, price: editing.value } : t
        )
      );
    }
    setEditing({ tableId: null, value: "" });
  };

  const handleTableClick = (t: TableDef) => {
    setSelected(t.id === selected ? null : t.id);
  };

  const availableCount = tables.filter((t) => t.status === "available").length;
  const soldOutCount = tables.filter((t) => t.status === "sold_out").length;
  const selectedTable = tables.find((t) => t.id === selected);

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 uppercase">
          DJ CHETAS NIGHT
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Table Reservation Management &mdash; Click any table to select, then toggle status or edit price
        </p>
      </div>

      {/* Stats bar */}
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
          <span className="text-sm font-semibold">{tables.length} Total Tables</span>
        </div>
      </div>

      {/* Action panel for selected table */}
      {selectedTable && (
        <div className="flex justify-center mb-4">
          <div className="bg-white rounded-xl shadow-md border px-6 py-4 flex items-center gap-4 flex-wrap justify-center">
            <div>
              <span className="text-xs text-gray-400 block">Selected</span>
              <span className="font-bold text-gray-800 text-lg">{selectedTable.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Price:</span>
              {editing.tableId === selectedTable.id ? (
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
                  onClick={(e) => startEdit(selectedTable.id, selectedTable.price, e)}
                  title="Click to edit price"
                >
                  {selectedTable.price.replace("\n", " ")}
                </button>
              )}
            </div>
            <button
              className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition shadow-sm ${
                selectedTable.status === "available"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
              onClick={() => toggleStatus(selectedTable.id)}
            >
              {selectedTable.status === "available" ? "Mark Sold Out" : "Mark Available"}
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
          {/* Aspect ratio box matching virtual canvas 750x970 */}
          <div
            ref={containerRef}
            style={{ paddingBottom: `${(970 / 750) * 100}%`, position: "relative" }}
          >
            {/* Static labels */}
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

              {/* Performance stage vertical label — centered between inner F columns */}
              <div
                className="absolute flex items-center justify-center bg-gray-100 border border-gray-300 rounded"
                style={{
                  top: pct(124, H),
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: pct(42, W),
                  height: pct(218, H),
                }}
              >
                <span
                  className="text-gray-500 font-bold tracking-widest select-none"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    fontSize: "min(1.1vw, 9px)",
                    letterSpacing: "0.08em",
                  }}
                >
                  PERFORMANCE STAGE
                </span>
              </div>

              {/* Lift stage circle — centered horizontally and vertically in floor */}
              <div
                className="absolute flex items-center justify-center rounded-full bg-gray-100 border border-gray-300 text-gray-500 font-semibold text-center select-none"
                style={{
                  top: pct(290, H),
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: pct(110, W),
                  height: pct(110, H),
                  fontSize: "min(1.4vw, 11px)",
                }}
              >
                LIFT<br />STAGE
              </div>

              {/* D zone dashed border */}
              <div
                className="absolute border-2 border-dashed border-gray-400 rounded-lg pointer-events-none"
                style={{
                  top: pct(683, H), left: pct(145, W),
                  width: pct(460, W), height: pct(128, H),
                }}
              />

              {/* LIFT box */}
              <div
                className="absolute flex items-center justify-center border border-gray-400 rounded bg-white text-gray-500 font-semibold"
                style={{ top: pct(653, H), right: pct(6, W), width: pct(35, W), height: pct(80, H), fontSize: "min(1.2vw, 10px)" }}
              >
                <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>LIFT</span>
              </div>

              {/* Tables */}
              {tables.map((t) => {
                const isSold = t.status === "sold_out";
                const isSel = selected === t.id;
                const priceLines = t.price.split("\n");

                return (
                  <div
                    key={t.id}
                    className="absolute cursor-pointer"
                    style={{
                      top: pct(t.top, H),
                      left: pct(t.left, W),
                      width: pct(t.width, W),
                      height: pct(t.height, H),
                    }}
                    onClick={() => handleTableClick(t)}
                  >
                    {/* Table box */}
                    <div
                      className="absolute inset-0 rounded-md flex flex-col items-center justify-center transition-all"
                      style={{
                        backgroundColor: isSold ? "#6b7280" : t.bgColor,
                        opacity: isSold ? 0.7 : 1,
                        outline: isSel ? "3px solid #fbbf24" : "none",
                        outlineOffset: "2px",
                        boxShadow: isSel ? "0 0 0 3px #fbbf24" : "inset 0 1px 0 rgba(255,255,255,0.2)",
                      }}
                    >
                      {/* Table label */}
                      <span
                        className="text-white font-bold leading-tight text-center"
                        style={{ fontSize: "min(1.4vw, 10px)", lineHeight: 1.2, padding: "1px 2px" }}
                      >
                        {t.label.split("\n").map((line, i) => (
                          <span key={i} style={{ display: "block" }}>{line}</span>
                        ))}
                      </span>

                      {/* Sold out overlay cross */}
                      {isSold && (
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <line x1="10" y1="10" x2="90" y2="90" stroke="white" strokeWidth="4" opacity="0.6" />
                          <line x1="90" y1="10" x2="10" y2="90" stroke="white" strokeWidth="4" opacity="0.6" />
                        </svg>
                      )}
                    </div>

                    {/* Price label below */}
                    <div
                      className="absolute w-full text-center font-medium text-gray-700"
                      style={{ top: "calc(100% + 2px)", fontSize: "min(1.2vw, 9px)", lineHeight: 1.3 }}
                    >
                      {priceLines.map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
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
        Click a table to select &bull; Click price in panel to edit &bull; Toggle Available / Sold Out
      </p>
    </div>
  );
}
