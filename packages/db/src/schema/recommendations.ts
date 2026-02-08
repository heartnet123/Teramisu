import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { product } from "./ecommerce";

export const recommendationEventTypeEnum = pgEnum("recommendation_event_type", [
  "view",
  "click",
  "conversion",
]);

export const recommendationTypeEnum = pgEnum("recommendation_type", [
  "frequently_bought_together",
  "personalized",
  "category_based",
  "cart_related",
  "order_related",
]);

export const recommendationEvent = pgTable(
  "recommendation_event",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    recommendedProductId: text("recommended_product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    eventType: recommendationEventTypeEnum("event_type").notNull(),
    recommendationType: recommendationTypeEnum("recommendation_type").notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("recommendationEvent_userId_idx").on(table.userId),
    index("recommendationEvent_productId_idx").on(table.productId),
    index("recommendationEvent_recommendedProductId_idx").on(table.recommendedProductId),
    index("recommendationEvent_eventType_idx").on(table.eventType),
    index("recommendationEvent_recommendationType_idx").on(table.recommendationType),
  ]
);

export const recommendationStats = pgTable(
  "recommendation_stats",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    recommendedProductId: text("recommended_product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    recommendationType: recommendationTypeEnum("recommendation_type").notNull(),
    viewCount: integer("view_count").notNull().default(0),
    clickCount: integer("click_count").notNull().default(0),
    conversionCount: integer("conversion_count").notNull().default(0),
    lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("recommendationStats_productId_idx").on(table.productId),
    index("recommendationStats_recommendedProductId_idx").on(table.recommendedProductId),
    index("recommendationStats_recommendationType_idx").on(table.recommendationType),
    index("recommendationStats_recommendationType_productId_idx").on(table.recommendationType, table.productId),
  ]
);

export const recommendationEventRelations = relations(recommendationEvent, ({ one }) => ({
  user: one(user, {
    fields: [recommendationEvent.userId],
    references: [user.id],
  }),
  product: one(product, {
    fields: [recommendationEvent.productId],
    references: [product.id],
  }),
  recommendedProduct: one(product, {
    fields: [recommendationEvent.recommendedProductId],
    references: [product.id],
  }),
}));

export const recommendationStatsRelations = relations(recommendationStats, ({ one }) => ({
  product: one(product, {
    fields: [recommendationStats.productId],
    references: [product.id],
  }),
  recommendedProduct: one(product, {
    fields: [recommendationStats.recommendedProductId],
    references: [product.id],
  }),
}));

/**
 * Data dictionary for recommendations schema
 * Exported as `recommendationsDataDictionary`
 *
 * Tables:
 * - recommendation_event
 *   - id: text PK
 *   - userId: text FK -> user.id (nullable)
 *   - productId: text FK -> product.id NOT NULL
 *   - recommendedProductId: text FK -> product.id NOT NULL
 *   - eventType: recommendation_event_type enum NOT NULL
 *   - recommendationType: recommendation_type enum NOT NULL
 *   - metadata: text (JSON)
 *   - createdAt: timestamp NOT NULL DEFAULT now()
 *
 * - recommendation_stats
 *   - id: text PK
 *   - productId: text FK -> product.id NOT NULL
 *   - recommendedProductId: text FK -> product.id NOT NULL
 *   - recommendationType: recommendation_type enum NOT NULL
 *   - viewCount: integer NOT NULL DEFAULT 0
 *   - clickCount: integer NOT NULL DEFAULT 0
 *   - conversionCount: integer NOT NULL DEFAULT 0
 *   - lastUpdatedAt: timestamp NOT NULL DEFAULT now()
 *   - createdAt: timestamp NOT NULL DEFAULT now()
 *
 * Enums:
 * - recommendation_event_type: view, click, conversion
 * - recommendation_type: frequently_bought_together, personalized, category_based, cart_related, order_related
 */

export const recommendationsDataDictionary = {
  recommendation_event: {
    id: "text PK",
    userId: "text FK -> user.id (nullable)",
    productId: "text FK -> product.id NOT NULL",
    recommendedProductId: "text FK -> product.id NOT NULL",
    eventType: "recommendation_event_type enum NOT NULL",
    recommendationType: "recommendation_type enum NOT NULL",
    metadata: "text (JSON)",
    createdAt: "timestamp NOT NULL DEFAULT now()",
  },
  recommendation_stats: {
    id: "text PK",
    productId: "text FK -> product.id NOT NULL",
    recommendedProductId: "text FK -> product.id NOT NULL",
    recommendationType: "recommendation_type enum NOT NULL",
    viewCount: "integer NOT NULL DEFAULT 0",
    clickCount: "integer NOT NULL DEFAULT 0",
    conversionCount: "integer NOT NULL DEFAULT 0",
    lastUpdatedAt: "timestamp NOT NULL DEFAULT now()",
    createdAt: "timestamp NOT NULL DEFAULT now()",
  },
  enums: {
    recommendation_event_type: ["view", "click", "conversion"],
    recommendation_type: [
      "frequently_bought_together",
      "personalized",
      "category_based",
      "cart_related",
      "order_related",
    ],
  },
};
