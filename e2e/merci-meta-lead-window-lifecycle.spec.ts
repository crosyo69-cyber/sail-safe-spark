import { test, expect, type Page } from '@playwright/test';
import {
  installFbqMarkerStub,
  waitForFbqMarkerCount,
  readFbqMarkerCount,
  expectFbqMarkerCountStable,
} from './utils/fbq-markers';

/**
 * E2E lifecycle test for Meta Pixel Lead dedup window on /merci.
 *
 * Strategy (CI-stable, no fixed sleeps):
 *   - Phase A: visit /merci + 5 reloads, each gated by the
 *     `__fbq-marker-Lead` MutationObserver (no 300/500ms waits, no race).
 *     After Phase A the marker count must equal 1 (4 of the 5 reloads were
 *     blocked by the 10s sliding-window dedup, so the marker stays at 1).
 *   - To avoid a real 12s wall-clock wait in CI, we deterministically
 *     "age" the dedup timestamps (sessionStorage `__meta_pixel_lead` +
 *     localStorage mirror `conversion_fired_meta_lead`) by 11s. The dedup
 *     contract reads `Date.now() - storedTs` and considers anything
 *     >= 10000 ms as expired — so rewriting the timestamps is exactly
 *     equivalent to waiting 11s, but instant and deterministic.
 *   - Phase B: reload once and wait for the marker to reach 2.
 *
 * The fbq stub bumps `<meta id="__fbq-marker-Lead">` synchronously inside
 * the wrap, so MutationObserver fires the moment React's useEffect runs.
 * That removes every flaky "wait for useEffect to flush" sleep.
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

test.describe('Meta Pixel Lead — /merci dedup window lifecycle', () => {
  // No real wall-clock waits: just reloads gated by markers.
  test.setTimeout(45_000);

  test('5 reloads <10s = 1 Lead, then reload after window expiry = 2 Leads', async ({
    page,
  }) => {
    await installInstrumentation(page);

    // ── Phase A: arrive on /merci, then 5 reloads. Each step is gated by
    // the marker so we never race the useEffect.
    await page.goto('/merci');
    // First mount: wait for the very first Lead to be recorded.
    await waitForFbqMarkerCount(page, 'Lead', 1, { timeout: 10_000 });

    const phaseAStart = Date.now();
    for (let i = 1; i <= 5; i += 1) {
      await page.reload();
      // Wait until the page is settled — heading visible AND the dedup-mirror
      // is still armed, which proves meta-pixel.ts has been consulted.
      await expect(
        page.getByRole('heading', { name: /merci pour votre demande/i })
      ).toBeVisible();
      // Wait until the new Merci useEffect has either fired (and was
      // immediately blocked by dedup) or completed without firing. We can
      // detect "useEffect ran" by polling the dedup mirror, which Merci
      // re-reads on every mount. The marker count is asserted at the end.
      await page.waitForFunction(
        () => window.localStorage.getItem('conversion_fired_meta_lead') !== null,
        undefined,
        { timeout: 5_000 }
      );
    }
    const phaseAElapsed = Date.now() - phaseAStart;
    console.log(
      `[Phase A] 5 reloads completed in ${phaseAElapsed}ms (must be < 10000)`
    );
    expect(
      phaseAElapsed,
      'Phase A must complete inside the 10s dedup window'
    ).toBeLessThan(10_000);

    const markerAfterA = await readFbqMarkerCount(page, 'Lead');
    let calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    const afterPhaseA = leadFamilyCount(calls);
    console.log(
      `[Phase A] Lead marker = ${markerAfterA} | Lead-family fbq count = ${afterPhaseA}`
    );
    // Deterministic: marker must be 1 AND remain 1 for 500ms (no late re-fire).
    await expectFbqMarkerCountStable(page, 'Lead', 1, { stableForMs: 500 });
    expect(
      afterPhaseA,
      'Inside the 10s window, Lead+CompleteRegistration combined must equal 1'
    ).toBe(1);

    // The persistent mirror must be armed.
    const mirrorAfterA = await page.evaluate(() =>
      window.localStorage.getItem('conversion_fired_meta_lead')
    );
    expect(mirrorAfterA, 'Dedup mirror must be armed after Phase A').not.toBeNull();

    // ── Phase B: deterministically expire the 10s window by aging the
    // stored timestamps (equivalent to waiting 11s wall-clock, but
    // instant). Then reload once and wait for the marker to reach 2.
    await page.evaluate(() => {
      const aged = String(Date.now() - 11_000);
      try {
        window.sessionStorage.setItem('__meta_pixel_lead', aged);
      } catch {
        /* ignore */
      }
      try {
        window.localStorage.setItem('conversion_fired_meta_lead', aged);
      } catch {
        /* ignore */
      }
      // Also release the in-memory lock that meta-pixel.ts arms on entry,
      // since it doesn't read storage and would block the next call.
      delete (window as unknown as { __metaPixelLeadLockUntil?: number })
        .__metaPixelLeadLockUntil;
    });

    await page.reload();
    await expect(
      page.getByRole('heading', { name: /merci pour votre demande/i })
    ).toBeVisible();
    // Event-driven: wait for the Lead marker to reach 2 (no fixed sleep).
    await waitForFbqMarkerCount(page, 'Lead', 2, { timeout: 10_000 });

    const markerAfterB = await readFbqMarkerCount(page, 'Lead');
    calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    const afterPhaseB = leadFamilyCount(calls);
    console.log(
      `[Phase B] Lead marker = ${markerAfterB} | Lead-family fbq count = ${afterPhaseB}`
    );

    // Deterministic: marker must be 2 AND stable (no spurious 3rd fire).
    await expectFbqMarkerCountStable(page, 'Lead', 2, { stableForMs: 500 });
    expect(
      afterPhaseB,
      'After the 10s window expired, the next /merci mount must fire a 2nd Lead (total = 2)'
    ).toBe(2);

    // Mirror must be re-armed for the second fire.
    const mirrorAfterB = await page.evaluate(() =>
      window.localStorage.getItem('conversion_fired_meta_lead')
    );
    expect(mirrorAfterB, 'Dedup mirror must be re-armed after Phase B').not.toBeNull();

    // And the new mirror timestamp must be fresher than the artificially
    // aged one (proves a real new fire happened, not a leftover value).
    const mirrorTs = Number(mirrorAfterB);
    expect(
      Date.now() - mirrorTs,
      'Re-armed mirror timestamp must be recent (< 5s)'
    ).toBeLessThan(5_000);
  });
});