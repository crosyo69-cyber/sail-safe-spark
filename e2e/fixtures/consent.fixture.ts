import type { Page } from '@playwright/test';
import { storageTest, type StorageHelper } from './storage.fixture';

/**
 * Cookie-consent driver.
 *
 * Source of truth in the app (see `src/lib/consent.ts`):
 *   - localStorage `cookie-consent`      → banner dismissed
 *   - localStorage `cookie-preferences`  → { necessary, analytics, marketing }
 *   - CustomEvent `ksp:consent-updated`  → live notification
 *
 * Conversion code (Google Ads / Meta Pixel) is gated on `marketing: true`,
 * so any spec asserting a conversion MUST grant marketing consent first.
 */
export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const CONSENT_KEYS = ['cookie-consent', 'cookie-preferences'] as const;

export const CONSENT_PRESETS = {
  all: { necessary: true, analytics: true, marketing: true },
  analyticsOnly: { necessary: true, analytics: true, marketing: false },
  rejectAll: { necessary: true, analytics: false, marketing: false },
} satisfies Record<string, CookiePreferences>;

export interface ConsentHelper {
  /** Write preferences + dismiss the banner, then dispatch the update event. */
  set(prefs: CookiePreferences): Promise<void>;
  /** Grant everything (default state for conversion specs). */
  grantAll(): Promise<void>;
  /** Analytics only — marketing conversions must stay blocked. */
  analyticsOnly(): Promise<void>;
  /** Refuse everything non-essential. */
  rejectAll(): Promise<void>;
  /** Remove the consent keys so the banner shows again on next load. */
  reset(): Promise<void>;
  /** Read the persisted preferences (null when the banner was never answered). */
  read(): Promise<CookiePreferences | null>;
  /** Seed consent BEFORE the first navigation (survives page.goto). */
  seedBeforeNavigation(prefs?: CookiePreferences): Promise<void>;
}

export function createConsentHelper(page: Page, storage: StorageHelper): ConsentHelper {
  const apply = async (prefs: CookiePreferences) => {
    await storage.ensureOrigin();
    await page.evaluate((p) => {
      try {
        window.localStorage.setItem('cookie-consent', 'true');
        window.localStorage.setItem('cookie-preferences', JSON.stringify(p));
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: p }));
    }, prefs);
  };

  return {
    set: apply,
    grantAll: () => apply(CONSENT_PRESETS.all),
    analyticsOnly: () => apply(CONSENT_PRESETS.analyticsOnly),
    rejectAll: () => apply(CONSENT_PRESETS.rejectAll),

    async reset() {
      await storage.ensureOrigin();
      await page.evaluate(() => {
        try {
          window.localStorage.removeItem('cookie-consent');
          window.localStorage.removeItem('cookie-preferences');
        } catch {
          /* ignore */
        }
      });
    },

    async read() {
      await storage.ensureOrigin();
      return page.evaluate(() => {
        try {
          const raw = window.localStorage.getItem('cookie-preferences');
          return raw ? (JSON.parse(raw) as CookiePreferences) : null;
        } catch {
          return null;
        }
      });
    },

    async seedBeforeNavigation(prefs = CONSENT_PRESETS.all) {
      await page.addInitScript((p) => {
        try {
          window.localStorage.setItem('cookie-consent', 'true');
          window.localStorage.setItem('cookie-preferences', JSON.stringify(p));
        } catch {
          /* ignore */
        }
      }, prefs);
    },
  };
}

export const consentTest = storageTest.extend<{ consent: ConsentHelper }>({
  consent: async ({ page, storage }, use) => {
    await use(createConsentHelper(page, storage));
  },
});