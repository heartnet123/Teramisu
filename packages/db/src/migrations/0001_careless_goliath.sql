CREATE TYPE "public"."coupon_type" AS ENUM('percentage', 'fixed_amount', 'free_shipping');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('order_placed', 'order_approved', 'order_shipped', 'order_delivered', 'order_cancelled', 'payment_received', 'payment_failed', 'low_stock', 'new_review', 'promotion', 'system');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('promptpay', 'credit_card', 'bank_transfer', 'omise');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'successful', 'failed', 'expired', 'refunded');--> statement-breakpoint
CREATE TABLE "address" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"label" text,
	"recipient_name" text NOT NULL,
	"phone" text NOT NULL,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"subdistrict" text,
	"district" text NOT NULL,
	"province" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'Thailand' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image" text,
	"parent_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "coupon_type" NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"min_purchase_amount" numeric(10, 2),
	"max_discount_amount" numeric(10, 2),
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"max_uses_per_user" integer DEFAULT 1,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "coupon_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"coupon_id" text NOT NULL,
	"user_id" text NOT NULL,
	"order_id" text NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"metadata" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'THB' NOT NULL,
	"omise_charge_id" text,
	"omise_source_id" text,
	"qr_code_url" text,
	"expires_at" timestamp,
	"paid_at" timestamp,
	"failed_at" timestamp,
	"failure_code" text,
	"failure_message" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"order_id" text,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT true NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_user_product_unique" UNIQUE("user_id","product_id")
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
CREATE TABLE "wishlist" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_user_product_unique" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_parent_id_category_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "address_userId_idx" ON "address" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "address_isDefault_idx" ON "address" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "category_slug_idx" ON "category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "category_parentId_idx" ON "category" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "category_isActive_idx" ON "category" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "coupon_code_idx" ON "coupon" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupon_isActive_idx" ON "coupon" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "coupon_validUntil_idx" ON "coupon" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "couponUsage_couponId_idx" ON "coupon_usage" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "couponUsage_userId_idx" ON "coupon_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "couponUsage_orderId_idx" ON "coupon_usage" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "notification_userId_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_isRead_idx" ON "notification" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notification_type_idx" ON "notification" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_createdAt_idx" ON "notification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payment_orderId_idx" ON "payment" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_omiseChargeId_idx" ON "payment" USING btree ("omise_charge_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "review_userId_idx" ON "review" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "review_productId_idx" ON "review" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "review_rating_idx" ON "review" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "review_isApproved_idx" ON "review" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX "wishlist_userId_idx" ON "wishlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wishlist_productId_idx" ON "wishlist" USING btree ("product_id");