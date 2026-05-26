/**
 * Conversion deduplication — single source of truth.
 *
 * Contract (validated by Playwright e2e suite):
 *   - Each conversion key stores a numeric Date.now() timestamp.
 *   - A new fire is allowed iff `Date.now() - last >= WINDOW_MS` (>= 10_000).
 *   - Primary store: sessionStorage (per-tab).
 *   - Optional persistent mirror: localStorage (survives reload / back / remount)
 *     but is read with the SAME 10s window so it expires too.
 *   - No daily flag, no in-memory lock until midnight, no window.name fallback —
 *     those broke the 10s sliding-window contract.
 *
 * Public API used by analytics.ts / meta-pixel.ts:
 *   - shouldFireWithinWindow(key, mirrorKey?) → boolean (true = fire allowed)
 *   - markFired(key, mirrorKey?) → records Date.now() in both stores
 *
 * Public API used by the admin debug panel:
 *   - get/clear block history, debug toggle, clearAllDailyConversionFlags()
 */

export const CONVERSION_DEDUP_WINDOW_MS = 10_000;

/**
 * Session-once guard prefix. Once a conversion fires successfully in the
 * current browser session (any tab), we set this flag and refuse to fire
 * the SAME conversion id again for the whole session — regardless of the
 * 10s sliding window. Prevents double counting when the user is routed
 * Contact form → /merci page (which would otherwise both push the GTM
 * `merci_conversion` event after the 10s window expires).
 *
 * Stored in localStorage so it survives reloads, back/forward, new tabs,
 * and the direct-navigation /merci flow. Cleared by the admin reset
 * button (clearAllDailyConversionFlags) via the `conversion_once_` prefix.
 */
const SESSION_ONCE_PREFIX = 'conversion_once_';

export function hasSessionConversionFired(conversionId: string): boolean {
  const key = `${SESSION_ONCE_PREFIX}${conversionId}`;
  return (
    readTimestamp(safeStorage('localStorage'), key) !== null ||
    readTimestamp(safeStorage('sessionStorage'), key) !== null
  );
}

export function markSessionConversionFired(conversionId: string, ts = Date.now()): void {
  const key = `${SESSION_ONCE_PREFIX}${conversionId}`;
  writeTimestamp(safeStorage('localStorage'), key, ts);
  writeTimestamp(safeStorage('sessionStorage'), key, ts);
}

const DEBUG_FLAG_KEY = 'ksp_conv_debug';
const BLOCK_HISTORY_KEY = 'ksp_conv_block_history';
const BLOCK_HISTORY_MAX = 100;
const BLOCK_HISTORY_EVENT = 'ksp:conversion-dedup:block';

export const CONVERSION_DEDUP_BLOCK_EVENT = BLOCK_HISTORY_EVENT;

export type ConversionDedupSource = 'sessionStorage' | 'localStorage';

export interface ConversionDedupBlockEntry {
  key: string;
  mirrorKey?: string;
  blockedAt: string;
  lastFiredAt: string;
  ageMs: number;
  source: ConversionDedupSource;
  url?: string;
}

// ───────────────────────── storage helpers ─────────────────────────

function safeStorage(type: 'sessionStorage' | 'localStorage'): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window[type]; } catch { return null; }
}

function readTimestamp(storage: Storage | null, key: string): number | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function writeTimestamp(storage: Storage | null, key: string, ts: number): void {
  if (!storage) return;
  try { storage.setItem(key, String(ts)); } catch { /* quota / private mode */ }
}

function removeKey(storage: Storage | null, key: string): void {
  if (!storage) return;
  try { storage.removeItem(key); } catch { /* ignore */ }
}

// ───────────────────────── core API ─────────────────────────

/**
 * Returns true if a conversion event for `key` (and optional persistent
 * `mirrorKey`) should be fired now, i.e. no fire in the last WINDOW_MS.
 *
 * If a recent fire is found, a debug entry is recorded.
 */
export function shouldFireWithinWindow(
  key: string,
  mirrorKey?: string,
  windowMs = CONVERSION_DEDUP_WINDOW_MS,
): boolean {
  const now = Date.now();
  const session = safeStorage('sessionStorage');
  const local = safeStorage('localStorage');

  const sessionTs = readTimestamp(session, key);
  const mirrorTs = mirrorKey ? readTimestamp(local, mirrorKey) : null;

  // Pick the most recent valid timestamp.
  let last: number | null = null;
  let source: ConversionDedupSource | null = null;
  if (sessionTs !== null) { last = sessionTs; source = 'sessionStorage'; }
  if (mirrorTs !== null && (last === null || mirrorTs > last)) {
    last = mirrorTs; source = 'localStorage';
  }

  if (last === null || source === null) return true;

  const age = now - last;
  if (age >= windowMs) {
    // Stale — drop both so subsequent reads are clean.
    removeKey(session, key);
    if (mirrorKey) removeKey(local, mirrorKey);
    return true;
  }

  recordBlockedConversion({
    key,
    mirrorKey,
    blockedAt: new Date(now).toISOString(),
    lastFiredAt: new Date(last).toISOString(),
    ageMs: age,
    source,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });
  return false;
}

/** Record a fresh fire timestamp in sessionStorage and the optional mirror. */
export function markFired(key: string, mirrorKey?: string, ts = Date.now()): void {
  writeTimestamp(safeStorage('sessionStorage'), key, ts);
  if (mirrorKey) writeTimestamp(safeStorage('localStorage'), mirrorKey, ts);
}

// ───────────────────────── debug & history ─────────────────────────

export function setConversionDedupDebug(enabled: boolean): void {
  const ls = safeStorage('localStorage');
  if (!ls) return;
  try {
    if (enabled) ls.setItem(DEBUG_FLAG_KEY, '1');
    else ls.removeItem(DEBUG_FLAG_KEY);
  } catch { /* ignore */ }
}

export function isConversionDedupDebugEnabled(): boolean {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as ImportMeta).env?.DEV) return true;
  } catch { /* ignore */ }
  if (typeof window === 'undefined') return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('debugDedup') === '1') return true;
    if (url.hash.includes('debugDedup')) return true;
  } catch { /* ignore */ }
  try {
    return safeStorage('localStorage')?.getItem(DEBUG_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function recordBlockedConversion(entry: ConversionDedupBlockEntry): void {
  if (typeof window === 'undefined') return;

  if (isConversionDedupDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.log(
      `%c[ConversionDedup] BLOCKED %c${entry.key}%c — age ${entry.ageMs}ms (source: ${entry.source})`,
      'color:#f59e0b;font-weight:bold',
      'color:#1f2937;background:#fde68a;padding:0 4px;border-radius:3px;font-weight:bold',
      'color:#6b7280',
      entry,
    );
  }

  try {
    const ls = safeStorage('localStorage');
    if (ls) {
      const raw = ls.getItem(BLOCK_HISTORY_KEY);
      const list: ConversionDedupBlockEntry[] = raw ? JSON.parse(raw) : [];
      const next = [entry, ...(Array.isArray(list) ? list : [])].slice(0, BLOCK_HISTORY_MAX);
      ls.setItem(BLOCK_HISTORY_KEY, JSON.stringify(next));
    }
  } catch { /* ignore */ }

  try {
    window.dispatchEvent(new CustomEvent(BLOCK_HISTORY_EVENT, { detail: entry }));
  } catch { /* ignore */ }
}

export function getConversionDedupBlockHistory(): ConversionDedupBlockEntry[] {
  try {
    const raw = safeStorage('localStorage')?.getItem(BLOCK_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ConversionDedupBlockEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearConversionDedupBlockHistory(): void {
  try { safeStorage('localStorage')?.removeItem(BLOCK_HISTORY_KEY); } catch { /* ignore */ }
  if (typeof window !== 'undefined') {
    try { window.dispatchEvent(new CustomEvent(BLOCK_HISTORY_EVENT, { detail: null })); }
    catch { /* ignore */ }
  }
}

/**
 * Wipe ALL conversion dedup keys from sessionStorage + localStorage.
 * Used by the admin "reset flags" button. Conservatively matches the prefixes
 * the app actively writes today: __gads_conv_, __ga4_form_submit_,
 * __meta_pixel_lead, conversion_fired_, plus any leftover ksp_conv_*.
 */
export function clearAllDailyConversionFlags(): void {
  const PREFIXES = [
    '__gads_conv_',
    '__ga4_form_submit_',
    '__meta_pixel_lead',
    'conversion_fired_',
    'conversion_once_',
    'ksp_conv_',
  ];
  (['sessionStorage', 'localStorage'] as const).forEach((type) => {
    const storage = safeStorage(type);
    if (!storage) return;
    try {
      for (let i = storage.length - 1; i >= 0; i -= 1) {
        const k = storage.key(i);
        if (k && PREFIXES.some((p) => k.startsWith(p))) storage.removeItem(k);
      }
    } catch { /* ignore */ }
  });
}

// Convenience window hook for manual debugging from the browser console.
if (typeof window !== 'undefined') {
  (window as unknown as {
    __kspConversionDedupDebug?: {
      enable: () => void;
      disable: () => void;
      isEnabled: () => boolean;
      history: () => ConversionDedupBlockEntry[];
      clearHistory: () => void;
      clearFlags: () => void;
    };
  }).__kspConversionDedupDebug = {
    enable: () => setConversionDedupDebug(true),
    disable: () => setConversionDedupDebug(false),
    isEnabled: () => isConversionDedupDebugEnabled(),
    history: () => getConversionDedupBlockHistory(),
    clearHistory: () => clearConversionDedupBlockHistory(),
    clearFlags: () => clearAllDailyConversionFlags(),
  };
}
