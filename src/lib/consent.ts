/**
 * Cookie consent helpers.
 *
 * Source of truth: localStorage `cookie-preferences` (set by CookieConsent.tsx).
 * Marketing flag gates Google Ads + Meta Pixel conversion fires so we do not
 * send hits that would be blocked by browsers/extensions and rejected by Tag
 * Assistant when consent has not been granted.
 */
export type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const PREFS_KEY = 'cookie-preferences';

function readPrefs(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as CookiePreferences) : null;
  } catch {
    return null;
  }
}

export function hasMarketingConsent(): boolean {
  return readPrefs()?.marketing === true;
}

export function hasAnalyticsConsent(): boolean {
  return readPrefs()?.analytics === true;
}

/**
 * Subscribe to the next consent acceptance (marketing). Fires once.
 * Listens for the global `ksp:consent-updated` CustomEvent dispatched by
 * CookieConsent.tsx when preferences are saved.
 */
export function onMarketingConsent(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  if (hasMarketingConsent()) {
    cb();
    return () => {};
  }
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<CookiePreferences>).detail;
    if (detail?.marketing) {
      window.removeEventListener('ksp:consent-updated', handler);
      cb();
    }
  };
  window.addEventListener('ksp:consent-updated', handler);
  return () => window.removeEventListener('ksp:consent-updated', handler);
}