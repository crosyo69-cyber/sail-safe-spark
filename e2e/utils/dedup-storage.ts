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