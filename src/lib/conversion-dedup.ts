const CONVERSION_KEY_PREFIX = 'ksp_conv_';
const ALL_SCOPES = '*';
const CLEANUP_REGISTERED_FLAG = '__kspConversionDedupCleanupRegistered';
const NAVIGATION_FALLBACK_PREFIX = 'ksp_conv_nav:';

type ConversionFlags = Record<string, string>;

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

  return Boolean(
    sessionFlags[scope] ||
    sessionFlags[ALL_SCOPES] ||
    localFlags[scope] ||
    localFlags[ALL_SCOPES] ||
    navigationFlags[scope] ||
    navigationFlags[ALL_SCOPES]
  );
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