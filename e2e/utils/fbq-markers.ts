import type { Page } from '@playwright/test';

/**
 * Reusable Playwright utilities for Meta Pixel marker waits.
 *
 * These helpers cooperate with a page-side fbq stub that bumps
 * `<meta id="__fbq-marker-{name}">` elements with `data-count` and
 * `data-last-at` attributes on every fbq call. Tests can then react
 * to fbq activity event-driven (MutationObserver) instead of polling
 * or sleeping.
 *
 * Standard markers used across the suite:
 *   - `__fbq-marker-any`              — bumped on EVERY fbq invocation
 *   - `__fbq-marker-Lead`             — bumped on track('Lead', ...)
 *   - `__fbq-marker-CompleteRegistration` — bumped on track('CompleteRegistration', ...)
 *   - `__fbq-marker-{EventName}`      — bumped on any other track call
 *
 * Sister utility: `waitForSonnerToast` for one-shot toast detection.
 */

export const FBQ_MARKER_PREFIX = '__fbq-marker-';

export const fbqMarkerId = (name: string) => `${FBQ_MARKER_PREFIX}${name}`;

export const fbqMarkerSelector = (name: string, count?: number) =>
  count === undefined
    ? `meta#${fbqMarkerId(name)}`
    : `meta#${fbqMarkerId(name)}[data-count="${count}"]`;

/**
 * Install an `addInitScript` that wraps `window.fbq` so EVERY call also
 * bumps the corresponding `<meta id="__fbq-marker-{name}">` counter
 * (and a generic `__fbq-marker-any`). Safe to install on top of any
 * test-owned `fbqStub`: this hooks via a `Object.defineProperty` setter
 * so when the spec assigns its own stub, we wrap it transparently.
 *
 * Why a setter wrap and not a one-shot replacement? Specs assign their
 * stub inside their own `addInitScript`, and the order between init
 * scripts is preserved but each runs in isolation. By installing the
 * setter FIRST, any subsequent assignment (whether by a test stub or by
 * the app's meta-pixel.ts) is automatically wrapped to also bump
 * markers — the test still sees its own stub running, just with markers
 * as a side effect.
 *
 * Call BEFORE the test installs its own fbq stub:
 *   await installFbqMarkerStub(page);
 *   await installInstrumentation(page); // test-specific stub
 */
export async function installFbqMarkerStub(
  page: import('@playwright/test').Page
): Promise<void> {
  await page.addInitScript(({ prefix }) => {
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

    const wrap = (orig: unknown): ((...a: unknown[]) => unknown) => {
      const fn = typeof orig === 'function'
        ? (orig as (...a: unknown[]) => unknown)
        : (() => undefined);
      const wrapped = (...args: unknown[]) => {
        const verb = args[0];
        const name = args[1];
        bumpMarker(`${prefix}any`, {
          'data-last-call': `${String(verb)}:${String(name ?? '')}`,
        });
        let threw: unknown = null;
        let result: unknown;
        try {
          result = fn(...args);
        } catch (e) {
          threw = e;
        }
        if (verb === 'track' && typeof name === 'string') {
          bumpMarker(`${prefix}${name}`, {
            'data-status': threw ? 'blocked' : 'success',
          });
          // Dispatch a CustomEvent for tests that prefer event listeners.
          try {
            window.dispatchEvent(
              new CustomEvent(`fbq:${name}`, {
                detail: { args, at: Date.now(), blocked: !!threw },
              })
            );
          } catch { /* ignore */ }
        }
        if (threw) throw threw;
        return result;
      };
      // Tag the wrapper so we can detect double-wrapping.
      (wrapped as unknown as { __isMarkerWrap?: boolean }).__isMarkerWrap = true;
      return wrapped;
    };

    const isWrapped = (v: unknown) =>
      typeof v === 'function' &&
      (v as unknown as { __isMarkerWrap?: boolean }).__isMarkerWrap === true;

    let current: unknown = (window as unknown as { fbq?: unknown }).fbq;
    if (current && !isWrapped(current)) current = wrap(current);

    try {
      Object.defineProperty(window, 'fbq', {
        configurable: true,
        get() { return current; },
        set(v: unknown) {
          current = isWrapped(v) ? v : wrap(v);
        },
      });
      Object.defineProperty(window, '_fbq', {
        configurable: true,
        get() { return current; },
        set(v: unknown) {
          current = isWrapped(v) ? v : wrap(v);
        },
      });
    } catch { /* ignore — property may already be locked */ }
  }, { prefix: FBQ_MARKER_PREFIX });
}

/**
 * Wait until `<meta id="__fbq-marker-{name}">` `data-count` strictly
 * exceeds `from`. Resolves with the new count the very moment it bumps.
 *
 * Uses an in-page MutationObserver on the marker's `data-count`
 * attribute. If the marker doesn't exist yet, watches `<head>` for its
 * insertion and then attaches the attribute observer. No polling.
 */
export async function waitForFbqMarkerIncrease(
  page: Page,
  name: string,
  opts: { from?: number; timeout?: number } = {}
): Promise<number> {
  const { from = 0, timeout = 10_000 } = opts;
  return await page.evaluate(
    ({ name, from, timeout, prefix }) =>
      new Promise<number>((resolve, reject) => {
        const id = `${prefix}${name}`;

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
    { name, from, timeout, prefix: FBQ_MARKER_PREFIX }
  );
}

/**
 * Wait until `<meta id="__fbq-marker-{name}">` `data-count` is at least
 * `count`. Resolves with the actual count the moment it reaches/exceeds
 * the target. Fully deterministic — uses MutationObserver and re-checks
 * synchronously after observer attachment to eliminate the gap between
 * the fast-path read and observer setup.
 *
 * On timeout, the rejection includes the LAST observed count to make
 * debugging easier ("expected >=2, got 1").
 *
 * Defaults to "at least N"; pass `exact: true` if you need strict equality
 * AT the moment of resolution (rarely useful — the counter is monotonic).
 */
export async function waitForFbqMarkerCount(
  page: Page,
  name: string,
  count: number,
  opts: { timeout?: number; exact?: boolean } = {}
): Promise<number> {
  const { timeout = 10_000, exact = false } = opts;
  return await page.evaluate(
    ({ name, count, timeout, prefix, exact }) =>
      new Promise<number>((resolve, reject) => {
        const id = `${prefix}${name}`;

        const readCount = (el: Element | null) =>
          el ? Number(el.getAttribute('data-count') || '0') : 0;
        const matches = (c: number) => (exact ? c === count : c >= count);

        let lastSeen = readCount(document.getElementById(id));
        if (matches(lastSeen)) {
          resolve(lastSeen);
          return;
        }

        let attrObs: MutationObserver | null = null;
        let headObs: MutationObserver | null = null;
        const timer = window.setTimeout(() => {
          attrObs?.disconnect();
          headObs?.disconnect();
          reject(
            new Error(
              `[waitForFbqMarkerCount] timeout ${timeout}ms waiting for ` +
                `#${id} data-count ${exact ? '==' : '>='} ${count} ` +
                `(last seen: ${lastSeen})`
            )
          );
        }, timeout);

        const watchAttr = (target: Element) => {
          attrObs = new MutationObserver(() => {
            const c = readCount(target);
            lastSeen = c;
            if (matches(c)) {
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
          // Re-check synchronously to close the gap between fast-path
          // read and observer attachment.
          const c = readCount(target);
          lastSeen = c;
          if (matches(c)) {
            window.clearTimeout(timer);
            attrObs.disconnect();
            resolve(c);
          }
        };

        const existing = document.getElementById(id);
        if (existing) {
          watchAttr(existing);
          return;
        }

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
      }),
    { name, count, timeout, prefix: FBQ_MARKER_PREFIX, exact }
  );
}

export interface FbqMarkerSnapshot {
  /** Current `data-count` (0 when the marker has not been created yet). */
  count: number;
  /** `data-last-at` timestamp in ms (null when never bumped). */
  lastAt: number | null;
  /** `data-status` of the most recent track call ('success' | 'blocked' | null). */
  status: 'success' | 'blocked' | null;
  /** True iff the marker `<meta>` element exists in the DOM. */
  exists: boolean;
}

/**
 * Read a complete snapshot of an fbq marker (count + last timestamp + status).
 * Always returns a structured object — never throws. Useful for assertions
 * AND for diagnostic logging in failing tests.
 */
export async function readFbqMarker(
  page: Page,
  name: string
): Promise<FbqMarkerSnapshot> {
  return await page.evaluate(
    ({ id }) => {
      const el = document.getElementById(id);
      if (!el) {
        return { count: 0, lastAt: null, status: null, exists: false };
      }
      const rawCount = el.getAttribute('data-count');
      const rawAt = el.getAttribute('data-last-at');
      const rawStatus = el.getAttribute('data-status');
      const at = rawAt ? Number(rawAt) : NaN;
      return {
        count: rawCount ? Number(rawCount) : 0,
        lastAt: Number.isFinite(at) ? at : null,
        status:
          rawStatus === 'success' || rawStatus === 'blocked' ? rawStatus : null,
        exists: true,
      };
    },
    { id: fbqMarkerId(name) }
  );
}

/** Read the current `data-count` of a marker (0 when absent). Convenience wrapper. */
export async function readFbqMarkerCount(
  page: Page,
  name: string
): Promise<number> {
  return (await readFbqMarker(page, name)).count;
}

/**
 * Assert that an fbq marker's count equals exactly `expected` AND remains
 * stable for `stableForMs` (default 500 ms). This is the deterministic
 * primitive for "fired exactly N times" assertions: it eliminates the
 * race where a late N+1 fire would otherwise sneak in just after the
 * test reads the count.
 *
 * On mismatch the thrown error includes the observed snapshot for fast
 * triage in CI logs.
 */
export async function expectFbqMarkerCountStable(
  page: Page,
  name: string,
  expected: number,
  opts: { stableForMs?: number } = {}
): Promise<void> {
  const { stableForMs = 500 } = opts;

  const initial = await readFbqMarker(page, name);
  if (initial.count !== expected) {
    throw new Error(
      `[expectFbqMarkerCountStable] expected ${name} count=${expected}, ` +
        `got ${initial.count} (snapshot: ${JSON.stringify(initial)})`
    );
  }

  // Watch for any further bump during the stability window. We use a
  // MutationObserver in-page so we don't poll across the IPC boundary.
  const drift = await page.evaluate(
    ({ id, stableForMs, baseline }) =>
      new Promise<{ count: number; bumped: boolean }>((resolve) => {
        const el = document.getElementById(id);
        if (!el) {
          // Marker disappeared between read and observe — treat as no drift.
          window.setTimeout(
            () => resolve({ count: baseline, bumped: false }),
            stableForMs
          );
          return;
        }
        let bumped = false;
        const obs = new MutationObserver(() => {
          const c = Number(el.getAttribute('data-count') || '0');
          if (c !== baseline) {
            bumped = true;
            obs.disconnect();
            resolve({ count: c, bumped: true });
          }
        });
        obs.observe(el, { attributes: true, attributeFilter: ['data-count'] });
        window.setTimeout(() => {
          obs.disconnect();
          const c = Number(el.getAttribute('data-count') || '0');
          resolve({ count: c, bumped: bumped || c !== baseline });
        }, stableForMs);
      }),
    { id: fbqMarkerId(name), stableForMs, baseline: expected }
  );

  if (drift.bumped) {
    throw new Error(
      `[expectFbqMarkerCountStable] ${name} drifted during ${stableForMs}ms ` +
        `stability window: expected=${expected}, observed=${drift.count}`
    );
  }
}

/**
 * Reset one or more fbq markers (zero `data-count`, drop `data-last-at`).
 * Useful between phases of a test so a subsequent `waitForFbqMarkerIncrease`
 * with `from: 0` measures the next phase only.
 */
export async function resetFbqMarkers(
  page: Page,
  names: string[]
): Promise<void> {
  await page.evaluate(
    ({ ids }) => {
      for (const id of ids) {
        const m = document.getElementById(id);
        if (m) {
          m.setAttribute('data-count', '0');
          m.removeAttribute('data-last-at');
        }
      }
    },
    { ids: names.map(fbqMarkerId) }
  );
}

/**
 * Wait for the FIRST sonner toast to be inserted in the DOM. Resolves
 * with `{ at }` (timestamp ms) the instant a `[data-sonner-toast]` node
 * appears, then auto-disconnects the observer (one-shot). Pairs naturally
 * with `waitForFbqMarkerIncrease` via `Promise.race` to detect anti-bot
 * rejection vs. a successful fbq fire.
 */
export function waitForSonnerToast(
  page: Page,
  opts: { timeout?: number } = {}
): Promise<{ at: number }> {
  const { timeout = 10_000 } = opts;
  return page.evaluate(
    ({ timeout }) =>
      new Promise<{ at: number }>((resolve, reject) => {
        const SELECTOR = '[data-sonner-toast]';
        const matches = (n: Node) =>
          n instanceof HTMLElement &&
          (n.matches(SELECTOR) || !!n.querySelector?.(SELECTOR));

        if (document.querySelector(SELECTOR)) {
          resolve({ at: Date.now() });
          return;
        }

        let obs: MutationObserver | null = null;
        const timer = window.setTimeout(() => {
          obs?.disconnect();
          reject(
            new Error(
              `[waitForSonnerToast] timeout ${timeout}ms waiting for ` +
                `${SELECTOR}`
            )
          );
        }, timeout);

        obs = new MutationObserver((muts) => {
          for (const m of muts) {
            for (const n of Array.from(m.addedNodes)) {
              if (matches(n)) {
                window.clearTimeout(timer);
                obs?.disconnect();
                resolve({ at: Date.now() });
                return;
              }
            }
          }
        });
        obs.observe(document.body, { childList: true, subtree: true });
      }),
    { timeout }
  );
}