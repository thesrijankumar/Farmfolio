import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

export const authGuard = new Elysia({ name: "authGuard" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    })
  )
  .derive({ as: "scoped" }, async ({ jwt, headers, set }) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      throw new Error("Missing or invalid Authorization header");
    }

    const token = authHeader.slice(7);
    const payload = await jwt.verify(token);
    if (!payload) {
      set.status = 401;
      throw new Error("Invalid or expired token");
    }

    return { user: payload as { sub: string; email: string } };
  });