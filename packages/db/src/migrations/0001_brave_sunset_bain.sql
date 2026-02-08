CREATE TABLE "login_activity" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"location" text,
	"success" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "website_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"theme_colors" jsonb,
	"banners" jsonb DEFAULT '[]'::jsonb,
	"seo_keywords" text[],
	"seo_title" text,
	"seo_description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "wellness_goals" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "ingredients" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "rating" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "popularity_score" integer DEFAULT 0 NOT NULL;