import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export async function createUser(email: string, password: string) {
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) throw new Error("User already exists");

  const passwordHash = await Bun.password.hash(password);

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id, email: users.email });

  return user;
}

export async function verifyUser(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) throw new Error("Invalid credentials");

  const valid = await Bun.password.verify(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  return { id: user.id, email: user.email };
}