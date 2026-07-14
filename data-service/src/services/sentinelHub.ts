interface SentinelTokenResponse {
  access_token: string;
  expires_in: number;
}

interface SentinelStatsResponse {
  data: Array<{
    outputs: {
      ndvi: {
        bands: {
          B0: {
            stats: { mean: number; min: number; max: number };
          };
        };
      };
    };
  }>;
}

let cachedToken: { token: string; expiry: number } | null = null;

async function getSentinelToken() {
  if (cachedToken && Date.now() < cachedToken.expiry) return cachedToken.token;

  const res = await fetch("https://services.sentinel-hub.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SENTINEL_CLIENT_ID!,
      client_secret: process.env.SENTINEL_CLIENT_SECRET!,
    }),
  });

  const data = (await res.json()) as SentinelTokenResponse;

  if (!data.access_token) {
    throw new Error("Sentinel Hub auth failed: " + JSON.stringify(data));
  }

  cachedToken = { token: data.access_token, expiry: Date.now() + data.expires_in * 1000 - 5000 };
  return cachedToken.token;
}

export async function getNdvi(lat: number, lon: number) {
  const token = await getSentinelToken();
  const delta = 0.01;

  const body = {
    input: {
      bounds: {
        bbox: [lon - delta, lat - delta, lon + delta, lat + delta],
      },
      data: [{ type: "sentinel-2-l2a" }],
    },
    aggregation: {
      timeRange: {
        from: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
      aggregationInterval: { of: "P30D" },
      evalscript: `
        //VERSION=3
        function setup() {
          return {
            input: [{ bands: ["B04", "B08", "dataMask"] }],
            output: [
              { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
              { id: "dataMask", bands: 1 }
            ]
          };
        }
        function evaluatePixel(s) {
          let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 0.000001);
          return {
            ndvi: [ndvi],
            dataMask: [s.dataMask]
          };
        }
      `,
    },
  };

  const res = await fetch("https://services.sentinel-hub.com/api/v1/statistics", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Sentinel Hub error: ${res.status}`);

  const json = (await res.json()) as SentinelStatsResponse;
  const stats = json.data?.[0]?.outputs?.ndvi?.bands?.B0?.stats;

  return {
    ndviMean: stats?.mean ?? null,
    ndviMin: stats?.min ?? null,
    ndviMax: stats?.max ?? null,
    interpretation:
      stats?.mean == null ? "No data available"
      : stats.mean > 0.6 ? "Healthy dense vegetation"
      : stats.mean > 0.3 ? "Moderate vegetation"
      : "Sparse vegetation / bare soil",
  };
}