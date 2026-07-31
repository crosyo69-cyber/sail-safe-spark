import { type Page } from '@playwright/test';
// Import depuis retry-filter (et non @playwright/test) : ce wrapper installe le
// hook global qui nettoie les flags de dédup ET sème le consentement marketing.
// Sans lui, la conversion Ads/Meta reste différée par le gate de consentement
// et les mirrors `conversion_fired_*` ne sont jamais armés.
import { test, expect } from './utils/retry-filter';
import { SUBMIT_IDLE_LABEL_RE, SUBMIT_LOADING_LABEL_RE, SUBMIT_LOADING_LABEL, SUBMIT_BUTTON_TESTID, getSubmitButton } from './utils/submit-button';
import { installFbqMarkerStub } from './utils/fbq-markers';
import {
  installGtagRecorder,
  installFbqRecorder,
  readGtagCalls,
  readFbqCalls,
  countAdsConversions,
  countMetaEvent,
  waitForLocalStorageKeys,
  expectCountStable,
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
    // Deterministic signal that BOTH trackers have completed: their persistent
    // dedup mirrors are armed synchronously inside trackGoogleAdsConversion
    // and trackMetaLead. Polling these keys replaces every fixed sleep.
    await waitForLocalStorageKeys(page, [
      `conversion_fired_${CONV_ID}`,
      'conversion_fired_meta_lead',
    ]);

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

    // ---- 3) Reload /merci — assert counts STAY at 1 over a stability window ----
    await page.reload();
    await expectCountStable(() => readCounts(page), { ads: 1, cr: 1 }, {
      message: 'after /merci reload, Ads & CompleteRegistration must stay at 1',
    });

    // ---- 4) Browser back to "/" — counts must still stay at 1 ----
    await page.goBack();
    await expectCountStable(() => readCounts(page), { ads: 1, cr: 1 }, {
      message: 'after back to /, Ads & CompleteRegistration must stay at 1',
    });

    // ---- 5) Reload home — final stability check ----
    await page.reload();
    await expectCountStable(() => readCounts(page), { ads: 1, cr: 1 }, {
      message: 'after home reload, Ads & CompleteRegistration must stay at 1',
    });

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
