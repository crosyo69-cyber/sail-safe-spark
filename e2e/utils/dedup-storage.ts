import type { Page, BrowserContext } from '@playwright/test';

/**
 * Shared dedup-storage cleanup for conversion tests.
 *
 * Why this exists
 * ───────────────
 * The app's conversion dedup writes to BOTH stores:
 *   - sessionStorage: `__gads_conv_<id>`, `__ga4_form_submit_<form>`,
 *                     `__meta_pixel_lead`, `conversion_fired_meta_*`
 *   - localStorage:   `conversion_fired_<id>` (persistent mirror that
 *                     survives reload / back / remount), plus debug history
 *                     keys `ksp_conv_*`.
 *
 * Playwright reuses the same browser context across tests of the same file
 * by default, so a test that fired a conversion leaves the persistent
 * mirror armed and the next test sees a phantom "already fired" state.
 *
 * Always call `clearDedupStorage(page)` (or install the auto-clear hook
 * via `installDedupStorageReset(test)`) BEFORE the per-test action.
 */

export const DEDUP_STORAGE_PREFIXES = [
  '__gads_conv_',
  '__ga4_form_submit_',
  '__meta_pixel_lead',
  'conversion_fired_',
  'ksp_conv_',
  'conversion_once_',
  '__gtm_merci_',
  '__ksp_merci_gtag_count',
] as const;

/**
 * Wipe every dedup key from sessionStorage + localStorage on the page's
 * current origin. Safe to call before any navigation that needs a clean
 * conversion-state (it tolerates an `about:blank` page by no-oping).
 */
export async function clearDedupStorage(page: Page): Promise<void> {
  // Storage APIs throw on opaque origins (about:blank). Make sure we're on
  // a real origin first; if not, navigate to "/" so localStorage is reachable.
  const url = page.url();
  if (!url || url === 'about:blank' || url.startsWith('chrome-error://')) {
    await page.goto('/');
  }

  await page.evaluate((prefixes) => {
    const wipe = (storage: Storage) => {
      try {
        for (let i = storage.length - 1; i >= 0; i -= 1) {
          const k = storage.key(i);
          if (k && prefixes.some((p) => k.startsWith(p))) {
            storage.removeItem(k);
          }
        }
      } catch {
        /* private mode / quota — ignore */
      }
    };
    try { wipe(window.sessionStorage); } catch { /* ignore */ }
    try { wipe(window.localStorage); } catch { /* ignore */ }
    // Seed marketing/analytics consent so conversion tests are not blocked
    // by the new cookie-consent gate in src/lib/consent.ts. Production
    // behavior remains gated until the visitor accepts cookies.
    try {
      window.localStorage.setItem('cookie-consent', 'true');
      window.localStorage.setItem(
        'cookie-preferences',
        JSON.stringify({ necessary: true, analytics: true, marketing: true }),
      );
    } catch { /* ignore */ }
  }, DEDUP_STORAGE_PREFIXES as unknown as string[]);
}

/**
 * Clear dedup storage for every origin known to the context. Useful when a
 * test navigates between localhost and a tunnel/published URL.
 */
export async function clearDedupStorageAllOrigins(
  context: BrowserContext,
): Promise<void> {
  for (const page of context.pages()) {
    await clearDedupStorage(page).catch(() => { /* page may have closed */ });
  }
}

/**
 * Install a beforeEach hook on a Playwright `test` object that:
 *   1. Navigates to "/" to ensure a same-origin storage context.
 *   2. Wipes all dedup-related keys from both storages.
 *
 * Usage:
 *   import { test } from '@playwright/test';
 *   import { installDedupStorageReset } from './utils/dedup-storage';
 *   installDedupStorageReset(test);
 */
export function installDedupStorageReset(
  testObj: { beforeEach: (fn: (args: { page: Page }) => Promise<void>) => void },
): void {
  testObj.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearDedupStorage(page);
  });
}

/**
 * Annotation key used by the global auto-reset hook (in
 * `./utils/retry-filter`) to opt a test out of dedup-storage cleanup.
 */
export const DEDUP_AUTO_RESET_ANNOTATION = 'dedupAutoReset';

/**
 * Helper to disable the global dedup auto-reset for a single test.
 *
 * Usage:
 *   import { test, expect } from './utils/retry-filter';
 *   import { skipDedupAutoReset } from './utils/dedup-storage';
 *
 *   test('garde l’état dédup pré-armé', async ({ page }, testInfo) => {
 *     skipDedupAutoReset(testInfo);
 *     // ...sessionStorage / localStorage are NOT wiped before this test.
 *   });
 *
 * Equivalent à pousser manuellement
 * `{ type: 'dedupAutoReset', description: 'false' }` dans
 * `testInfo.annotations`, mais sans risque de typo sur le nom de la clé.
 */
export function skipDedupAutoReset(
  testInfo: { annotations: Array<{ type: string; description?: string }> },
  reason = 'false',
): void {
  testInfo.annotations.push({
    type: DEDUP_AUTO_RESET_ANNOTATION,
    description: reason === 'false' ? 'false' : `false: ${reason}`,
  });
}

/**
 * Returns true if the given testInfo has opted out of the global
 * dedup-storage auto-reset (annotation `dedupAutoReset` whose description
 * starts with `false`).
 */
export function hasDedupAutoResetSkip(
  testInfo: { annotations: Array<{ type: string; description?: string }> },
): boolean {
  return testInfo.annotations.some(
    (a) =>
      a.type === DEDUP_AUTO_RESET_ANNOTATION &&
      typeof a.description === 'string' &&
      a.description.startsWith('false'),
  );
}

/**
 * Returns the human-readable opt-out reason recorded by `skipDedupAutoReset`,
 * or `null` if no opt-out annotation is present.
 *
 * - `skipDedupAutoReset(info)` → `"(no reason given)"`
 * - `skipDedupAutoReset(info, "pré-arme __gads_conv_")` → that string
 */
export function getDedupAutoResetSkipReason(
  testInfo: { annotations: Array<{ type: string; description?: string }> },
): string | null {
  const ann = testInfo.annotations.find(
    (a) =>
      a.type === DEDUP_AUTO_RESET_ANNOTATION &&
      typeof a.description === 'string' &&
      a.description.startsWith('false'),
  );
  if (!ann || typeof ann.description !== 'string') return null;
  const stripped = ann.description.replace(/^false:?\s*/, '');
  return stripped.length > 0 ? stripped : '(no reason given)';
}

/**
 * Snapshot of every dedup-related key currently sitting in the page's
 * sessionStorage + localStorage on the current origin. Used by the global
 * auto-reset hook to log what state was carried over when a test opts out
 * of the cleanup, so a flake on the next conversion assertion can be
 * diagnosed against a concrete record.
 */
export interface DedupStorageSnapshot {
  origin: string;
  capturedAt: string; // ISO 8601
  sessionStorage: Record<string, string>;
  localStorage: Record<string, string>;
  totalKeys: number;
}

export async function snapshotDedupStorage(
  page: Page,
): Promise<DedupStorageSnapshot> {
  // Need a real origin to read web storage.
  const url = page.url();
  if (!url || url === 'about:blank' || url.startsWith('chrome-error://')) {
    try {
      await page.goto('/');
    } catch {
      return {
        origin: url || 'about:blank',
        capturedAt: new Date().toISOString(),
        sessionStorage: {},
        localStorage: {},
        totalKeys: 0,
      };
    }
  }

  return page.evaluate((prefixes) => {
    const collect = (storage: Storage): Record<string, string> => {
      const out: Record<string, string> = {};
      try {
        for (let i = 0; i < storage.length; i += 1) {
          const k = storage.key(i);
          if (!k) continue;
          if (prefixes.some((p) => k.startsWith(p))) {
            out[k] = storage.getItem(k) ?? '';
          }
        }
      } catch {
        /* ignore */
      }
      return out;
    };
    const session = collect(window.sessionStorage);
    const local = collect(window.localStorage);
    return {
      origin: window.location.origin,
      capturedAt: new Date().toISOString(),
      sessionStorage: session,
      localStorage: local,
      totalKeys: Object.keys(session).length + Object.keys(local).length,
    };
  }, DEDUP_STORAGE_PREFIXES as unknown as string[]);
}