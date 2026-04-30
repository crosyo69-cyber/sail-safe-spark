import { test, expect, type Page } from '@playwright/test';
import { installFbqMarkerStub } from './utils/fbq-markers';

/**
 * E2E: 5 rapid reloads of /merci within < 10s must NOT fire Meta Lead nor
 * CompleteRegistration more than once total.
 *
 * Rationale:
 *   /merci is reached after a CTA submission that fires trackMetaLead. The
 *   page itself does not call trackMetaLead in its useEffect, but a rogue
 *   re-import or future regression could. The 10s sliding-window dedup
 *   (sessionStorage `__meta_pixel_lead` + localStorage mirror
 *   `conversion_fired_meta_lead`) is the single source of truth and MUST
 *   block any re-fire across reloads happening within the window.
 *
 * Setup:
 *   - Stub fbq early to capture every track call across reloads.
 *   - Persist captured calls in sessionStorage so they survive reloads.
 *   - Submit the CTA once → land on /merci → reload 5 times in < 10s.
 *   - Assert: exactly ONE Lead OR CompleteRegistration event, total.
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

    const reinstall = () => {
      const original = (window as unknown as { fbq: (...a: unknown[]) => void }).fbq;
      (window as unknown as { fbq: typeof recorder }).fbq = (...args: unknown[]) => {
        calls.push(args);
        persist();
        try {
          original?.(...args);
        } catch {
          /* ignore */
        }
      };
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

test.describe('Meta Pixel — 5 rapid reloads of /merci', () => {
  test('Lead/CompleteRegistration fires exactly once across submit + 5 reloads < 10s', async ({
    page,
  }) => {
    await installInstrumentation(page);

    // 1. CTA submit triggers the single legitimate Lead.
    await page.goto('/');
    const submitButton = page.getByRole('button', { name: /envoyer ma demande/i });
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();

    await page.getByTestId('lead-firstname').fill('FiveReloads');
    await page.getByTestId('lead-email').fill('five-reloads@example.com');
    await page.getByTestId('lead-phone').fill('0612345678');

    // Anti-bot guard requires >3s between mount and submit.
    await page.waitForTimeout(3500);

    await submitButton.click();
    await page.waitForURL('**/merci', { timeout: 10_000 });
    await expect(
      page.getByRole('heading', { name: /merci pour votre demande/i })
    ).toBeVisible();

    // Let the post-submit useEffect settle.
    await page.waitForTimeout(300);

    // 2. Five rapid reloads, all within the 10s dedup window.
    const start = Date.now();
    for (let i = 1; i <= 5; i += 1) {
      await page.reload();
      await expect(
        page.getByRole('heading', { name: /merci pour votre demande/i })
      ).toBeVisible();
      // Small gap so React effects flush; stay well under 10s total.
      await page.waitForTimeout(400);
    }
    const elapsed = Date.now() - start;
    console.log(`[Test] 5 reloads completed in ${elapsed}ms (must be < 10000ms)`);
    expect(elapsed, '5 reloads must complete within the 10s dedup window').toBeLessThan(
      10_000
    );

    // 3. Inspect captured fbq calls.
    const calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );

    const leadEvents = calls.filter((c) => {
      const verb = c[0];
      const name = c[1];
      return (
        (verb === 'track' || verb === 'trackCustom') &&
        (name === 'Lead' || name === 'CompleteRegistration')
      );
    });

    const leadOnly = leadEvents.filter((c) => c[1] === 'Lead');
    const crOnly = leadEvents.filter((c) => c[1] === 'CompleteRegistration');

    console.log(
      `[Test] After submit + 5 reloads — Lead: ${leadOnly.length} | ` +
        `CompleteRegistration: ${crOnly.length} | total fbq calls: ${calls.length}`
    );
    console.log('[Test] Lead-family events:', JSON.stringify(leadEvents, null, 2));

    expect(
      leadEvents.length,
      'Lead + CompleteRegistration COMBINED must fire exactly once across submit + 5 reloads (<10s)'
    ).toBe(1);

    expect(
      leadOnly.length,
      'Meta Pixel Lead must fire at most once'
    ).toBeLessThanOrEqual(1);

    expect(
      crOnly.length,
      'Meta Pixel CompleteRegistration must fire at most once'
    ).toBeLessThanOrEqual(1);

    // Cross-check the persistent dedup mirror is armed.
    const mirror = await page.evaluate(() =>
      window.localStorage.getItem('conversion_fired_meta_lead')
    );
    expect(mirror, 'Persistent Meta Lead dedup mirror must be armed').not.toBeNull();
  });
});