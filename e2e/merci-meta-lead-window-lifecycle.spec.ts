import { test, expect, type Page } from '@playwright/test';
import { installFbqMarkerStub } from './utils/fbq-markers';

/**
 * E2E lifecycle test for Meta Pixel Lead dedup window on /merci.
 *
 * Phase A — 5 rapid reloads of /merci (< 10s total):
 *   The useEffect on /merci calls trackMetaLead on every mount, but the 10s
 *   sliding-window dedup (sessionStorage `__meta_pixel_lead` + localStorage
 *   mirror `conversion_fired_meta_lead`) MUST collapse all of them into
 *   exactly ONE Lead/CompleteRegistration event.
 *
 * Phase B — wait > 10s, then reload once:
 *   The window has expired. The next mount of /merci MUST be allowed to
 *   fire a SECOND Lead, bringing the total to exactly 2.
 *
 * Counts include 'Lead' and 'CompleteRegistration' (the standard fbq
 * fallback triggered when 'Lead' throws), since both share the SAME dedup
 * slot per meta-pixel.ts.
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
  // 5 rapid reloads + 12s wait + 1 final reload + overhead.
  test.setTimeout(60_000);

  test('5 reloads <10s = 1 Lead, then reload after 12s = 2 Leads', async ({ page }) => {
    await installInstrumentation(page);

    // ── Phase A: arrive on /merci directly + 5 reloads, all within 10s.
    await page.goto('/merci');
    await expect(
      page.getByRole('heading', { name: /merci pour votre demande/i })
    ).toBeVisible();

    const phaseAStart = Date.now();
    for (let i = 1; i <= 5; i += 1) {
      await page.reload();
      await expect(
        page.getByRole('heading', { name: /merci pour votre demande/i })
      ).toBeVisible();
      // Tight gap so 5 reloads fit comfortably in the 10s window.
      await page.waitForTimeout(300);
    }
    // Brief settle for the last useEffect to flush.
    await page.waitForTimeout(300);
    const phaseAElapsed = Date.now() - phaseAStart;
    console.log(`[Phase A] 5 reloads completed in ${phaseAElapsed}ms (must be < 10000)`);
    expect(
      phaseAElapsed,
      'Phase A must complete inside the 10s dedup window'
    ).toBeLessThan(10_000);

    let calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    const afterPhaseA = leadFamilyCount(calls);
    console.log(
      `[Phase A] Lead-family count after initial mount + 5 reloads: ${afterPhaseA}`
    );
    expect(
      afterPhaseA,
      'Inside the 10s window, Lead+CompleteRegistration combined must equal 1'
    ).toBe(1);

    // The persistent mirror must be armed.
    const mirrorAfterA = await page.evaluate(() =>
      window.localStorage.getItem('conversion_fired_meta_lead')
    );
    expect(mirrorAfterA, 'Dedup mirror must be armed after Phase A').not.toBeNull();

    // ── Phase B: wait > 10s so the sliding window expires, then reload once.
    console.log('[Phase B] waiting 12s for the dedup window to expire…');
    await page.waitForTimeout(12_000);

    await page.reload();
    await expect(
      page.getByRole('heading', { name: /merci pour votre demande/i })
    ).toBeVisible();
    // Allow useEffect + fbq wrapper chain to flush.
    await page.waitForTimeout(500);

    calls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    const afterPhaseB = leadFamilyCount(calls);
    console.log(
      `[Phase B] Lead-family count after reload past 10s window: ${afterPhaseB}`
    );

    expect(
      afterPhaseB,
      'After the 10s window expired, the next /merci mount must fire a 2nd Lead (total = 2)'
    ).toBe(2);

    // Mirror must be re-armed for the second fire.
    const mirrorAfterB = await page.evaluate(() =>
      window.localStorage.getItem('conversion_fired_meta_lead')
    );
    expect(mirrorAfterB, 'Dedup mirror must be re-armed after Phase B').not.toBeNull();
  });
});