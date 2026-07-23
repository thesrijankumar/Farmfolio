import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error(
    "❌ DATABASE_URL is not set. Make sure env.ts is imported FIRST in index.ts and your .env file exists."
  );
}

const client = postgres(dbUrl, {
  ssl: "require",
  max: 3,
  idle_timeout: 20,
  connect_timeout: 30,
  max_lifetime: 1800,
  prepare: false,
  fetch_types: false,
});

export const db = drizzle(client, { schema });