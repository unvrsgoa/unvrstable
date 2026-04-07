import { Router, type IRouter } from "express";
import { db, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function generateBookingId(): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `BK-${dateStr}-${rand}`;
}

router.get("/bookings", async (req, res) => {
  const event = (req.query.event as string) || "chetas";
  try {
    const rows = await db.select().from(bookingsTable).where(eq(bookingsTable.event, event));
    rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

router.get("/bookings/stats", async (req, res) => {
  const event = (req.query.event as string) || "chetas";
  try {
    const rows = await db.select().from(bookingsTable).where(eq(bookingsTable.event, event));
    const totalBookings = rows.length;
    const totalPax = rows.reduce((s, b) => s + b.paxCount, 0);
    const totalAdvance = rows.reduce((s, b) => s + b.advanceAmount, 0);
    const totalBalance = rows.reduce((s, b) => s + b.balanceAmount, 0);
    const totalAmount = rows.reduce((s, b) => s + b.totalPrice, 0);
    const arrivedCount = rows.filter((b) => b.arrived).length;
    const byMode: Record<string, number> = {};
    rows.forEach((b) => { byMode[b.paymentMode] = (byMode[b.paymentMode] || 0) + b.advanceAmount; });
    res.json({ totalBookings, totalPax, totalAdvance, totalBalance, totalAmount, arrivedCount, byMode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

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

router.post("/bookings", async (req, res) => {
  const { tableId, event, guestName, bookingDate, totalPrice, advanceAmount, paxCount, contactNo, paymentMode, ageGroup } = req.body;
  const balance = (totalPrice ?? 0) - (advanceAmount ?? 0);
  try {
    const [created] = await db.insert(bookingsTable).values({
      bookingId: generateBookingId(),
      tableId,
      event: event || "chetas",
      guestName,
      bookingDate,
      totalPrice: totalPrice ?? 0,
      advanceAmount: advanceAmount ?? 0,
      balanceAmount: balance,
      paxCount: paxCount ?? 1,
      contactNo,
      paymentMode,
      ageGroup,
    }).returning();
    res.json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

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
