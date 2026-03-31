import { Router, type IRouter } from "express";
import { db, clubTablesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_TABLES: Array<{ id: string; status: string; price: string }> = [
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
  { id: "f26", status: "available", price: "70K" },
  { id: "s1",  status: "available", price: "50K" },
  { id: "s2",  status: "available", price: "50K" },
  { id: "s5",  status: "available", price: "50K" },
  { id: "s3",  status: "available", price: "50K" },
  { id: "s4",  status: "available", price: "50K" },
  { id: "d01", status: "available", price: "80K" },
  { id: "d02", status: "available", price: "80K" },
  { id: "d03", status: "available", price: "80K" },
  { id: "rd1", status: "available", price: "Royal Diamond\n1 LAC" },
];

async function seedIfEmpty() {
  await db.insert(clubTablesTable).values(DEFAULT_TABLES).onConflictDoNothing();
}

seedIfEmpty().catch(console.error);

router.get("/tables", async (_req, res) => {
  try {
    const rows = await db.select().from(clubTablesTable);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tables" });
  }
});

router.patch("/tables/:id", async (req, res) => {
  const { id } = req.params;
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
      .where(eq(clubTablesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Table not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update table" });
  }
});

export default router;
