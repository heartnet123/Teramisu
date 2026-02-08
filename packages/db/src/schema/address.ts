import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const address = pgTable(
  "address",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label"), // e.g., "บ้าน", "ที่ทำงาน"
    recipientName: text("recipient_name").notNull(),
    phone: text("phone").notNull(),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    subdistrict: text("subdistrict"), // ตำบล/แขวง
    district: text("district").notNull(), // อำเภอ/เขต
    province: text("province").notNull(), // จังหวัด
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("Thailand"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("address_userId_idx").on(table.userId),
    index("address_isDefault_idx").on(table.isDefault),
  ]
);

export const addressRelations = relations(address, ({ one }) => ({
  user: one(user, {
    fields: [address.userId],
    references: [user.id],
  }),
}));

