import { type Page } from '@playwright/test';
import { test, expect } from './utils/retry-filter';

/**
 * E2E: when the visitor accepts ONLY analytics cookies (marketing = false),
 * the Google Ads conversion on /merci must never fire.
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
    const STORE_KEY = '__gadsEventsPersisted';
    const persisted: GadsEvent[] = (() => {
      try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
      catch { return []; }
    })();
    (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents = persisted;
    window.addEventListener('ksp:gads-conversion', (e: Event) => {
      const detail = (e as CustomEvent<GadsEvent>).detail;
      if (!detail) return;
      const arr = (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents;
      arr.push(detail);
      try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch { /* ignore */ }
    });
  });
}

async function countSentConversions(page: Page): Promise<number> {
  const events = await page.evaluate(
    () => (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents
  );
  return events.filter((e) => e.status === 'sent' && e.send_to === SEND_TO).length;
}

async function resetGadsCapture(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents.length = 0;
    try { localStorage.removeItem('__gadsEventsPersisted'); } catch { /* ignore */ }
  });
}

/** Persist an "analytics only" decision (analytics=true, marketing=false). */
async function acceptAnalyticsOnly(page: Page) {
  await page.evaluate(() => {
    const prefs = { necessary: true, analytics: true, marketing: false };
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
  });
}

test.describe('/merci — no Google Ads conversion when only analytics cookies are accepted', () => {
  test('analytics-only consent keeps Ads conversion silent on /merci', async ({ page }) => {
    await installGadsRecorder(page);

    // 1. Visit "/" then set analytics-only consent.
    await page.goto('/');
    await acceptAnalyticsOnly(page);

    // Reset capture before navigating to /merci.
    await resetGadsCapture(page);

    // 2. Initial /merci landing — must NOT fire because marketing is false.
    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(800);
    expect(await countSentConversions(page), 'no fire on /merci with analytics-only consent').toBe(0);

    // 3. Re-affirm the analytics-only consent (simulates user re-saving prefs)
    //    — `ksp:consent-updated` fires but with marketing:false, so the
    //    deferred replay listener in src/lib/consent.ts must remain idle.
    await acceptAnalyticsOnly(page);
    await page.waitForTimeout(300);
    expect(await countSentConversions(page), 'no fire after re-affirming analytics-only').toBe(0);

    // 4. Hard reload of /merci — Merci.tsx useEffect runs again, but the
    //    consent gate must still block because marketing is false.
    await page.reload();
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(800);
    expect(await countSentConversions(page), 'no fire on /merci reload with analytics-only consent').toBe(0);

    // 5. Persistent dedup mirror must remain empty — an analytics-only
    //    visit is not a "fired" conversion.
    const mirror = await page.evaluate(
      (key) => localStorage.getItem(key),
      `conversion_fired_${SEND_TO}`,
    );
    expect(mirror, 'persistent dedup mirror must stay null when marketing is false').toBeNull();

    // 6. GTM dataLayer must not contain a `merci_conversion` push either.
    const merciPushes = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer: Array<Record<string, unknown>> }).dataLayer || [];
      return dl.filter((e) => e && e.event === 'merci_conversion').length;
    });
    expect(merciPushes, 'GTM merci_conversion event must not be pushed when marketing is false').toBe(0);
  });
});
