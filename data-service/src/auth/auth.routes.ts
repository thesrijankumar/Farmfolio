import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { createUser, verifyUser, createResetToken, resetPassword } from "./auth.service";
import { sendResetEmail } from "../services/email.service";

const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

export const authRoutes = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
      exp: "7d",
    })
  )
  .post(
    "/api/auth/signup",
    async ({ jwt, body, set }) => {
      try {
        const user = await createUser(body.email, body.password);
        const token = await jwt.sign({ sub: user.id, email: user.email });
        return { token, user };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    { body: t.Object({ email: t.String(), password: t.String({ minLength: 6 }) }) }
  )
  .post(
    "/api/auth/login",
    async ({ jwt, body, set }) => {
      try {
        const user = await verifyUser(body.email, body.password);
        const token = await jwt.sign({ sub: user.id, email: user.email });
        return { token, user };
      } catch (err: any) {
        set.status = 401;
        return { error: err.message };
      }
    },
    { body: t.Object({ email: t.String(), password: t.String() }) }
  )
  .post(
    "/api/auth/forgot-password",
    async ({ body }) => {
      // Always return success — prevents email enumeration
      const token = await createResetToken(body.email);
      if (token) {
        const resetUrl = `${APP_URL}/reset?token=${token}`;
        // Fire-and-forget — don't expose email errors to client
        sendResetEmail(body.email, resetUrl).catch((e) =>
          console.error("Failed to send reset email:", e)
        );
      }
      return { ok: true };
    },
    { body: t.Object({ email: t.String() }) }
  )
  .post(
    "/api/auth/reset-password",
    async ({ body, set }) => {
      try {
        await resetPassword(body.token, body.password);
        return { ok: true };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    { body: t.Object({ token: t.String(), password: t.String({ minLength: 6 }) }) }
  );