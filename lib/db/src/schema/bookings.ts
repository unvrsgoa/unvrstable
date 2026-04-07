import { pgTable, text, integer, boolean, serial, timestamp } from "drizzle-orm/pg-core";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingId: text("booking_id").unique().notNull(),
  tableId: text("table_id").notNull(),
  event: text("event").notNull().default("chetas"),
  guestName: text("guest_name").notNull(),
  bookingDate: text("booking_date").notNull(),
  totalPrice: integer("total_price").notNull().default(0),
  advanceAmount: integer("advance_amount").notNull().default(0),
  balanceAmount: integer("balance_amount").notNull().default(0),
  paxCount: integer("pax_count").notNull().default(1),
  contactNo: text("contact_no").notNull(),
  paymentMode: text("payment_mode").notNull(),
  paymentBreakdown: text("payment_breakdown").default("[]"),
  ageGroup: text("age_group").notNull(),
  tlcCardNo: text("tlc_card_no").default(""),
  handBandColor: text("hand_band_color").default(""),
  arrived: boolean("arrived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Booking = typeof bookingsTable.$inferSelect;
export type InsertBooking = typeof bookingsTable.$inferInsert;
