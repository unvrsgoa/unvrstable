import { Router, type IRouter } from "express";
import { db, bookingsTable } from "@workspace/db";
import { eq, and, or, isNull } from "drizzle-orm";

const router: IRouter = Router();

function generateBookingId(): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `BK-${dateStr}-${rand}`;
}

function buildShowFilter(show: string | undefined) {
  if (!show) return undefined;
  // "Show 1" is the default — treat NULL rows as belonging to it (backward compat)
  if (show === "Show 1") return or(eq(bookingsTable.showLabel, show), isNull(bookingsTable.showLabel));
  return eq(bookingsTable.showLabel, show);
}

function computeStats(rows: typeof bookingsTable.$inferSelect[]) {
  const totalBookings = rows.length;
  const totalPax = rows.reduce((s, b) => s + (b.paxCount ?? 0), 0);
  const totalAdvance = rows.reduce((s, b) => s + (b.advanceAmount ?? 0), 0);
  const totalBalance = rows.reduce((s, b) => s + (b.balanceAmount ?? 0), 0);
  const totalAmount = rows.reduce((s, b) => s + (b.totalPrice ?? 0), 0);
  const arrivedCount = rows.filter((b) => b.arrived).length;

  const byMode: Record<string, number> = {};
  rows.forEach((b) => {
    const breakdown = safeParseBreakdown(b.paymentBreakdown);
    if (breakdown.length > 0) {
      breakdown.forEach((p) => { byMode[p.mode] = (byMode[p.mode] || 0) + p.amount; });
    } else if (b.paymentMode) {
      byMode[b.paymentMode] = (byMode[b.paymentMode] || 0) + b.advanceAmount;
    }
  });

  const byHandBand: Record<string, number> = {};
  rows.forEach((b) => {
    if (b.handBandColor) byHandBand[b.handBandColor] = (byHandBand[b.handBandColor] || 0) + b.paxCount;
  });

  return { totalBookings, totalPax, totalAdvance, totalBalance, totalAmount, arrivedCount, byMode, byHandBand };
}

function safeParseBreakdown(s: string | null | undefined): { mode: string; amount: number }[] {
  if (!s) return [];
  try { const r = JSON.parse(s); return Array.isArray(r) ? r : []; } catch { return []; }
}

// GET /bookings?event=chetas&show=Show+1
router.get("/bookings", async (req, res) => {
  const event = (req.query.event as string) || "chetas";
  const show = req.query.show as string | undefined;
  try {
    const showFilter = buildShowFilter(show);
    const where = showFilter ? and(eq(bookingsTable.event, event), showFilter) : eq(bookingsTable.event, event);
    const rows = await db.select().from(bookingsTable).where(where);
    rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// GET /bookings/stats?event=chetas&show=Show+1
router.get("/bookings/stats", async (req, res) => {
  const event = (req.query.event as string) || "chetas";
  const show = req.query.show as string | undefined;
  try {
    const showFilter = buildShowFilter(show);
    const where = showFilter ? and(eq(bookingsTable.event, event), showFilter) : eq(bookingsTable.event, event);
    const rows = await db.select().from(bookingsTable).where(where);
    res.json(computeStats(rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /bookings/scan/:bookingId
router.get("/bookings/scan/:bookingId", async (req, res) => {
  try {
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.bookingId, req.params.bookingId));
    if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// GET /bookings/shows?event=chetas  — list distinct show labels for an event
router.get("/bookings/shows", async (req, res) => {
  const event = (req.query.event as string) || "chetas";
  try {
    const rows = await db.selectDistinct({ showLabel: bookingsTable.showLabel })
      .from(bookingsTable)
      .where(eq(bookingsTable.event, event));
    const labels = Array.from(new Set(rows.map((r) => r.showLabel || "Show 1"))).sort();
    // Always include Show 1
    if (!labels.includes("Show 1")) labels.unshift("Show 1");
    res.json(labels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shows" });
  }
});

// GET /bookings/by-table/:tableId?event=chetas&show=Show+1
router.get("/bookings/by-table/:tableId", async (req, res) => {
  const event = (req.query.event as string) || "chetas";
  const show = req.query.show as string | undefined;
  try {
    const showFilter = buildShowFilter(show);
    const where = showFilter
      ? and(eq(bookingsTable.tableId, req.params.tableId), eq(bookingsTable.event, event), showFilter)
      : and(eq(bookingsTable.tableId, req.params.tableId), eq(bookingsTable.event, event));
    const rows = await db.select().from(bookingsTable).where(where);
    rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    res.json(rows[0] ?? null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// DELETE /bookings/wipe?event=chetas&show=Show+1
router.delete("/bookings/wipe", async (req, res) => {
  const event = (req.query.event as string) || "chetas";
  const show = req.query.show as string | undefined;
  try {
    const showFilter = buildShowFilter(show);
    const where = showFilter ? and(eq(bookingsTable.event, event), showFilter) : eq(bookingsTable.event, event);
    await db.delete(bookingsTable).where(where);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to wipe bookings" });
  }
});

// POST /bookings
router.post("/bookings", async (req, res) => {
  const { tableId, event, guestName, bookingDate, totalPrice, advanceAmount, paxCount, contactNo,
    paymentMode, paymentBreakdown, ageGroup, tlcCardNo, handBandColor, showLabel } = req.body;
  const balance = (totalPrice ?? 0) - (advanceAmount ?? 0);
  try {
    const [created] = await db.insert(bookingsTable).values({
      bookingId: generateBookingId(),
      tableId, event: event || "chetas", guestName, bookingDate,
      totalPrice: totalPrice ?? 0, advanceAmount: advanceAmount ?? 0, balanceAmount: balance,
      paxCount: paxCount ?? 1, contactNo, paymentMode: paymentMode || "Cash",
      paymentBreakdown: paymentBreakdown ? JSON.stringify(paymentBreakdown) : "[]",
      ageGroup, tlcCardNo: tlcCardNo || "", handBandColor: handBandColor || "",
      showLabel: showLabel || "Show 1",
    }).returning();
    res.json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// PATCH /bookings/:id/arrived
router.patch("/bookings/:id/arrived", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [updated] = await db.update(bookingsTable).set({ arrived: true }).where(eq(bookingsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// PATCH /bookings/:id  (edit full booking)
router.patch("/bookings/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { guestName, bookingDate, totalPrice, advanceAmount, paxCount, contactNo,
    paymentMode, paymentBreakdown, ageGroup, tlcCardNo, handBandColor } = req.body;
  const balance = (totalPrice ?? 0) - (advanceAmount ?? 0);
  try {
    const [updated] = await db.update(bookingsTable).set({
      guestName, bookingDate,
      totalPrice: totalPrice ?? 0, advanceAmount: advanceAmount ?? 0, balanceAmount: balance,
      paxCount: paxCount ?? 1, contactNo, paymentMode: paymentMode || "Cash",
      paymentBreakdown: paymentBreakdown ? JSON.stringify(paymentBreakdown) : "[]",
      ageGroup, tlcCardNo: tlcCardNo || "", handBandColor: handBandColor || "",
    }).where(eq(bookingsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// DELETE /bookings/:id
router.delete("/bookings/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await db.delete(bookingsTable).where(eq(bookingsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

export default router;
