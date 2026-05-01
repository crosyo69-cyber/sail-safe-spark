import { test, expect, type Page } from '@playwright/test';
import { SUBMIT_IDLE_LABEL_RE, SUBMIT_LOADING_LABEL_RE, SUBMIT_LOADING_LABEL, SUBMIT_BUTTON_TESTID, getSubmitButton } from './utils/submit-button';
import { installFbqMarkerStub } from './utils/fbq-markers';

/**
 * E2E: 5 reloads of /merci spaced 12s apart (each > the 10s dedup window).
 *
 * Two complementary assertions:
 *
 *  A) /merci.useEffect calls trackMetaLead on every mount. The 10s sliding
 *     dedup window means reloads SPACED >10s APART are each allowed
 *     through by design (window expired). With 5 reloads at 12s gaps, we
 *     expect 1 (original CTA) + 5 (post-expiry reloads) = 6 Lead-family
 *     fires. Reloads within the window would be deduped — that contract
 *     is covered by sibling tests (e.g. cta-iframe-pixel-reload-no-duplicate).
 *
 *  B) After the 10s dedup window has expired, a NEW genuine Lead trigger
 *     (a fresh CTA submission with a different email to bypass the form's
 *     own dedup) MUST be allowed through. This proves the sliding window
 *     does release after expiry.
 *
 * NOTE: this test runs > 60s (5 × 12s + overhead). We bump the per-test
 * timeout accordingly.
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
      } catch {
        return [];
      }
    })();
    const calls: FbqCall[] = prior;
    (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls = calls;

    const persist = () => {
      try {
        sessionStorage.setItem(STASH_KEY, JSON.stringify(calls));
      } catch {
        /* ignore */
      }
    };

    const recorder = (...args: unknown[]) => {
      calls.push(args);
      persist();
    };
    (window as unknown as { fbq: typeof recorder }).fbq = recorder;
    (window as unknown as { _fbq: typeof recorder })._fbq = recorder;

    // Re-pin the canonical recorder if anything else overwrites window.fbq.
    // Do NOT wrap the previous function — wrapping accumulates layers across
    // timer ticks and inflates the recorded call count (1 real fire → N records).
    const reinstall = () => {
      if ((window as unknown as { fbq: unknown }).fbq !== recorder) {
        (window as unknown as { fbq: typeof recorder }).fbq = recorder;
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

function leadFamilyCount(calls: FbqCall[]): number {
  return calls.filter((c) => {
    const verb = c[0];
    const name = c[1];
    return (
      (verb === 'track' || verb === 'trackCustom') &&
      (name === 'Lead' || name === 'CompleteRegistration')
    );
  }).length;
}

async function submitCta(page: Page, email: string, firstname: string) {
  await page.goto('/');
  const submitButton = getSubmitButton(page);
  await submitButton.scrollIntoViewIfNeeded();
  await expect(submitButton).toBeVisible();

  await page.getByTestId('lead-firstname').fill(firstname);
  await page.getByTestId('lead-email').fill(email);
  await page.getByTestId('lead-phone').fill('0612345678');

  // Anti-bot guard requires >3s between mount and submit.
  await page.waitForTimeout(3500);

  await submitButton.click();
  await page.waitForURL('**/merci', { timeout: 10_000 });
  await expect(
    page.getByRole('heading', { name: /merci pour votre demande/i })
  ).toBeVisible();
}

test.describe('Meta Pixel — 5 reloads of /merci with 12s gap (window expiry)', () => {
  // 5 × 12s reloads + 2 submits + ~10s of overhead → give it 2 minutes.
  test.setTimeout(150_000);

  test('after 10s expiry, each reload past the window re-fires Lead, and a fresh CTA also fires', async ({
    page,
  }) => {
    await installInstrumentation(page);

    // ── Phase 1: initial CTA submit → first legitimate Lead.
    await submitCta(page, 'twelve-sec-1@example.com', 'TwelveSecFirst');
    await page.waitForTimeout(300);

    let calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    const afterFirstSubmit = leadFamilyCount(calls);
    console.log(`[Phase 1] Lead-family after first submit: ${afterFirstSubmit}`);
    expect(afterFirstSubmit, 'first CTA submit must produce exactly 1 Lead').toBe(1);

    // ── Phase 2: 5 reloads of /merci, spaced 12s apart. Each reload happens
    // AFTER the 10s dedup window has expired, so trackMetaLead in
    // Merci.useEffect is allowed through every time (by design).
    for (let i = 1; i <= 5; i += 1) {
      console.log(`[Phase 2] reload #${i}/5 — waiting 12s before reload`);
      await page.waitForTimeout(12_000);
      await page.reload();
      await expect(
        page.getByRole('heading', { name: /merci pour votre demande/i })
      ).toBeVisible();
    }

    calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    const afterReloads = leadFamilyCount(calls);
    console.log(`[Phase 2] Lead-family after 5 reloads (12s gap): ${afterReloads}`);
    expect(
      afterReloads,
      '5 reloads spaced 12s apart (>10s window) must each re-fire Lead by design: 1 initial + 5 reloads = 6'
    ).toBe(6);

    // After the last 12s wait + reload, the dedup window is fully expired.
    // Sanity-check the persistent mirror got auto-cleared on the next read.
    // (shouldFireWithinWindow purges stale keys when consulted; we trigger
    //  a consult by attempting a real Lead next.)

    // ── Phase 3: fresh CTA submission with a NEW email → must fire one more Lead.
    await submitCta(page, 'twelve-sec-2@example.com', 'TwelveSecSecond');
    await page.waitForTimeout(500);

    calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    const afterSecondSubmit = leadFamilyCount(calls);
    console.log(`[Phase 3] Lead-family after second CTA submit: ${afterSecondSubmit}`);

    expect(
      afterSecondSubmit,
      'after the 10s window expired, a fresh CTA submit must fire one more Lead: 6 + 1 = 7'
    ).toBe(7);

    // Mirror must be re-armed for the new fire.
    const mirror = await page.evaluate(() =>
      window.localStorage.getItem('conversion_fired_meta_lead')
    );
    expect(
      mirror,
      'persistent dedup mirror must be re-armed after the 2nd Lead'
    ).not.toBeNull();
  });
});
