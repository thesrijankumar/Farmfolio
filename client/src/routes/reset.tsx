import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Shell } from "../components/farmfolio/Shell";

export const Route = createFileRoute("/reset")({
  component: ResetPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) ?? "",
  }),
});

function ResetPage() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/reset" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      toast.success("Password updated — sign in with your new password.");
      setTimeout(() => navigate({ to: "/auth", replace: true }), 2200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Reset failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-md">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
            Farmfolio · Password reset
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-[color:var(--forest-deep)]">
            Set a new password
          </h1>

          {!token ? (
            <div className="mt-10 border-l-2 border-destructive bg-destructive/5 px-4 py-4">
              <p className="text-sm text-destructive">
                No reset token found. Please use the link from your email.
              </p>
            </div>
          ) : done ? (
            <div className="mt-10 border-l-2 border-[color:var(--forest)] bg-[color:var(--forest)]/5 px-4 py-4">
              <p className="text-sm font-medium text-[color:var(--forest-deep)]">
                Password updated ✓
              </p>
              <p className="mt-1 text-sm text-foreground/70">
                Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-10 space-y-8">
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  New password
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 block w-full border-0 border-b border-input bg-transparent px-0 py-2 text-base focus:border-[color:var(--forest)] focus:outline-none focus:ring-0"
                />
              </label>

              <label className="block">
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Confirm password
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 block w-full border-0 border-b border-input bg-transparent px-0 py-2 text-base focus:border-[color:var(--forest)] focus:outline-none focus:ring-0"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[color:var(--forest)] px-5 py-3 text-sm font-medium tracking-wide text-[color:var(--cream)] transition-colors hover:bg-[color:var(--forest-deep)] disabled:opacity-60"
              >
                {loading ? "Saving…" : "Set new password →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </Shell>
  );
}
