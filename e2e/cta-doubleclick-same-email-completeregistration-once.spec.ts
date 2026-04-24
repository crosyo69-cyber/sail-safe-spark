import { test, expect, type Page } from '@playwright/test';

/**
 * E2E: two rapid clicks on the CTA submit button (same email, no change in
 * between) must trigger 'CompleteRegistration' EXACTLY ONCE.
 *
 * Guarded by:
 *   - `submitLockRef` (synchronous, in CTASection.tsx) — blocks the 2nd
 *     submit handler invocation before React commits the disabled state.
 *   - In-memory + sessionStorage dedup in trackMetaLead (10s window).
 *
 * Lead is forced to fail so the fallback 'CompleteRegistration' is measured.
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

  // Slow the network response slightly so the first request is still in
  // flight when we fire the 2nd click — this is the realistic race the
  // submitLockRef is designed to catch.
  await page.route('**/functions/v1/send-contact-email', async (route) => {
    await new Promise((r) => setTimeout(r, 400));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

test.describe('CTA double-click same email — CompleteRegistration once', () => {
  test('2 rapid clicks on submit (no email change) → CompleteRegistration fires exactly once', async ({ page }) => {
    await installInstrumentation(page);

    await page.goto('/');

    const submitButton = page.getByRole('button', { name: /envoyer ma demande/i });
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    await page.getByPlaceholder('Votre prénom').fill('TestUser');
    await page.getByPlaceholder('Votre email').fill('test@example.com');
    await page.getByPlaceholder('Votre téléphone').fill('0612345678');

    // Anti-bot guard: form must be older than 3s.
    await page.waitForTimeout(3500);

    // Two rapid clicks — the 2nd one races against React's disabled commit.
    // `clickCount: 2` would be a real double-click; we use two separate
    // clicks with no delay to mimic an impatient user mashing the button.
    await Promise.all([
      submitButton.click({ noWaitAfter: true }),
      submitButton.click({ noWaitAfter: true, force: true }),
    ]);

    await page.waitForURL('**/merci', { timeout: 10_000 });
    await expect(
      page.getByRole('heading', { name: /merci pour votre demande/i })
    ).toBeVisible();

    // Wait until the recorded fires settle.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const calls = (window as unknown as { __fbqCalls?: FbqCall[] }).__fbqCalls ?? [];
            return calls.filter(
              (c) => c[0] === 'track' && c[1] === 'CompleteRegistration'
            ).length;
          }),
        { timeout: 5_000, intervals: [50, 100, 200] }
      )
      .toBe(1);

    const calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    const leadFires = calls.filter((c) => c[0] === 'track' && c[1] === 'Lead');
    const completeRegFires = calls.filter(
      (c) => c[0] === 'track' && c[1] === 'CompleteRegistration'
    );

    console.log(
      `[Test] After 2 rapid clicks → Lead: ${leadFires.length} | ` +
      `CompleteRegistration: ${completeRegFires.length}`
    );
    console.log('[Test] All recorded fbq calls:', JSON.stringify(calls, null, 2));

    expect(leadFires.length, 'Lead must never successfully fire when blocked').toBe(0);
    expect(
      completeRegFires.length,
      'CompleteRegistration must fire exactly once even with 2 rapid same-form clicks'
    ).toBe(1);

    // Guards must have been engaged.
    const dedupSet = await page.evaluate(
      () => sessionStorage.getItem('__meta_pixel_lead') !== null
    );
    expect(dedupSet, 'Dedup sessionStorage key must be set after the flow').toBe(true);

    const memLockSet = await page.evaluate(
      () =>
        typeof (window as unknown as { __metaPixelLeadLockUntil?: number })
          .__metaPixelLeadLockUntil === 'number'
    );
    expect(memLockSet, 'In-memory lock must be set after the flow').toBe(true);
  });
});