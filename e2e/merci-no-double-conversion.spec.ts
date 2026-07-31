import { type Page } from '@playwright/test';
import { test, expect } from './utils/retry-filter';
import { installGtagRecorder, readGtagCalls, countAdsConversions, waitForAdsConversionCount } from './utils/conversion-readers';

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

async function getConversionCount(page: Page): Promise<number> {
  return countAdsConversions(await readGtagCalls(page), `${ADS_ID}/${ADS_LABEL}`);
}

test.describe('/merci page — conversion dedup after CTA submission', () => {
  // Per-test reset of sessionStorage + localStorage dedup keys
  // (incl. conversion_fired_*) is provided GLOBALLY by the
  // `./utils/retry-filter` test fixture — no manual beforeEach needed.

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
      const w = window as unknown as { __gtagCalls?: unknown[][] };
      if (w.__gtagCalls) w.__gtagCalls.length = 0;
      try { sessionStorage.removeItem('__gtagCallsStash'); } catch { /* ignore */ }
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
      const w = window as unknown as { __gtagCalls?: unknown[][] };
      if (w.__gtagCalls) w.__gtagCalls.length = 0;
      try { sessionStorage.removeItem('__gtagCallsStash'); } catch { /* ignore */ }
    });

    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();

    // Attente déterministe (expect.poll) au lieu d'un sleep fixe : sur worker
    // lent, la conversion peut arriver après 1s → faux négatif intermittent.
    await waitForAdsConversionCount(page, `${ADS_ID}/${ADS_LABEL}`, 1);

    const conversions = await getConversionCount(page);
    console.log(`[Test] /merci conversions captured (should be 1): ${conversions}`);
    expect(
      conversions,
      'Google Ads conversion must fire exactly once on /merci when no prior dedup'
    ).toBe(1);
  });
});