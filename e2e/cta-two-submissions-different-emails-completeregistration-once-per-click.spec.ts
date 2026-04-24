import { test, expect, type Page } from '@playwright/test';

/**
 * E2E: two distinct CTA submissions (different emails) within the same page
 * session (no full reload). Each click must trigger 'CompleteRegistration'
 * EXACTLY ONCE — never twice for a single click.
 *
 * Flow:
 *   1. Fill form with email A → submit → land on /merci → assert 1 fire.
 *   2. goBack to homepage (SPA, no reload).
 *   3. Wait >10s so the dedup window expires (otherwise the 2nd click is
 *      legitimately skipped and we cannot assert "1 fire per click").
 *   4. Fill form with email B → submit → land on /merci → assert 2 fires total.
 *
 * Lead is forced to fail so the fallback path ('CompleteRegistration') is the
 * one being measured.
 */

type FbqCall = unknown[];

async function installInstrumentation(page: Page) {
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

async function fillAndSubmit(page: Page, email: string) {
  const submitButton = page.getByRole('button', { name: /envoyer ma demande/i });
  await submitButton.scrollIntoViewIfNeeded();
  await expect(submitButton).toBeVisible();

  await page.getByPlaceholder('Votre prénom').fill('TestUser');
  await page.getByPlaceholder('Votre email').fill(email);
  await page.getByPlaceholder('Votre téléphone').fill('0612345678');

  // Anti-bot: form must be older than 3s before submit.
  await page.waitForTimeout(3500);
  await submitButton.click();

  await page.waitForURL('**/merci', { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
}

test.describe('Two CTA submissions, different emails — CompleteRegistration once per click', () => {
  test('submit A → goBack → wait dedup window → submit B → 2 total CompleteRegistration fires', async ({ page }) => {
    await installInstrumentation(page);

    await page.goto('/');

    // ----- Submission #1 (email A) -----
    await fillAndSubmit(page, 'alice@example.com');
    await page.waitForTimeout(1_000); // let Merci's useEffect run

    let calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    let completeRegFires = calls.filter(
      (c) => c[0] === 'track' && c[1] === 'CompleteRegistration'
    );
    console.log(`[Test] After submit #1 — CompleteRegistration fires: ${completeRegFires.length}`);
    expect(
      completeRegFires.length,
      'After 1st click, CompleteRegistration must fire exactly once'
    ).toBe(1);

    // ----- Navigate back to homepage WITHOUT reload (SPA) -----
    await page.goBack();
    await page.waitForURL('**/', { timeout: 5_000 });

    // Wait long enough for the 10s dedup window to expire so the 2nd click
    // is allowed to fire its own CompleteRegistration.
    await page.waitForTimeout(11_000);

    // ----- Submission #2 (email B) -----
    await fillAndSubmit(page, 'bob@example.com');
    await page.waitForTimeout(1_000);

    calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    const leadFires = calls.filter(
      (c) => c[0] === 'track' && c[1] === 'Lead'
    );
    completeRegFires = calls.filter(
      (c) => c[0] === 'track' && c[1] === 'CompleteRegistration'
    );

    console.log(
      `[Test] After submit #2 — Lead: ${leadFires.length} | ` +
      `CompleteRegistration: ${completeRegFires.length}`
    );
    console.log('[Test] All recorded fbq calls:', JSON.stringify(calls, null, 2));

    expect(leadFires.length, 'Lead must never successfully fire when blocked').toBe(0);
    expect(
      completeRegFires.length,
      'Each click must produce exactly 1 CompleteRegistration → 2 total for 2 clicks'
    ).toBe(2);
  });
});