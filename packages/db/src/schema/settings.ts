import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const websiteSettings = pgTable("website_settings", {
  id: text("id").primaryKey(),
  themeColors: jsonb("theme_colors").$type<{
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    foreground?: string;
  }>(),
  banners: jsonb("banners").$type<Array<{
    id: string;
    title: string;
    description?: string;
    image?: string;
    link?: string;
    isActive: boolean;
    order: number;
  }>>().default([]),
  seoKeywords: text("seo_keywords").array(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const loginActivity = pgTable("login_activity", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"),
  success: boolean("success").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
