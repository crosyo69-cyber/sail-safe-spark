import { type Page } from '@playwright/test';
import { test, expect } from './utils/retry-filter';

/**
 * E2E: Google Ads conversion on /merci fires ONLY after marketing cookies
 * are accepted — even if the visitor first rejected them.
 *
 * Contract under test:
 *  1. Visitor rejects marketing cookies (marketing:false).
 *  2. Landing on /merci → NO gtag('event','conversion', { send_to:... }).
 *  3. Visitor later accepts marketing cookies (marketing:true).
 *  4. The deferred conversion replays and fires exactly once.
 */

const ADS_LABEL = 's2n0CL3puI4cEIW4u9AD';
const ADS_ID = 'AW-974052357';
const SEND_TO = `${ADS_ID}/${ADS_LABEL}`;

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

async function countConversions(page: Page): Promise<number> {
  const calls = await page.evaluate(
    () => (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls
  );
  return calls.filter(
    (c) => c[0] === 'event' && c[1] === 'conversion'
      && (c[2] as Record<string, unknown>)?.send_to === SEND_TO
  ).length;
}

async function resetCapture(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls.length = 0;
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

/** Simulate the visitor clicking "Refuser" on the cookie banner. */
async function rejectMarketing(page: Page) {
  await page.evaluate(() => {
    const prefs = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
  });
}

/** Simulate the visitor later clicking "Accepter" on the cookie banner. */
async function acceptMarketing(page: Page) {
  await page.evaluate(() => {
    const prefs = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
  });
}

test.describe('/merci — Google Ads conversion after reject-then-accept', () => {
  test('conversion stays silent after initial rejection, then fires once on acceptance', async ({ page }) => {
    await installGtagRecorder(page);

    // Override the global auto-seeded consent so the test starts from a
    // clean "rejected" state.
    await page.goto('/');
    await revokeConsent(page);
    await rejectMarketing(page);

    await resetCapture(page);

    // 1. Land on /merci with marketing rejected → conversion must NOT fire.
    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(1_000);

    expect(
      await countConversions(page),
      'Google Ads conversion must NOT fire while marketing cookies are rejected'
    ).toBe(0);

    const mirrorBefore = await page.evaluate(
      (key) => localStorage.getItem(key),
      `conversion_fired_${SEND_TO}`,
    );
    expect(mirrorBefore, 'dedup mirror must stay empty while consent is rejected').toBeNull();

    // 2. Visitor changes their mind and accepts marketing cookies.
    await acceptMarketing(page);
    await page.waitForTimeout(800);

    const conversionsAfter = await countConversions(page);
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
