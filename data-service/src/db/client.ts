import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Environment variables will be injected by Bun or the production environment
// If DATABASE_URL is missing, postgres will throw an error on connection

const client = postgres(process.env.DATABASE_URL as string, {
  ssl: "require",
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  prepare: false,
});
export const db = drizzle(client, { schema });