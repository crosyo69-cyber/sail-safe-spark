import { test, expect, type Page } from '@playwright/test';
import { SUBMIT_IDLE_LABEL_RE, SUBMIT_LOADING_LABEL_RE, SUBMIT_LOADING_LABEL } from './utils/submit-button';
import { installFbqMarkerStub } from './utils/fbq-markers';

/**
 * E2E: THREE rapid clicks on the homepage CTA, redirect to /merci, then
 * browser BACK navigation to the homepage. Across the entire flow, the Meta
 * Pixel fallback 'CompleteRegistration' must fire EXACTLY ONCE thanks to:
 *   - the synchronous submitLockRef guard in CTASection
 *   - the shared 10s sessionStorage dedup key '__meta_pixel_lead'
 *
 * Lead is simulated as unavailable (throws) so the fallback path is exercised.
 *
 * Strategy:
 *  1. Stub window.fbq BEFORE any script (Lead throws, others recorded).
 *  2. Mirror calls into sessionStorage so they survive navigation/back.
 *  3. Stub send-contact-email for instant success.
 *  4. Fill form, wait > 3s (anti-bot guard), fire 3 synchronous clicks.
 *  5. Wait for /merci, then go BACK to the homepage (page.goBack()).
 *  6. Assert: 0 successful Lead, exactly 1 CompleteRegistration total.
 */

type FbqCall = unknown[];

async function installInstrumentation(page: Page) {
  // Wrap window.fbq via a setter so EVERY call also bumps
  // <meta id="__fbq-marker-*"> counters used by the shared marker
  // utilities. Installed BEFORE the test-owned stub assignment.
  await installFbqMarkerStub(page);
  await page.addInitScript(() => {
    const STASH_KEY = '__fbqCallsStash';
    const prior = (() => {
      try {
        const raw = sessionStorage.getItem(STASH_KEY);
        return raw ? (JSON.parse(raw) as FbqCall[]) : [];
      } catch { return []; }
    })();
    const calls: FbqCall[] = prior;
    (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls = calls;

    const persist = () => {
      try { sessionStorage.setItem(STASH_KEY, JSON.stringify(calls)); } catch { /* ignore */ }
    };

    const fbqStub = (...args: unknown[]) => {
      const verb = args[0];
      const name = args[1];
      if (verb === 'track' && name === 'Lead') {
        calls.push(['__attempt_failed__', ...args]);
        persist();
        throw new Error('[test] Lead event blocked');
      }
      calls.push(args);
      persist();
    };

    (window as unknown as { fbq: typeof fbqStub }).fbq = fbqStub;
    (window as unknown as { _fbq: typeof fbqStub })._fbq = fbqStub;

    const reinstall = () => {
      const prev = (window as unknown as { fbq: (...a: unknown[]) => void }).fbq;
      if (prev !== fbqStub) {
        (window as unknown as { fbq: typeof fbqStub }).fbq = fbqStub;
      }
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

test.describe('CTA triple-click + back navigation — CompleteRegistration fires once', () => {
  test('3 rapid clicks + /merci + browser back → CompleteRegistration exactly once', async ({ page }) => {
    await installInstrumentation(page);

    await page.goto('/');

    const submitButton = page.getByRole('button', { name: SUBMIT_IDLE_LABEL_RE });
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();

    await page.getByTestId('lead-firstname').fill('TestUser');
    await page.getByTestId('lead-email').fill('test@example.com');
    await page.getByTestId('lead-phone').fill('0612345678');

    // Anti-bot guard requires >3s between mount and submit.
    await page.waitForTimeout(3500);

    // THREE rapid synchronous clicks via dispatchEvent.
    await submitButton.evaluate((el) => {
      const btn = el as HTMLButtonElement;
      const fire = () => btn.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
      );
      fire();
      fire();
      fire();
    });

    await page.waitForURL('**/merci', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();

    // Let Merci.tsx's useEffect run (would re-fire trackMetaLead w/o dedup).
    await page.waitForTimeout(500);

    // BROWSER BACK — go back to the homepage. CTASection remounts; any code
    // path that re-fires trackMetaLead must be blocked by the dedup window.
    await page.goBack();
    await page.waitForURL((url) => !url.pathname.includes('/merci'), { timeout: 10_000 });
    await page.waitForTimeout(1_000);

    const calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );

    const leadAttempts = calls.filter(
      (c) => c[0] === '__attempt_failed__' && c[1] === 'track' && c[2] === 'Lead'
    );
    const leadFires = calls.filter(
      (c) => c[0] === 'track' && c[1] === 'Lead'
    );
    const completeRegFires = calls.filter(
      (c) => c[0] === 'track' && c[1] === 'CompleteRegistration'
    );

    console.log(
      `[Test] After 3 clicks + /merci + back — Lead attempts (failed): ${leadAttempts.length} | ` +
      `Lead fires (success): ${leadFires.length} | ` +
      `CompleteRegistration fires: ${completeRegFires.length}`
    );
    console.log('[Test] All recorded fbq calls:', JSON.stringify(calls, null, 2));

    expect(leadFires.length, 'Lead must never successfully fire when blocked').toBe(0);
    expect(
      completeRegFires.length,
      'CompleteRegistration must fire exactly once across 3 clicks + /merci + back'
    ).toBe(1);

    const dedupSet = await page.evaluate(
      () => localStorage.getItem('conversion_fired_meta_lead') !== null
    );
    expect(dedupSet, 'Persistent dedup key must remain set after the flow').toBe(true);
  });
});
