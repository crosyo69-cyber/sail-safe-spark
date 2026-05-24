const FALLBACK_ORIGINS = [
  "https://www.kitesurfpassion.fr",
  "https://kitesurfpassion.fr",
  "https://www.kitesurfpassion.com",
  "https://kitesurfpassion.com",
];

export const DEFAULT_ORIGIN = "https://www.kitesurfpassion.fr";

/**
 * Parse an allowlist string (comma or whitespace separated) into a Set of
 * normalized origins. Invalid/empty entries are silently dropped.
 */
export function parseAllowlist(raw: string | null | undefined): Set<string> {
  const items = (raw ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return new Set(items);
}

function readEnv(name: string): string | null {
  try {
    // deno-lint-ignore no-explicit-any
    const d = (globalThis as any).Deno;
    return d?.env?.get?.(name) ?? null;
  } catch {
    return null;
  }
}

/**
 * Read the allowlist from the ALLOWLIST_DOMAINS env var if set, otherwise
 * fall back to the built-in production domains. Computed at call time so
 * tests can mutate the env between cases.
 */
export function getAllowedOrigins(): Set<string> {
  const fromEnv = parseAllowlist(readEnv("ALLOWLIST_DOMAINS"));
  if (fromEnv.size > 0) return fromEnv;
  return new Set(FALLBACK_ORIGINS);
}

// Back-compat export (snapshot at module load — prefer getAllowedOrigins()).
export const ALLOWED_ORIGINS = getAllowedOrigins();

export function resolveOrigin(rawOrigin: string | null | undefined): string {
  const value = (rawOrigin ?? "").trim();
  const allowed = getAllowedOrigins();
  if (allowed.has(value)) return value;
  // Ensure fallback is itself reachable; if the configured allowlist doesn't
  // include DEFAULT_ORIGIN, fall back to the first allowed entry.
  if (allowed.has(DEFAULT_ORIGIN)) return DEFAULT_ORIGIN;
  const first = allowed.values().next().value;
  return first ?? DEFAULT_ORIGIN;
}