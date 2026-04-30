import { test, expect, type Page } from '@playwright/test';
import { SUBMIT_IDLE_LABEL_RE, SUBMIT_LOADING_LABEL_RE, SUBMIT_LOADING_LABEL, SUBMIT_BUTTON_TESTID, getSubmitButton } from './utils/submit-button';

/**
 * E2E: verify that after a successful CTA submission + redirect to /merci,
 * RELOADING /merci does NOT re-fire the Google Ads conversion nor the GA4
 * form_submit event. Both must remain at exactly 1 fire across the whole flow.
 *
 * Dedup is enforced by 10s sessionStorage windows in trackGoogleAdsConversion
 * and trackFormSubmit (analytics.ts). Since gtag calls captured before reload
 * would normally be lost, we mirror them into sessionStorage so they survive.
 */

const ADS_LABEL = 's2n0CL3puI4cEIW4u9AD';
const ADS_ID = 'AW-974052357';

type GtagCall = [string, string, Record<string, unknown>?];

async function installInstrumentation(page: Page) {
  await page.addInitScript(() => {
    const STASH_KEY = '__gtagCallsStash';
    const prior = (() => {
      try {
        const raw = sessionStorage.getItem(STASH_KEY);
        return raw ? (JSON.parse(raw) as GtagCall[]) : [];
      } catch { return []; }
    })();
    const calls: GtagCall[] = prior;
    (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls = calls;
    (window as unknown as { dataLayer: unknown[] }).dataLayer = [];

    const persist = () => {
      try { sessionStorage.setItem(STASH_KEY, JSON.stringify(calls)); } catch { /* ignore */ }
    };

    const recorder = (...args: unknown[]) => {
      calls.push(args as GtagCall);
      persist();
    };
    (window as unknown as { gtag: typeof recorder }).gtag = recorder;

    const reinstall = () => {
      const original = (window as unknown as { gtag: (...a: unknown[]) => void }).gtag;
      (window as unknown as { gtag: typeof recorder }).gtag = (...args: unknown[]) => {
        calls.push(args as GtagCall);
        persist();
        try { original?.(...args); } catch { /* ignore */ }
      };
    };
    setTimeout(reinstall, 0);
    setTimeout(reinstall, 100);
    setTimeout(reinstall, 500);
    setTimeout(reinstall, 1500);
  });

  await page.route('**/functions/v1/send-contact-email', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

test.describe('CTA → /merci → reload — no double conversion', () => {
  test('GA4 form_submit and Google Ads conversion fire exactly once across submit + reload', async ({ page }) => {
    await installInstrumentation(page);

    await page.goto('/');
    const submitButton = getSubmitButton(page);
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();

    await page.getByTestId('lead-firstname').fill('TestUser');
    await page.getByTestId('lead-email').fill('test@example.com');
    await page.getByTestId('lead-phone').fill('0612345678');

    // Anti-bot timestamp guard requires >3s between mount and submit.
    await page.waitForTimeout(3500);

    await submitButton.click();
    await page.waitForURL('**/merci', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();

    // Let Merci.tsx's useEffect run (would re-fire Ads conversion if not deduped).
    await page.waitForTimeout(500);

    // RELOAD /merci — the scenario under test.
    await page.reload();
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(1_000);

    const calls = await page.evaluate(
      () => (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls
    );

    const formSubmits = calls.filter(
      (c) => c[0] === 'event' && c[1] === 'form_submit'
        && (c[2] as Record<string, unknown>)?.form_name === 'cta_reservation'
    );
    const adsConversions = calls.filter(
      (c) => c[0] === 'event' && c[1] === 'conversion'
        && typeof (c[2] as Record<string, unknown>)?.send_to === 'string'
        && ((c[2] as Record<string, unknown>).send_to as string) === `${ADS_ID}/${ADS_LABEL}`
    );

    console.log(
      `[Test] After submit + reload — form_submit: ${formSubmits.length}/1 | ` +
      `conversion(${ADS_LABEL}): ${adsConversions.length}/1 | total gtag calls: ${calls.length}`
    );

    expect(formSubmits.length, 'GA4 form_submit must fire exactly once across submit + reload').toBe(1);
    expect(adsConversions.length, 'Google Ads conversion must fire exactly once across submit + reload').toBe(1);
  });
});
