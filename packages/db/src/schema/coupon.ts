import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { order } from "./ecommerce";

export const couponTypeEnum = pgEnum("coupon_type", [
  "percentage", // ส่วนลดเป็นเปอร์เซ็นต์
  "fixed_amount", // ส่วนลดเป็นจำนวนเงินคงที่
  "free_shipping", // ฟรีค่าจัดส่ง
]);

export const coupon = pgTable(
  "coupon",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    type: couponTypeEnum("type").notNull(),
    value: decimal("value", { precision: 10, scale: 2 }).notNull(), // เปอร์เซ็นต์ หรือ จำนวนเงิน
    minPurchaseAmount: decimal("min_purchase_amount", { precision: 10, scale: 2 }),
    maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
    maxUses: integer("max_uses"), // null = unlimited
    usedCount: integer("used_count").notNull().default(0),
    maxUsesPerUser: integer("max_uses_per_user").default(1),
    validFrom: timestamp("valid_from").notNull(),
    validUntil: timestamp("valid_until").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("coupon_code_idx").on(table.code),
    index("coupon_isActive_idx").on(table.isActive),
    index("coupon_validUntil_idx").on(table.validUntil),
  ]
);

// Track coupon usage per user
export const couponUsage = pgTable(
  "coupon_usage",
  {
    id: text("id").primaryKey(),
    couponId: text("coupon_id")
      .notNull()
      .references(() => coupon.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
    usedAt: timestamp("used_at").defaultNow().notNull(),
  },
  (table) => [
    index("couponUsage_couponId_idx").on(table.couponId),
    index("couponUsage_userId_idx").on(table.userId),
    index("couponUsage_orderId_idx").on(table.orderId),
  ]
);

export const couponRelations = relations(coupon, ({ many }) => ({
  usages: many(couponUsage),
}));

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
  coupon: one(coupon, {
    fields: [couponUsage.couponId],
    references: [coupon.id],
  }),
  user: one(user, {
    fields: [couponUsage.userId],
    references: [user.id],
  }),
  order: one(order, {
    fields: [couponUsage.orderId],
    references: [order.id],
  }),
}));

