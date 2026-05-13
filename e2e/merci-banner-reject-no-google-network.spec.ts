import { type Page, type Request } from '@playwright/test';
import { test, expect } from './utils/retry-filter';

/**
 * E2E: when the visitor refuses analytics + marketing via the cookie banner
 * ("Tout refuser"), NO Google Ads / GTM measurement request must be sent on
 * /merci.
 *
 * With Consent Mode v2 (option 2), the gtag.js loader script itself is still
 * fetched (it is needed to push the `consent: default = denied` signal), but
 * NO measurement / conversion / remarketing hit must reach Google's
 * collection endpoints while consent stays denied.
 */

// Endpoints that actually transmit measurement / conversion / remarketing
// data. The gtag.js loader (`googletagmanager.com/gtag/js`) and gtm.js
// loader are intentionally excluded — Consent Mode v2 expects them to load.
const GOOGLE_MEASUREMENT_PATTERNS: RegExp[] = [
  /googleadservices\.com/i,
  /doubleclick\.net/i,
  /google-analytics\.com\/(?:g\/collect|collect|r\/collect)/i,
  /(?:www\.)?google\.com\/(?:ccm\/collect|pagead|ads|rmkt)/i,
  /analytics\.google\.com\/g\/collect/i,
];

function isGoogleMeasurementRequest(url: string): boolean {
  return GOOGLE_MEASUREMENT_PATTERNS.some((re) => re.test(url));
}

async function clearConsent(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('cookie-consent');
    localStorage.removeItem('cookie-preferences');
  });
}

test.describe('/merci — banner "Tout refuser" blocks all Google measurement hits', () => {
  test('no measurement requests after rejecting analytics+marketing via the banner', async ({ page }) => {
    // 1. Land on home with a clean slate so the cookie banner appears.
    await page.goto('/');
    await clearConsent(page);
    await page.reload();

    // 2. Wait for the banner (1.5s delay in CookieConsent.tsx) and click "Tout refuser".
    const rejectBtn = page.getByRole('button', { name: /tout refuser/i });
    await expect(rejectBtn).toBeVisible({ timeout: 5000 });
    await rejectBtn.click();
    await expect(rejectBtn).toBeHidden();

    // 3. Sanity check: prefs persisted as fully denied.
    const prefs = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('cookie-preferences') || 'null'),
    );
    expect(prefs).toEqual({ necessary: true, analytics: false, marketing: false });

    // 4. Start network capture only AFTER consent is denied, so we don't
    //    pollute results with anything fired during the initial '/' load.
    const measurementRequests: { url: string; method: string; resourceType: string }[] = [];
    const onRequest = (req: Request) => {
      const url = req.url();
      if (isGoogleMeasurementRequest(url)) {
        measurementRequests.push({
          url,
          method: req.method(),
          resourceType: req.resourceType(),
        });
      }
    };
    page.on('request', onRequest);

    try {
      // 5. Navigate to /merci.
      await page.goto('/merci');
      await expect(
        page.getByRole('heading', { name: /merci pour votre demande/i }),
      ).toBeVisible();
      await page.waitForTimeout(1500);

      // 6. Hard reload — Consent Mode default is re-applied; gate must hold.
      await page.reload();
      await expect(
        page.getByRole('heading', { name: /merci pour votre demande/i }),
      ).toBeVisible();
      await page.waitForTimeout(1500);

      // 7. Assert: zero Google Ads / GA / remarketing measurement hits.
      expect(
        measurementRequests,
        `expected no Google measurement requests on /merci with banner-rejected consent, got:\n` +
          measurementRequests
            .map((r) => `  - [${r.method} ${r.resourceType}] ${r.url}`)
            .join('\n'),
      ).toEqual([]);
    } finally {
      page.off('request', onRequest);
    }
  });
});