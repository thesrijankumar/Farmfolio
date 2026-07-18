/**
 * env.ts — Must be the very first import in index.ts.
 * Loads .env BEFORE any other module (like db/client.ts) reads process.env.
 */
import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(import.meta.dir, "../.env") });

// Validate critical env vars and give clear errors instead of silent failures
const required = ["DATABASE_URL", "JWT_SECRET"] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `❌ Missing required environment variable: ${key}\n` +
        `   Make sure your .env file exists at: ${resolve(import.meta.dir, "../.env")}`
    );
  }
}
