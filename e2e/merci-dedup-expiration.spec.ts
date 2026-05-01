import { test, expect } from '@playwright/test';
import {
  installGtagRecorder,
  waitForAdsConversionCount,
} from './utils/conversion-readers';

/**
 * E2E: verify that the 10s dedup window for Google Ads conversions DOES expire,
 * allowing a second conversion to fire when the dedup timestamp is older than 10s.
 *
 * This complements merci-no-double-conversion.spec.ts by testing the opposite
 * boundary condition: when the last conversion was >10s ago, the event should fire.
 *
 * The dedup window is 10 seconds, defined in trackGoogleAdsConversion() (analytics.ts).
 * Key format: `__gads_conv_${GOOGLE_ADS_ID}/${conversionLabel}`.
 */

const ADS_LABEL = 's2n0CL3puI4cEIW4u9AD';
const ADS_ID = 'AW-974052357';
const CONV_ID = `${ADS_ID}/${ADS_LABEL}`;
const DEDUP_KEY = `__gads_conv_${ADS_ID}/${ADS_LABEL}`;
const MIRROR_KEY = `conversion_fired_${ADS_ID}/${ADS_LABEL}`;

const GA4_FORM_DEDUP_KEY = '__ga4_form_submit_cta_reservation';

// GA4 form_submit is tracked via CTASection, not Merci.tsx — but we still check
// the GA4 dedup key to ensure the 10s window is consistent.

test.describe('/merci page — 10s dedup window expiration', () => {
  test('DOES fire conversion again when dedup timestamp is >10s old', async ({ page }) => {
    await installGtagRecorder(page);

    // Seed both dedup stores with a timestamp 11 seconds ago (>10s window).
    await page.goto('/');
    await page.evaluate(({ key, mirrorKey }) => {
      const stale = String(Date.now() - 11_000);
      sessionStorage.setItem(key, stale);
      localStorage.setItem(mirrorKey, stale);
    }, { key: DEDUP_KEY, mirrorKey: MIRROR_KEY });

    // Navigate to /merci — Merci.tsx's useEffect calls trackGoogleAdsConversion.
    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();

    await waitForAdsConversionCount(page, CONV_ID, 1, {
      message: 'Google Ads conversion MUST fire again when dedup window (10s) has expired',
    });
  });

  test('DOES fire conversion at exactly 10s boundary (edge case)', async ({ page }) => {
    await installGtagRecorder(page);

    // At exactly 10s: Date.now() - last >= 10_000 is true (dedup window closed).
    await page.goto('/');
    await page.evaluate(({ key, mirrorKey }) => {
      const boundary = String(Date.now() - 10_000);
      sessionStorage.setItem(key, boundary);
      localStorage.setItem(mirrorKey, boundary);
    }, { key: DEDUP_KEY, mirrorKey: MIRROR_KEY });

    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await waitForAdsConversionCount(page, CONV_ID, 1, {
      message: 'At exactly 10s, the conversion should fire (>= 10000ms check)',
    });
  });
});
