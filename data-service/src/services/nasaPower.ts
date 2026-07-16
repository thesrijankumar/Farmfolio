const NASA_BASE = "https://power.larc.nasa.gov/api/temporal/climatology/point";

interface NasaPowerResponse {
  properties: {
    parameter: {
      T2M?: { ANN?: number };
      PRECTOTCORR?: { ANN?: number };
      RH2M?: { ANN?: number };
      ALLSKY_SFC_SW_DWN?: { ANN?: number };
      WS2M?: { ANN?: number };
      GWETTOP?: { ANN?: number };
      GWETROOT?: { ANN?: number };
      EVPTRNS?: { ANN?: number };
      T2MDEW?: { ANN?: number };
      FROST_DAYS?: { ANN?: number };
    };
  };
}

export async function getNasaPowerData(lat: number, lon: number) {
  const params = new URLSearchParams({
    parameters: "T2M,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN,WS2M,GWETTOP,GWETROOT,EVPTRNS,T2MDEW,FROST_DAYS",
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
    // Original climate params
    avgTemperatureC: p.T2M?.ANN,
    avgRainfallMM: p.PRECTOTCORR?.ANN,
    avgHumidityPct: p.RH2M?.ANN,
    avgSolarRadiation: p.ALLSKY_SFC_SW_DWN?.ANN,
    avgWindSpeed: p.WS2M?.ANN,
    // New soil & environmental params
    soilMoistureSurface: p.GWETTOP?.ANN,   // 0-1 scale, top layer wetness
    soilMoistureRoot: p.GWETROOT?.ANN,     // 0-1 scale, root zone wetness
    evapotranspiration: p.EVPTRNS?.ANN,    // mm/day, water lost from soil+plants
    dewPointC: p.T2MDEW?.ANN,              // °C, dew/frost point temperature
    frostDaysPerYear: p.FROST_DAYS?.ANN,   // avg annual frost days
  };
}