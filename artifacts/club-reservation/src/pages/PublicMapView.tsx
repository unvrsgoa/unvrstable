import { useState, useEffect } from "react";
import venueImage from "@assets/cewcw_1783598948856.png";
import soldOutImg from "@assets/Untitled_(1)_1776301600692.png";

const W = 750, H = 1024;
function pct(val: number, total: number) { return `${((val / total) * 100).toFixed(3)}%`; }

const LAYOUT = [
  { id: "platinum1", left: 138, top: 96,  width: 116, height: 62 },
  { id: "platinum2", left: 516, top: 96,  width: 116, height: 62 },
  { id: "gold1",     left:  60, top: 184, width: 82,  height: 55 },
  { id: "gold2",     left: 147, top: 184, width: 82,  height: 55 },
  { id: "gold3",     left: 234, top: 184, width: 82,  height: 55 },
  { id: "gold4",     left: 467, top: 184, width: 72,  height: 55 },
  { id: "gold5",     left: 544, top: 184, width: 72,  height: 55 },
  { id: "gold6",     left: 621, top: 184, width: 72,  height: 55 },
  { id: "vipl1",     left:  30, top: 252, width: 124, height: 87 },
  { id: "vipl2",     left:  30, top: 339, width: 124, height: 87 },
  { id: "vipl3",     left:  30, top: 426, width: 124, height: 87 },
  { id: "vipl4",     left:  30, top: 513, width: 124, height: 87 },
  { id: "vipl5",     left:  30, top: 600, width: 124, height: 87 },
  { id: "vipl6",     left:  30, top: 687, width: 124, height: 87 },
  { id: "vipl7",     left:  30, top: 774, width: 124, height: 87 },
  { id: "vipr1",     left: 605, top: 252, width: 124, height: 87 },
  { id: "vipr2",     left: 605, top: 339, width: 124, height: 87 },
  { id: "vipr3",     left: 605, top: 426, width: 124, height: 87 },
  { id: "vipr4",     left: 605, top: 513, width: 124, height: 87 },
  { id: "vipr5",     left: 605, top: 600, width: 124, height: 87 },
  { id: "vipr6",     left: 605, top: 687, width: 124, height: 87 },
  { id: "f7",  left: 235, top: 268, width: 40, height: 40 },
  { id: "f12", left: 287, top: 263, width: 40, height: 40 },
  { id: "f12a", left: 285, top: 340, width: 38, height: 38 },
  { id: "f12b", left: 285, top: 398, width: 38, height: 38 },
  { id: "f14a", left: 340, top: 430, width: 38, height: 38 },
  { id: "f14b", left: 340, top: 488, width: 38, height: 38 },
  { id: "f8",  left: 235, top: 329, width: 40, height: 40 },
  { id: "f6",  left: 173, top: 368, width: 40, height: 40 },
  { id: "f9",  left: 235, top: 396, width: 40, height: 40 },
  { id: "f5",  left: 173, top: 427, width: 40, height: 40 },
  { id: "f10", left: 235, top: 470, width: 40, height: 40 },
  { id: "f4",  left: 173, top: 485, width: 40, height: 40 },
  { id: "f11", left: 235, top: 543, width: 40, height: 40 },
  { id: "f3",  left: 170, top: 630, width: 40, height: 40 },
  { id: "f2",  left: 170, top: 688, width: 40, height: 40 },
  { id: "f1",  left: 170, top: 746, width: 40, height: 40 },
  { id: "f14", left: 452, top: 263, width: 40, height: 40 },
  { id: "f15", left: 506, top: 263, width: 40, height: 40 },
  { id: "f16", left: 506, top: 334, width: 40, height: 40 },
  { id: "f17", left: 506, top: 401, width: 40, height: 40 },
  { id: "f20", left: 558, top: 353, width: 40, height: 40 },
  { id: "f18", left: 506, top: 475, width: 40, height: 40 },
  { id: "f21", left: 558, top: 419, width: 40, height: 40 },
  { id: "f19", left: 506, top: 548, width: 40, height: 40 },
  { id: "f22", left: 558, top: 485, width: 40, height: 40 },
  { id: "f23", left: 558, top: 611, width: 40, height: 40 },
  { id: "f24", left: 558, top: 669, width: 40, height: 40 },
  { id: "f25", left: 558, top: 727, width: 40, height: 40 },
  { id: "s1",  left: 316, top: 516, width: 42, height: 40 },
  { id: "s2",  left: 365, top: 516, width: 42, height: 40 },
  { id: "s3",  left: 414, top: 516, width: 42, height: 40 },
  { id: "s4",  left: 316, top: 568, width: 42, height: 40 },
  { id: "s5",  left: 365, top: 568, width: 42, height: 40 },
  { id: "s6",  left: 414, top: 568, width: 42, height: 40 },
  { id: "d1",  left: 259, top: 807, width: 38, height: 38 },
  { id: "d2",  left: 302, top: 807, width: 38, height: 38 },
  { id: "d3",  left: 345, top: 807, width: 38, height: 38 },
  { id: "d4",  left: 388, top: 807, width: 38, height: 38 },
  { id: "d5",  left: 431, top: 807, width: 38, height: 38 },
  { id: "d6",  left: 474, top: 807, width: 38, height: 38 },
  { id: "d7",  left: 517, top: 807, width: 38, height: 38 },
  { id: "d8",  left: 560, top: 807, width: 38, height: 38 },
  { id: "d9",  left: 518, top: 866, width: 38, height: 38 },
  { id: "d10", left: 562, top: 866, width: 38, height: 38 },
  { id: "rd1", left: 240, top: 892, width: 110, height: 95 },
];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type EventKey = "chetas" | "normal";

export default function PublicMapView() {
  const [event, setEvent] = useState<EventKey>("chetas");
  const [tableData, setTableData] = useState<Record<string, { status: string; price: string }>>({});
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const load = async (ev: EventKey) => {
    try {
      const res = await fetch(`${BASE}/api/tables?event=${ev}`);
      if (!res.ok) return;
      const data: { id: string; status: string; price: string }[] = await res.json();
      const map: Record<string, { status: string; price: string }> = {};
      data.forEach((t) => { map[t.id] = { status: t.status, price: t.price ?? "" }; });
      setTableData(map);
      setLastUpdated(new Date());
    } catch {}
  };

  useEffect(() => { load(event); }, [event]);
  useEffect(() => {
    const interval = setInterval(() => load(event), 30_000);
    return () => clearInterval(interval);
  }, [event]);

  const normalEventName = localStorage.getItem("tlc_normal_name") || "Normal Night";

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center py-6 px-2">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-black text-yellow-400 tracking-widest uppercase">The Leela Club</h1>
        <p className="text-gray-400 text-xs mt-1">Live Table Availability</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setEvent("chetas")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
            event === "chetas" ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          🎧 DJ Chetas
        </button>
        <button
          onClick={() => setEvent("normal")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
            event === "normal" ? "bg-gray-200 text-gray-900" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          🎵 {normalEventName}
        </button>
      </div>

      <div className="w-full flex justify-center">
        <div className="relative rounded-2xl overflow-hidden" style={{ width: "min(92vw, 750px)" }}>
          <div style={{ paddingBottom: `${(H / W) * 100}%`, position: "relative" }}>
            <img
              src={venueImage}
              alt="The Leela Club — Floor Plan"
              className="absolute w-full h-full"
              style={{ objectFit: "fill", zIndex: 0, top: 0, left: "5px" }}
              draggable={false}
            />
            <div className="absolute inset-0" style={{ zIndex: 1 }}>
              {LAYOUT.map((t) => {
                const row = tableData[t.id];
                const isSold = row?.status === "sold_out";
                const price = row?.price ?? "";
                const priceLines = price.split("\n");

                return (
                  <div
                    key={t.id}
                    className="absolute"
                    style={{ top: pct(t.top, H), left: pct(t.left, W), width: pct(t.width, W), height: pct(t.height, H) }}
                  >
                    <div className="absolute inset-0 rounded-md" style={{ backgroundColor: "rgba(251, 191, 36, 0.25)" }}>
                      {isSold && (
                        <img
                          src={soldOutImg}
                          alt="Sold Out"
                          className="absolute object-contain pointer-events-none"
                          style={t.id.startsWith("f") ? {
                            width: "350%", height: "350%",
                            top: "50%", left: "50%",
                            transform: "translate(-50%, -50%)",
                          } : {
                            inset: 0, width: "100%", height: "100%", padding: "2px",
                          }}
                        />
                      )}
                    </div>
                    {!isSold && price && (
                      <div
                        className="absolute w-full text-center font-black"
                        style={{
                          ...(t.id.startsWith("vipl") || t.id.startsWith("vipr")
                            ? { top: "50%", transform: "translateY(-50%)" }
                            : { top: "calc(100% + 2px)" }),
                          fontSize: "min(1.6vw, 11px)",
                          lineHeight: 1.3,
                          color: "#FFD700",
                          textShadow: "0 0 4px #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
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

      {(() => {
        const total = LAYOUT.length;
        const soldCount = LAYOUT.filter((t) => tableData[t.id]?.status === "sold_out").length;
        const availCount = total - soldCount;
        return (
          <div className="mt-4 w-full max-w-sm">
            <div className="bg-gray-800 rounded-2xl px-5 py-4 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-gray-300 text-sm font-semibold tracking-wide">Table Status</span>
                <span className="text-gray-500 text-xs">{total} total tables</span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 bg-green-900/40 rounded-xl px-3 py-3 text-center">
                  <div className="text-2xl font-black text-green-400">{availCount}</div>
                  <div className="text-xs text-green-500 mt-0.5 font-semibold uppercase tracking-wide">Available</div>
                </div>
                <div className="flex-1 bg-red-900/40 rounded-xl px-3 py-3 text-center">
                  <div className="text-2xl font-black text-red-400">{soldCount}</div>
                  <div className="text-xs text-red-500 mt-0.5 font-semibold uppercase tracking-wide">Sold Out</div>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-700"
                  style={{ width: total > 0 ? `${(soldCount / total) * 100}%` : "0%" }}
                />
              </div>
              <p className="text-center text-gray-500 text-xs">
                Updated: {lastUpdated.toLocaleTimeString()} · auto-refreshes every 30s
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
