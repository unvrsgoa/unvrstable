import { useEffect, useRef, useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Booking {
  id: number;
  bookingId: string;
  tableId: string;
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

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [arriving, setArriving] = useState(false);
  const [manualId, setManualId] = useState("");
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lookupBooking = async (bookingId: string) => {
    setNotFound(false);
    try {
      const res = await fetch(`${BASE}/api/bookings/scan/${bookingId.trim()}`);
      if (!res.ok) { setNotFound(true); return; }
      const data = await res.json();
      setBooking(data);
    } catch {
      setNotFound(true);
    }
  };

  const startScanner = async () => {
    const { Html5QrcodeScanner } = await import("html5-qrcode");
    setScanning(true);
    setTimeout(() => {
      if (!containerRef.current) return;
      scannerRef.current = new Html5QrcodeScanner(
        "qr-scanner-box",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(
        (text: string) => {
          stopScanner();
          lookupBooking(text);
        },
        () => {}
      );
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => () => stopScanner(), []);

  const markArrived = async () => {
    if (!booking) return;
    setArriving(true);
    try {
      const res = await fetch(`${BASE}/api/bookings/${booking.id}/arrived`, { method: "PATCH" });
      const updated = await res.json();
      setBooking(updated);
    } catch {
      alert("Failed to mark arrived");
    } finally {
      setArriving(false);
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString()}`;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-2">📷 Guest Arrival Scanner</h2>
      <p className="text-sm text-gray-500 mb-6">Scan guest QR code or enter Booking ID manually to check in.</p>

      {/* Manual lookup */}
      <div className="flex gap-2 mb-5">
        <input
          className="flex-1 border rounded-lg px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-400 outline-none"
          placeholder="Enter Booking ID (e.g. BK-20260406-A8K2)"
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookupBooking(manualId)}
        />
        <button onClick={() => lookupBooking(manualId)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">Look Up</button>
      </div>

      {/* Camera scan */}
      {!scanning ? (
        <button
          onClick={startScanner}
          className="w-full py-4 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-bold text-sm hover:bg-indigo-50 transition mb-5"
        >
          📷 Open Camera to Scan QR Code
        </button>
      ) : (
        <div className="mb-5">
          <div ref={containerRef} id="qr-scanner-box" className="rounded-xl overflow-hidden border-2 border-indigo-300" />
          <button onClick={stopScanner} className="mt-3 w-full py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Stop Camera</button>
        </div>
      )}

      {/* Not found */}
      {notFound && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-600 mb-4">
          <p className="text-2xl mb-1">❌</p>
          <p className="font-bold">Booking not found</p>
          <p className="text-sm text-red-400">Check the booking ID and try again.</p>
        </div>
      )}

      {/* Booking found */}
      {booking && (
        <div className={`rounded-2xl border-2 shadow-lg overflow-hidden ${booking.arrived ? "border-emerald-400" : "border-indigo-300"}`}>

          {/* Header */}
          <div className={`p-4 ${booking.arrived ? "bg-emerald-50" : "bg-indigo-50"}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-extrabold text-gray-800 text-lg leading-tight">{booking.guestName}</p>
                <p className="text-xs font-mono text-indigo-700">{booking.bookingId}</p>
              </div>
              {booking.arrived ? (
                <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">✅ ARRIVED</span>
              ) : (
                <span className="bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">⏳ PENDING</span>
              )}
            </div>

            {/* Prominent PAX arrival banner */}
            {booking.arrived ? (
              <div className="bg-emerald-500 text-white rounded-xl p-3 flex items-center justify-center gap-3">
                <span className="text-4xl font-extrabold leading-none">{booking.paxCount}</span>
                <div>
                  <p className="font-extrabold text-base leading-tight">PAX ARRIVED</p>
                  <p className="text-xs opacity-80">Check-in complete</p>
                </div>
                <span className="text-3xl ml-auto">✅</span>
              </div>
            ) : (
              <div className="bg-indigo-600 text-white rounded-xl p-3 flex items-center justify-center gap-3">
                <span className="text-4xl font-extrabold leading-none">{booking.paxCount}</span>
                <div>
                  <p className="font-extrabold text-base leading-tight">PAX EXPECTED</p>
                  <p className="text-xs opacity-80">Awaiting check-in</p>
                </div>
                <span className="text-3xl ml-auto">👥</span>
              </div>
            )}
          </div>

          <div className="p-4 grid grid-cols-2 gap-3 text-sm">
            {[
              ["Table", booking.tableId.toUpperCase()],
              ["Date", booking.bookingDate],
              ["Contact", booking.contactNo],
              ["Age Group", booking.ageGroup],
              ["Payment", booking.paymentMode],
              ["Total", fmt(booking.totalPrice)],
              ["Advance", fmt(booking.advanceAmount)],
              ["Balance Due", fmt(booking.balanceAmount)],
            ].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-lg p-2">
                <span className="text-xs text-gray-400 block">{k}</span>
                <span className="font-semibold text-gray-800">{v}</span>
              </div>
            ))}
          </div>

          <div className="p-4 pt-0 flex gap-3">
            <button onClick={() => { setBooking(null); setNotFound(false); setManualId(""); }} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">Clear</button>
            {!booking.arrived && (
              <button onClick={markArrived} disabled={arriving} className="flex-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm disabled:opacity-50">
                {arriving ? "Marking…" : `✅ CHECK IN ${booking.paxCount} PAX`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
