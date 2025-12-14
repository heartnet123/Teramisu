import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "approved",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "preparing",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
]);

export const product = pgTable("product", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category"),
  stock: integer("stock").notNull().default(0),
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const order = pgTable(
  "order",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    shipmentStatus: shipmentStatusEnum("shipment_status"),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    shippingAddress: text("shipping_address"),
    trackingNumber: text("tracking_number"),
    notes: text("notes"),
    approvedAt: timestamp("approved_at"),
    shippedAt: timestamp("shipped_at"),
    deliveredAt: timestamp("delivered_at"),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("order_userId_idx").on(table.userId),
    index("order_status_idx").on(table.status),
  ]
);

export const orderItem = pgTable(
  "order_item",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    priceAtPurchase: decimal("price_at_purchase", {
      precision: 10,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("orderItem_orderId_idx").on(table.orderId)]
);

export const productRelations = relations(product, ({ many }) => ({
  orderItems: many(orderItem),
}));

export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
  items: many(orderItem),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  product: one(product, {
    fields: [orderItem.productId],
    references: [product.id],
  }),
}));
