import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: token ? "/location" : "/auth", replace: true });
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="text-sm text-muted-foreground">Loading…</span>
    </div>
  );
}
