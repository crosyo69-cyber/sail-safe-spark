import { test, expect, type Page } from '@playwright/test';
import { SUBMIT_IDLE_LABEL_RE, SUBMIT_LOADING_LABEL_RE, SUBMIT_LOADING_LABEL, SUBMIT_BUTTON_TESTID, getSubmitButton } from './utils/submit-button';
import { installFbqMarkerStub } from './utils/fbq-markers';
import {
  installGtagRecorder,
  installFbqRecorder,
  readGtagCalls,
  readFbqCalls,
  countAdsConversions,
  countMetaEvent,
} from './utils/conversion-readers';

/**
 * E2E combiné Google Ads + Meta Pixel — session-flag dedup.
 *
 * Vérifie que sur l'enchaînement :
 *   1. Soumission du formulaire CTA homepage
 *   2. Redirection /merci (qui re-déclenche les deux trackers)
 *   3. Reload /merci
 *   4. Retour arrière vers "/"
 *   5. Reload "/"
 *
 * Les DEUX événements suivants se déclenchent EXACTEMENT UNE FOIS par session :
 *   - Google Ads conversion `AW-974052357/s2n0CL3puI4cEIW4u9AD`
 *   - Meta Pixel `CompleteRegistration` (fallback de Lead, forcé en échec ici)
 *
 * Et que les drapeaux sessionStorage suivants sont posés :
 *   - `conversion_fired_AW-974052357/s2n0CL3puI4cEIW4u9AD`
 *   - `conversion_fired_meta_lead`
 */

const ADS_LABEL = 's2n0CL3puI4cEIW4u9AD';
const ADS_ID = 'AW-974052357';
const CONV_ID = `${ADS_ID}/${ADS_LABEL}`;

async function installInstrumentation(page: Page) {
  // Meta Pixel DOM marker stub (used by helpers that read <meta id="__fbq-marker-*">).
  await installFbqMarkerStub(page);
  // Canonical recorders — defineProperty-based, sessionStorage-persisted,
  // never read dataLayer. See e2e/utils/conversion-readers.ts.
  await installGtagRecorder(page);
  await installFbqRecorder(page, { failLead: true });

  // Stub the Supabase edge function so the form succeeds instantly with no email.
  await page.route('**/functions/v1/send-contact-email', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

async function readCounts(page: Page): Promise<{ ads: number; cr: number }> {
  // Single source of truth — `__gtagCalls` / `__fbqCalls` only. Never dataLayer.
  const [gtag, fbq] = await Promise.all([readGtagCalls(page), readFbqCalls(page)]);
  return {
    ads: countAdsConversions(gtag, CONV_ID),
    cr: countMetaEvent(fbq, 'CompleteRegistration'),
  };
}

test.describe('Combined Google Ads + Meta Pixel — per-session dedup', () => {
  test('both events fire exactly once across submit + /merci + reload + back + home reload', async ({ page }) => {
    await installInstrumentation(page);

    // ---- 1) Submit the form ----
    await page.goto('/');

    const submitButton = getSubmitButton(page);
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();

    await page.getByTestId('lead-firstname').fill('TestUser');
    await page.getByTestId('lead-email').fill('combined-dedup@example.com');
    await page.getByTestId('lead-phone').fill('0612345678');

    // Anti-bot timestamp guard
    await page.waitForTimeout(3500);
    await submitButton.click();

    // ---- 2) /merci re-fires both trackers via useEffect ----
    await page.waitForURL('**/merci', { timeout: 10_000 });
    // Wait for BOTH trackers to have fired before reading. The persistent
    // dedup mirrors are armed synchronously inside trackGoogleAdsConversion
    // and trackMetaLead, so polling them is the deterministic signal that
    // both /merci useEffect tracker calls have completed. Replaces the
    // previous 500ms fixed sleep that was the source of CI flake.
    await expect
      .poll(
        () =>
          page.evaluate(
            (id) => ({
              ads: localStorage.getItem(`conversion_fired_${id}`) !== null,
              meta: localStorage.getItem('conversion_fired_meta_lead') !== null,
            }),
            CONV_ID
          ),
        { timeout: 10_000, intervals: [50, 100, 200] }
      )
      .toEqual({ ads: true, meta: true });

    let counts = await readCounts(page);
    expect(counts.ads, 'after submit + /merci, Google Ads fires once').toBe(1);
    expect(counts.cr, 'after submit + /merci, CompleteRegistration fires once').toBe(1);

    // Both session flags must be set
    const flags = await page.evaluate((id) => ({
      ads: localStorage.getItem(`conversion_fired_${id}`),
      meta: localStorage.getItem('conversion_fired_meta_lead'),
    }), CONV_ID);
    expect(flags.ads, 'Google Ads persistent flag must be present').not.toBeNull();
    expect(flags.meta, 'Meta Pixel persistent flag must be present').not.toBeNull();

    // ---- 3) Reload /merci ----
    await page.reload();
    await page.waitForTimeout(500);

    counts = await readCounts(page);
    expect(counts.ads, 'after /merci reload, Google Ads still 1').toBe(1);
    expect(counts.cr, 'after /merci reload, CompleteRegistration still 1').toBe(1);

    // ---- 4) Browser back to "/" ----
    await page.goBack();
    await page.waitForTimeout(500);

    counts = await readCounts(page);
    expect(counts.ads, 'after back to /, Google Ads still 1').toBe(1);
    expect(counts.cr, 'after back to /, CompleteRegistration still 1').toBe(1);

    // ---- 5) Reload home ----
    await page.reload();
    await page.waitForTimeout(500);

    counts = await readCounts(page);

    console.log(
      `[Test] Final counts → Google Ads conversion: ${counts.ads} | Meta CompleteRegistration: ${counts.cr}`
    );

    expect(
      counts.ads,
      'Google Ads conversion must fire EXACTLY ONCE across submit + /merci + reload + back + home reload'
    ).toBe(1);
    expect(
      counts.cr,
      'Meta Pixel CompleteRegistration must fire EXACTLY ONCE across submit + /merci + reload + back + home reload'
    ).toBe(1);
  });
});
