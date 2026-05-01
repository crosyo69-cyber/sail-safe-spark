import { test, expect, type Page } from '@playwright/test';
import { clearDedupStorage } from './utils/dedup-storage';

/**
 * E2E: verify that loading /merci AFTER a successful CTA submission does NOT
 * fire a second Google Ads conversion or a second GA4 event for the same
 * conversion label, even though Merci.tsx calls trackGoogleAdsConversion in
 * a useEffect on mount.
 *
 * The dedup is enforced by the 10s sessionStorage window in
 * trackGoogleAdsConversion (key: `__gads_conv_AW-974052357/<label>`).
 *
 * Flow:
 *  1. Pre-seed sessionStorage with a recent dedup timestamp (simulating that
 *     CTASection just fired the conversion 1s ago).
 *  2. Navigate to /merci directly.
 *  3. Wait for Merci's useEffect to run.
 *  4. Assert ZERO conversion gtag calls were captured.
 *
 * We separately verify the un-deduped path by clearing sessionStorage and
 * reloading: the conversion should then fire exactly once.
 */

const ADS_LABEL = 's2n0CL3puI4cEIW4u9AD';
const ADS_ID = 'AW-974052357';
const DEDUP_KEY = `__gads_conv_${ADS_ID}/${ADS_LABEL}`;

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

test.describe('/merci page — conversion dedup after CTA submission', () => {
  // Per-test reset: wipes sessionStorage + localStorage dedup keys
  // (incl. conversion_fired_*) so one test's persistent mirror cannot
  // leak into the next via the shared browser context.
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearDedupStorage(page);
  });

  test('does NOT fire conversion when CTASection already fired it <10s ago', async ({ page }) => {
    await installGtagRecorder(page);

    // Visit any page first to get a same-origin context, then seed sessionStorage
    // with a timestamp from 1 second ago (well within the 10s dedup window).
    await page.goto('/');
    await page.evaluate(({ key }) => {
      sessionStorage.setItem(key, String(Date.now() - 1_000));
    }, { key: DEDUP_KEY });

    // Reset captured calls so we only count what happens on /merci.
    await page.evaluate(() => {
      (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls.length = 0;
    });

    // Navigate to /merci — this triggers Merci.tsx's useEffect that calls
    // trackGoogleAdsConversion('s2n0CL3puI4cEIW4u9AD').
    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();

    // Give useEffect + any deferred analytics init time to run.
    await page.waitForTimeout(1_000);

    const conversions = await getConversionCount(page);
    console.log(`[Test] /merci conversions captured (should be 0): ${conversions}`);
    expect(
      conversions,
      'Google Ads conversion must NOT fire again on /merci within the 10s dedup window'
    ).toBe(0);
  });

  test('DOES fire conversion exactly once on /merci when no recent dedup exists', async ({ page }) => {
    await installGtagRecorder(page);

    // beforeEach already wiped dedup storage (session + local incl.
    // conversion_fired_*). Just reset captured calls before navigating.
    await page.goto('/');

    // Reset capture.
    await page.evaluate(() => {
      (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls.length = 0;
    });

    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(1_000);

    const conversions = await getConversionCount(page);
    console.log(`[Test] /merci conversions captured (should be 1): ${conversions}`);
    expect(
      conversions,
      'Google Ads conversion must fire exactly once on /merci when no prior dedup'
    ).toBe(1);
  });
});