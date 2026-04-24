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

/**
 * Snapshot the CTA form mount time so we can poll the anti-bot 3s window
 * instead of relying on a fixed sleep. We mark mount time on first visibility
 * of the submit button after navigation.
 */
async function waitForFormReady(page: Page) {
  const submitButton = page.getByRole('button', { name: /envoyer ma demande/i });
  await submitButton.scrollIntoViewIfNeeded();
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();
  // Stamp mount time the first moment the form is interactive.
  await page.evaluate(() => {
    (window as unknown as { __ctaFormMountedAt?: number }).__ctaFormMountedAt = Date.now();
  });
  return submitButton;
}

async function fillAndSubmit(page: Page, email: string) {
  const submitButton = await waitForFormReady(page);

  await page.getByPlaceholder('Votre prénom').fill('TestUser');
  await page.getByPlaceholder('Votre email').fill(email);
  await page.getByPlaceholder('Votre téléphone').fill('0612345678');

  // Poll the anti-bot 3s window instead of a fixed sleep — exits as soon as
  // 3.05s have elapsed since the form was deemed interactive.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const t = (window as unknown as { __ctaFormMountedAt?: number }).__ctaFormMountedAt;
          return typeof t === 'number' ? Date.now() - t : 0;
        }),
      { timeout: 6_000, intervals: [100, 200, 250] }
    )
    .toBeGreaterThanOrEqual(3050);

  // Locator for the loading-state button: text becomes exactly "Envoi en cours..."
  // and the lucide <Send /> icon is removed from the DOM.
  const loadingButton = page.getByRole('button', { name: /envoi en cours\.\.\./i });

  await submitButton.click();

  // 1) Button immediately enters disabled+loading state — assert real DOM
  //    transitions instead of sleeping. Race with URL change in case the
  //    network is so fast that React commits the navigation before we
  //    observe the loading text.
  await Promise.race([
    expect(loadingButton).toBeVisible({ timeout: 3_000 }),
    page.waitForURL('**/merci', { timeout: 3_000, waitUntil: 'commit' }),
  ]);

  // If we caught the loading state, also confirm it's disabled and the
  // original "Envoyer ma demande" label has disappeared.
  if (page.url().endsWith('/') || !page.url().includes('/merci')) {
    await expect(loadingButton).toBeDisabled();
    await expect(
      page.getByRole('button', { name: /^envoyer ma demande$/i })
    ).toHaveCount(0);
  }

  // 2) Navigation to /merci is the definitive success signal.
  await page.waitForURL('**/merci', { timeout: 10_000, waitUntil: 'commit' });

  // 3) On /merci, the loading button must be gone (loader has disappeared)
  //    and the success heading must be rendered.
  await expect(loadingButton).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
}

/** Wait until the recorded CompleteRegistration fires reach `expected`. */
async function waitForCompleteRegistrationCount(page: Page, expected: number) {
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const calls = (window as unknown as { __fbqCalls?: FbqCall[] }).__fbqCalls ?? [];
          return calls.filter((c) => c[0] === 'track' && c[1] === 'CompleteRegistration').length;
        }),
      { timeout: 5_000, intervals: [50, 100, 200] }
    )
    .toBe(expected);
}

test.describe('Two CTA submissions, different emails — CompleteRegistration once per click', () => {
  test('submit A → goBack → wait dedup window → submit B → 2 total CompleteRegistration fires', async ({ page }) => {
    await installInstrumentation(page);

    await page.goto('/');

    // ----- Submission #1 (email A) -----
    await fillAndSubmit(page, 'alice@example.com');
    // Wait for the fbq call instead of a fixed 1s sleep.
    await waitForCompleteRegistrationCount(page, 1);
    console.log('[Test] After submit #1 — CompleteRegistration fires: 1');

    // ----- Navigate back to homepage WITHOUT reload (SPA) -----
    await page.goBack();
    await page.waitForURL('**/', { timeout: 5_000 });
    // Wait for the CTA form to be interactive again on home — replaces a sleep.
    await waitForFormReady(page);

    // Poll the dedup sessionStorage key until the 10s window has expired,
    // instead of sleeping 11s blindly.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const last = Number(sessionStorage.getItem('__meta_pixel_lead') || '0');
            return last > 0 ? Date.now() - last : Number.POSITIVE_INFINITY;
          }),
        { timeout: 15_000, intervals: [250, 500, 500] }
      )
      .toBeGreaterThan(10_000);

    // ----- Submission #2 (email B) -----
    await fillAndSubmit(page, 'bob@example.com');
    await waitForCompleteRegistrationCount(page, 2);

    const calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    const leadFires = calls.filter(
      (c) => c[0] === 'track' && c[1] === 'Lead'
    );
    const completeRegFires = calls.filter(
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