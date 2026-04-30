import { test, expect, type Page } from '@playwright/test';
import { installFbqMarkerStub } from './utils/fbq-markers';

/**
 * E2E: two distinct CTA submissions (different emails) within the same browser
 * session. Per the strict per-session rule for Meta Pixel, ONLY THE FIRST
 * submission must fire CompleteRegistration. The second submission, even with
 * a different email and even after the 10s sliding window has expired, MUST
 * be blocked by the permanent localStorage flag `conversion_fired_meta_lead`.
 *
 * Flow:
 *   1. Fill form with email A → submit → land on /merci → assert 1 fire.
 *   2. goBack to homepage (SPA, no reload).
 *   3. Wait >10s so the 10s window has clearly expired (proves the permanent
 *      flag — not the sliding window — is what blocks the 2nd fire).
 *   4. Fill form with email B → submit → land on /merci → assert STILL 1 fire.
 *   5. Assert the persistent localStorage flag is set throughout.
 *
 * Lead is forced to fail so the fallback path ('CompleteRegistration') is the
 * one being measured.
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

  await page.getByTestId('lead-firstname').fill('TestUser');
  await page.getByTestId('lead-email').fill(email);
  await page.getByTestId('lead-phone').fill('0612345678');

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

  // 1) Two acceptable outcomes after the click:
  //    a) The "Envoi en cours..." loading state becomes visible (slower nav).
  //    b) The page already navigated to /merci before React could paint
  //       the loading state (faster-than-paint nav, fully legitimate).
  //    We race both and accept whichever happens first. We do NOT then
  //    re-check page.url() synchronously — that read is stale relative to
  //    the commit and was the source of the previous flake.
  const navigated = page
    .waitForURL('**/merci', { timeout: 5_000, waitUntil: 'commit' })
    .then(() => 'navigated' as const)
    .catch(() => null);
  const loaded = expect(loadingButton)
    .toBeVisible({ timeout: 5_000 })
    .then(() => 'loaded' as const)
    .catch(() => null);
  const winner = await Promise.race([navigated, loaded]);
  if (winner === 'loaded') {
    // We caught the loading state — also assert the original label is gone.
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

  // Exact-text assertions on the /merci page: heading + subtext blocks must
  // match the production copy verbatim after every submission.
  await expect(
    page.getByRole('heading', { level: 1, name: 'Merci pour votre demande !' })
  ).toHaveText('Merci pour votre demande !');

  await expect(
    page.getByText(/Nous vous contactons sous .* pour confirmer votre réservation\./)
  ).toContainText('Nous vous contactons sous 24h pour confirmer votre réservation.');

  await expect(
    page.getByText("À très vite sur l'eau ! 🪁", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText('Besoin d\'une réponse rapide ?', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByRole('main').getByRole('link', { name: /06 72 71 69 05/ })
  ).toHaveAttribute('href', 'tel:0672716905');
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

test.describe('Two CTA submissions, different emails — CompleteRegistration once per session', () => {
  test('submit A → goBack → wait >10s → submit B → still only 1 CompleteRegistration (permanent session flag)', async ({ page }) => {
    await installInstrumentation(page);

    await page.goto('/');

    // ----- Submission #1 (email A) -----
    await fillAndSubmit(page, 'alice@example.com');
    // Wait for the fbq call instead of a fixed 1s sleep.
    await waitForCompleteRegistrationCount(page, 1);
    console.log('[Test] After submit #1 — CompleteRegistration fires: 1');

    // The permanent per-session flag must be armed after the first fire.
    const flagAfterFirst = await page.evaluate(
      () => localStorage.getItem('conversion_fired_meta_lead')
    );
    expect(
      flagAfterFirst,
      'Persistent flag conversion_fired_meta_lead must be set after first fire'
    ).not.toBeNull();

    // ----- Navigate back to homepage WITHOUT reload (SPA) -----
    await page.goBack();
    await page.waitForURL('**/', { timeout: 5_000 });
    // Wait for the CTA form to be interactive again on home — replaces a sleep.
    await waitForFormReady(page);

    // Poll until the 10s sliding window has clearly expired. We deliberately
    // wait beyond 10s to PROVE the second fire is blocked by the permanent
    // session flag (not by the sliding window).
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

    // ----- Submission #2 (email B) — MUST NOT fire CompleteRegistration -----
    await fillAndSubmit(page, 'bob@example.com');

    // Give the app some time to (incorrectly) fire — if dedup works, no new
    // CompleteRegistration call will appear in __fbqCalls.
    await page.waitForTimeout(1_000);

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
      'Strict per-session rule: only the FIRST submit fires; the 2nd is blocked by the permanent flag'
    ).toBe(1);

    // Flag must still be present after the second (blocked) attempt.
    const flagAfterSecond = await page.evaluate(
      () => localStorage.getItem('conversion_fired_meta_lead')
    );
    expect(
      flagAfterSecond,
      'Persistent flag must remain set after 2nd (blocked) submission'
    ).not.toBeNull();
  });
});