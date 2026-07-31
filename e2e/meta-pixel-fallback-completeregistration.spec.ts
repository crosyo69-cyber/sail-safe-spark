import { type Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { installFbqMarkerStub } from './utils/fbq-markers';

/**
 * E2E: when `window.fbq` is unavailable at the moment trackMetaLead is invoked,
 * the function MUST fall back to firing 'CompleteRegistration' (Meta standard
 * event) instead of 'Lead'. The 10s sessionStorage dedup is SHARED between
 * Lead and CompleteRegistration, so even if fbq becomes available later and
 * trackMetaLead is called again within 10s, NO additional conversion fires.
 *
 * Strategy:
 *  1. Block `window.fbq` from ever being defined as a function by installing a
 *     non-configurable getter that returns `undefined`. This prevents
 *     initMetaPixel() and the test-installed recorder from making fbq callable.
 *     Wait — a getter that returns undefined would also break the recorder.
 *     Instead: install fbq as a NON-FUNCTION sentinel (an object) so the
 *     `typeof window.fbq === 'function'` check in trackMetaLead returns false,
 *     while still allowing us to OBSERVE that the production code never calls
 *     fbq directly. We then capture the *attempted event* by spying on
 *     trackMetaLead's effects via sessionStorage dedup key + a recorder we
 *     swap in mid-test once we want to verify the dedup blocks the second call.
 *
 * Simpler & more robust approach used here:
 *  - Phase A: navigate to /, force fbq to a NON-FUNCTION value, then call
 *    `trackMetaLead` from page context via a tiny module probe. Verify the
 *    dedup key was NOT set (fallback also failed → retry-safe per
 *    meta-pixel.ts contract) — OR if fbq is non-function only when typeof
 *    check runs, the function exits without marking. To test the *fallback
 *    fire*, we need fbq to be a FUNCTION but the 'Lead' track to be unavailable.
 *
 * Final approach: install fbq as a function that THROWS for 'Lead' but
 * succeeds for 'CompleteRegistration'. This simulates the real-world scenario
 * where 'Lead' isn't available/blocked but 'CompleteRegistration' is, exactly
 * triggering the fallback branch. Then call trackMetaLead twice; assert
 * exactly one CompleteRegistration call and zero Lead calls.
 */

type FbqCall = unknown[];

async function installFbqLeadBlocker(page: Page) {
  // Wrap window.fbq via a setter so EVERY call also bumps
  // <meta id="__fbq-marker-*"> counters used by the shared marker
  // utilities. Installed BEFORE the test-owned stub assignment.
  await installFbqMarkerStub(page);
  await page.addInitScript(() => {
    const calls: FbqCall[] = [];
    (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls = calls;

    // Recorder that throws on 'Lead' (simulating Lead unavailable) but
    // succeeds on everything else, including 'CompleteRegistration'.
    const fbqStub = (...args: unknown[]) => {
      const verb = args[0];
      const name = args[1];
      if (verb === 'track' && name === 'Lead') {
        // Record the attempt for visibility, then throw to trigger fallback.
        calls.push(['__attempt_failed__', ...args]);
        throw new Error('[test] Lead event blocked');
      }
      calls.push(args);
    };

    // Define fbq immediately so meta-pixel.ts initMetaPixel() returns early.
    (window as unknown as { fbq: typeof fbqStub }).fbq = fbqStub;
    (window as unknown as { _fbq: typeof fbqStub })._fbq = fbqStub;

    // Re-install across the app's analytics init lifecycle in case it overwrites.
    const reinstall = () => {
      const prev = (window as unknown as { fbq: (...a: unknown[]) => void }).fbq;
      // Only reinstall if it's not already our throwing stub
      if (prev !== fbqStub) {
        (window as unknown as { fbq: typeof fbqStub }).fbq = fbqStub;
      }
    };
    setTimeout(reinstall, 0);
    setTimeout(reinstall, 100);
    setTimeout(reinstall, 500);
    setTimeout(reinstall, 1500);
  });
}

test.describe('Meta Pixel — fallback to CompleteRegistration when Lead unavailable', () => {
  test('uses CompleteRegistration fallback and stays at 1 conversion via dedup', async ({ page }) => {
    await installFbqLeadBlocker(page);

    // Use any page that imports meta-pixel.ts. Home is fine.
    await page.goto('/');

    // Reset dedup + recorder so we measure only what this test produces.
    await page.evaluate(() => {
      sessionStorage.removeItem('__meta_pixel_lead');
      (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls.length = 0;
    });

    // Dynamically import the production trackMetaLead to invoke it twice.
    // The first call: 'Lead' throws → fallback to 'CompleteRegistration' fires.
    // The second call: dedup window blocks → no event fires.
    await page.evaluate(async () => {
      // Runtime URL served by Vite dev server; opaque to tsc.
      const mod = await import(/* @vite-ignore */ '/src/lib/meta-pixel.ts' as string) as {
        trackMetaLead: (opts: { content_name: string; content_category?: string }) => void;
      };
      mod.trackMetaLead({ content_name: 'cta_reservation', content_category: 'kitesurf' });
      mod.trackMetaLead({ content_name: 'cta_reservation', content_category: 'kitesurf' });
    });

    // Inspect what fbq actually received.
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
      `[Test] fbq calls — Lead attempts (failed): ${leadAttempts.length} | ` +
      `Lead fires (success): ${leadFires.length} | ` +
      `CompleteRegistration fires: ${completeRegFires.length}`
    );
    console.log('[Test] All recorded calls:', JSON.stringify(calls, null, 2));

    expect(
      leadFires.length,
      'Lead must NOT successfully fire when blocked'
    ).toBe(0);
    expect(
      completeRegFires.length,
      'CompleteRegistration must fire exactly once via fallback (dedup blocks the 2nd call)'
    ).toBe(1);

    // Sanity: dedup key must be set.
    const dedupSet = await page.evaluate(
      () => localStorage.getItem('conversion_fired_meta_lead') !== null
    );
    expect(dedupSet, 'Persistent dedup key must be set after fallback fire').toBe(true);
  });
});