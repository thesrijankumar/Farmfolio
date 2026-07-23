import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Shell } from "../components/farmfolio/Shell";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const { token, setToken } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (token) navigate({ to: "/location", replace: true });
  }, [token, navigate]);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setResetSent(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "forgot") {
        await api.forgotPassword(email);
        setResetSent(true);
        return;
      }
      const res =
        mode === "login"
          ? await api.login(email, password)
          : await api.signup(email, password);
      setToken(res.token);
      toast.success(mode === "login" ? "Welcome back" : "Account created");
      navigate({ to: "/location", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-16 md:grid-cols-[1.1fr_1fr]">
        <section className="flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
            Farmfolio · v0.1
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-[color:var(--forest-deep)] md:text-6xl">
            Read your land
            <br />
            <span className="italic text-[color:var(--forest)]">the way satellites do.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/75">
            Climate averages, vegetation health and plain-language field notes
            for any coordinate on Earth. Built for growers who prefer numbers
            to hunches.
          </p>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Datasets
              </dt>
              <dd className="stat-num mt-1 text-2xl text-[color:var(--forest-deep)]">6</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Resolution
              </dt>
              <dd className="stat-num mt-1 text-2xl text-[color:var(--forest-deep)]">
                10<span className="text-base">m</span>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Latency
              </dt>
              <dd className="stat-num mt-1 text-2xl text-[color:var(--forest-deep)]">
                &lt;5<span className="text-base">s</span>
              </dd>
            </div>
          </dl>
        </section>

        <section className="border border-border bg-card p-8 md:p-10">
          {/* Tabs */}
          <div className="flex items-center gap-6 text-sm">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`relative pb-2 transition-colors ${
                  mode === m
                    ? "text-[color:var(--forest-deep)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Sign in" : "Create account"}
                {mode === m && (
                  <span className="absolute inset-x-0 -bottom-px h-[2px] bg-[color:var(--forest)]" />
                )}
              </button>
            ))}
          </div>

          {/* Forgot password success state */}
          {mode === "forgot" && resetSent ? (
            <div className="mt-10 space-y-4">
              <div className="border-l-2 border-[color:var(--forest)] bg-[color:var(--forest)]/5 px-4 py-4">
                <p className="text-sm font-medium text-[color:var(--forest-deep)]">
                  Reset link sent ✓
                </p>
                <p className="mt-1 text-sm text-foreground/70">
                  Check your inbox — the link expires in 1 hour.
                </p>
              </div>
              <button
                onClick={() => switchMode("login")}
                className="text-sm text-[color:var(--forest)] underline-offset-2 hover:underline"
              >
                ← Back to sign in
              </button>
            </div>
          ) : mode === "forgot" ? (
            /* Forgot password form */
            <form onSubmit={onSubmit} className="mt-8 space-y-6">
              <p className="text-sm text-foreground/70">
                Enter your account email and we'll send a reset link.
              </p>
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Email
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block w-full border-0 border-b border-input bg-transparent px-0 py-2 text-base focus:border-[color:var(--forest)] focus:outline-none focus:ring-0"
                  placeholder="you@farm.co"
                />
              </label>

              {error && (
                <p className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-sm bg-[color:var(--forest)] px-5 py-3 text-sm font-medium tracking-wide text-[color:var(--cream)] transition-colors hover:bg-[color:var(--forest-deep)] disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>

              <button
                type="button"
                onClick={() => switchMode("login")}
                className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to sign in
              </button>
            </form>
          ) : (
            /* Login / Signup form */
            <form onSubmit={onSubmit} className="mt-8 space-y-6">
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Email
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block w-full border-0 border-b border-input bg-transparent px-0 py-2 text-base focus:border-[color:var(--forest)] focus:outline-none focus:ring-0"
                  placeholder="you@farm.co"
                />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Password
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 block w-full border-0 border-b border-input bg-transparent px-0 py-2 text-base focus:border-[color:var(--forest)] focus:outline-none focus:ring-0"
                  placeholder="••••••••"
                />
              </label>

              {error && (
                <p className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-sm bg-[color:var(--forest)] px-5 py-3 text-sm font-medium tracking-wide text-[color:var(--cream)] transition-colors hover:bg-[color:var(--forest-deep)] disabled:opacity-60"
              >
                {loading
                  ? "Working…"
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </button>
              )}

              <p className="text-xs text-muted-foreground">
                JWT stored locally in your browser. Rotate credentials before
                production use.
              </p>
            </form>
          )}
        </section>
      </div>
    </Shell>
  );
}
