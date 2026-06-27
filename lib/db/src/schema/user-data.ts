import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userDataTable = pgTable("user_data", {
  userId: text("user_id").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserDataSchema = createInsertSchema(userDataTable);
export type InsertUserData = z.infer<typeof insertUserDataSchema>;
export type UserDataRow = typeof userDataTable.$inferSelect;
