import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";

const app = new Elysia().use(
  jwt({
    name: "jwt",
    secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  })
).get("/token", async ({ jwt }) => {
  return await jwt.sign({ sub: "123", email: "test@test.com" });
}).listen(3001);

console.log("Running...");
