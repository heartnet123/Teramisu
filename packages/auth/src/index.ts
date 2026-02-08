import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@Teramisu/db";
import * as schema from "@Teramisu/db/schema/auth";

const isProd = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema: schema,
  }),
  trustedOrigins: (process.env.CORS_ORIGIN || "http://localhost:3001")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      httpOnly: true,
    },
  },
});
