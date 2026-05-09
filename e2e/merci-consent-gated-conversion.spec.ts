import { type Page } from '@playwright/test';
import { test, expect } from './utils/retry-filter';

/**
 * E2E: cookie-consent gate on Google Ads conversion (src/lib/consent.ts).
 *
 * Contract under test:
 *  1. With NO marketing consent, landing on /merci must NOT emit a
 *     gtag('event','conversion', { send_to: AW-974052357/<label> }).
 *  2. After the user accepts marketing cookies (CookieConsent dispatches
 *     `ksp:consent-updated`), the deferred conversion replays and fires
 *     exactly once.
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

/** Wipe the consent flags seeded by the global dedup beforeEach. */
async function revokeConsent(page: Page) {
  await page.evaluate(() => {
    try {
      localStorage.removeItem('cookie-consent');
      localStorage.removeItem('cookie-preferences');
    } catch { /* ignore */ }
  });
}

test.describe('/merci — Google Ads conversion gated on cookie consent', () => {
  test('defers conversion when marketing cookies have NOT been accepted', async ({ page }) => {
    await installGtagRecorder(page);

    // Get a same-origin context, then strip the consent flags that the global
    // dedup-storage hook auto-seeds for the rest of the suite.
    await page.goto('/');
    await revokeConsent(page);

    // Reset capture before navigating to /merci.
    await page.evaluate(() => {
      (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls.length = 0;
    });

    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(1_000);

    const conversions = await countConversions(page);
    expect(
      conversions,
      'Google Ads conversion must NOT fire on /merci before marketing cookies are accepted'
    ).toBe(0);

    // No persistent dedup mirror should be armed either — the fire was
    // deferred, not "successfully" recorded.
    const mirror = await page.evaluate(
      (key) => localStorage.getItem(key),
      `conversion_fired_${SEND_TO}`,
    );
    expect(mirror, 'persistent dedup mirror must remain empty while consent is pending').toBeNull();
  });

  test('replays the deferred conversion exactly once after consent is granted', async ({ page }) => {
    await installGtagRecorder(page);

    await page.goto('/');
    await revokeConsent(page);

    await page.evaluate(() => {
      (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls.length = 0;
    });

    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(800);

    expect(await countConversions(page), 'pre-consent: no conversion').toBe(0);

    // Simulate the user clicking "Tout accepter" on the cookie banner: write
    // the prefs to localStorage and dispatch the same event CookieConsent.tsx
    // emits (`ksp:consent-updated`). The onMarketingConsent listener in
    // src/lib/consent.ts should then replay trackGoogleAdsConversion.
    await page.evaluate(() => {
      const prefs = { necessary: true, analytics: true, marketing: true };
      localStorage.setItem('cookie-consent', 'true');
      localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
      window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
    });

    await page.waitForTimeout(800);

    const conversions = await countConversions(page);
    expect(
      conversions,
      'Google Ads conversion must fire exactly once after marketing consent is granted'
    ).toBe(1);
  });
});
