const NASA_BASE = "https://power.larc.nasa.gov/api/temporal/climatology/point";

interface NasaPowerResponse {
  properties: {
    parameter: {
      T2M?: { ANN?: number };
      PRECTOTCORR?: { ANN?: number };
      RH2M?: { ANN?: number };
      ALLSKY_SFC_SW_DWN?: { ANN?: number };
      WS2M?: { ANN?: number };
    };
  };
}

export async function getNasaPowerData(lat: number, lon: number) {
  const params = new URLSearchParams({
    parameters: "T2M,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN,WS2M",
    community: "AG",
    longitude: lon.toString(),
    latitude: lat.toString(),
    format: "JSON",
  });

  const res = await fetch(`${NASA_BASE}?${params}`);
  const json = (await res.json()) as NasaPowerResponse;

  if (!res.ok) {
    throw new Error(`NASA POWER error: ${res.status} - ${JSON.stringify(json)}`);
  }

  const p = json.properties?.parameter;
  if (!p) {
    throw new Error(`NASA POWER response missing expected data: ${JSON.stringify(json)}`);
  }

  return {
    avgTemperatureC: p.T2M?.ANN,
    avgRainfallMM: p.PRECTOTCORR?.ANN,
    avgHumidityPct: p.RH2M?.ANN,
    avgSolarRadiation: p.ALLSKY_SFC_SW_DWN?.ANN,
    avgWindSpeed: p.WS2M?.ANN,
  };
}