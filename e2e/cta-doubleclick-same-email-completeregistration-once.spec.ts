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

/**
 * Wait until the <meta id="__fbq-marker-{name}"> data-count attribute
 * strictly exceeds `from`. Returns the new count as soon as it bumps.
 *
 * Implementation: runs a MutationObserver INSIDE the page on the marker
 * (or on <head> while the marker doesn't exist yet) and resolves the very
 * moment the attribute changes. No polling, no probe clicks.
 */
async function waitForFbqMarkerIncrease(
  page: Page,
  name: string,
  opts: { from?: number; timeout?: number } = {}
): Promise<number> {
  const { from = 0, timeout = 10_000 } = opts;
  return await page.evaluate(
    ({ name, from, timeout }) =>
      new Promise<number>((resolve, reject) => {
        const id = `__fbq-marker-${name}`;

        const readCount = (el: Element | null) =>
          el ? Number(el.getAttribute('data-count') || '0') : 0;

        // Fast path — already bumped.
        const existing = document.getElementById(id);
        if (readCount(existing) > from) {
          resolve(readCount(existing));
          return;
        }

        let attrObs: MutationObserver | null = null;
        let headObs: MutationObserver | null = null;
        const timer = window.setTimeout(() => {
          attrObs?.disconnect();
          headObs?.disconnect();
          reject(
            new Error(
              `[waitForFbqMarkerIncrease] timeout ${timeout}ms waiting ` +
                `for #${id} data-count > ${from}`
            )
          );
        }, timeout);

        const watchAttr = (target: Element) => {
          attrObs = new MutationObserver(() => {
            const c = readCount(target);
            if (c > from) {
              window.clearTimeout(timer);
              attrObs?.disconnect();
              headObs?.disconnect();
              resolve(c);
            }
          });
          attrObs.observe(target, {
            attributes: true,
            attributeFilter: ['data-count'],
          });
          // Re-check synchronously in case it bumped between the fast
          // path read and observer attachment.
          const c = readCount(target);
          if (c > from) {
            window.clearTimeout(timer);
            attrObs.disconnect();
            resolve(c);
          }
        };

        if (existing) {
          watchAttr(existing);
        } else {
          // Marker not yet created — watch <head> for its insertion.
          headObs = new MutationObserver(() => {
            const el = document.getElementById(id);
            if (el) {
              headObs?.disconnect();
              headObs = null;
              watchAttr(el);
            }
          });
          headObs.observe(document.head || document.documentElement, {
            childList: true,
            subtree: true,
          });
        }
      }),
    { name, from, timeout }
  );
}

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
      // Helper: bump a <meta> marker with data-count + data-last-at, plus
      // any extra attributes passed in. Markers are the single source of
      // truth for tests waiting on fbq activity — no wall-clock timers.
      const bumpMarker = (
        id: string,
        extras: Record<string, string> = {}
      ) => {
        try {
          let m = document.getElementById(id) as HTMLMetaElement | null;
          if (!m) {
            m = document.createElement('meta');
            m.id = id;
            m.setAttribute('name', id.replace(/^__/, ''));
            m.setAttribute('data-count', '0');
            (document.head || document.documentElement).appendChild(m);
          }
          const next = Number(m.getAttribute('data-count') || '0') + 1;
          m.setAttribute('data-count', String(next));
          m.setAttribute('data-last-at', String(Date.now()));
          for (const [k, v] of Object.entries(extras)) m.setAttribute(k, v);
        } catch { /* ignore */ }
      };

      // 1) Generic marker — fires on EVERY fbq invocation, success or not.
      bumpMarker('__fbq-marker-any', {
        'data-last-call': `${String(verb)}:${String(name ?? '')}`,
      });

      // 2) Per-event marker — fires for both Lead (blocked) and any other
      //    track call. This lets tests wait precisely for the FIRST useful
      //    call (e.g. __fbq-marker-Lead[data-last-at]) without any timer.
      if (verb === 'track' && typeof name === 'string') {
        const blocked = name === 'Lead';
        bumpMarker(`__fbq-marker-${name}`, {
          'data-status': blocked ? 'blocked' : 'success',
        });
      }

      if (verb === 'track' && name === 'Lead') {
        calls.push(['__attempt_failed__', ...args]);
        persist();
        throw new Error('[test] Lead event blocked');
      }
      calls.push(args);
      persist();
      // 3) CustomEvent for every successful track call. The per-event
      //    marker has already been bumped above with data-status=success.
      try {
        if (verb === 'track' && typeof name === 'string') {
          window.dispatchEvent(
            new CustomEvent(`fbq:${name}`, { detail: { args, at: Date.now() } })
          );
        }
      } catch { /* ignore */ }
    };

    (window as unknown as { fbq: typeof fbqStub }).fbq = fbqStub;
    (window as unknown as { _fbq: typeof fbqStub })._fbq = fbqStub;

    // Expose a one-shot promise that resolves the very moment
    // CompleteRegistration is dispatched — tests can await it directly.
    (window as unknown as {
      __completeRegistrationFired?: Promise<{ at: number; args: unknown[] }>;
    }).__completeRegistrationFired = new Promise((resolve) => {
      window.addEventListener(
        'fbq:CompleteRegistration',
        (e: Event) => {
          const ce = e as CustomEvent<{ at: number; args: unknown[] }>;
          resolve(ce.detail);
        },
        { once: true }
      );
    });

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

    // Anti-bot guard: arm the MutationObserver-based wait FIRST, then
    // fire probe clicks. The watcher resolves synchronously on the page
    // the moment the marker bumps — no expect.poll, no retry interval.
    //
    // We still need at least one click to attempt a submission; if the
    // 3s guard rejects it, the toast appears and submitLockRef is
    // released, so we listen for the toast role="status" (sonner) and
    // immediately re-click. The wait promise resolves on the click that
    // finally goes through.
    await expect(submitButton).toBeEnabled();

    const markerBumped = waitForFbqMarkerIncrease(page, 'Lead', {
      from: 0,
      timeout: 15_000,
    });

    // Auto-retry click on each toast (anti-bot rejection signal). One
    // observer is enough; it disconnects when markerBumped resolves.
    let retryStop = false;
    markerBumped.finally(() => { retryStop = true; }).catch(() => { /* */ });
    const clickLoop = (async () => {
      await submitButton.click({ noWaitAfter: true, force: true }).catch(() => {});
      // Observe DOM for any new toast/status node and re-click.
      while (!retryStop) {
        const toastSeen = await page
          .waitForSelector('[role="status"], [data-sonner-toast]', {
            state: 'attached',
            timeout: 4_000,
          })
          .catch(() => null);
        if (!toastSeen || retryStop) break;
        await page.waitForTimeout(50); // micro-yield, NOT a guard timer
        await submitButton
          .click({ noWaitAfter: true, force: true })
          .catch(() => {});
      }
    })();

    await markerBumped;
    await clickLoop.catch(() => {});

    // The probe submission has navigated to /merci. Go back and reset
    // state so the upcoming double-click burst is the only thing
    // measured by the assertions below.
    if (page.url().includes('/merci')) {
      await page.goBack();
      await expect(submitButton).toBeVisible();
    }
    await page.evaluate(() => {
      const w = window as unknown as { __fbqCalls: FbqCall[] };
      w.__fbqCalls.length = 0;
      try { sessionStorage.removeItem('__fbqCallsStash'); } catch { /* ignore */ }
      for (const id of [
        '__fbq-marker-any',
        '__fbq-marker-Lead',
        '__fbq-marker-CompleteRegistration',
      ]) {
        const m = document.getElementById(id);
        if (m) {
          m.setAttribute('data-count', '0');
          m.removeAttribute('data-last-at');
        }
      }
      try { sessionStorage.removeItem('__meta_pixel_lead'); } catch { /* ignore */ }
      delete (window as unknown as { __metaPixelLeadLockUntil?: number })
        .__metaPixelLeadLockUntil;
      (window as unknown as {
        __completeRegistrationFired?: Promise<{ at: number; args: unknown[] }>;
      }).__completeRegistrationFired = new Promise((resolve) => {
        window.addEventListener(
          'fbq:CompleteRegistration',
          (e: Event) => {
            const ce = e as CustomEvent<{ at: number; args: unknown[] }>;
            resolve(ce.detail);
          },
          { once: true }
        );
      });
    });
    await expect(submitButton).toBeEnabled();

    // Two rapid clicks — the 2nd one races against React's disabled commit.
    // `clickCount: 2` would be a real double-click; we use two separate
    // clicks with no delay to mimic an impatient user mashing the button.
    await Promise.all([
      submitButton.click({ noWaitAfter: true }),
      submitButton.click({ noWaitAfter: true, force: true }),
    ]);

    // Event-driven detection: wait for the explicit DOM marker injected by
    // the stub the moment CompleteRegistration is tracked. No timers.
    await page.waitForSelector(
      'meta#__fbq-marker-CompleteRegistration[data-count="1"]',
      { state: 'attached', timeout: 10_000 }
    );

    // Also assert the one-shot promise resolved with the expected payload.
    const firedDetail = await page.evaluate(
      () =>
        (window as unknown as {
          __completeRegistrationFired: Promise<{ at: number; args: unknown[] }>;
        }).__completeRegistrationFired
    );
    expect(firedDetail.args[0]).toBe('track');
    expect(firedDetail.args[1]).toBe('CompleteRegistration');

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

    // ----- Ordering assertions (timing-insensitive) -----
    //
    // Build a chronological list of relevant track events with their indices,
    // then assert structural properties rather than exact timestamps.
    const trackTimeline = calls
      .map((c, idx) => ({ idx, verb: c[0], name: c[1] }))
      .filter(
        (e) =>
          (e.verb === 'track' && (e.name === 'Lead' || e.name === 'CompleteRegistration')) ||
          (e.verb === '__attempt_failed__')
      );

    const completeRegIndex = trackTimeline.findIndex(
      (e) => e.verb === 'track' && e.name === 'CompleteRegistration'
    );
    expect(
      completeRegIndex,
      'CompleteRegistration must appear in the fbq timeline'
    ).toBeGreaterThanOrEqual(0);

    // 1) CompleteRegistration must occur exactly once across the whole timeline.
    const completeRegOccurrences = trackTimeline.filter(
      (e) => e.verb === 'track' && e.name === 'CompleteRegistration'
    );
    expect(
      completeRegOccurrences.length,
      'CompleteRegistration must occur exactly once in the chronological timeline'
    ).toBe(1);

    // 2) No SUCCESSFUL Lead may appear before CompleteRegistration. Failed
    //    Lead attempts (recorded as '__attempt_failed__') are allowed and
    //    expected — that's how the fallback gets triggered.
    const successfulLeadBefore = trackTimeline
      .slice(0, completeRegIndex)
      .filter((e) => e.verb === 'track' && e.name === 'Lead');
    expect(
      successfulLeadBefore.length,
      'No successful Lead may be tracked before CompleteRegistration'
    ).toBe(0);

    // 3) No Lead — successful or attempted — may appear AFTER
    //    CompleteRegistration. Once the fallback fires, the dedup window
    //    must block any subsequent attempt for the next 10s.
    const anyLeadAfter = trackTimeline
      .slice(completeRegIndex + 1)
      .filter(
        (e) =>
          (e.verb === 'track' && e.name === 'Lead') ||
          e.verb === '__attempt_failed__'
      );
    expect(
      anyLeadAfter.length,
      'No Lead attempt (success or failure) may occur after CompleteRegistration'
    ).toBe(0);

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