interface SentinelTokenResponse {
  access_token: string;
  expires_in: number;
}

interface SentinelStatsResponse {
  data: Array<{
    outputs: {
      ndvi:          { bands: { B0: { stats: { mean: number; min: number; max: number } } } };
      ndre:          { bands: { B0: { stats: { mean: number } } } };
      chlorophyll:   { bands: { B0: { stats: { mean: number } } } };
      evi:           { bands: { B0: { stats: { mean: number } } } };
      ndwi:          { bands: { B0: { stats: { mean: number } } } };
      moistureIndex: { bands: { B0: { stats: { mean: number } } } };
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

function interpretNdvi(mean: number | null): string {
  if (mean == null) return "No data available";
  if (mean > 0.6) return "Healthy dense vegetation";
  if (mean > 0.3) return "Moderate vegetation";
  return "Sparse vegetation / bare soil";
}

function interpretNdre(mean: number | null): string {
  if (mean == null) return "No data";
  if (mean > 0.45) return "High nitrogen content — excellent plant health";
  if (mean > 0.25) return "Adequate nitrogen — moderate plant vigour";
  if (mean > 0.10) return "Low nitrogen — potential deficiency";
  return "Very low nitrogen — likely deficiency or bare soil";
}

function interpretNdwi(mean: number | null): string {
  if (mean == null) return "No data";
  if (mean > 0.3) return "High water content — well-irrigated";
  if (mean > 0.0) return "Moderate water content";
  if (mean > -0.2) return "Low water content — mild stress";
  return "Very low water content — drought stress likely";
}

function interpretMoisture(mean: number | null): string {
  if (mean == null) return "No data";
  if (mean > 0.2) return "High canopy moisture";
  if (mean > 0.0) return "Moderate canopy moisture";
  return "Low canopy moisture — vegetation moisture stress";
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
            input: [{ bands: ["B02", "B03", "B04", "B05", "B07", "B08", "B8A", "B11", "dataMask"] }],
            output: [
              { id: "ndvi",          bands: 1, sampleType: "FLOAT32" },
              { id: "ndre",          bands: 1, sampleType: "FLOAT32" },
              { id: "chlorophyll",   bands: 1, sampleType: "FLOAT32" },
              { id: "evi",           bands: 1, sampleType: "FLOAT32" },
              { id: "ndwi",          bands: 1, sampleType: "FLOAT32" },
              { id: "moistureIndex", bands: 1, sampleType: "FLOAT32" },
              { id: "dataMask",      bands: 1 }
            ]
          };
        }
        function evaluatePixel(s) {
          let eps = 0.000001;
          // NDVI: vegetation density
          let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + eps);
          // NDRE: red-edge nitrogen/chlorophyll proxy  (B8A=842nm edge, B05=705nm)
          let ndre = (s.B8A - s.B05) / (s.B8A + s.B05 + eps);
          // Chlorophyll index: (B07/B05) - 1
          let chlorophyll = (s.B07 / (s.B05 + eps)) - 1;
          // EVI: Enhanced Vegetation Index
          let evi = 2.5 * (s.B08 - s.B04) / (s.B08 + 6 * s.B04 - 7.5 * s.B02 + 1 + eps);
          // NDWI: canopy water content (B03=green, B08=NIR)
          let ndwi = (s.B03 - s.B08) / (s.B03 + s.B08 + eps);
          // Moisture index: (B8A - B11) / (B8A + B11)
          let moisture = (s.B8A - s.B11) / (s.B8A + s.B11 + eps);
          return {
            ndvi:          [ndvi],
            ndre:          [ndre],
            chlorophyll:   [chlorophyll],
            evi:           [evi],
            ndwi:          [ndwi],
            moistureIndex: [moisture],
            dataMask:      [s.dataMask]
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
  const out = json.data?.[0]?.outputs;

  const ndviStats  = out?.ndvi?.bands?.B0?.stats;
  const ndreMean   = out?.ndre?.bands?.B0?.stats?.mean ?? null;
  const chlMean    = out?.chlorophyll?.bands?.B0?.stats?.mean ?? null;
  const eviMean    = out?.evi?.bands?.B0?.stats?.mean ?? null;
  const ndwiMean   = out?.ndwi?.bands?.B0?.stats?.mean ?? null;
  const moistMean  = out?.moistureIndex?.bands?.B0?.stats?.mean ?? null;

  return {
    // NDVI (original)
    ndviMean: ndviStats?.mean ?? null,
    ndviMin:  ndviStats?.min  ?? null,
    ndviMax:  ndviStats?.max  ?? null,
    interpretation: interpretNdvi(ndviStats?.mean ?? null),

    // NDRE — nitrogen / chlorophyll proxy
    ndreMean,
    ndreInterpretation: interpretNdre(ndreMean),

    // Chlorophyll Index (Red Edge)
    chlorophyllIndex: chlMean !== null ? parseFloat(chlMean.toFixed(3)) : null,

    // EVI — Enhanced Vegetation Index
    eviMean: eviMean !== null ? parseFloat(eviMean.toFixed(3)) : null,

    // NDWI — canopy water content
    ndwiMean,
    ndwiInterpretation: interpretNdwi(ndwiMean),

    // Moisture Index — vegetation moisture stress
    moistureIndex: moistMean,
    moistureInterpretation: interpretMoisture(moistMean),
  };
}