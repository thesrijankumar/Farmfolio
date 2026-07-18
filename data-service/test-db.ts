import { db } from "./src/db/client";
import { users } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await db.select().from(users).where(eq(users.email, "sarthakpatel873@gmail.com"));
      console.log(`Query ${i} success`);
    } catch (e: any) {
      console.error(`Query ${i} error:`, e.message, e.cause || e);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  process.exit(0);
}
run();
