import { type Page } from '@playwright/test';
import { test, expect } from './utils/retry-filter';

/**
 * E2E: when the visitor rejects BOTH analytics and marketing cookies
 * (only necessary cookies enabled), the Google Ads conversion on /merci
 * must never fire — neither on initial load, nor on subsequent reloads.
 *
 * Contract enforced by src/lib/consent.ts + src/lib/analytics.ts:
 *   - hasMarketingConsent() returns false when prefs.marketing === false
 *   - trackGoogleAdsConversion() defers and only re-arms via
 *     onMarketingConsent(), which never fires unless marketing becomes true.
 */

const ADS_LABEL = 's2n0CL3puI4cEIW4u9AD';
const ADS_ID = 'AW-974052357';
const SEND_TO = `${ADS_ID}/${ADS_LABEL}`;

type GadsEvent = { status: string; send_to: string; ts: number };

async function installGadsRecorder(page: Page) {
  await page.addInitScript(() => {
    const events: GadsEvent[] = [];
    (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents = events;
    window.addEventListener('ksp:gads-conversion', (e: Event) => {
      const detail = (e as CustomEvent<GadsEvent>).detail;
      if (detail) events.push(detail);
    });
  });
}

async function countSentConversions(page: Page): Promise<number> {
  const events = await page.evaluate(
    () => (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents
  );
  return events.filter(
    (e) => e.status === 'sent' && e.send_to === SEND_TO
  ).length;
}

async function resetGadsCapture(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents.length = 0;
  });
}

/** Simulate the visitor rejecting all non-essential cookies. */
async function rejectAllNonEssential(page: Page) {
  await page.evaluate(() => {
    const prefs = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
  });
}

test.describe('/merci — no Google Ads conversion when both analytics and marketing are refused', () => {
  test('rejecting all non-essential cookies keeps Ads conversion silent', async ({ page }) => {
    await installGadsRecorder(page);

    // 1. Set reject-all consent before landing on /merci.
    await page.goto('/');
    await rejectAllNonEssential(page);
    await resetGadsCapture(page);

    // 2. Land on /merci with all non-essential rejected → must NOT fire.
    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(800);
    expect(await countSentConversions(page), 'no fire on /merci with all non-essential rejected').toBe(0);

    // 3. Re-affirm the rejection — still must NOT fire.
    await rejectAllNonEssential(page);
    await page.waitForTimeout(300);
    expect(await countSentConversions(page), 'no fire after re-rejection').toBe(0);

    // 4. Hard reload — consent gate must still block.
    await page.reload();
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(800);
    expect(await countSentConversions(page), 'no fire on reload with all non-essential rejected').toBe(0);

    // 5. Dedup mirror must stay empty.
    const mirror = await page.evaluate(
      (key) => localStorage.getItem(key),
      `conversion_fired_${SEND_TO}`,
    );
    expect(mirror, 'dedup mirror must stay null when marketing is false').toBeNull();

    // 6. GTM dataLayer must not contain merci_conversion.
    const merciPushes = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer: Array<Record<string, unknown>> }).dataLayer || [];
      return dl.filter((e) => e && e.event === 'merci_conversion').length;
    });
    expect(merciPushes, 'GTM merci_conversion event must not be pushed when marketing is false').toBe(0);
  });
});
