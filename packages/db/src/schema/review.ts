import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { product } from "./ecommerce";

export const review = pgTable(
  "review",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    orderId: text("order_id"), // Reference to the order where product was purchased
    rating: integer("rating").notNull(), // 1-5 stars
    title: text("title"),
    comment: text("comment"),
    isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
    isApproved: boolean("is_approved").notNull().default(true), // For moderation
    helpfulCount: integer("helpful_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("review_userId_idx").on(table.userId),
    index("review_productId_idx").on(table.productId),
    index("review_rating_idx").on(table.rating),
    index("review_isApproved_idx").on(table.isApproved),
    unique("review_user_product_unique").on(table.userId, table.productId),
  ]
);

export const reviewRelations = relations(review, ({ one }) => ({
  user: one(user, {
    fields: [review.userId],
    references: [user.id],
  }),
  product: one(product, {
    fields: [review.productId],
    references: [product.id],
  }),
}));

