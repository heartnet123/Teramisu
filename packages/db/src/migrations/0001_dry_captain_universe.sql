CREATE TYPE "public"."recommendation_event_type" AS ENUM('view', 'click', 'conversion');--> statement-breakpoint
CREATE TYPE "public"."recommendation_type" AS ENUM('frequently_bought_together', 'personalized', 'category_based', 'cart_related', 'order_related');--> statement-breakpoint
CREATE TABLE "recommendation_event" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"product_id" text NOT NULL,
	"recommended_product_id" text NOT NULL,
	"event_type" "recommendation_event_type" NOT NULL,
	"recommendation_type" "recommendation_type" NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"recommended_product_id" text NOT NULL,
	"recommendation_type" "recommendation_type" NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"conversion_count" integer DEFAULT 0 NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
ALTER TABLE "recommendation_event" ADD CONSTRAINT "recommendation_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_event" ADD CONSTRAINT "recommendation_event_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_event" ADD CONSTRAINT "recommendation_event_recommended_product_id_product_id_fk" FOREIGN KEY ("recommended_product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_stats" ADD CONSTRAINT "recommendation_stats_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_stats" ADD CONSTRAINT "recommendation_stats_recommended_product_id_product_id_fk" FOREIGN KEY ("recommended_product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recommendationEvent_userId_idx" ON "recommendation_event" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recommendationEvent_productId_idx" ON "recommendation_event" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "recommendationEvent_recommendedProductId_idx" ON "recommendation_event" USING btree ("recommended_product_id");--> statement-breakpoint
CREATE INDEX "recommendationEvent_eventType_idx" ON "recommendation_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "recommendationEvent_recommendationType_idx" ON "recommendation_event" USING btree ("recommendation_type");--> statement-breakpoint
CREATE INDEX "recommendationStats_productId_idx" ON "recommendation_stats" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "recommendationStats_recommendedProductId_idx" ON "recommendation_stats" USING btree ("recommended_product_id");--> statement-breakpoint
CREATE INDEX "recommendationStats_recommendationType_idx" ON "recommendation_stats" USING btree ("recommendation_type");--> statement-breakpoint
CREATE INDEX "recommendationStats_recommendationType_productId_idx" ON "recommendation_stats" USING btree ("recommendation_type","product_id");