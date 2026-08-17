import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const farewellMessages = sqliteTable("farewell_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  role: text("role").notNull().default("teammate"),
  message: text("message").notNull(),
  stamp: text("stamp").notNull().default("WITH LOVE"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
