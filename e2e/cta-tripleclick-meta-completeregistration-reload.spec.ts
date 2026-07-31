import { type Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { SUBMIT_IDLE_LABEL_RE, SUBMIT_LOADING_LABEL_RE, SUBMIT_LOADING_LABEL, SUBMIT_BUTTON_TESTID, getSubmitButton } from './utils/submit-button';
import { installFbqMarkerStub } from './utils/fbq-markers';

/**
 * E2E: THREE rapid clicks on the homepage CTA "Envoyer ma demande" with Meta
 * Pixel 'Lead' simulated as unavailable (throws). We verify that across the
 * whole flow (triple-click submit → redirect to /merci → reload /merci), the
 * Meta Pixel fallback 'CompleteRegistration' fires EXACTLY ONCE thanks to:
 *   - the synchronous submitLockRef guard in CTASection (blocks 2nd/3rd submit)
 *   - the shared 10s sessionStorage dedup key '__meta_pixel_lead'
 *
 * Strategy:
 *  1. Stub window.fbq BEFORE any script:
 *     - 'track Lead' throws (simulates unavailability in trackMetaLead)
 *     - everything else (incl. 'track CompleteRegistration') is recorded.
 *  2. Mirror calls into sessionStorage so they survive the reload.
 *  3. Stub the send-contact-email edge function for instant success.
 *  4. Fill the form, wait > 3s (anti-bot timestamp guard), then fire THREE
 *     rapid clicks dispatched as quickly as possible from the browser side.
 *  5. Wait for /merci, then reload it.
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

test.describe('CTA triple-click — Meta Pixel CompleteRegistration fires once after reload', () => {
  test('3 rapid clicks + /merci + reload → CompleteRegistration exactly once', async ({ page }) => {
    await installInstrumentation(page);

    await page.goto('/');

    const submitButton = getSubmitButton(page);
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();

    await page.getByTestId('lead-firstname').fill('TestUser');
    await page.getByTestId('lead-email').fill('test@example.com');
    await page.getByTestId('lead-phone').fill('0612345678');

    // Anti-bot guard requires >3s between mount and submit.
    await page.waitForTimeout(3500);

    // THREE rapid clicks dispatched synchronously from the browser. We use
    // dispatchEvent inside the page so the three click events are queued
    // back-to-back without any await between them — the worst case for the
    // submitLockRef guard and the dedup window.
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

    // RELOAD /merci — useEffect runs again; dedup must block any new fire.
    await page.reload();
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
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
      `[Test] After 3 clicks + /merci + reload — Lead attempts (failed): ${leadAttempts.length} | ` +
      `Lead fires (success): ${leadFires.length} | ` +
      `CompleteRegistration fires: ${completeRegFires.length}`
    );
    console.log('[Test] All recorded fbq calls:', JSON.stringify(calls, null, 2));

    expect(leadFires.length, 'Lead must never successfully fire when blocked').toBe(0);
    expect(
      completeRegFires.length,
      'CompleteRegistration must fire exactly once across 3 clicks + /merci + reload'
    ).toBe(1);

    const dedupSet = await page.evaluate(
      () => localStorage.getItem('conversion_fired_meta_lead') !== null
    );
    expect(dedupSet, 'Persistent dedup key must remain set after the flow').toBe(true);
  });
});
