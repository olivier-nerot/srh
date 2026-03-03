import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const otps = sqliteTable("otps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const newsletterQueue = sqliteTable("newsletter_queue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  selectedPublicationIds: text("selected_publication_ids", {
    mode: "json",
  }).$type<number[]>(),
  type: text("type").notNull().default("newsletter"),
  status: text("status").notNull().default("draft"),
  totalRecipients: integer("total_recipients").notNull(),
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
});

export const newsletterRecipients = sqliteTable("newsletter_recipients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  newsletterId: integer("newsletter_id").notNull(),
  userId: integer("user_id").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
