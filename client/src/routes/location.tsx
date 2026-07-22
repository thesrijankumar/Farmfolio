import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { Suspense, useEffect, useState, type FormEvent } from "react";
const MapPicker = React.lazy(() => import("../components/farmfolio/MapPicker"));
import { toast } from "sonner";
import { MapPin, LocateFixed, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Shell } from "../components/farmfolio/Shell";
import { setCurrentReport } from "../lib/report-store";

export const Route = createFileRoute("/location")({
  component: LocationPage,
});

function LocationPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!token) navigate({ to: "/auth", replace: true });
  }, [token, navigate]);

  async function useMyLocation() {
    setGeoLoading(true);

    const fallbackToIp = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("IP Geolocation failed");
        const data = await res.json();
        if (data.latitude && data.longitude) {
          setLat(data.latitude.toFixed(5));
          setLon(data.longitude.toFixed(5));
          toast.success("Location captured (via IP)");
        } else {
          throw new Error("Could not parse IP location");
        }
      } catch (err) {
        toast.error("Could not read location");
      } finally {
        setGeoLoading(false);
      }
    };

    if (!navigator.geolocation || !window.isSecureContext) {
      await fallbackToIp();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5));
        setLon(pos.coords.longitude.toFixed(5));
        setGeoLoading(false);
        toast.success("Location captured");
      },
      (err) => {
        console.warn("Geolocation API failed:", err.message);
        fallbackToIp();
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (
      !Number.isFinite(latNum) ||
      !Number.isFinite(lonNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lonNum < -180 ||
      lonNum > 180
    ) {
      setError("Enter a valid latitude (-90 to 90) and longitude (-180 to 180).");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const report = await api.landReport(token, latNum, lonNum);
      setCurrentReport(report);
      navigate({ to: "/report" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not fetch report";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const presets: Array<{ label: string; lat: number; lon: number }> = [
    { label: "Napa Valley, CA", lat: 38.5025, lon: -122.2654 },
    { label: "Punjab, IN", lat: 30.9, lon: 75.85 },
    { label: "Loire Valley, FR", lat: 47.3, lon: 0.68 },
  ];

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          Step 01 · Coordinates
        </p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight tracking-tight text-[color:var(--forest-deep)] md:text-5xl">
          Where is the field?
        </h1>
        <p className="mt-4 max-w-xl text-foreground/70">
          Point Farmfolio at any coordinate on Earth. We pull climate normals
          and current vegetation indices from open satellite data.
        </p>

        <div className="mt-12 grid gap-12 md:grid-cols-[1.2fr_1fr]">
          <form onSubmit={onSubmit} className="space-y-8">
            <div className="relative inline-flex">
              {/* Sonar rings — 3 staggered expanding rings */}
              {!geoLoading && (
                <>
                  {[0, 0.75, 1.5].map((delay) => (
                    <span
                      key={delay}
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: -2,
                        border: "2px solid #2D6A4F",
                        borderRadius: 1,
                        animation: `loc-ring-expand 2.25s ease-out ${delay}s infinite`,
                        pointerEvents: "none",
                      }}
                    />
                  ))}
                </>
              )}
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoLoading}
                style={
                  geoLoading
                    ? undefined
                    : {
                        boxShadow:
                          "0 0 0 2px rgba(45,106,79,0.25), 0 0 18px 4px rgba(45,106,79,0.18)",
                      }
                }
                className="relative group inline-flex items-center gap-3 border border-[color:var(--forest)] px-5 py-3 text-sm text-[color:var(--forest-deep)] transition-colors hover:bg-[color:var(--forest)] hover:text-[color:var(--cream)] disabled:opacity-60"
              >

              {geoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
              Use my location
              </button>
            </div>

            <div className="rule-t pt-8">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Or enter manually
              </p>
              <div className="mt-6 grid grid-cols-2 gap-6">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Latitude
                  </span>
                  <input
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    inputMode="decimal"
                    placeholder="38.50250"
                    className="stat-num mt-2 block w-full border-0 border-b border-input bg-transparent px-0 py-2 text-2xl text-[color:var(--forest-deep)] focus:border-[color:var(--forest)] focus:outline-none focus:ring-0"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Longitude
                  </span>
                  <input
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    inputMode="decimal"
                    placeholder="-122.26540"
                    className="stat-num mt-2 block w-full border-0 border-b border-input bg-transparent px-0 py-2 text-2xl text-[color:var(--forest-deep)] focus:border-[color:var(--forest)] focus:outline-none focus:ring-0"
                  />
                </label>
              </div>
              
              {isMounted && (
                <div className="mt-8 h-[300px] w-full overflow-hidden border border-[color:var(--forest)]/20 bg-muted">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading map...
                      </div>
                    }
                  >
                    <MapPicker
                      lat={lat}
                      lon={lon}
                      setLat={setLat}
                      setLon={setLon}
                    />
                  </Suspense>
                </div>
              )}
            </div>

            {error && (
              <p className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-3 rounded-sm bg-[color:var(--forest)] px-6 py-3 text-sm font-medium tracking-wide text-[color:var(--cream)] transition-colors hover:bg-[color:var(--forest-deep)] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assembling report…
                </>
              ) : (
                <>
                  Get field report
                  <span aria-hidden>→</span>
                </>
              )}
            </button>
          </form>

          <aside className="border-l border-border pl-8">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Try a preset
            </p>
            <ul className="mt-4 space-y-3">
              {presets.map((p) => (
                <li key={p.label}>
                  <button
                    type="button"
                    onClick={() => {
                      setLat(p.lat.toString());
                      setLon(p.lon.toString());
                    }}
                    className="group flex w-full items-start gap-3 py-2 text-left"
                  >
                    <MapPin className="mt-1 h-4 w-4 text-[color:var(--forest)]" />
                    <div>
                      <p className="text-sm text-foreground group-hover:text-[color:var(--forest-deep)]">
                        {p.label}
                      </p>
                      <p className="stat-num text-xs text-muted-foreground">
                        {p.lat.toFixed(2)}, {p.lon.toFixed(2)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
