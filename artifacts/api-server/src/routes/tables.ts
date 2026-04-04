import { Router, type IRouter } from "express";
import { db, clubTablesTable } from "@workspace/db";
import { eq, like } from "drizzle-orm";

const router: IRouter = Router();

const BASE_TABLES: Array<{ id: string; status: string; price: string }> = [
  { id: "platinum1", status: "available", price: "2 LAC" },
  { id: "platinum2", status: "available", price: "2 LAC" },
  { id: "gold1", status: "available", price: "1.5 LAC" },
  { id: "gold2", status: "available", price: "2 LAC" },
  { id: "gold3", status: "available", price: "3 LAC" },
  { id: "gold4", status: "available", price: "3 LAC" },
  { id: "gold5", status: "available", price: "2 LAC" },
  { id: "gold6", status: "available", price: "1.5 LAC" },
  { id: "vipl1", status: "available", price: "1.5 LAC" },
  { id: "vipl2", status: "available", price: "1.5 LAC" },
  { id: "vipl3", status: "available", price: "1 LAC" },
  { id: "vipl4", status: "available", price: "1 LAC" },
  { id: "vipl5", status: "available", price: "1 LAC" },
  { id: "vipl6", status: "available", price: "1 LAC" },
  { id: "vipl7", status: "available", price: "1 LAC" },
  { id: "vipr1", status: "available", price: "1.5 LAC" },
  { id: "vipr2", status: "available", price: "1.5 LAC" },
  { id: "vipr3", status: "available", price: "1 LAC" },
  { id: "vipr4", status: "available", price: "1 LAC" },
  { id: "vipr5", status: "available", price: "1 LAC" },
  { id: "vipr6", status: "available", price: "1 LAC" },
  { id: "f7",  status: "available", price: "70K" },
  { id: "f12", status: "available", price: "70K" },
  { id: "f8",  status: "available", price: "70K" },
  { id: "f9",  status: "available", price: "50K" },
  { id: "f10", status: "available", price: "50K" },
  { id: "f11", status: "available", price: "50K" },
  { id: "f6",  status: "available", price: "50K" },
  { id: "f5",  status: "available", price: "50K" },
  { id: "f4",  status: "available", price: "50K" },
  { id: "f3",  status: "available", price: "50K" },
  { id: "f2",  status: "available", price: "50K" },
  { id: "f1",  status: "available", price: "50K" },
  { id: "f20", status: "available", price: "50K" },
  { id: "f21", status: "available", price: "50K" },
  { id: "f22", status: "available", price: "50K" },
  { id: "f23", status: "available", price: "50K" },
  { id: "f24", status: "available", price: "50K" },
  { id: "f25", status: "available", price: "50K" },
  { id: "f14", status: "available", price: "70K" },
  { id: "f15", status: "available", price: "70K" },
  { id: "f16", status: "available", price: "70K" },
  { id: "f17", status: "available", price: "50K" },
  { id: "f18", status: "available", price: "50K" },
  { id: "f19", status: "available", price: "50K" },
  { id: "s1",  status: "available", price: "50K" },
  { id: "s2",  status: "available", price: "50K" },
  { id: "s5",  status: "available", price: "50K" },
  { id: "s3",  status: "available", price: "50K" },
  { id: "s4",  status: "available", price: "50K" },
  { id: "d1",  status: "available", price: "80K" },
  { id: "d2",  status: "available", price: "80K" },
  { id: "d3",  status: "available", price: "80K" },
  { id: "d4",  status: "available", price: "80K" },
  { id: "d5",  status: "available", price: "80K" },
  { id: "d6",  status: "available", price: "80K" },
  { id: "d7",  status: "available", price: "80K" },
  { id: "d8",  status: "available", price: "80K" },
  { id: "d9",  status: "available", price: "80K" },
  { id: "d10", status: "available", price: "80K" },
  { id: "rd1", status: "available", price: "Royal Diamond\n1 LAC" },
];

const EVENTS = ["chetas", "normal"] as const;

const CHETAS_ONLY_TABLES: Array<{ id: string; status: string; price: string }> = [
  { id: "goldstandy1", status: "available", price: "2 LAC" },
  { id: "goldstandy2", status: "available", price: "2 LAC" },
];

async function seedAllEvents() {
  const rows = EVENTS.flatMap((event) =>
    BASE_TABLES.map((t) => ({ id: `${event}_${t.id}`, status: t.status, price: t.price }))
  );
  const chetasExtras = CHETAS_ONLY_TABLES.map((t) => ({
    id: `chetas_${t.id}`,
    status: t.status,
    price: t.price,
  }));
  await db.insert(clubTablesTable).values([...rows, ...chetasExtras]).onConflictDoNothing();
}

seedAllEvents().catch(console.error);

router.get("/tables", async (req, res) => {
  const event = (req.query.event as string) || "chetas";
  const prefix = `${event}_`;
  try {
    const rows = await db
      .select()
      .from(clubTablesTable)
      .where(like(clubTablesTable.id, `${prefix}%`));
    const stripped = rows.map((r) => ({ ...r, id: r.id.slice(prefix.length) }));
    res.json(stripped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tables" });
  }
});

router.patch("/tables/:id", async (req, res) => {
  const event = (req.query.event as string) || "chetas";
  const dbId = `${event}_${req.params.id}`;
  const { status, price } = req.body as { status?: string; price?: string };

  if (!status && !price) {
    res.status(400).json({ error: "Provide status or price to update" });
    return;
  }

  const updates: Partial<{ status: string; price: string }> = {};
  if (status) updates.status = status;
  if (price !== undefined) updates.price = price;

  try {
    const [updated] = await db
      .update(clubTablesTable)
      .set(updates)
      .where(eq(clubTablesTable.id, dbId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Table not found" });
      return;
    }
    res.json({ ...updated, id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update table" });
  }
});

export default router;
