const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", ...o }).format(d);

export function parisHour(d: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }).format(d));
}

/** UTC offset of Paris (minutes) at a given instant. */
function parisOffsetMin(d: Date): number {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(d).map(x => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return Math.round((asUtc - d.getTime()) / 60000);
}

function parisMidnight(y: number, m: number, day: number): Date {
  const guess = new Date(Date.UTC(y, m - 1, day));
  return new Date(guess.getTime() - parisOffsetMin(guess) * 60000);
}

/** Yesterday as a Paris calendar day, with exact UTC bounds. */
export function parisYesterday(now: Date) {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(now).split("-").map(Number);
  const todayStart = parisMidnight(y, m, d);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  const start = parisMidnight(prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate());
  return {
    date: prev.toISOString().slice(0, 10),
    today: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    label: fmt(start, { weekday: "long", day: "numeric", month: "long" }),
    startIso: start.toISOString(), endIso: todayStart.toISOString(),
    startTs: Math.floor(start.getTime() / 1000), endTs: Math.floor(todayStart.getTime() / 1000),
  };
}

export const eur = (cents: number) => `${(cents / 100).toLocaleString("fr-FR")} €`;
