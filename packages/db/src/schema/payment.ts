import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  decimal,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { order } from "./ecommerce";

export const paymentMethodEnum = pgEnum("payment_method", [
  "promptpay",
  "credit_card",
  "bank_transfer",
  "omise",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "successful",
  "failed",
  "expired",
  "refunded",
]);

export const payment = pgTable(
  "payment",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("THB"),
    omiseChargeId: text("omise_charge_id"),
    omiseSourceId: text("omise_source_id"),
    qrCodeUrl: text("qr_code_url"),
    expiresAt: timestamp("expires_at"),
    paidAt: timestamp("paid_at"),
    failedAt: timestamp("failed_at"),
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),
    metadata: text("metadata"), // JSON string for additional data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payment_orderId_idx").on(table.orderId),
    index("payment_omiseChargeId_idx").on(table.omiseChargeId),
    index("payment_status_idx").on(table.status),
  ]
);

export const paymentRelations = relations(payment, ({ one }) => ({
  order: one(order, {
    fields: [payment.orderId],
    references: [order.id],
  }),
}));

