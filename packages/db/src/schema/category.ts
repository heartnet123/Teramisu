import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const category = pgTable(
  "category",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    image: text("image"),
    parentId: text("parent_id").references((): any => category.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("category_slug_idx").on(table.slug),
    index("category_parentId_idx").on(table.parentId),
    index("category_isActive_idx").on(table.isActive),
  ]
);

export const categoryRelations = relations(category, ({ one, many }) => ({
  parent: one(category, {
    fields: [category.parentId],
    references: [category.id],
    relationName: "categoryParent",
  }),
  children: many(category, { relationName: "categoryParent" }),
}));

