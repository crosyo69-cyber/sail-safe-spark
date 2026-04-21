import { test, expect, type Page } from '@playwright/test';

/**
 * E2E: verify that loading /merci does NOT re-fire the GA4 `form_submit`
 * event for `cta_reservation`, even when the Google Ads conversion dedup
 * window is active (i.e. CTASection just submitted the form <10s ago).
 *
 * Why this matters:
 *  - CTASection calls trackFormSubmit('cta_reservation', ...) once on submit.
 *  - Merci.tsx mounts immediately after via SPA navigation and runs a useEffect
 *    that calls trackGoogleAdsConversion + trackMetaLead — but it MUST NOT
 *    re-emit a GA4 form_submit event (that would inflate conversion counts in
 *    GA4 even though Google Ads is correctly deduped via sessionStorage).
 *
 * Two scenarios are checked to make the guarantee robust:
 *   1. Dedup ACTIVE  (recent ads dedup key + recent form_submit dedup key seeded)
 *   2. Dedup INACTIVE (no seeded keys — direct visit to /merci, e.g. bookmark)
 * In both cases, /merci must produce ZERO `form_submit` events with
 * form_name === 'cta_reservation'.
 */

const ADS_LABEL = 's2n0CL3puI4cEIW4u9AD';
const ADS_ID = 'AW-974052357';
const ADS_DEDUP_KEY = `__gads_conv_${ADS_ID}/${ADS_LABEL}`;
const GA4_FORM_DEDUP_KEY = '__ga4_form_submit_cta_reservation';

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

async function getFormSubmitCount(page: Page, formName: string): Promise<number> {
  const calls = await page.evaluate(
    () => (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls
  );
  return calls.filter(
    (c) => c[0] === 'event' && c[1] === 'form_submit'
      && (c[2] as Record<string, unknown>)?.form_name === formName
  ).length;
}

test.describe('/merci page — GA4 form_submit must NOT re-fire', () => {
  test('with ads dedup active: zero GA4 form_submit on /merci load', async ({ page }) => {
    await installGtagRecorder(page);

    // Same-origin context first, then seed BOTH dedup keys to simulate a
    // submission that just happened in CTASection 1 second ago.
    await page.goto('/');
    await page.evaluate(({ adsKey, ga4Key }) => {
      const now = String(Date.now() - 1_000);
      sessionStorage.setItem(adsKey, now);
      sessionStorage.setItem(ga4Key, now);
    }, { adsKey: ADS_DEDUP_KEY, ga4Key: GA4_FORM_DEDUP_KEY });

    // Reset capture so we count only what /merci emits.
    await page.evaluate(() => {
      (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls.length = 0;
    });

    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(1_000);

    const formSubmits = await getFormSubmitCount(page, 'cta_reservation');
    console.log(`[Test] /merci form_submit(cta_reservation) — dedup ACTIVE: ${formSubmits} (expected 0)`);
    expect(
      formSubmits,
      'GA4 form_submit must NOT fire on /merci when dedup window is active'
    ).toBe(0);
  });

  test('with no dedup seeded: still zero GA4 form_submit on direct /merci visit', async ({ page }) => {
    await installGtagRecorder(page);

    await page.goto('/');
    await page.evaluate(({ adsKey, ga4Key }) => {
      sessionStorage.removeItem(adsKey);
      sessionStorage.removeItem(ga4Key);
    }, { adsKey: ADS_DEDUP_KEY, ga4Key: GA4_FORM_DEDUP_KEY });

    await page.evaluate(() => {
      (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls.length = 0;
    });

    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(1_000);

    const formSubmits = await getFormSubmitCount(page, 'cta_reservation');
    console.log(`[Test] /merci form_submit(cta_reservation) — dedup INACTIVE: ${formSubmits} (expected 0)`);
    expect(
      formSubmits,
      'GA4 form_submit must never be emitted by /merci itself (Merci.tsx does not call trackFormSubmit)'
    ).toBe(0);
  });
});