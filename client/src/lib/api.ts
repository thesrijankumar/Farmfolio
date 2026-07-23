export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:3000";

export type LandReport = {
  rawData: {
    location: { lat: number; lon: number };
    climate: {
      // Original
      avgTemperatureC: number;
      avgRainfallMM: number;
      avgHumidityPct: number;
      avgSolarRadiation: number;
      avgWindSpeed: number;
      // New NASA POWER fields
      soilMoistureSurface: number | null;
      soilMoistureRoot: number | null;
      evapotranspiration: number | null;
      dewPointC: number | null;
      frostDaysPerYear: number | null;
    };
    vegetation: {
      // NDVI (original)
      ndviMean: number;
      ndviMin: number;
      ndviMax: number;
      interpretation: string;
      // Nitrogen / Chlorophyll (Sentinel-2 Red Edge)
      ndreMean: number | null;
      ndreInterpretation: string;
      chlorophyllIndex: number | null;
      // Additional spectral indices
      eviMean: number | null;
      ndwiMean: number | null;
      ndwiInterpretation: string;
      moistureIndex: number | null;
      moistureInterpretation: string;
    };
    userId: string;
  };
  summary: string;
  sessionId: string;
};

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
      else if (body?.error) msg = body.error;
    } catch {
      try {
        const text = await res.text();
        if (text) msg = text;
      } catch {}
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export const api = {
  signup: (email: string, password: string) =>
    fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then((r) => handle<{ token: string }>(r)),

  login: (email: string, password: string) =>
    fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then((r) => handle<{ token: string }>(r)),

  landReport: (token: string, lat: number, lon: number) =>
    fetch(`${API_BASE}/api/land-report`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lat, lon }),
    }).then((r) => handle<LandReport>(r)),

  /**
   * Send a chat message to the agronomy assistant.
   * @param language - "en" | "hi" — instructs the agent to reply in that language
   */
  ask: (token: string, sessionId: string, question: string, language: "en" | "hi" = "en") =>
    fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId, question, language }),
    }).then((r) => handle<{ reply: string }>(r)),

  /**
   * Re-fetch the AI summary in a specific language.
   * Used when the user switches the language toggle on the report page.
   */
  summarizeInLanguage: (token: string, sessionId: string, language: "en" | "hi") =>
    // We re-use the /api/ask endpoint with a translation question scoped to the language.
    // The agent-service system prompt is already set to the correct language via `language`.
    fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId,
        question:
          language === "hi"
            ? "इस खेत का सारांश हिंदी में दें। (Summarise this field's current conditions in Hindi, 3–5 sentences, plain language, no advice.)"
            : "Summarise this field's current conditions in English in 3–5 plain-language sentences. No advice, just description.",
        language,
      }),
    }).then((r) => handle<{ reply: string }>(r)),

  /** Send a password-reset email. Always resolves (never reveals if email exists). */
  forgotPassword: (email: string) =>
    fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    }).then((r) => handle<{ ok: boolean }>(r)),

  /** Set a new password using the token from the reset email. */
  resetPassword: (token: string, password: string) =>
    fetch(`${API_BASE}/api/auth/reset-password`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    }).then((r) => handle<{ ok: boolean }>(r)),
};
