import { test, expect, type Page } from '@playwright/test';
import { getSubmitButton } from './utils/submit-button';
import { installGtagRecorder, readGtagCalls } from './utils/conversion-readers';
import { clearDedupStorage } from './utils/dedup-storage';

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

/**
 * Root cause of the historical 3x `form_submit` count: the old inline
 * recorder re-wrapped `window.gtag` on a setTimeout ladder (0/100/500/1500ms),
 * so a SINGLE real gtag call was recorded once per wrapper layer. The app was
 * always firing exactly once. We now use the shared idempotent recorder.
 */
async function installInstrumentation(page: Page) {
  await installGtagRecorder(page);

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
    await clearDedupStorage(page);
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

    const calls = (await readGtagCalls(page)) as GtagCall[];

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
