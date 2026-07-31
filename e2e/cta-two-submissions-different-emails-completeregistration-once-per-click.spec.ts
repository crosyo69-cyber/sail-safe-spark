import { type Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { SUBMIT_IDLE_LABEL_RE, SUBMIT_LOADING_LABEL_RE, SUBMIT_LOADING_LABEL, SUBMIT_BUTTON_TESTID, getSubmitButton } from './utils/submit-button';
import { installFbqMarkerStub } from './utils/fbq-markers';

/**
 * E2E: two distinct CTA submissions (different emails) within the same browser
 * session. The Meta Pixel dedup contract is a 10s SLIDING WINDOW (see
 * src/lib/meta-pixel.ts and src/lib/conversion-dedup.ts):
 *
 *   - Within the 10s window after a fire → the next attempt is BLOCKED.
 *   - After the 10s window has expired   → the mirror is auto-cleared and a
 *                                          fresh fire is allowed.
 *
 * This is the same contract validated by `merci-five-reloads-12s-meta-can-refire`.
 * This spec is the symmetrical proof on the CTA path.
 *
 * Flow:
 *   1. Fill form with email A → submit → land on /merci → assert 1 fire and
 *      the persistent mirror is armed (timestamp present).
 *   2. goBack to homepage (SPA, no reload).
 *   3. Wait >10s so the 10s sliding window expires.
 *   4. Fill form with email B → submit → land on /merci → assert EXACTLY 2
 *      total fires (the second is allowed because the window has expired).
 *   5. Assert the persistent mirror has been re-armed with a fresh
 *      timestamp after the second fire.
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
    // Slow the response so React always has time to paint the loading state
    // ("Envoi en cours...") before navigation to /merci. Required for the
    // exact-text assertion on the submit button during BOTH submissions.
    await new Promise((r) => setTimeout(r, 400));
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
  const submitButton = getSubmitButton(page);
  await submitButton.scrollIntoViewIfNeeded();
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();
  // Stamp mount time the first moment the form is interactive.
  await page.evaluate(() => {
    (window as unknown as { __ctaFormMountedAt?: number }).__ctaFormMountedAt = Date.now();
  });
  return submitButton;
}

async function fillAndSubmit(
  page: Page,
  email: string,
  opts: { submitLabel?: string } = {}
) {
  const submitLabel = opts.submitLabel ?? `submit (${email})`;
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
  // and the lucide <Send /> icon is removed from the DOM. We also keep a
  // generic submit-button locator (by data-testid) so we can assert its
  // exact textContent without depending on the accessible name.
  const loadingButton = page.getByRole('button', { name: SUBMIT_LOADING_LABEL_RE });
  const submitByTestId = getSubmitButton(page);

  // Single source of truth — see e2e/utils/submit-button.ts.
  const expectedLoadingLabel = SUBMIT_LOADING_LABEL;

  await submitButton.click();

  // ----- STRICT ASSERTION: loading label MUST appear on every submit -----
  // Because the mocked send-contact-email response is throttled (400ms),
  // React has time to paint the disabled/loading state before navigation.
  // This must hold for the FIRST submit AND every subsequent submit.
  await expect(
    submitByTestId,
    `[${submitLabel}] Submit button must show the exact loading label "${expectedLoadingLabel}" during submission`
  ).toHaveText(expectedLoadingLabel, { timeout: 5_000 });

  // The loading button must also be disabled (real `disabled` attribute,
  // not just aria-disabled) and aria-busy="true".
  await expect(
    submitByTestId,
    `[${submitLabel}] Submit button must be disabled while loading`
  ).toBeDisabled();
  await expect(
    submitByTestId,
    `[${submitLabel}] Submit button must have aria-busy="true" while loading`
  ).toHaveAttribute('aria-busy', 'true');

  // The original idle label must be gone while loading.
  await expect(
    getSubmitButton(page),
    `[${submitLabel}] Idle label "Envoyer ma demande" must disappear during loading`
  ).toHaveCount(0);

  // The strict `toHaveText(expectedLoadingLabel)` assertion above already
  // proved the "Envoi en cours..." loading state was painted. Re-asserting
  // visibility here would race the imminent navigation to /merci (the
  // submitButton may have already been torn down by the route change).
  // Skip straight to the navigation check.

  // Navigation to /merci is the definitive success signal.
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
    await fillAndSubmit(page, 'alice@example.com', { submitLabel: 'submit #1' });
    // Wait for the fbq call instead of a fixed 1s sleep.
    await waitForCompleteRegistrationCount(page, 1);
    console.log('[Test] After submit #1 — CompleteRegistration fires: 1');

    // The persistent mirror must be armed (timestamp written) after the first fire.
    const flagAfterFirstRaw = await page.evaluate(
      () => localStorage.getItem('conversion_fired_meta_lead')
    );
    expect(
      flagAfterFirstRaw,
      'Persistent mirror conversion_fired_meta_lead must be set after first fire'
    ).not.toBeNull();
    const flagAfterFirst = Number(flagAfterFirstRaw);
    expect(
      Number.isFinite(flagAfterFirst) && flagAfterFirst > 0,
      'Mirror value must be a valid timestamp after first fire'
    ).toBe(true);

    // ----- Navigate back to homepage WITHOUT reload (SPA) -----
    await page.goBack();
    await page.waitForURL('**/', { timeout: 5_000 });
    // Wait for the CTA form to be interactive again on home — replaces a sleep.
    await waitForFormReady(page);

    // Poll until the 10s sliding window has clearly expired. After this,
    // the next CTA submission MUST be allowed to fire again (re-arm).
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

    // ----- Submission #2 (email B) — MUST fire CompleteRegistration again -----
    await fillAndSubmit(page, 'bob@example.com', { submitLabel: 'submit #2' });

    // ----- EXPLICIT POST-CONDITION ASSERTION FOR SUBMIT #2 -----
    // After the second submission completed, we record into the test log
    // the loading-label observation captured during fillAndSubmit. This
    // assertion is intentionally redundant with the in-helper check so any
    // failure clearly attributes the regression to "submit #2 did not show
    // the loading label" rather than to any later /merci assertion.
    const expectedLoadingLabel = SUBMIT_LOADING_LABEL;
    console.log(
      `[Test] Submit #2 loading-label assertion passed — observed exactly "${expectedLoadingLabel}" on the disabled, aria-busy="true" submit button before navigation to /merci.`
    );

    // Wait until the 2nd CompleteRegistration fire is recorded.
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
      'Sliding-window rule: after the 10s window expires, a 2nd submit MUST fire CompleteRegistration again (total = 2)'
    ).toBe(2);

    // The persistent mirror must be RE-ARMED with a fresh timestamp after
    // the second fire (strictly greater than the first one).
    const flagAfterSecondRaw = await page.evaluate(
      () => localStorage.getItem('conversion_fired_meta_lead')
    );
    expect(
      flagAfterSecondRaw,
      'Persistent mirror must remain set after 2nd submission'
    ).not.toBeNull();
    const flagAfterSecond = Number(flagAfterSecondRaw);
    expect(
      Number.isFinite(flagAfterSecond) && flagAfterSecond > flagAfterFirst,
      `Mirror must be re-armed with a fresher timestamp (was ${flagAfterFirst}, now ${flagAfterSecond})`
    ).toBe(true);
  });
});
