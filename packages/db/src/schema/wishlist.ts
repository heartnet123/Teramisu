import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { product } from "./ecommerce";

export const wishlist = pgTable(
  "wishlist",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("wishlist_userId_idx").on(table.userId),
    index("wishlist_productId_idx").on(table.productId),
    unique("wishlist_user_product_unique").on(table.userId, table.productId),
  ]
);

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(user, {
    fields: [wishlist.userId],
    references: [user.id],
  }),
  product: one(product, {
    fields: [wishlist.productId],
    references: [product.id],
  }),
}));

