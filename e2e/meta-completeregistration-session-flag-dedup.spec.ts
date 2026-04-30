import { test, expect, type Page } from '@playwright/test';
import { SUBMIT_IDLE_LABEL_RE, SUBMIT_LOADING_LABEL_RE, SUBMIT_LOADING_LABEL } from './utils/submit-button';
import { installFbqMarkerStub } from './utils/fbq-markers';

/**
 * E2E: verify the session-wide `conversion_fired_meta_lead` flag in
 * sessionStorage guarantees the Meta Pixel `CompleteRegistration` (fallback
 * for `Lead`) fires AT MOST ONCE per browser session, even when the user:
 *   1. Submits the form (→ /merci) — fires CompleteRegistration #1
 *   2. Reloads /merci in the same tab — must NOT re-fire
 *   3. Goes back to "/" — must NOT re-fire
 *   4. Reloads "/" — must NOT re-fire
 *   5. Re-submits the same CTA form — must NOT re-fire
 *
 * Lead is forced to throw so the fallback CompleteRegistration is exercised.
 * Across the whole flow, there must be exactly 1 `track CompleteRegistration`
 * in fbq calls and the session flag must be present.
 */

type FbqCall = unknown[];

async function installInstrumentation(page: Page) {
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
      // Force Lead to fail so app code falls back to CompleteRegistration.
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

function countCompleteRegistration(calls: FbqCall[]): number {
  return calls.filter((c) => c[0] === 'track' && c[1] === 'CompleteRegistration').length;
}

async function fillAndSubmitCta(page: Page, email: string) {
  const submitButton = page.getByRole('button', { name: SUBMIT_IDLE_LABEL_RE });
  await submitButton.scrollIntoViewIfNeeded();
  await expect(submitButton).toBeVisible();

  await page.getByTestId('lead-firstname').fill('TestUser');
  await page.getByTestId('lead-email').fill(email);
  await page.getByTestId('lead-phone').fill('0612345678');

  // Anti-bot timestamp guard
  await page.waitForTimeout(3500);

  await submitButton.click();
}

test.describe('Meta Pixel CompleteRegistration — per-session dedup flag', () => {
  test('fires exactly once across submit + /merci reload + back + home reload + resubmit', async ({ page }) => {
    await installInstrumentation(page);

    // ---- 1) Submit the form (→ /merci) ----
    await page.goto('/');
    await fillAndSubmitCta(page, 'session-flag-meta@example.com');

    await page.waitForURL('**/merci', { timeout: 10_000 });
    await page.waitForTimeout(500);

    let calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    expect(
      countCompleteRegistration(calls),
      'after form submit + /merci, CompleteRegistration fired exactly once'
    ).toBe(1);

    // The session flag must be set
    const flagAfterMerci = await page.evaluate(
      () => localStorage.getItem('conversion_fired_meta_lead')
    );
    expect(
      flagAfterMerci,
      'persistent localStorage flag conversion_fired_meta_lead must be set after first fire'
    ).not.toBeNull();

    // ---- 2) Reload /merci in the same tab ----
    await page.reload();
    await page.waitForTimeout(500);

    calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    expect(
      countCompleteRegistration(calls),
      'after /merci reload, CompleteRegistration still only once'
    ).toBe(1);

    // ---- 3) Browser back to "/" ----
    await page.goBack();
    await page.waitForTimeout(500);

    calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    expect(
      countCompleteRegistration(calls),
      'after back navigation to /, CompleteRegistration still only once'
    ).toBe(1);

    // ---- 4) Reload home ----
    await page.reload();
    await page.waitForTimeout(500);

    calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    expect(
      countCompleteRegistration(calls),
      'after home reload, CompleteRegistration still only once'
    ).toBe(1);

    // ---- 5) Resubmit the same CTA form within the same session ----
    await fillAndSubmitCta(page, 'session-flag-meta-2@example.com');
    await page.waitForURL('**/merci', { timeout: 10_000 });
    await page.waitForTimeout(500);

    calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    const finalCount = countCompleteRegistration(calls);

    console.log(
      `[Test] Final fbq calls: ${calls.length} | CompleteRegistration fires: ${finalCount}`
    );

    expect(
      finalCount,
      'CompleteRegistration must fire EXACTLY ONCE per session across reload + back + resubmit'
    ).toBe(1);
  });
});
