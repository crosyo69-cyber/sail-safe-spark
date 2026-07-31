import { type Page } from '@playwright/test';
// retry-filter = hook global (nettoyage des flags de dédup + consentement semé).
import { test, expect } from './fixtures';
import { installGtagRecorder, readGtagCalls, countAdsConversions } from './utils/conversion-readers';
import { SUBMIT_IDLE_LABEL_RE, SUBMIT_LOADING_LABEL_RE, SUBMIT_LOADING_LABEL, SUBMIT_BUTTON_TESTID, getSubmitButton } from './utils/submit-button';

/**
 * E2E: verify that a double-click on the homepage CTA "Envoyer ma demande"
 * fires GA4 form_submit AND Google Ads conversion EXACTLY ONCE.
 *
 * Strategy:
 *  1. Inject stubs in the page BEFORE any script runs:
 *     - window.gtag → records every (event, name, params) call into window.__gtagCalls
 *     - intercept supabase.functions.invoke('send-contact-email') via network route
 *       so no real email is sent and we get an instant success response.
 *  2. Fill the form, wait > 3s (anti-bot timestamp guard in CTASection).
 *  3. Double-click the submit button as fast as possible.
 *  4. Wait for navigation to /merci.
 *  5. Assert exactly 1 form_submit + 1 conversion event for the AW-... label.
 */

const ADS_LABEL = 's2n0CL3puI4cEIW4u9AD';
const ADS_ID = 'AW-974052357';

async function installInstrumentation(page: Page) {
  // Recorder partagé (Object.defineProperty, idempotent). L'ancien recorder
  // local ré-enveloppait window.gtag via une échelle de setTimeout : chaque
  // ré-installation empilait un wrapper, donc UN fire était compté N fois.
  await installGtagRecorder(page);

  // Stub the Supabase edge function call so we don't actually send an email
  // and the success branch fires immediately.
  await page.route('**/functions/v1/send-contact-email', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

test.describe('CTA homepage — double-click conversion dedup', () => {
  test('fires GA4 form_submit and Google Ads conversion exactly once', async ({ page }) => {
    await installInstrumentation(page);

    await page.goto('/');

    // Scroll to the CTA section to ensure it's mounted/visible.
    const submitButton = getSubmitButton(page);
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();

    // Fill the form
    await page.getByTestId('lead-firstname').fill('TestUser');
    await page.getByTestId('lead-email').fill('test@example.com');
    await page.getByTestId('lead-phone').fill('0612345678');

    // Anti-bot guard requires >3s between mount and submit.
    await page.waitForTimeout(3500);

    // Double-click as fast as possible. Playwright's dblclick fires two clicks
    // back-to-back synchronously from the browser's POV.
    await submitButton.dblclick();

    // Wait for the success redirect to /merci
    await page.waitForURL('**/merci', { timeout: 10_000 });

    // Give /merci's useEffect a beat to run (it ALSO calls trackGoogleAdsConversion
    // and must be deduped by the 10s sessionStorage window).
    await page.waitForTimeout(500);

    // Read recorded gtag calls
    const calls = await readGtagCalls(page);

    const formSubmits = calls.filter(
      (c) => c[0] === 'event' && c[1] === 'form_submit'
        && (c[2] as Record<string, unknown>)?.form_name === 'cta_reservation'
    );
    const adsConversionCount = countAdsConversions(calls, `${ADS_ID}/${ADS_LABEL}`);

    console.log(
      `[Test] gtag calls captured: ${calls.length} | ` +
      `form_submit(cta_reservation): ${formSubmits.length} | ` +
      `conversion(${ADS_LABEL}): ${adsConversionCount}`
    );

    expect(formSubmits.length, 'GA4 form_submit must fire exactly once').toBe(1);
    expect(adsConversionCount, 'Google Ads conversion must fire exactly once').toBe(1);
  });
});
