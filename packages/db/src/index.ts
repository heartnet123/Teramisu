import { drizzle } from "drizzle-orm/node-postgres";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as authSchema from "./schema/auth";
import * as ecommerceSchema from "./schema/ecommerce";
import * as settingsSchema from "./schema/settings";
import * as paymentSchema from "./schema/payment";
import * as addressSchema from "./schema/address";
import * as categorySchema from "./schema/category";
import * as wishlistSchema from "./schema/wishlist";
import * as reviewSchema from "./schema/review";
import * as couponSchema from "./schema/coupon";
import * as notificationSchema from "./schema/notification";

export const schema = {
	...authSchema,
	...ecommerceSchema,
	...settingsSchema,
	...paymentSchema,
	...addressSchema,
	...categorySchema,
	...wishlistSchema,
	...reviewSchema,
	...couponSchema,
	...notificationSchema,
} as const;

export type Db = NodePgDatabase<typeof schema>;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required");
}

export const db: Db = drizzle(databaseUrl, { schema });

export * from "./schema/auth";
export * from "./schema/ecommerce";
export * from "./schema/settings";
export * from "./schema/payment";
export * from "./schema/address";
export * from "./schema/category";
export * from "./schema/wishlist";
export * from "./schema/review";
export * from "./schema/coupon";
export * from "./schema/notification";
