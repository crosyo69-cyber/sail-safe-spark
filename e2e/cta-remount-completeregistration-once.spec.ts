import { test, expect, type Page } from '@playwright/test';
import { installFbqMarkerStub } from './utils/fbq-markers';

/**
 * E2E: rapidly remount the CTASection by navigating between two routes that
 * both render <CTASection /> (homepage `/` and `/cours-pumpfoil-dock-start-hyeres`).
 * After several remounts, perform a single submit and verify that the Meta
 * Pixel fallback 'CompleteRegistration' fires EXACTLY ONCE.
 *
 * This validates the in-memory + sessionStorage dedup combo in trackMetaLead:
 * even though the CTASection unmounts/remounts repeatedly (which would reset
 * any component-level state), the module-level lock survives within the JS
 * runtime and the sessionStorage key would survive across reloads.
 *
 * Lead is simulated as unavailable (throws) so the fallback path is exercised.
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

test.describe('CTASection rapid remounts — CompleteRegistration once on submit', () => {
  test('navigate /, /cours-pumpfoil…, / × N then submit → CompleteRegistration exactly once', async ({ page }) => {
    await installInstrumentation(page);

    // Both routes render <CTASection />, so client-side navigation between
    // them remounts the component without a full page reload.
    const ROUTES = ['/', '/cours-pumpfoil-dock-start-hyeres'];

    await page.goto('/');

    // Rapidly remount CTASection by bouncing between the two routes.
    // Use SPA navigation via the History API so React Router handles it as a
    // route transition and remounts the page (and thus CTASection).
    for (let i = 0; i < 6; i++) {
      const next = ROUTES[(i + 1) % ROUTES.length];
      await page.evaluate((path) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, next);
      // Give React a tick to commit the new tree.
      await page.waitForTimeout(120);
    }

    // End on the homepage and let the form mount fully.
    await page.evaluate(() => {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    const submitButton = page.getByRole('button', { name: /envoyer ma demande/i });
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();

    await page.getByPlaceholder('Votre prénom').fill('TestUser');
    await page.getByPlaceholder('Votre email').fill('test@example.com');
    await page.getByPlaceholder('Votre téléphone').fill('0612345678');

    // Anti-bot guard requires >3s between mount and submit. The remount loop
    // resets formTimestamp on each mount, so we wait from the latest mount.
    await page.waitForTimeout(3500);

    await submitButton.click();

    await page.waitForURL('**/merci', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();

    // Let Merci.tsx's useEffect run.
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
      `[Test] After ${6} remounts + submit + /merci — ` +
      `Lead fires: ${leadFires.length} | CompleteRegistration fires: ${completeRegFires.length}`
    );
    console.log('[Test] All recorded fbq calls:', JSON.stringify(calls, null, 2));

    expect(leadFires.length, 'Lead must never successfully fire when blocked').toBe(0);
    expect(
      completeRegFires.length,
      'CompleteRegistration must fire exactly once despite rapid CTASection remounts'
    ).toBe(1);

    const dedupSet = await page.evaluate(
      () => sessionStorage.getItem('__meta_pixel_lead') !== null
    );
    expect(dedupSet, 'Dedup sessionStorage key must be set after the flow').toBe(true);

    const memLockSet = await page.evaluate(
      () => typeof (window as unknown as { __metaPixelLeadLockUntil?: number }).__metaPixelLeadLockUntil === 'number'
    );
    expect(memLockSet, 'In-memory lock must be set after the flow').toBe(true);
  });
});