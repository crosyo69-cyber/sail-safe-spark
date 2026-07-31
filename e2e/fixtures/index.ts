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
 * Fixture chain (each layer extends the previous one):
 *   retry-filter  → retry policy + global dedup auto-reset + consent seed
 *   storage       → `storage`   low-level localStorage / sessionStorage helper
 *   consent       → `consent`   cookie-consent driver (grantAll / rejectAll…)
 *   dedup         → `dedup`     conversion dedup reset / arm / snapshot
 *   analytics     → `analytics` gtag + fbq recorders (auto-installed) & counters
 */
export { analyticsTest as test } from './analytics.fixture';
export { expect } from '@playwright/test';

export * from './storage.fixture';
export * from './consent.fixture';
export * from './dedup.fixture';
export * from './analytics.fixture';