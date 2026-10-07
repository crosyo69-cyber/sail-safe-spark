/**
 * Composed Playwright fixture entrypoint.
 *
 *   import { test, expect } from './fixtures';
 *
 *   test('CTA fires one Ads conversion', async ({ page, analytics, consent }) => {
 *     await consent.grantAll();
 *     await page.goto('/merci');
 *     await analytics.expectAds(1);
 *   });
 *
 * All fixtures are composed here in a SINGLE `base.extend({...})` off the
 * retry-filter test (retry policy + global dedup auto-reset + consent seed),
 * so worker/module load order can never drop a layer:
 *   storage    → low-level localStorage / sessionStorage helper
 *   consent    → cookie-consent driver (grantAll / rejectAll…)
 *   dedup      → conversion dedup reset / arm / snapshot
 *   analytics  → gtag + fbq recorders (auto-installed, before navigation)
 */
import { test as base } from '../utils/retry-filter';
import { createStorageHelper, type StorageHelper } from './storage.fixture';
import { createConsentHelper, type ConsentHelper } from './consent.fixture';
import { createDedupHelper, type DedupHelper } from './dedup.fixture';
import { createAnalyticsHelper, type AnalyticsHelper } from './analytics.fixture';

export interface KspFixtures {
  storage: StorageHelper;
  consent: ConsentHelper;
  dedup: DedupHelper;
  analytics: AnalyticsHelper;
}

export const test = base.extend<KspFixtures>({
  storage: async ({ page }, use) => {
    await use(createStorageHelper(page));
  },

  consent: async ({ page, storage }, use) => {
    await use(createConsentHelper(page, storage));
  },

  dedup: async ({ page, storage }, use) => {
    await use(createDedupHelper(page, storage));
  },

  // auto: recorders MUST be installed before the first navigation, otherwise
  // early conversions are lost ("0 conversions recorded").
  analytics: [
    async ({ page }, use) => {
      const helper = createAnalyticsHelper(page);
      await helper.installGtag();
      await helper.installFbq();
      await use(helper);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
export type { Page, Route } from '@playwright/test';

export * from './storage.fixture';
export * from './consent.fixture';
export * from './dedup.fixture';
export * from './analytics.fixture';