/**
 * Booking date utilities — Europe/Paris timezone (school's operating timezone).
 *
 * Sessions in the database use a Postgres `DATE` column that represents a Paris
 * calendar day. The browser may be in any timezone, and methods like
 * `new Date().toISOString().slice(0, 10)` return the UTC day, which can drift
 * by ±1 day in the morning/evening. All booking-flow date math MUST go through
 * these helpers to stay aligned with the server's view of "today" / "tomorrow".
 */

const PARIS_TZ = "Europe/Paris";

/** Formats a Date as `yyyy-MM-dd` for the Europe/Paris timezone. */
export function toParisDateOnly(d: Date): string {
  // sv-SE locale yields the ISO-like `YYYY-MM-DD HH:mm:ss` format.
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return parts; // already `yyyy-MM-dd`
}

/** `yyyy-MM-dd` for today in Europe/Paris. */
export function parisToday(): string {
  return toParisDateOnly(new Date());
}

/** `yyyy-MM-dd` for tomorrow in Europe/Paris. */
export function parisTomorrow(): string {
  return parisAddDays(parisToday(), 1);
}

/**
 * Adds `days` to an `yyyy-MM-dd` string and returns the resulting
 * `yyyy-MM-dd`. Pure string math — no timezone surprises.
 */
export function parisAddDays(yyyyMmDd: string, days: number): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  // Use UTC arithmetic on a midnight-UTC date to avoid DST drift; we only
  // care about the calendar day.
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * A local-midnight `Date` representing today in Europe/Paris. Suitable for
 * shadcn `<Calendar disabled={(d) => d < parisStartOfToday()} />` because the
 * Calendar component emits dates at local midnight.
 */
export function parisStartOfToday(): Date {
  return parisDateOnlyToLocalMidnight(parisToday());
}

/**
 * A local-midnight `Date` representing tomorrow in Europe/Paris. Use this for
 * date pickers where today is not bookable (e.g. paid deposits require 24h
 * lead time).
 */
export function parisStartOfTomorrow(): Date {
  return parisDateOnlyToLocalMidnight(parisTomorrow());
}

/**
 * Builds a `Date` at the browser's local midnight for the given Paris
 * calendar day. We deliberately use local midnight (not UTC midnight) because
 * `react-day-picker` compares against `Date` instances built from local
 * `new Date(year, month, day)`.
 */
function parisDateOnlyToLocalMidnight(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}