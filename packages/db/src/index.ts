import { drizzle } from "drizzle-orm/node-postgres";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as authSchema from "./schema/auth";
import * as ecommerceSchema from "./schema/ecommerce";
import * as settingsSchema from "./schema/settings";

export const schema = {
	...authSchema,
	...ecommerceSchema,
	...settingsSchema,
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
