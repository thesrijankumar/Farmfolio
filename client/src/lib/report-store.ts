import type { LandReport } from "./api";

// Simple in-memory store to pass the latest report between routes.
// (Kept out of URL so we don't refetch on refresh — but we accept that
// a hard refresh on /report sends the user back to /location.)
let current: LandReport | null = null;

export function setCurrentReport(r: LandReport | null) {
  current = r;
}
export function getCurrentReport(): LandReport | null {
  return current;
}
