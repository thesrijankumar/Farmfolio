import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { createUser, verifyUser } from "./auth.service";

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
  );