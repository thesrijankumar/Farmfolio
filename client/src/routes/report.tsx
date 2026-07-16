import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { api, type LandReport } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Shell } from "../components/farmfolio/Shell";
import { CountUp } from "../components/farmfolio/CountUp";
import { getCurrentReport } from "../lib/report-store";

export const Route = createFileRoute("/report")({
  component: ReportPage,
});

type Msg = { role: "user" | "assistant"; text: string };

function ReportPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<LandReport | null>(null);

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
          Loading report…
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ReportView report={report} token={token!} />
    </Shell>
  );
}

function ReportView({ report, token }: { report: LandReport; token: string }) {
  const { rawData, summary, sessionId } = report;
  const { climate, vegetation, location } = rawData;

  const climateStats = useMemo(
    () => [
      { label: "Temperature", value: climate.avgTemperatureC, unit: "°C", decimals: 1 },
      { label: "Rainfall", value: climate.avgRainfallMM, unit: "mm/day", decimals: 2 },
      { label: "Humidity", value: climate.avgHumidityPct, unit: "%", decimals: 0 },
      { label: "Solar radiation", value: climate.avgSolarRadiation, unit: "kWh/m²", decimals: 1 },
      { label: "Wind speed", value: climate.avgWindSpeed, unit: "m/s", decimals: 1 },
    ],
    [climate],
  );

  const soilStats = useMemo(
    () => [
      {
        label: "Surface soil moisture",
        value: climate.soilMoistureSurface,
        unit: "",
        decimals: 2,
        note: "0–1 scale (top layer)",
      },
      {
        label: "Root zone moisture",
        value: climate.soilMoistureRoot,
        unit: "",
        decimals: 2,
        note: "0–1 scale (root zone)",
      },
      {
        label: "Evapotranspiration",
        value: climate.evapotranspiration,
        unit: "mm/day",
        decimals: 2,
        note: "Water lost from soil + plants",
      },
      {
        label: "Dew point",
        value: climate.dewPointC,
        unit: "°C",
        decimals: 1,
        note: "Moisture condensation threshold",
      },
      {
        label: "Frost days / year",
        value: climate.frostDaysPerYear,
        unit: "days",
        decimals: 0,
        note: "Average annual frost days",
      },
    ],
    [climate],
  );

  // NDRE badge color
  const ndreColor =
    vegetation.ndreMean == null ? "text-muted-foreground"
    : vegetation.ndreMean > 0.45 ? "text-emerald-700"
    : vegetation.ndreMean > 0.25 ? "text-lime-700"
    : vegetation.ndreMean > 0.10 ? "text-amber-600"
    : "text-red-600";

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
            Field report
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-[color:var(--forest-deep)] md:text-5xl">
            {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
          </h1>
        </div>
        <p className="stat-num text-sm text-muted-foreground">
          Session · <span className="text-foreground/70">{sessionId.slice(0, 8)}</span>
        </p>
      </div>

      {/* ── Climate ─────────────────────────────────────────────────── */}
      <section className="mt-14 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          Climate · NASA POWER
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
          Soil &amp; Water · NASA POWER
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
            <MoistureBar label="Surface moisture" value={climate.soilMoistureSurface} />
            <MoistureBar label="Root zone moisture" value={climate.soilMoistureRoot} />
          </div>
        )}
      </section>

      {/* ── AI Summary ──────────────────────────────────────────────── */}
      <section className="mt-16 grid gap-10 md:grid-cols-[auto_1fr]">
        <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)] md:pt-3">
          Field note
        </div>
        <blockquote className="border-l-2 border-[color:var(--forest)] pl-6">
          <p className="font-serif text-2xl leading-snug tracking-tight text-[color:var(--forest-deep)] md:text-3xl">
            &ldquo;{summary}&rdquo;
          </p>
          <footer className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
            Farmfolio agronomy assistant
          </footer>
        </blockquote>
      </section>

      {/* ── NDVI ────────────────────────────────────────────────────── */}
      <section className="mt-20 rule-t pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
              Vegetation index · NDVI · Sentinel-2
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
        />
      </section>

      {/* ── Nitrogen & Chlorophyll ──────────────────────────────────── */}
      <section className="mt-20 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          Nitrogen &amp; Chlorophyll · Sentinel-2 Red Edge
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          NDRE and chlorophyll index are satellite proxies for leaf nitrogen content (industry standard)
        </p>
        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* NDRE score */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              NDRE — Nitrogen proxy
            </p>
            {vegetation.ndreMean != null ? (
              <>
                <p className={`stat-num mt-3 text-5xl ${ndreColor}`}>
                  <CountUp value={vegetation.ndreMean} decimals={3} />
                </p>
                <p className={`mt-2 text-sm font-medium ${ndreColor}`}>
                  {vegetation.ndreInterpretation}
                </p>
                <NdreScale value={vegetation.ndreMean} />
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No data available</p>
            )}
          </div>
          {/* Chlorophyll Index */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Chlorophyll index (Red Edge)
            </p>
            {vegetation.chlorophyllIndex != null ? (
              <>
                <p className="stat-num mt-3 text-5xl text-[color:var(--forest-deep)]">
                  <CountUp value={vegetation.chlorophyllIndex} decimals={2} />
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Higher = more chlorophyll = more nitrogen uptake
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No data available</p>
            )}
          </div>
          {/* EVI */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              EVI — Enhanced vegetation
            </p>
            {vegetation.eviMean != null ? (
              <>
                <p className="stat-num mt-3 text-5xl text-[color:var(--forest-deep)]">
                  <CountUp value={vegetation.eviMean} decimals={3} />
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Less affected by atmosphere &amp; clouds than NDVI
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No data available</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Water & Moisture Stress ─────────────────────────────────── */}
      <section className="mt-20 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          Water &amp; Moisture Stress · Sentinel-2
        </p>
        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* NDWI */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              NDWI — Canopy water content
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
              <p className="mt-3 text-sm text-muted-foreground">No data available</p>
            )}
          </div>
          {/* Moisture Index */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Moisture stress index (B8A/B11)
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
              <p className="mt-3 text-sm text-muted-foreground">No data available</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Chat ────────────────────────────────────────────────────── */}
      <section className="mt-20 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          Ask the agronomist
        </p>
        <h2 className="mt-2 max-w-2xl font-serif text-3xl tracking-tight text-[color:var(--forest-deep)]">
          Follow up on this report.
        </h2>
        <ChatPanel token={token} sessionId={sessionId} />
      </section>
    </div>
  );
}


function NdviScale({ mean, min, max }: { mean: number; min: number; max: number }) {
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
        <span>0.0 · bare</span>
        <span>0.3 · sparse</span>
        <span>0.6 · healthy</span>
        <span>0.9 · dense canopy</span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-6 text-sm">
        <Stat label="Min" value={min} />
        <Stat label="Mean" value={mean} highlight />
        <Stat label="Max" value={max} />
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

function ChatPanel({ token, sessionId }: { token: string; sessionId: string }) {
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
      const { reply } = await api.ask(token, sessionId, q);
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
    "Which crops would suit this climate?",
    "Is irrigation likely necessary?",
    "What does the NDVI trend suggest right now?",
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
              No questions yet. Ask anything about this field — planting
              windows, water balance, crop suitability, NDVI trend.
            </p>
          )}
          <ul className="space-y-8">
            {messages.map((m, i) => (
              <li key={i}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {m.role === "user" ? "You" : "Farmfolio"}
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
                  Thinking…
                </p>
              </li>
            )}
          </ul>
        </div>

        <form onSubmit={onSend} className="mt-8 flex items-center gap-3 border-t border-border pt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this field…"
            className="flex-1 border-0 bg-transparent px-0 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="inline-flex items-center gap-2 rounded-sm bg-[color:var(--forest)] px-4 py-2 text-sm text-[color:var(--cream)] transition-colors hover:bg-[color:var(--forest-deep)] disabled:opacity-50"
          >
            Ask
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      <aside className="md:w-64 md:border-l md:border-border md:pl-8">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Suggested
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
function NdreScale({ value }: { value: number }) {
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
        <span>0.0 · deficient</span>
        <span>0.25 · adequate</span>
        <span>0.45+ · optimal</span>
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
