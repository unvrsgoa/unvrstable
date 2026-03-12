import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clubTablesTable = pgTable("club_tables", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("available"),
  price: text("price").notNull(),
});

export const insertClubTableSchema = createInsertSchema(clubTablesTable);
export const updateClubTableSchema = insertClubTableSchema.partial().omit({ id: true });

export type ClubTable = typeof clubTablesTable.$inferSelect;
export type InsertClubTable = z.infer<typeof insertClubTableSchema>;
