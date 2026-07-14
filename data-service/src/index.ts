import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { getNasaPowerData } from "./services/nasaPower";
import { getNdvi } from "./services/sentinelHub";
import { authRoutes } from "./auth/auth.routes";
import { authGuard } from "./auth/auth.middleware";

interface SummarizeResponse {
  summary: string;
  sessionId: string;
}

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:8000";

new Elysia()
  .use(cors())

  // ── Public routes (no auth required) ─────────────────────────────────────
  .use(authRoutes)

  // Health check
  .get("/health", () => ({ status: "ok", service: "data-service", timestamp: new Date().toISOString() }))

  // ── Protected routes ──────────────────────────────────────────────────────
  .use(authGuard)

  .post(
    "/api/land-report",
    async ({ body, user }) => {
      const { lat, lon } = body;

      const [nasaData, sentinelData] = await Promise.all([
        getNasaPowerData(lat, lon),
        getNdvi(lat, lon),
      ]);

      const farmData = {
        location: { lat, lon },
        climate: nasaData,
        vegetation: sentinelData,
        userId: user.sub,
      };

      // Try to call agent service; fall back gracefully if not running
      try {
        const agentRes = await fetch(`${AGENT_SERVICE_URL}/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(farmData),
          signal: AbortSignal.timeout(8000),
        });

        if (agentRes.ok) {
          const { summary, sessionId } = (await agentRes.json()) as SummarizeResponse;
          return { rawData: farmData, summary, sessionId };
        }
      } catch {
        // agent service not available — return raw data only
      }

      return {
        rawData: farmData,
        summary: null,
        sessionId: null,
        note: "Agent service unavailable. Raw satellite & climate data returned.",
      };
    },
    { body: t.Object({ lat: t.Number(), lon: t.Number() }) }
  )

  .post(
    "/api/ask",
    async ({ body }) => {
      try {
        const res = await fetch(`${AGENT_SERVICE_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`Agent error: ${res.status}`);
        return res.json();
      } catch (err: any) {
        return { error: "Agent service unavailable", detail: err.message };
      }
    },
    { body: t.Object({ sessionId: t.String(), question: t.String() }) }
  )

  .listen(3000);

console.log("✅ Data service running on http://localhost:3000");