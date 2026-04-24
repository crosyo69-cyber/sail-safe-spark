import { test, expect, type Page } from '@playwright/test';

/**
 * E2E: after several CTASection remounts (SPA navigation between routes that
 * both render <CTASection />), scroll down to the CTA, click submit ONCE, and
 * verify the Meta Pixel fallback 'CompleteRegistration' fires EXACTLY ONCE.
 *
 * Lead is forced to fail so the fallback path is exercised. The test asserts
 * the in-memory lock + sessionStorage dedup combo holds across remounts.
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

  await page.route('**/functions/v1/send-contact-email', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

test.describe('CTA scroll after remounts — single click fires CompleteRegistration once', () => {
  test('remount × N → scroll to CTA → 1 click → CompleteRegistration fires exactly once', async ({ page }) => {
    await installInstrumentation(page);

    const ROUTES = ['/', '/cours-pumpfoil-dock-start-hyeres'];

    await page.goto('/');

    // Rapidly remount CTASection via SPA navigation between two routes that
    // both render it. PopStateEvent triggers React Router's route transition.
    for (let i = 0; i < 5; i++) {
      const next = ROUTES[(i + 1) % ROUTES.length];
      await page.evaluate((path) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, next);
      await page.waitForTimeout(120);
    }

    // End on the homepage so the CTA form is at the bottom of a long page.
    await page.evaluate(() => {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(200);

    // Scroll progressively to the bottom — simulates a real user journey
    // through the homepage sections before reaching the CTA.
    await page.evaluate(async () => {
      const total = document.body.scrollHeight;
      const steps = 8;
      for (let i = 1; i <= steps; i++) {
        window.scrollTo({ top: (total * i) / steps, behavior: 'instant' as ScrollBehavior });
        await new Promise((r) => setTimeout(r, 100));
      }
    });

    const submitButton = page.getByRole('button', { name: /envoyer ma demande/i });
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();

    await page.getByPlaceholder('Votre prénom').fill('TestUser');
    await page.getByPlaceholder('Votre email').fill('test@example.com');
    await page.getByPlaceholder('Votre téléphone').fill('0612345678');

    // Anti-bot guard: wait >3s from latest mount before submitting.
    await page.waitForTimeout(3500);

    // Single click — no double/triple click.
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
      `[Test] After 5 remounts + scroll + 1 click → ` +
      `Lead fires: ${leadFires.length} | CompleteRegistration fires: ${completeRegFires.length}`
    );
    console.log('[Test] All recorded fbq calls:', JSON.stringify(calls, null, 2));

    expect(leadFires.length, 'Lead must never successfully fire when blocked').toBe(0);
    expect(
      completeRegFires.length,
      'CompleteRegistration must fire exactly once after scroll + single click post-remounts'
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