import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(import.meta.dir, ".env") });

import postgres from "postgres";

const url = process.env.DATABASE_URL;
console.log("Connecting to:", url?.replace(/:.*@/, ":*****@"));

const client = postgres(url as string, {
  ssl: "require",
  max: 1,
  idle_timeout: 30,
  connect_timeout: 30,
  prepare: false,
  onnotice: (n) => console.log("NOTICE:", n),
  debug: (conn, query, params, types) => console.log("DEBUG:", query),
});

try {
  const res = await client`SELECT id, email FROM users WHERE email = ${"sarthakpatel873@gmail.com"}`;
  console.log("✅ SUCCESS:", res);
} catch (e: any) {
  console.error("❌ FULL ERROR:");
  console.error("  message:", e.message);
  console.error("  code:", e.code);
  console.error("  cause:", e.cause);
  console.error("  stack:", e.stack);
} finally {
  await client.end();
}
