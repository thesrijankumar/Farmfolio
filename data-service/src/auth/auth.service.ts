import { db } from "../db/client";
import { users, passwordResetTokens } from "../db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";

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
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) throw new Error("Invalid credentials");

    const valid = await Bun.password.verify(password, user.passwordHash);
    if (!valid) throw new Error("Invalid credentials");

    return { id: user.id, email: user.email };
  } catch (e: any) {
    console.error("DB QUERY ERROR:", e, e.cause || "");
    throw e;
  }
}

// ── Forgot / Reset password ───────────────────────────────────────────────────

/**
 * Creates a secure password-reset token for the given email.
 * Returns the token (to be embedded in the reset URL).
 * Returns null silently if the email doesn't exist (prevents user enumeration).
 */
export async function createResetToken(email: string): Promise<string | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return null; // don't reveal whether email exists

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  return token;
}

/**
 * Validates a reset token and sets the new password.
 * Throws on invalid / expired / already-used token.
 */
export async function resetPassword(token: string, newPassword: string) {
  const now = new Date();

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, now),
        isNull(passwordResetTokens.usedAt)
      )
    );

  if (!row) throw new Error("Reset link is invalid or has expired.");

  const passwordHash = await Bun.password.hash(newPassword);

  await Promise.all([
    db.update(users).set({ passwordHash }).where(eq(users.id, row.userId)),
    db.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.id, row.id)),
  ]);
}