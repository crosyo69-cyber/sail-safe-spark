import { type Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { SUBMIT_IDLE_LABEL_RE, SUBMIT_LOADING_LABEL_RE, SUBMIT_LOADING_LABEL, SUBMIT_BUTTON_TESTID, getSubmitButton } from './utils/submit-button';
import { installFbqMarkerStub } from './utils/fbq-markers';

/**
 * E2E: verify Meta Pixel "Lead" event fires EXACTLY ONCE across the flow:
 *   CTASection submit  →  redirect to /merci  →  reload /merci.
 *
 * Context:
 *  - CTASection.handleSubmit calls trackMetaLead({ content_name: 'cta_reservation', ... }).
 *  - Merci.tsx useEffect calls trackMetaLead({ content_name: 'conversion_merci' }).
 *  - On a reload of /merci, the useEffect fires again.
 *
 * Currently meta-pixel.ts has NO dedup guard, so this test documents and
 * enforces the expected behavior: across submit + reload, only ONE Lead event
 * total should be fired (sessionStorage-based dedup, 10s window — same model
 * as Google Ads conversion). If meta-pixel.ts lacks dedup, this test will
 * FAIL and surfaces the gap.
 *
 * We mirror fbq calls into sessionStorage so they survive the reload.
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

    const recorder = (...args: unknown[]) => {
      calls.push(args);
      persist();
    };
    // Mark as already-initialized so meta-pixel.ts initMetaPixel() short-circuits
    // (it returns early when window.fbq is already defined).
    (window as unknown as { fbq: typeof recorder }).fbq = recorder;
    (window as unknown as { _fbq: typeof recorder })._fbq = recorder;

    // Re-pin the canonical recorder if any other script (e.g. fbevents.js
    // bootstrap) overwrites window.fbq. We deliberately do NOT wrap the
    // existing function — wrapping accumulates layers across timer ticks
    // and inflates the recorded call count for a single real fire.
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

test.describe('Meta Pixel — Lead/CompleteRegistration dedup across submit + reload', () => {
  test('Lead event fires exactly once across CTA submit + /merci + reload', async ({ page }) => {
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

    await submitButton.click();
    await page.waitForURL('**/merci', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();

    // Let Merci.tsx's useEffect run (fires its own trackMetaLead).
    await page.waitForTimeout(500);

    // RELOAD /merci — useEffect would re-fire Lead without a dedup guard.
    await page.reload();
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(1_000);

    const calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );

    // Count any Lead-style conversion: 'Lead' (current) or 'CompleteRegistration'.
    const leadEvents = calls.filter((c) => {
      const verb = c[0];
      const name = c[1];
      return (verb === 'track' || verb === 'trackCustom')
        && (name === 'Lead' || name === 'CompleteRegistration');
    });

    console.log(
      `[Test] After submit + reload — Meta Pixel Lead/CompleteRegistration: ${leadEvents.length}/1 ` +
      `| total fbq calls: ${calls.length}`
    );
    console.log('[Test] Lead events captured:', JSON.stringify(leadEvents, null, 2));

    expect(
      leadEvents.length,
      'Meta Pixel Lead/CompleteRegistration must fire exactly once across submit + /merci + reload'
    ).toBe(1);
  });
});
