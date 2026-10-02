import { type Page } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * E2E: Google Ads conversion on /merci fires ONLY after marketing cookies
 * are accepted — even when the visitor initially accepted ONLY analytics cookies.
 *
 * Contract under test:
 *  1. Visitor accepts analytics cookies but not marketing (analytics:true, marketing:false).
 *  2. Landing on /merci → NO ksp:gads-conversion with status 'sent'.
 *  3. Visitor later accepts marketing cookies (marketing:true).
 *  4. The deferred conversion replays and fires exactly once (status 'sent').
 *
 * We listen for the app's own `ksp:gads-conversion` CustomEvent instead of
 * intercepting gtag, because gtag wrapping is fragile (gtag.js can overwrite
 * window.gtag late, requiring multiple reinstalls that multiply recordings).
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

/** Strip the consent flags auto-seeded by the global dedup beforeEach. */
async function revokeConsent(page: Page) {
  await page.evaluate(() => {
    try {
      localStorage.removeItem('cookie-consent');
      localStorage.removeItem('cookie-preferences');
    } catch { /* ignore */ }
  });
}

/** Simulate the visitor accepting analytics-only on the cookie banner. */
async function acceptAnalyticsOnly(page: Page) {
  await page.evaluate(() => {
    const prefs = { necessary: true, analytics: true, marketing: false };
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
  });
}

/** Simulate the visitor later accepting marketing cookies. */
async function acceptMarketing(page: Page) {
  await page.evaluate(() => {
    const prefs = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
  });
}

test.describe('/merci — Google Ads conversion after analytics-only then accept marketing', () => {
  test('conversion stays silent with analytics-only, then fires once on marketing acceptance', async ({ page }) => {
    await installGadsRecorder(page);

    // Override the global auto-seeded consent so the test starts from a
    // clean "analytics-only" state.
    await page.goto('/');
    await revokeConsent(page);
    await acceptAnalyticsOnly(page);

    await resetGadsCapture(page);

    // 1. Land on /merci with analytics-only (marketing false) → conversion must NOT fire.
    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(1_000);

    expect(
      await countSentConversions(page),
      'Google Ads conversion must NOT fire while only analytics cookies are accepted'
    ).toBe(0);

    const mirrorBefore = await page.evaluate(
      (key) => localStorage.getItem(key),
      `conversion_fired_${SEND_TO}`,
    );
    expect(mirrorBefore, 'dedup mirror must stay empty while marketing consent is missing').toBeNull();

    // 2. Visitor accepts marketing cookies (upgrading from analytics-only).
    await acceptMarketing(page);
    await page.waitForTimeout(800);

    const conversionsAfter = await countSentConversions(page);
    expect(
      conversionsAfter,
      'Google Ads conversion must fire exactly once after marketing consent is granted'
    ).toBe(1);

    const mirrorAfter = await page.evaluate(
      (key) => localStorage.getItem(key),
      `conversion_fired_${SEND_TO}`,
    );
    expect(mirrorAfter, 'dedup mirror must be armed after the deferred conversion fires').not.toBeNull();
  });
});
