export const ALLOWED_ORIGINS = new Set([
  "https://www.kitesurfpassion.fr",
  "https://kitesurfpassion.fr",
  "https://www.kitesurfpassion.com",
  "https://kitesurfpassion.com",
]);

export const DEFAULT_ORIGIN = "https://www.kitesurfpassion.fr";

export function resolveOrigin(rawOrigin: string | null | undefined): string {
  const value = (rawOrigin ?? "").trim();
  return ALLOWED_ORIGINS.has(value) ? value : DEFAULT_ORIGIN;
}