import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const notificationTypeEnum = pgEnum("notification_type", [
  "order_placed",
  "order_approved",
  "order_shipped",
  "order_delivered",
  "order_cancelled",
  "payment_received",
  "payment_failed",
  "low_stock",
  "new_review",
  "promotion",
  "system",
]);

export const notification = pgTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    link: text("link"), // Optional link to navigate to
    metadata: text("metadata"), // JSON string for additional data
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_userId_idx").on(table.userId),
    index("notification_isRead_idx").on(table.isRead),
    index("notification_type_idx").on(table.type),
    index("notification_createdAt_idx").on(table.createdAt),
  ]
);

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));

