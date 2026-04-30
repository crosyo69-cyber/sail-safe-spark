const CONVERSION_KEY_PREFIX = 'ksp_conv_';
const ALL_SCOPES = '*';
const CLEANUP_REGISTERED_FLAG = '__kspConversionDedupCleanupRegistered';
const NAVIGATION_FALLBACK_PREFIX = 'ksp_conv_nav:';
const DEBUG_FLAG_KEY = 'ksp_conv_debug';
const BLOCK_HISTORY_KEY = 'ksp_conv_block_history';
const BLOCK_HISTORY_MAX = 100;
const BLOCK_HISTORY_EVENT = 'ksp:conversion-dedup:block';

type ConversionFlags = Record<string, string>;

export type ConversionDedupSource =
  | 'sessionStorage'
  | 'localStorage'
  | 'window.name';

export interface ConversionDedupBlockInfo {
  scope: string;
  date: string; // YYYY-MM-DD (today's daily key suffix)
  sources: ConversionDedupSource[]; // every storage where the flag was found
  matchedScope: string; // either the requested scope or '*' (wildcard)
  timestamps: Partial<Record<ConversionDedupSource, string>>;
}

export interface ConversionDedupBlockEntry extends ConversionDedupBlockInfo {
  blockedAt: string; // ISO timestamp when the block happened
  url?: string;
}

/**
 * Enable/disable verbose dedup logging at runtime. Persisted to
 * localStorage so it survives reloads. Also auto-on in dev or when the
 * URL contains `?debugDedup=1` / `#debugDedup`.
 */
export function setConversionDedupDebug(enabled: boolean): void {
  try {
    const ls = safeStorage('localStorage');
    if (!ls) return;
    if (enabled) ls.setItem(DEBUG_FLAG_KEY, '1');
    else ls.removeItem(DEBUG_FLAG_KEY);
  } catch {
    // ignore
  }
}

export function isConversionDedupDebugEnabled(): boolean {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as ImportMeta).env?.DEV) {
      return true;
    }
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('debugDedup') === '1') return true;
      if (url.hash.includes('debugDedup')) return true;
    } catch {
      // ignore
    }
    try {
      const ls = safeStorage('localStorage');
      if (ls?.getItem(DEBUG_FLAG_KEY) === '1') return true;
    } catch {
      // ignore
    }
  }
  return false;
}

function logBlockedConversion(info: ConversionDedupBlockInfo): void {
  recordBlockedConversion(info);
  if (!isConversionDedupDebugEnabled()) return;
  const reason = info.matchedScope === ALL_SCOPES
    ? 'wildcard flag (*) covers every scope today'
    : `scope flag matched`;
  // eslint-disable-next-line no-console
  console.log(
    `%c[ConversionDedup] BLOCKED %c${info.scope}%c on ${info.date} — ${reason}`,
    'color: #f59e0b; font-weight: bold',
    'color: #1f2937; font-weight: bold; background: #fde68a; padding: 0 4px; border-radius: 3px',
    'color: #6b7280',
    {
      sources: info.sources,
      matchedScope: info.matchedScope,
      timestamps: info.timestamps,
    },
  );
}

function recordBlockedConversion(info: ConversionDedupBlockInfo): void {
  if (typeof window === 'undefined') return;
  const entry: ConversionDedupBlockEntry = {
    ...info,
    blockedAt: new Date().toISOString(),
    url: typeof window.location !== 'undefined' ? window.location.href : undefined,
  };
  try {
    const ls = safeStorage('localStorage');
    if (ls) {
      const raw = ls.getItem(BLOCK_HISTORY_KEY);
      const list: ConversionDedupBlockEntry[] = raw ? (JSON.parse(raw) as ConversionDedupBlockEntry[]) : [];
      const next = [entry, ...(Array.isArray(list) ? list : [])].slice(0, BLOCK_HISTORY_MAX);
      ls.setItem(BLOCK_HISTORY_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore quota / parse failures
  }
  try {
    window.dispatchEvent(new CustomEvent(BLOCK_HISTORY_EVENT, { detail: entry }));
  } catch {
    // ignore
  }
}

export function getConversionDedupBlockHistory(): ConversionDedupBlockEntry[] {
  try {
    const ls = safeStorage('localStorage');
    if (!ls) return [];
    const raw = ls.getItem(BLOCK_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ConversionDedupBlockEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearConversionDedupBlockHistory(): void {
  try {
    safeStorage('localStorage')?.removeItem(BLOCK_HISTORY_KEY);
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(BLOCK_HISTORY_EVENT, { detail: null }));
    } catch {
      // ignore
    }
  }
}

export const CONVERSION_DEDUP_BLOCK_EVENT = BLOCK_HISTORY_EVENT;

/**
 * Wipe ALL today's daily conversion flags from sessionStorage, localStorage
 * and the window.name fallback. Useful for admins testing conversions.
 */
export function clearAllDailyConversionFlags(): void {
  const today = getDailyConversionKey();
  (['sessionStorage', 'localStorage'] as const).forEach((type) => {
    const storage = safeStorage(type);
    if (!storage) return;
    try {
      for (let i = storage.length - 1; i >= 0; i -= 1) {
        const key = storage.key(i);
        if (key?.startsWith(CONVERSION_KEY_PREFIX)) storage.removeItem(key);
      }
    } catch {
      // ignore
    }
  });
  if (typeof window !== 'undefined') {
    try {
      const nav = readNavigationFallback();
      delete nav[today];
      window.name = Object.keys(nav).length === 0
        ? ''
        : `${NAVIGATION_FALLBACK_PREFIX}${JSON.stringify(nav)}`;
    } catch {
      // ignore
    }
  }
}

export function getDailyConversionKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${CONVERSION_KEY_PREFIX}${year}-${month}-${day}`;
}

export function isTodayTimestamp(value: string | null, date = new Date()): boolean {
  if (!value) return false;

  const timestamp = Number(value);
  const parsed = Number.isFinite(timestamp) ? timestamp : Date.parse(value);
  if (!Number.isFinite(parsed)) return false;

  const parsedDate = new Date(parsed);
  return parsedDate.getFullYear() === date.getFullYear()
    && parsedDate.getMonth() === date.getMonth()
    && parsedDate.getDate() === date.getDate();
}

function safeStorage(type: 'sessionStorage' | 'localStorage'): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window[type];
  } catch {
    return null;
  }
}

function readFlags(storage: Storage | null, key: string): ConversionFlags {
  if (!storage) return {};
  try {
    const raw = storage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as ConversionFlags;
    }
    return { [ALL_SCOPES]: String(raw) };
  } catch {
    return { [ALL_SCOPES]: String(Date.now()) };
  }
}

function writeFlags(storage: Storage | null, key: string, flags: ConversionFlags): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(flags));
  } catch {
    // ignore storage failures (private mode, quota, disabled storage)
  }
}

function readNavigationFallback(): Record<string, ConversionFlags> {
  if (typeof window === 'undefined') return {};
  try {
    if (!window.name.startsWith(NAVIGATION_FALLBACK_PREFIX)) return {};
    const parsed = JSON.parse(window.name.slice(NAVIGATION_FALLBACK_PREFIX.length)) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, ConversionFlags>;
    }
  } catch {
    // ignore malformed window.name values
  }
  return {};
}

function writeNavigationFallback(key: string, flags: ConversionFlags): void {
  if (typeof window === 'undefined') return;
  try {
    window.name = `${NAVIGATION_FALLBACK_PREFIX}${JSON.stringify({
      ...readNavigationFallback(),
      [key]: flags,
    })}`;
  } catch {
    // ignore fallback failures
  }
}

function clearSessionConversionFlags(): void {
  const storage = safeStorage('sessionStorage');
  if (!storage) return;

  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.startsWith(CONVERSION_KEY_PREFIX)) {
        storage.removeItem(key);
      }
    }
  } catch {
    // ignore cleanup failures
  }
}

export function registerConversionDedupCleanup(): void {
  if (typeof window === 'undefined') return;
  const w = window as Window & { [CLEANUP_REGISTERED_FLAG]?: boolean };
  if (w[CLEANUP_REGISTERED_FLAG]) return;

  window.addEventListener('beforeunload', clearSessionConversionFlags);
  w[CLEANUP_REGISTERED_FLAG] = true;
}

export function hasDailyConversionFlag(scope: string): boolean {
  registerConversionDedupCleanup();
  const key = getDailyConversionKey();
  const sessionFlags = readFlags(safeStorage('sessionStorage'), key);
  const localFlags = readFlags(safeStorage('localStorage'), key);
  const navigationFlags = readNavigationFallback()[key] ?? {};

  const sources: ConversionDedupSource[] = [];
  const timestamps: Partial<Record<ConversionDedupSource, string>> = {};
  let matchedScope: string | null = null;

  const check = (
    name: ConversionDedupSource,
    flags: ConversionFlags,
  ) => {
    const ts = flags[scope] ?? flags[ALL_SCOPES];
    if (!ts) return;
    sources.push(name);
    timestamps[name] = ts;
    if (matchedScope === null) {
      matchedScope = flags[scope] ? scope : ALL_SCOPES;
    }
  };

  check('sessionStorage', sessionFlags);
  check('localStorage', localFlags);
  check('window.name', navigationFlags);

  if (sources.length === 0) return false;

  logBlockedConversion({
    scope,
    date: key.slice(CONVERSION_KEY_PREFIX.length),
    sources,
    matchedScope: matchedScope ?? scope,
    timestamps,
  });
  return true;
}

export function markDailyConversionFlag(scope: string): void {
  registerConversionDedupCleanup();
  const key = getDailyConversionKey();
  const timestamp = new Date().toISOString();

  const sessionStorageRef = safeStorage('sessionStorage');
  const localStorageRef = safeStorage('localStorage');

  writeFlags(sessionStorageRef, key, {
    ...readFlags(sessionStorageRef, key),
    [scope]: timestamp,
  });
  writeFlags(localStorageRef, key, {
    ...readFlags(localStorageRef, key),
    [scope]: timestamp,
  });
  writeNavigationFallback(key, {
    ...(readNavigationFallback()[key] ?? {}),
    [scope]: timestamp,
  });
}

export function clearDailyConversionFlag(scope: string): void {
  const key = getDailyConversionKey();

  (['sessionStorage', 'localStorage'] as const).forEach((type) => {
    const storage = safeStorage(type);
    if (!storage) return;
    const flags = readFlags(storage, key);
    delete flags[scope];
    delete flags[ALL_SCOPES];

    if (Object.keys(flags).length === 0) {
      try {
        storage.removeItem(key);
      } catch {
        // ignore storage failures
      }
      return;
    }

    writeFlags(storage, key, flags);
  });

  const navigationState = readNavigationFallback();
  const navigationFlags = navigationState[key];
  if (!navigationFlags) return;

  delete navigationFlags[scope];
  delete navigationFlags[ALL_SCOPES];

  if (Object.keys(navigationFlags).length === 0) {
    delete navigationState[key];
  }

  try {
    window.name = Object.keys(navigationState).length === 0
      ? ''
      : `${NAVIGATION_FALLBACK_PREFIX}${JSON.stringify(navigationState)}`;
  } catch {
    // ignore fallback cleanup failures
  }
}

if (typeof window !== 'undefined') {
  (window as unknown as {
    __kspConversionDedupDebug?: {
      enable: () => void;
      disable: () => void;
      isEnabled: () => boolean;
    };
  }).__kspConversionDedupDebug = {
    enable: () => setConversionDedupDebug(true),
    disable: () => setConversionDedupDebug(false),
    isEnabled: () => isConversionDedupDebugEnabled(),
  };
}