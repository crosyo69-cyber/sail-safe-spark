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

/**
 * Strict validation of a redirect URL before it is handed to Stripe.
 * Rejects anything that is not exactly `https://<allowlisted-host>` with:
 *   - protocol === "https:"
 *   - no userinfo (user/password)
 *   - no explicit port (including default 443)
 *   - host is lower-case (no upper-case smuggling — Set lookup is case-sensitive)
 *   - origin is in the active allowlist
 * Throws `Error("Invalid redirect origin")` on any violation so callers can
 * return a 400 without leaking specifics.
 */
export function assertSafeRedirectUrl(rawUrl: string): void {
  if (typeof rawUrl !== "string" || rawUrl.length === 0 || rawUrl.length > 2048) {
    throw new Error("Invalid redirect origin");
  }
  // The raw string must start with https:// — never protocol-relative,
  // javascript:, data:, file:, http:, etc.
  if (!rawUrl.startsWith("https://")) {
    throw new Error("Invalid redirect origin");
  }
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid redirect origin");
  }
  if (parsed.protocol !== "https:") throw new Error("Invalid redirect origin");
  if (parsed.username !== "" || parsed.password !== "") {
    throw new Error("Invalid redirect origin");
  }
  if (parsed.port !== "") throw new Error("Invalid redirect origin");
  if (parsed.hostname !== parsed.hostname.toLowerCase()) {
    throw new Error("Invalid redirect origin");
  }
  // Reject any upper-case characters in the host portion of the raw input,
  // before URL parsing normalises them away.
  const rawHostMatch = rawUrl.slice("https://".length).split(/[/?#]/, 1)[0];
  if (rawHostMatch !== rawHostMatch.toLowerCase()) {
    throw new Error("Invalid redirect origin");
  }
  // Reject explicit ports in the raw input (incl. default :443).
  if (rawHostMatch.includes(":")) {
    throw new Error("Invalid redirect origin");
  }
  const allowed = getAllowedOrigins();
  if (!allowed.has(parsed.origin)) throw new Error("Invalid redirect origin");
}