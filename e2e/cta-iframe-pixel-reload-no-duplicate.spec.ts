import { test, expect, type Page } from '@playwright/test';

/**
 * E2E: simulate Meta Pixel being loaded via an <iframe> tracker (the noscript
 * fallback shape that Meta serves at facebook.com/tr) IN ADDITION to the JS
 * fbq pipeline. We must guarantee that CompleteRegistration is not fired
 * twice across submit → /merci → reload.
 *
 * Strategy:
 *  1. Stub window.fbq to:
 *     - throw on 'track Lead' (forces the CompleteRegistration fallback path)
 *     - record everything else
 *     - mirror EVERY successful 'track' call by injecting a hidden <iframe>
 *       pointing to a stubbed facebook.com/tr URL — this mimics the way Meta
 *       Pixel can fan out events to its iframe tracker. Each iframe load is
 *       recorded as a SEPARATE event in __pixelHits so we can detect a
 *       duplicate even if it travels via the iframe channel.
 *  2. Intercept https://www.facebook.com/tr* with a 1×1 transparent GIF so
 *     the iframe loads instantly and offline.
 *  3. Persist all recorded calls in sessionStorage so they survive the reload.
 *  4. Submit the form, redirect to /merci, then reload /merci.
 *  5. Assert: 0 successful Lead, exactly 1 CompleteRegistration in fbq calls,
 *     and exactly 1 iframe pixel hit for CompleteRegistration.
 */

type FbqCall = unknown[];

async function installInstrumentation(page: Page) {
  await page.addInitScript(() => {
    const STASH_FBQ = '__fbqCallsStash';
    const STASH_PIX = '__pixelHitsStash';

    const loadStash = <T,>(key: string): T[] => {
      try {
        const raw = sessionStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T[]) : [];
      } catch { return []; }
    };

    const fbqCalls: FbqCall[] = loadStash<FbqCall>(STASH_FBQ);
    const pixelHits: string[] = loadStash<string>(STASH_PIX);
    (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls = fbqCalls;
    (window as unknown as { __pixelHits: string[] }).__pixelHits = pixelHits;

    const persist = () => {
      try {
        sessionStorage.setItem(STASH_FBQ, JSON.stringify(fbqCalls));
        sessionStorage.setItem(STASH_PIX, JSON.stringify(pixelHits));
      } catch { /* ignore */ }
    };

    // Inject an <iframe> that mimics Meta's noscript pixel beacon.
    const injectIframePixel = (eventName: string) => {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText = 'position:absolute;width:1px;height:1px;border:0;left:-9999px;';
      iframe.src = `https://www.facebook.com/tr?id=733582700316147&ev=${encodeURIComponent(eventName)}&noscript=1`;
      iframe.addEventListener('load', () => {
        pixelHits.push(eventName);
        persist();
      });
      document.body.appendChild(iframe);
    };

    const fbqStub = (...args: unknown[]) => {
      const verb = args[0];
      const name = args[1];
      if (verb === 'track' && name === 'Lead') {
        fbqCalls.push(['__attempt_failed__', ...args]);
        persist();
        throw new Error('[test] Lead event blocked');
      }
      fbqCalls.push(args);
      persist();
      // Mirror successful track calls through the iframe channel.
      if (verb === 'track' && typeof name === 'string') {
        injectIframePixel(name);
      }
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

  // Stub the Meta iframe tracker endpoint with a tiny transparent GIF.
  const TRANSPARENT_GIF = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  await page.route('https://www.facebook.com/tr**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/gif',
      body: TRANSPARENT_GIF,
    });
  });

  // Stub the Supabase edge function so no real email is sent.
  await page.route('**/functions/v1/send-contact-email', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

test.describe('CTA + iframe Meta Pixel — CompleteRegistration once after /merci reload', () => {
  test('iframe-routed CompleteRegistration fires exactly once across submit + /merci + reload', async ({ page }) => {
    await installInstrumentation(page);

    await page.goto('/');

    const submitButton = page.getByRole('button', { name: /envoyer ma demande/i });
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();

    await page.getByPlaceholder('Votre prénom').fill('TestUser');
    await page.getByPlaceholder('Votre email').fill('test@example.com');
    await page.getByPlaceholder('Votre téléphone').fill('0612345678');

    // Anti-bot guard requires >3s between mount and submit.
    await page.waitForTimeout(3500);

    await submitButton.click();

    await page.waitForURL('**/merci', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();

    // Let Merci.tsx's useEffect run (would re-fire trackMetaLead w/o dedup).
    await page.waitForTimeout(500);

    // RELOAD /merci — useEffect runs again; dedup must block any new fire,
    // which means NO new iframe pixel hit should be emitted either.
    await page.reload();
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(1_500);

    const fbqCalls = await page.evaluate(
      () => (window as unknown as { __fbqCalls: FbqCall[] }).__fbqCalls
    );
    const pixelHits = await page.evaluate(
      () => (window as unknown as { __pixelHits: string[] }).__pixelHits
    );

    const leadFires = fbqCalls.filter(
      (c) => c[0] === 'track' && c[1] === 'Lead'
    );
    const completeRegFires = fbqCalls.filter(
      (c) => c[0] === 'track' && c[1] === 'CompleteRegistration'
    );
    const completeRegPixelHits = pixelHits.filter((n) => n === 'CompleteRegistration');
    const leadPixelHits = pixelHits.filter((n) => n === 'Lead');

    console.log(
      `[Test] After submit + /merci + reload — ` +
      `Lead fires: ${leadFires.length} | CompleteRegistration fires: ${completeRegFires.length} | ` +
      `iframe Lead hits: ${leadPixelHits.length} | iframe CompleteRegistration hits: ${completeRegPixelHits.length}`
    );
    console.log('[Test] fbq calls:', JSON.stringify(fbqCalls, null, 2));
    console.log('[Test] pixel hits:', JSON.stringify(pixelHits, null, 2));

    expect(leadFires.length, 'Lead must never successfully fire when blocked').toBe(0);
    expect(
      completeRegFires.length,
      'CompleteRegistration must fire exactly once via fbq across submit + reload'
    ).toBe(1);
    expect(
      leadPixelHits.length,
      'No Lead iframe pixel hit must occur (Lead is blocked)'
    ).toBe(0);
    expect(
      completeRegPixelHits.length,
      'CompleteRegistration iframe pixel must hit exactly once across submit + reload'
    ).toBe(1);

    const dedupSet = await page.evaluate(
      () => sessionStorage.getItem('__meta_pixel_lead') !== null
    );
    expect(dedupSet, 'Dedup sessionStorage key must remain set after the flow').toBe(true);
  });
});