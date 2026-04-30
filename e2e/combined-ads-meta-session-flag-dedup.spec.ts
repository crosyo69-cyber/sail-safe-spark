import { test, expect, type Page } from '@playwright/test';
import { installFbqMarkerStub } from './utils/fbq-markers';

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

type GtagCall = [string, string, Record<string, unknown>?];
type FbqCall = unknown[];

async function installInstrumentation(page: Page) {
  // -------- Meta Pixel marker stub (DOM markers used by helpers) --------
  await installFbqMarkerStub(page);

  // -------- Combined gtag + fbq recording stubs (cross-reload via sessionStorage) --------
  await page.addInitScript(() => {
    // ----- gtag recorder -----
    const GTAG_STASH = '__gtagCallsStash';
    const gtagPrior = (() => {
      try {
        const raw = sessionStorage.getItem(GTAG_STASH);
        return raw ? (JSON.parse(raw) as GtagCall[]) : [];
      } catch { return []; }
    })();
    const gtagCalls: GtagCall[] = gtagPrior;
    (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls = gtagCalls;
    (window as unknown as { dataLayer: unknown[] }).dataLayer = [];

    const persistGtag = () => {
      try { sessionStorage.setItem(GTAG_STASH, JSON.stringify(gtagCalls)); } catch { /* ignore */ }
    };

    const gtagRecorder = (...args: unknown[]) => {
      gtagCalls.push(args as GtagCall);
      persistGtag();
    };
    (window as unknown as { gtag: typeof gtagRecorder }).gtag = gtagRecorder;

    // Re-wrap to win the race against analytics.ts initGA4()
    const reinstallGtag = () => {
      const original = (window as unknown as { gtag: (...a: unknown[]) => void }).gtag;
      if (original === gtagRecorder) return;
      (window as unknown as { gtag: typeof gtagRecorder }).gtag = (...args: unknown[]) => {
        gtagCalls.push(args as GtagCall);
        persistGtag();
        try { original?.(...args); } catch { /* ignore */ }
      };
    };

    // ----- fbq recorder (Lead forced to throw → fallback CompleteRegistration) -----
    const FBQ_STASH = '__fbqCallsStash';
    const fbqPrior = (() => {
      try {
        const raw = sessionStorage.getItem(FBQ_STASH);
        return raw ? (JSON.parse(raw) as FbqCall[]) : [];
      } catch { return []; }
    })();
    const fbqCalls: FbqCall[] = fbqPrior;
    (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls = fbqCalls;

    const persistFbq = () => {
      try { sessionStorage.setItem(FBQ_STASH, JSON.stringify(fbqCalls)); } catch { /* ignore */ }
    };

    const fbqStub = (...args: unknown[]) => {
      const verb = args[0];
      const name = args[1];
      if (verb === 'track' && name === 'Lead') {
        fbqCalls.push(['__attempt_failed__', ...args]);
        persistFbq();
        throw new Error('[test] Lead event blocked');
      }
      fbqCalls.push(args);
      persistFbq();
    };
    (window as unknown as { fbq: typeof fbqStub }).fbq = fbqStub;
    (window as unknown as { _fbq: typeof fbqStub })._fbq = fbqStub;

    const reinstallFbq = () => {
      const prev = (window as unknown as { fbq: (...a: unknown[]) => void }).fbq;
      if (prev !== fbqStub) {
        (window as unknown as { fbq: typeof fbqStub }).fbq = fbqStub;
      }
    };

    [0, 100, 500, 1500].forEach((delay) => {
      setTimeout(reinstallGtag, delay);
      setTimeout(reinstallFbq, delay);
    });
  });

  // Stub the Supabase edge function so the form succeeds instantly with no email.
  await page.route('**/functions/v1/send-contact-email', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

function countAdsConversions(calls: GtagCall[]): number {
  return calls.filter(
    (c) => c[0] === 'event' && c[1] === 'conversion'
      && typeof (c[2] as Record<string, unknown>)?.send_to === 'string'
      && ((c[2] as Record<string, unknown>).send_to as string) === CONV_ID
  ).length;
}

function countCompleteRegistration(calls: FbqCall[]): number {
  return calls.filter((c) => c[0] === 'track' && c[1] === 'CompleteRegistration').length;
}

async function readCounts(page: Page): Promise<{ ads: number; cr: number }> {
  const [gtag, fbq] = await Promise.all([
    page.evaluate(() => (window as unknown as { __gtagCalls: GtagCall[] }).__gtagCalls),
    page.evaluate(() => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls),
  ]);
  return {
    ads: countAdsConversions(gtag),
    cr: countCompleteRegistration(fbq),
  };
}

test.describe('Combined Google Ads + Meta Pixel — per-session dedup', () => {
  test('both events fire exactly once across submit + /merci + reload + back + home reload', async ({ page }) => {
    await installInstrumentation(page);

    // ---- 1) Submit the form ----
    await page.goto('/');

    const submitButton = page.getByRole('button', { name: /envoyer ma demande/i });
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();

    await page.getByPlaceholder('Votre prénom').fill('TestUser');
    await page.getByPlaceholder('Votre email').fill('combined-dedup@example.com');
    await page.getByPlaceholder('Votre téléphone').fill('0612345678');

    // Anti-bot timestamp guard
    await page.waitForTimeout(3500);
    await submitButton.click();

    // ---- 2) /merci re-fires both trackers via useEffect ----
    await page.waitForURL('**/merci', { timeout: 10_000 });
    await page.waitForTimeout(500);

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