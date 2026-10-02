import { type Page } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * E2E: when the visitor REJECTS marketing cookies, the Google Ads conversion
 * on /merci must never fire — neither on initial load, nor after the reject
 * event, nor on subsequent reloads or in-app navigations back to /merci.
 *
 * Contract enforced by src/lib/consent.ts + src/lib/analytics.ts:
 *   - hasMarketingConsent() returns false when prefs.marketing === false
 *   - trackGoogleAdsConversion() defers and only re-arms via
 *     onMarketingConsent(), which never fires for a "reject" decision.
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

/** Persist a "marketing rejected" decision (mirrors CookieConsent's rejectAll). */
async function rejectMarketing(page: Page) {
  await page.evaluate(() => {
    const prefs = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
  });
}

test.describe('/merci — no Google Ads conversion when marketing cookies are REFUSED', () => {
  test('rejecting cookies keeps the conversion silent across reloads & re-navigations', async ({ page }) => {
    await installGtagRecorder(page);

    // 1. Visit "/" then explicitly reject marketing — overrides the consent
    //    seeded by the global dedup-storage beforeEach hook.
    await page.goto('/');
    await rejectMarketing(page);

    // Reset capture before navigating to /merci.
    await page.evaluate(() => {
      (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls.length = 0;
    });

    // 2. Initial /merci landing — must NOT fire.
    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(800);
    expect(await countConversions(page), 'no fire on first /merci view with refused consent').toBe(0);

    // 3. Re-affirm the rejection (simulates user closing/reopening banner)
    //    — `ksp:consent-updated` fires but with marketing:false, so the
    //    deferred replay listener in src/lib/consent.ts must remain idle.
    await rejectMarketing(page);
    await page.waitForTimeout(300);
    expect(await countConversions(page), 'no fire after re-rejection event').toBe(0);

    // 4. Hard reload of /merci — Merci.tsx useEffect runs again, but the
    //    consent gate must still block.
    await page.reload();
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(800);
    expect(await countConversions(page), 'no fire on /merci reload with refused consent').toBe(0);

    // 5. Navigate away and come back — every Merci mount must remain silent.
    await page.goto('/');
    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(800);
    expect(await countConversions(page), 'no fire after leaving and re-entering /merci').toBe(0);

    // 6. Persistent dedup mirror must remain empty — a refused conversion is
    //    not a "fired" conversion.
    const mirror = await page.evaluate(
      (key) => localStorage.getItem(key),
      `conversion_fired_${SEND_TO}`,
    );
    expect(mirror, 'persistent dedup mirror must stay null when consent is refused').toBeNull();

    // 7. GTM dataLayer must not contain a `merci_conversion` push either.
    const merciPushes = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer: Array<Record<string, unknown>> }).dataLayer || [];
      return dl.filter((e) => e && e.event === 'merci_conversion').length;
    });
    expect(merciPushes, 'GTM merci_conversion event must not be pushed when consent is refused').toBe(0);
  });
});
