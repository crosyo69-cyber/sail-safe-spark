import { test, expect, type Page } from '@playwright/test';

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
const DEDUP_KEY = `__gads_conv_${ADS_ID}/${ADS_LABEL}`;

const GA4_FORM_DEDUP_KEY = '__ga4_form_submit_cta_reservation';

// GA4 form_submit is tracked via CTASection, not Merci.tsx — but we still check
the GA4 dedup key to ensure the 10s window is consistent.

type GtagCall = [string, string, Record<string, unknown>?];

async function installGtagRecorder(page: Page) {
  await page.addInitScript(() => {
    const calls: GtagCall[] = [];
    (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls = calls;
    (window as unknown as { dataLayer: unknown[] }).dataLayer = [];

    const recorder = (...args: unknown[]) => {
      calls.push(args as GtagCall);
    };
    (window as unknown as { gtag: typeof recorder }).gtag = recorder;

    // Re-install after analytics.ts overwrites window.gtag during initGA4()
    const reinstall = () => {
      const original = (window as unknown as { gtag: (...a: unknown[]) => void }).gtag;
      (window as unknown as { gtag: typeof recorder }).gtag = (...args: unknown[]) => {
        calls.push(args as GtagCall);
        try { original?.(...args); } catch { /* ignore */ }
      };
    };
    setTimeout(reinstall, 0);
    setTimeout(reinstall, 100);
    setTimeout(reinstall, 500);
    setTimeout(reinstall, 1500);
  });
}

async function getConversionCount(page: Page): Promise<number> {
  const calls = await page.evaluate(
    () => (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls
  );
  return calls.filter(
    (c) => c[0] === 'event' && c[1] === 'conversion'
      && typeof (c[2] as Record<string, unknown>)?.send_to === 'string'
      && ((c[2] as Record<string, unknown>).send_to as string) === `${ADS_ID}/${ADS_LABEL}`
  ).length;
}

test.describe('/merci page — 10s dedup window expiration', () => {
  test('DOES fire conversion again when dedup timestamp is >10s old', async ({ page }) => {
    await installGtagRecorder(page);

    // Seed the sessionStorage dedup key with a timestamp 11 seconds ago (>10s window).
    await page.goto('/');
    await page.evaluate(({ key }) => {
      sessionStorage.setItem(key, String(Date.now() - 11_000));
    }, { key: DEDUP_KEY });

    // Reset captured calls so we only count what happens on /merci.
    await page.evaluate(() => {
      (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls.length = 0;
    });

    // Navigate to /merci — Merci.tsx's useEffect calls trackGoogleAdsConversion.
    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();

    // Wait for useEffect + analytics init.
    await page.waitForTimeout(1_000);

    const conversions = await getConversionCount(page);
    console.log(`[Test] /merci conversions captured (should be 1): ${conversions}`);
    expect(
      conversions,
      'Google Ads conversion MUST fire again when dedup window (10s) has expired'
    ).toBe(1);
  });

  test('DOES fire conversion at exactly 10s boundary (edge case)', async ({ page }) => {
    await installGtagRecorder(page);

    // At exactly 10s: Date.now() - last >= 10_000 is true (dedup window closed).
    await page.goto('/');
    await page.evaluate(({ key }) => {
      sessionStorage.setItem(key, String(Date.now() - 10_000));
    }, { key: DEDUP_KEY });

    await page.evaluate(() => {
      (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls.length = 0;
    });

    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(1_000);

    const conversions = await getConversionCount(page);
    console.log(`[Test] /merci conversions at 10s boundary (should be 1): ${conversions}`);
    expect(
      conversions,
      'At exactly 10s, the conversion should fire (>= 10000ms check)'
    ).toBe(1);
  });
});
