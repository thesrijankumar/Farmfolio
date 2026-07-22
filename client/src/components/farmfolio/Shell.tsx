import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "../../lib/auth";

export function Shell({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="rule-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-2xl tracking-tight text-[color:var(--forest-deep)]">
              Farmfolio
            </span>
            <span className="text-[10px] hidden uppercase tracking-[0.2em] text-muted-foreground">
              Field intelligence
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {token ? (
              <>
                <Link
                  to="/location"
                  className="text-foreground/70 hover:text-foreground"
                  activeProps={{ className: "text-foreground font-medium" }}
                >
                  New report
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate({ to: "/auth", replace: true });
                  }}
                  className="text-foreground/70 hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/auth" className="text-foreground/70 hover:text-foreground">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-24 rule-t">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
          Farmfolio · satellite-derived climate &amp; NDVI advisory
        </div>
      </footer>
    </div>
  );
}
