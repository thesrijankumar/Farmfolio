import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, ArrowRight, Languages } from "lucide-react";
import { api, type LandReport } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Shell } from "../components/farmfolio/Shell";
import { CountUp } from "../components/farmfolio/CountUp";
import { getCurrentReport } from "../lib/report-store";

export const Route = createFileRoute("/report")({
  component: ReportPage,
});

type Lang = "en" | "hi";

const TRANSLATIONS = {
  en: {
    loading: "Loading report…",
    fieldReport: "Field report",
    session: "Session",
    climateNasa: "Climate · NASA POWER",
    temperature: "Temperature",
    rainfall: "Rainfall",
    humidity: "Humidity",
    solarRadiation: "Solar radiation",
    windSpeed: "Wind speed",
    soilWaterNasa: "Soil & Water · NASA POWER",
    surfaceMoisture: "Surface soil moisture",
    rootMoisture: "Root zone moisture",
    evapotranspiration: "Evapotranspiration",
    dewPoint: "Dew point",
    frostDays: "Frost days / year",
    surfaceNote: "0–1 scale (top layer)",
    rootNote: "0–1 scale (root zone)",
    evapoNote: "Water lost from soil + plants",
    dewNote: "Moisture condensation threshold",
    frostNote: "Average annual frost days",
    fieldNote: "Field note",
    agronomyAssistant: "Farmfolio agronomy assistant",
    vegIndexNdvi: "Vegetation index · NDVI · Sentinel-2",
    nitrogenChloro: "Nitrogen & Chlorophyll · Sentinel-2 Red Edge",
    nitrogenDesc: "NDRE and chlorophyll index are satellite proxies for leaf nitrogen content (industry standard)",
    ndreProxy: "NDRE — Nitrogen proxy",
    chlorophyllIndex: "Chlorophyll index (Red Edge)",
    chloroDesc: "Higher = more chlorophyll = more nitrogen uptake",
    evi: "EVI — Enhanced vegetation",
    eviDesc: "Less affected by atmosphere & clouds than NDVI",
    waterMoistureStress: "Water & Moisture Stress · Sentinel-2",
    ndwi: "NDWI — Canopy water content",
    moistureStressIdx: "Moisture stress index (B8A/B11)",
    askAgronomist: "Ask the agronomist",
    followUp: "Follow up on this report.",
    noData: "No data available",
    bare: "0.0 · bare",
    sparse: "0.3 · sparse",
    healthy: "0.6 · healthy",
    denseCanopy: "0.9 · dense canopy",
    min: "Min",
    mean: "Mean",
    max: "Max",
    deficient: "0.0 · deficient",
    adequate: "0.25 · adequate",
    optimal: "0.45+ · optimal",
    noQuestions: "No questions yet. Ask anything about this field — planting windows, water balance, crop suitability, NDVI trend.",
    you: "You",
    thinking: "Thinking…",
    askPlaceholder: "Ask a question about this field…",
    askBtn: "Ask",
    suggested: "Suggested",
    sug1: "Which crops would suit this climate?",
    sug2: "Is irrigation likely necessary?",
    sug3: "What does the NDVI trend suggest right now?",
    langToggle: "हिन्दी",
  },
  hi: {
    loading: "रिपोर्ट लोड हो रही है...",
    fieldReport: "खेत रिपोर्ट",
    session: "सत्र",
    climateNasa: "जलवायु · NASA POWER",
    temperature: "तापमान",
    rainfall: "वर्षा",
    humidity: "नमी",
    solarRadiation: "सौर विकिरण",
    windSpeed: "हवा की गति",
    soilWaterNasa: "मिट्टी और जल · NASA POWER",
    surfaceMoisture: "सतह की मिट्टी की नमी",
    rootMoisture: "जड़ क्षेत्र की नमी",
    evapotranspiration: "वाष्पीकरण",
    dewPoint: "ओस बिंदु",
    frostDays: "पाला के दिन / वर्ष",
    surfaceNote: "0-1 पैमाना (ऊपरी परत)",
    rootNote: "0-1 पैमाना (जड़ क्षेत्र)",
    evapoNote: "मिट्टी + पौधों से पानी का नुकसान",
    dewNote: "नमी संघनन सीमा",
    frostNote: "औसत वार्षिक पाला के दिन",
    fieldNote: "खेत नोट",
    agronomyAssistant: "फार्मफोलियो कृषि सहायक",
    vegIndexNdvi: "वनस्पति सूचकांक · NDVI · Sentinel-2",
    nitrogenChloro: "नाइट्रोजन और क्लोरोफिल · Sentinel-2 Red Edge",
    nitrogenDesc: "NDRE और क्लोरोफिल सूचकांक पत्ती नाइट्रोजन सामग्री के लिए उपग्रह प्रॉक्सी हैं (उद्योग मानक)",
    ndreProxy: "NDRE - नाइट्रोजन प्रॉक्सी",
    chlorophyllIndex: "क्लोरोफिल सूचकांक (Red Edge)",
    chloroDesc: "उच्च = अधिक क्लोरोफिल = अधिक नाइट्रोजन ग्रहण",
    evi: "EVI - उन्नत वनस्पति",
    eviDesc: "NDVI की तुलना में वायुमंडल और बादलों से कम प्रभावित",
    waterMoistureStress: "जल और नमी तनाव · Sentinel-2",
    ndwi: "NDWI - कैनोपी जल सामग्री",
    moistureStressIdx: "नमी तनाव सूचकांक (B8A/B11)",
    askAgronomist: "कृषिविज्ञानी से पूछें",
    followUp: "इस रिपोर्ट पर अनुवर्ती कार्रवाई करें।",
    noData: "कोई डेटा उपलब्ध नहीं",
    bare: "0.0 · खाली",
    sparse: "0.3 · विरल",
    healthy: "0.6 · स्वस्थ",
    denseCanopy: "0.9 · घनी कैनोपी",
    min: "न्यूनतम",
    mean: "औसत",
    max: "अधिकतम",
    deficient: "0.0 · कमी",
    adequate: "0.25 · पर्याप्त",
    optimal: "0.45+ · इष्टतम",
    noQuestions: "अभी तक कोई प्रश्न नहीं। इस क्षेत्र के बारे में कुछ भी पूछें - रोपण का समय, जल संतुलन, फसल उपयुक्तता, NDVI प्रवृत्ति।",
    you: "आप",
    thinking: "सोच रहा है...",
    askPlaceholder: "इस क्षेत्र के बारे में एक प्रश्न पूछें...",
    askBtn: "पूछें",
    suggested: "सुझाव",
    sug1: "इस जलवायु के लिए कौन सी फसलें उपयुक्त होंगी?",
    sug2: "क्या सिंचाई की संभावना है?",
    sug3: "NDVI प्रवृत्ति अभी क्या सुझाव देती है?",
    langToggle: "English",
  }
} as const;

type Msg = { role: "user" | "assistant"; text: string };

function ReportPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<LandReport | null>(null);
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    if (!token) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    const r = getCurrentReport();
    if (!r) {
      navigate({ to: "/location", replace: true });
      return;
    }
    setReport(r);
  }, [token, navigate]);

  if (!report) {
    return (
      <Shell>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          {TRANSLATIONS[lang].loading}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ReportView report={report} token={token!} lang={lang} setLang={setLang} />
    </Shell>
  );
}

function ReportView({ report, token, lang, setLang }: { report: LandReport; token: string, lang: Lang, setLang: (l: Lang) => void }) {
  const { rawData, summary, sessionId } = report;
  const { climate, vegetation, location } = rawData;
  const t = TRANSLATIONS[lang];

  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);
  const [translatingSummary, setTranslatingSummary] = useState(false);

  useEffect(() => {
    setTranslatedSummary(null);
  }, [lang]);

  async function handleTranslateSummary() {
    if (translatingSummary) return;
    setTranslatingSummary(true);
    try {
      const prompt = lang === "hi"
        ? `Translate the following agricultural field summary to Hindi: "${summary}"`
        : `Translate the following agricultural field summary to English: "${summary}"`;
      const { reply } = await api.ask(token, sessionId, prompt);
      setTranslatedSummary(reply);
    } catch (err) {
      toast.error("Could not translate summary");
    } finally {
      setTranslatingSummary(false);
    }
  }

  const displaySummary = translatedSummary || summary;

  const climateStats = useMemo(
    () => [
      { label: t.temperature, value: climate.avgTemperatureC, unit: "°C", decimals: 1 },
      { label: t.rainfall, value: climate.avgRainfallMM, unit: "mm/day", decimals: 2 },
      { label: t.humidity, value: climate.avgHumidityPct, unit: "%", decimals: 0 },
      { label: t.solarRadiation, value: climate.avgSolarRadiation, unit: "kWh/m²", decimals: 1 },
      { label: t.windSpeed, value: climate.avgWindSpeed, unit: "m/s", decimals: 1 },
    ],
    [climate, t],
  );

  const soilStats = useMemo(
    () => [
      {
        label: t.surfaceMoisture,
        value: climate.soilMoistureSurface,
        unit: "",
        decimals: 2,
        note: t.surfaceNote,
      },
      {
        label: t.rootMoisture,
        value: climate.soilMoistureRoot,
        unit: "",
        decimals: 2,
        note: t.rootNote,
      },
      {
        label: t.evapotranspiration,
        value: climate.evapotranspiration,
        unit: "mm/day",
        decimals: 2,
        note: t.evapoNote,
      },
      {
        label: t.dewPoint,
        value: climate.dewPointC,
        unit: "°C",
        decimals: 1,
        note: t.dewNote,
      },
      {
        label: t.frostDays,
        value: climate.frostDaysPerYear,
        unit: "days",
        decimals: 0,
        note: t.frostNote,
      },
    ],
    [climate, t],
  );

  // NDRE badge color
  const ndreColor =
    vegetation.ndreMean == null ? "text-muted-foreground"
    : vegetation.ndreMean > 0.45 ? "text-emerald-700"
    : vegetation.ndreMean > 0.25 ? "text-lime-700"
    : vegetation.ndreMean > 0.10 ? "text-amber-600"
    : "text-red-600";

  return (
    <div className={`mx-auto max-w-6xl px-6 py-14 ${lang === "hi" ? "font-hi" : ""}`}>
      <style>{`
        .font-hi .text-\\[10px\\] { font-size: 13px !important; }
        .font-hi .text-\\[11px\\] { font-size: 14px !important; }
        .font-hi .text-xs { font-size: 15px !important; }
        .font-hi .text-sm { font-size: 16px !important; }
        .font-hi .text-base { font-size: 18px !important; }
        .font-hi p, .font-hi span, .font-hi div, .font-hi button { letter-spacing: 0.02em; }
      `}</style>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
              {t.fieldReport}
            </p>
            <button 
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted"
            >
              <Languages className="h-3 w-3" />
              {t.langToggle}
            </button>
          </div>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-[color:var(--forest-deep)] md:text-5xl">
            {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
          </h1>
        </div>
        <p className="stat-num text-sm text-muted-foreground">
          {t.session} · <span className="text-foreground/70">{sessionId.slice(0, 8)}</span>
        </p>
      </div>

      {/* ── Climate ─────────────────────────────────────────────────── */}
      <section className="mt-14 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          {t.climateNasa}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-5">
          {climateStats.map((s) => (
            <div key={s.label}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
              <p className="stat-num mt-3 text-5xl text-[color:var(--forest-deep)] md:text-6xl">
                <CountUp value={s.value} decimals={s.decimals} />
                <span className="ml-1 text-lg text-muted-foreground">{s.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Soil Health ─────────────────────────────────────────────── */}
      <section className="mt-16 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          {t.soilWaterNasa}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-5">
          {soilStats.map((s) => (
            <div key={s.label}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
              {s.value != null ? (
                <p className="stat-num mt-3 text-4xl text-[color:var(--forest-deep)] md:text-5xl">
                  <CountUp value={s.value} decimals={s.decimals} />
                  {s.unit && <span className="ml-1 text-base text-muted-foreground">{s.unit}</span>}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">—</p>
              )}
              <p className="mt-1 text-[10px] text-muted-foreground/70">{s.note}</p>
            </div>
          ))}
        </div>
        {/* Soil moisture visual bars */}
        {climate.soilMoistureSurface != null && climate.soilMoistureRoot != null && (
          <div className="mt-10 space-y-4">
            <MoistureBar label={t.surfaceMoisture} value={climate.soilMoistureSurface} />
            <MoistureBar label={t.rootMoisture} value={climate.soilMoistureRoot} />
          </div>
        )}
      </section>

      {/* ── AI Summary ──────────────────────────────────────────────── */}
      <section className="mt-16 grid gap-10 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col gap-3 items-start md:pt-3">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
            {t.fieldNote}
          </div>
          {lang === "hi" && !translatedSummary && (
            <button
              onClick={handleTranslateSummary}
              disabled={translatingSummary}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted"
            >
              {translatingSummary ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
              अनुवाद करें (Translate)
            </button>
          )}
        </div>
        <blockquote className="border-l-2 border-[color:var(--forest)] pl-6">
          <p className="font-serif text-2xl leading-snug tracking-tight text-[color:var(--forest-deep)] md:text-3xl">
            &ldquo;{displaySummary}&rdquo;
          </p>
          <footer className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
            {t.agronomyAssistant}
          </footer>
        </blockquote>
      </section>

      {/* ── NDVI ────────────────────────────────────────────────────── */}
      <section className="mt-20 rule-t pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
              {t.vegIndexNdvi}
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-[color:var(--forest-deep)]">
              {vegetation.interpretation}
            </h2>
          </div>
          <p className="stat-num text-5xl text-[color:var(--forest-deep)]">
            <CountUp value={vegetation.ndviMean} decimals={2} />
          </p>
        </div>
        <NdviScale
          mean={vegetation.ndviMean}
          min={vegetation.ndviMin}
          max={vegetation.ndviMax}
          lang={lang}
        />
      </section>

      {/* ── Nitrogen & Chlorophyll ──────────────────────────────────── */}
      <section className="mt-20 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          {t.nitrogenChloro}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.nitrogenDesc}
        </p>
        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* NDRE score */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t.ndreProxy}
            </p>
            {vegetation.ndreMean != null ? (
              <>
                <p className={`stat-num mt-3 text-5xl ${ndreColor}`}>
                  <CountUp value={vegetation.ndreMean} decimals={3} />
                </p>
                <p className={`mt-2 text-sm font-medium ${ndreColor}`}>
                  {vegetation.ndreInterpretation}
                </p>
                <NdreScale value={vegetation.ndreMean} lang={lang} />
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t.noData}</p>
            )}
          </div>
          {/* Chlorophyll Index */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t.chlorophyllIndex}
            </p>
            {vegetation.chlorophyllIndex != null ? (
              <>
                <p className="stat-num mt-3 text-5xl text-[color:var(--forest-deep)]">
                  <CountUp value={vegetation.chlorophyllIndex} decimals={2} />
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.chloroDesc}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t.noData}</p>
            )}
          </div>
          {/* EVI */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t.evi}
            </p>
            {vegetation.eviMean != null ? (
              <>
                <p className="stat-num mt-3 text-5xl text-[color:var(--forest-deep)]">
                  <CountUp value={vegetation.eviMean} decimals={3} />
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.eviDesc}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t.noData}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Water & Moisture Stress ─────────────────────────────────── */}
      <section className="mt-20 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          {t.waterMoistureStress}
        </p>
        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* NDWI */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t.ndwi}
            </p>
            {vegetation.ndwiMean != null ? (
              <>
                <p className="stat-num mt-3 text-5xl text-[color:var(--forest-deep)]">
                  <CountUp value={vegetation.ndwiMean} decimals={3} />
                </p>
                <p className="mt-2 text-sm font-medium text-[color:var(--forest-deep)]">
                  {vegetation.ndwiInterpretation}
                </p>
                <IndexBar value={vegetation.ndwiMean} min={-0.5} max={0.5} />
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t.noData}</p>
            )}
          </div>
          {/* Moisture Index */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t.moistureStressIdx}
            </p>
            {vegetation.moistureIndex != null ? (
              <>
                <p className="stat-num mt-3 text-5xl text-[color:var(--forest-deep)]">
                  <CountUp value={vegetation.moistureIndex} decimals={3} />
                </p>
                <p className="mt-2 text-sm font-medium text-[color:var(--forest-deep)]">
                  {vegetation.moistureInterpretation}
                </p>
                <IndexBar value={vegetation.moistureIndex} min={-0.5} max={0.5} />
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t.noData}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Chat ────────────────────────────────────────────────────── */}
      <section className="mt-20 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          {t.askAgronomist}
        </p>
        <h2 className="mt-2 max-w-2xl font-serif text-3xl tracking-tight text-[color:var(--forest-deep)]">
          {t.followUp}
        </h2>
        <ChatPanel token={token} sessionId={sessionId} lang={lang} />
      </section>
    </div>
  );
}


function NdviScale({ mean, min, max, lang }: { mean: number; min: number; max: number; lang: Lang }) {
  const t = TRANSLATIONS[lang];
  // Practical scale 0..0.9
  const scaleMin = 0;
  const scaleMax = 0.9;
  const pct = (v: number) =>
    `${Math.min(100, Math.max(0, ((v - scaleMin) / (scaleMax - scaleMin)) * 100))}%`;

  return (
    <div className="mt-10">
      <div className="relative h-3 w-full bg-[color:var(--sage)]/50">
        {/* gradient bar */}
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: "100%",
            background:
              "linear-gradient(to right, oklch(0.85 0.05 60), oklch(0.78 0.12 120), oklch(0.42 0.12 150))",
            opacity: 0.85,
          }}
        />
        {/* min-max range */}
        <div
          className="absolute inset-y-0 border-x border-[color:var(--forest-deep)]/50 bg-[color:var(--forest-deep)]/10"
          style={{ left: pct(min), width: `calc(${pct(max)} - ${pct(min)})` }}
        />
        {/* mean marker */}
        <div
          className="absolute -top-2 -bottom-2 w-[2px] bg-[color:var(--forest-deep)]"
          style={{ left: pct(mean) }}
        >
          <span className="stat-num absolute -top-6 -translate-x-1/2 text-xs text-[color:var(--forest-deep)]">
            {mean.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="stat-num mt-3 flex justify-between text-[11px] text-muted-foreground">
        <span>{t.bare}</span>
        <span>{t.sparse}</span>
        <span>{t.healthy}</span>
        <span>{t.denseCanopy}</span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-6 text-sm">
        <Stat label={t.min} value={min} />
        <Stat label={t.mean} value={mean} highlight />
        <Stat label={t.max} value={max} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={`stat-num mt-2 text-3xl ${
          highlight ? "text-[color:var(--forest-deep)]" : "text-foreground/80"
        }`}
      >
        {value.toFixed(2)}
      </p>
    </div>
  );
}

function ChatPanel({ token, sessionId, lang }: { token: string; sessionId: string; lang: Lang }) {
  const t = TRANSLATIONS[lang];
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || pending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setPending(true);
    try {
      const prompt = lang === "hi" ? `${q} (Please reply in Hindi / कृपया हिंदी में उत्तर दें)` : q;
      const { reply } = await api.ask(token, sessionId, prompt);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send";
      toast.error(msg);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `⚠︎ ${msg}` },
      ]);
    } finally {
      setPending(false);
    }
  }

  const suggestions = [
    t.sug1,
    t.sug2,
    t.sug3,
  ];

  return (
    <div className="mt-8 grid gap-10 md:grid-cols-[1fr_auto]">
      <div>
        <div
          ref={scrollRef}
          className="min-h-[220px] max-h-[440px] overflow-y-auto pr-2"
        >
          {messages.length === 0 && !pending && (
            <p className="text-foreground/60">
              {t.noQuestions}
            </p>
          )}
          <ul className="space-y-8">
            {messages.map((m, i) => (
              <li key={i}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {m.role === "user" ? t.you : "Farmfolio"}
                </p>
                <p
                  className={`mt-2 leading-relaxed ${
                    m.role === "assistant"
                      ? "font-serif text-lg text-[color:var(--forest-deep)]"
                      : "text-foreground"
                  }`}
                >
                  {m.text}
                </p>
              </li>
            ))}
            {pending && (
              <li>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Farmfolio
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t.thinking}
                </p>
              </li>
            )}
          </ul>
        </div>

        <form onSubmit={onSend} className="mt-8 flex items-center gap-3 border-t border-border pt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.askPlaceholder}
            className="flex-1 border-0 bg-transparent px-0 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="inline-flex items-center gap-2 rounded-sm bg-[color:var(--forest)] px-4 py-2 text-sm text-[color:var(--cream)] transition-colors hover:bg-[color:var(--forest-deep)] disabled:opacity-50"
          >
            {t.askBtn}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      <aside className="md:w-64 md:border-l md:border-border md:pl-8">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {t.suggested}
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => setInput(s)}
                className="text-left text-foreground/75 hover:text-[color:var(--forest-deep)]"
              >
                — {s}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

// ── Visual helper components ─────────────────────────────────────────────────

/** NDRE nitrogen scale — 0 to 0.6 */
function NdreScale({ value, lang }: { value: number; lang: Lang }) {
  const t = TRANSLATIONS[lang];
  const pct = `${Math.min(100, Math.max(0, (value / 0.6) * 100))}%`;
  return (
    <div className="mt-6">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[color:var(--sage)]/40">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: pct,
            background: "linear-gradient(to right, oklch(0.65 0.18 30), oklch(0.70 0.16 80), oklch(0.45 0.14 145))",
          }}
        />
      </div>
      <div className="stat-num mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{t.deficient}</span>
        <span>{t.adequate}</span>
        <span>{t.optimal}</span>
      </div>
    </div>
  );
}

/** Moisture bar — 0 to 1 scale */
function MoistureBar({ label, value }: { label: string; value: number }) {
  const pct = `${Math.min(100, Math.max(0, value * 100))}%`;
  const color =
    value > 0.7 ? "oklch(0.42 0.12 225)"
    : value > 0.4 ? "oklch(0.50 0.13 200)"
    : "oklch(0.68 0.12 55)";
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        <span className="stat-num">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[color:var(--sage)]/40">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: pct, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/** Generic index bar centered at 0, range [min, max] */
function IndexBar({ value, min, max }: { value: number; min: number; max: number }) {
  const range = max - min;
  const zeroPct = ((0 - min) / range) * 100;
  const valPct = ((value - min) / range) * 100;
  const barLeft = Math.min(zeroPct, valPct);
  const barWidth = Math.abs(valPct - zeroPct);
  const isPositive = value >= 0;

  return (
    <div className="mt-6">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[color:var(--sage)]/40">
        {/* colored fill from zero to value */}
        <div
          className="absolute inset-y-0 rounded-full"
          style={{
            left: `${barLeft}%`,
            width: `${barWidth}%`,
            backgroundColor: isPositive ? "oklch(0.42 0.12 150)" : "oklch(0.60 0.18 30)",
          }}
        />
        {/* center line */}
        <div
          className="absolute inset-y-0 w-[1px] bg-foreground/30"
          style={{ left: `${zeroPct}%` }}
        />
      </div>
      <div className="stat-num mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{min.toFixed(1)}</span>
        <span>0</span>
        <span>{max.toFixed(1)}</span>
      </div>
    </div>
  );
}
