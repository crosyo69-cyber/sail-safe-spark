import { type Page, type Request } from '@playwright/test';
import { test, expect } from './utils/retry-filter';

/**
 * E2E: when the visitor rejects BOTH analytics and marketing on /merci,
 * NO network request must be sent to Google Ads / Google Tag Manager
 * endpoints (googleadservices, googletagmanager, doubleclick, google-analytics,
 * google.com/ccm/collect, google.com/pagead).
 */

const GOOGLE_HOST_PATTERNS: RegExp[] = [
  /googleadservices\.com/i,
  /googletagmanager\.com/i,
  /doubleclick\.net/i,
  /google-analytics\.com/i,
  /(?:www\.)?google\.com\/(?:ccm\/collect|pagead|ads)/i,
  /analytics\.google\.com/i,
];

function isGoogleAdsRequest(url: string): boolean {
  return GOOGLE_HOST_PATTERNS.some((re) => re.test(url));
}

async function rejectAllNonEssential(page: Page) {
  await page.evaluate(() => {
    const prefs = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
  });
}

test.describe('/merci — no Google Ads / GTM network calls when analytics+marketing refused', () => {
  test('no requests reach Google Ads/GTM endpoints with reject-all consent', async ({ page }) => {
    // 1. Set reject-all consent BEFORE navigating to /merci.
    await page.goto('/');
    await rejectAllNonEssential(page);

    // 2. Start network capture only after consent is persisted, so we don't
    //    pollute results with anything fired during the initial '/' load.
    const googleRequests: { url: string; method: string; resourceType: string }[] = [];
    const onRequest = (req: Request) => {
      const url = req.url();
      if (isGoogleAdsRequest(url)) {
        googleRequests.push({
          url,
          method: req.method(),
          resourceType: req.resourceType(),
        });
      }
    };
    page.on('request', onRequest);

    try {
      // 3. Land on /merci.
      await page.goto('/merci');
      await expect(
        page.getByRole('heading', { name: /merci pour votre demande/i })
      ).toBeVisible();
      await page.waitForTimeout(1500);

      // 4. Re-affirm rejection (simulates user re-saving prefs on /merci).
      await rejectAllNonEssential(page);
      await page.waitForTimeout(500);

      // 5. Hard reload — Merci useEffect runs again; gate must keep blocking.
      await page.reload();
      await expect(
        page.getByRole('heading', { name: /merci pour votre demande/i })
      ).toBeVisible();
      await page.waitForTimeout(1500);

      // 6. Assert: zero network calls to Google Ads / GTM endpoints.
      expect(
        googleRequests,
        `expected no Google Ads/GTM network calls on /merci with reject-all consent, got:\n` +
          googleRequests
            .map((r) => `  - [${r.method} ${r.resourceType}] ${r.url}`)
            .join('\n'),
      ).toEqual([]);
    } finally {
      page.off('request', onRequest);
    }
  });
});
