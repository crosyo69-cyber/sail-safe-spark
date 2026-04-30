import { test, expect, type Page } from '@playwright/test';
import { SUBMIT_IDLE_LABEL_RE, SUBMIT_LOADING_LABEL_RE, SUBMIT_LOADING_LABEL } from './utils/submit-button';
import { installFbqMarkerStub } from './utils/fbq-markers';

/**
 * E2E: THREE rapid clicks on the homepage CTA → /merci → DOUBLE goBack() →
 * RELOAD homepage. Across the entire flow, the Meta Pixel fallback
 * 'CompleteRegistration' must fire EXACTLY ONCE.
 *
 * Lead is simulated as unavailable (throws) so the fallback path is exercised.
 * Dedup is enforced by the shared 10s persistent key '__meta_pixel_lead'.
 *
 * The double goBack() exercises an additional history transition where the
 * second back may be a no-op (no prior entry) but must not destabilize dedup.
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

test.describe('CTA triple-click + /merci + double back + home reload — CompleteRegistration once', () => {
  test('3 clicks + /merci + 2x goBack + home reload → CompleteRegistration exactly once', async ({ page }) => {
    await installInstrumentation(page);

    // Seed a prior history entry so the second goBack() has somewhere to go.
    await page.goto('/contact-reservation-kitesurf-hyeres');
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
    await page.waitForTimeout(500);

    // FIRST goBack — back to homepage.
    await page.goBack();
    await page.waitForURL((url) => !url.pathname.includes('/merci'), { timeout: 10_000 });
    await page.waitForTimeout(300);

    // SECOND goBack — back to the seeded /contact page.
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(300);

    // Navigate forward to the homepage explicitly, then RELOAD it.
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
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
      `[Test] After 3 clicks + /merci + 2x back + home reload — Lead attempts (failed): ${leadAttempts.length} | ` +
      `Lead fires (success): ${leadFires.length} | ` +
      `CompleteRegistration fires: ${completeRegFires.length}`
    );
    console.log('[Test] All recorded fbq calls:', JSON.stringify(calls, null, 2));

    expect(leadFires.length, 'Lead must never successfully fire when blocked').toBe(0);
    expect(
      completeRegFires.length,
      'CompleteRegistration must fire exactly once across 3 clicks + /merci + 2x back + home reload'
    ).toBe(1);

    const dedupSet = await page.evaluate(
      () => localStorage.getItem('conversion_fired_meta_lead') !== null
    );
    expect(dedupSet, 'Persistent dedup key must remain set after the flow').toBe(true);
  });
});
