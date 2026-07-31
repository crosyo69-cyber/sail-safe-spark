import { expect, type Page } from '@playwright/test';

/**
 * Single source of truth for reading conversion tracker calls in E2E specs.
 *
 * Why this exists
 * ---------------
 * Several specs used to read `window.dataLayer` in addition to (or instead of)
 * the test-owned recorder array. That caused two recurring flakies:
 *  - After a reload, `dataLayer` is fresh (empty) while `__gtagCalls` is
 *    re-hydrated from sessionStorage → counts dropped to 0.
 *  - When the recorder wraps a previous gtag that itself pushes to
 *    `dataLayer`, every call lands in BOTH stores → counts doubled.
 *
 * Contract
 * --------
 *  - Recorders are installed via `installGtagRecorder` / `installFbqRecorder`
 *    BEFORE any app script runs (page.addInitScript).
 *  - Captured calls are mirrored into sessionStorage (`__gtagCallsStash`
 *    / `__fbqCallsStash`) so they survive `page.reload()` within the same
 *    browsing context.
 *  - Specs MUST read counts only via `readGtagCalls` / `readFbqCalls`. They
 *    MUST NOT read `window.dataLayer` directly — doing so re-introduces the
 *    double-count / reload-zero races above.
 */

export type GtagCall = [string, string, Record<string, unknown>?];
export type FbqCall = unknown[];

const GTAG_STASH_KEY = '__gtagCallsStash';
const FBQ_STASH_KEY = '__fbqCallsStash';

/**
 * Install the gtag recorder. Uses `Object.defineProperty` so any later
 * assignment to `window.gtag` (e.g. from analytics bootstrap) is automatically
 * re-wrapped — no setTimeout race needed. Calls are captured EXACTLY ONCE per
 * fire (the wrapper records, then delegates to the underlying function).
 */
export async function installGtagRecorder(page: Page): Promise<void> {
  await page.addInitScript(
    ({ stashKey }) => {
      // The recorder can legitimately be installed twice (the auto analytics
      // fixture installs it, and legacy specs call installGtagRecorder again).
      // Each init script runs in the SAME document, so a second installation
      // must reuse the FIRST closure's array — otherwise the wrapper keeps
      // writing into the now-orphaned array while `window.__gtagCalls` points
      // at a fresh empty one ("0 conversions recorded").
      const already = (window as unknown as { __gtagRecorderInstalled?: boolean })
        .__gtagRecorderInstalled;
      if (already) return;
      (window as unknown as { __gtagRecorderInstalled: boolean }).__gtagRecorderInstalled = true;

      const prior = (() => {
        try {
          const raw = sessionStorage.getItem(stashKey);
          return raw ? (JSON.parse(raw) as unknown[][]) : [];
        } catch {
          return [];
        }
      })();
      const existing = (window as unknown as { __gtagCalls?: unknown[][] }).__gtagCalls;
      const calls: unknown[][] = Array.isArray(existing) ? existing : prior;
      (window as unknown as { __gtagCalls: unknown[][] }).__gtagCalls = calls;
      // Seed dataLayer so production code that probes `window.dataLayer`
      // does not crash. We never READ from it.
      if (!Array.isArray((window as unknown as { dataLayer?: unknown }).dataLayer)) {
        (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
      }

      const persist = () => {
        try {
          sessionStorage.setItem(stashKey, JSON.stringify(calls));
        } catch {
          /* quota / private mode — ignore */
        }
      };

      const record = (...args: unknown[]) => {
        calls.push(args);
        persist();
      };

      // True while our wrapper delegates to the underlying gtag: any
      // dataLayer.push triggered by that delegation is the SAME call we just
      // recorded and must not be counted twice.
      let inWrapper = false;

      const wrap = (orig: unknown): ((...a: unknown[]) => void) => {
        const fn = typeof orig === 'function' ? (orig as (...a: unknown[]) => void) : undefined;
        const wrapped = (...args: unknown[]) => {
          record(...args);
          inWrapper = true;
          try {
            fn?.(...args);
          } catch {
            /* ignore — we already recorded */
          } finally {
            inWrapper = false;
          }
        };
        (wrapped as unknown as { __isGtagRecorder?: boolean }).__isGtagRecorder = true;
        return wrapped;
      };

      const isWrapped = (v: unknown) =>
        typeof v === 'function' &&
        (v as unknown as { __isGtagRecorder?: boolean }).__isGtagRecorder === true;

      /**
       * Safety net for the accessor-clobber race.
       *
       * `index.html` declares `function gtag(){ dataLayer.push(arguments) }`.
       * A global function declaration is a DefineOwnProperty, so it REPLACES
       * our accessor instead of going through its setter. Between that moment
       * and the next `pin()` tick, a `gtag('event', 'conversion', …)` fired by
       * the app bypasses the recorder entirely → "0 conversions" flake.
       *
       * So we also tap `dataLayer.push`: any gtag-shaped entry (first item is
       * a string command) pushed while our wrapper is NOT executing is a call
       * that bypassed us, and is recorded exactly once here. Object pushes
       * (GTM events) are ignored — they are not gtag calls.
       */
      const pinDataLayer = () => {
        const dl = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
        if (!dl || typeof dl.push !== 'function') return;
        if ((dl.push as unknown as { __isGtagRecorder?: boolean }).__isGtagRecorder) return;
        const origPush = dl.push.bind(dl) as (...items: unknown[]) => number;
        const patched = (...items: unknown[]): number => {
          if (!inWrapper) {
            for (const item of items) {
              try {
                const arr =
                  Array.isArray(item) ||
                  Object.prototype.toString.call(item) === '[object Arguments]'
                    ? Array.from(item as ArrayLike<unknown>)
                    : null;
                if (arr && arr.length > 0 && typeof arr[0] === 'string') record(...arr);
              } catch {
                /* ignore malformed entries */
              }
            }
          }
          return origPush(...items);
        };
        (patched as unknown as { __isGtagRecorder?: boolean }).__isGtagRecorder = true;
        try {
          dl.push = patched as typeof dl.push;
        } catch {
          /* frozen dataLayer — nothing we can do */
        }
      };

      let current: unknown = wrap((window as unknown as { gtag?: unknown }).gtag);
      const pin = () => {
        // A classic `function gtag(){}` declaration in index.html creates the
        // global binding with DefineOwnProperty, which REPLACES our accessor
        // instead of calling its setter. So we re-pin the accessor a few
        // times. `wrap()` always wraps the RAW function (never a wrapper),
        // and `isWrapped` short-circuits, so a call is recorded EXACTLY once
        // no matter how many times we re-pin.
        const existing = (window as unknown as { gtag?: unknown }).gtag;
        if (isWrapped(existing)) {
          current = existing;
          pinDataLayer();
          return;
        }
        if (typeof existing === 'function') current = wrap(existing);
        try {
          Object.defineProperty(window, 'gtag', {
            configurable: true,
            get() {
              return current;
            },
            set(v: unknown) {
              current = isWrapped(v) ? v : wrap(v);
            },
          });
        } catch {
          (window as unknown as { gtag: unknown }).gtag = current;
        }
        pinDataLayer();
      };
      pin();
      [0, 5, 15, 30, 60, 100, 200, 300, 500, 800, 1200, 1500, 2000, 3000].forEach((t) =>
        setTimeout(pin, t),
      );
      const fastPin = setInterval(pin, 25);
      setTimeout(() => clearInterval(fastPin), 5000);
      document.addEventListener('DOMContentLoaded', pin);
      window.addEventListener('load', pin);
    },
    { stashKey: GTAG_STASH_KEY }
  );
}

/**
 * Install the fbq recorder. Same defineProperty contract as `installGtagRecorder`.
 *
 * Options:
 *  - `failLead`: when true, calls of the form `fbq('track','Lead', …)` throw
 *    after being recorded as `['__attempt_failed__', 'track', 'Lead', …]`.
 *    This forces the production code's CompleteRegistration fallback so specs
 *    can assert it ran exactly once.
 */
export async function installFbqRecorder(
  page: Page,
  options: { failLead?: boolean } = {}
): Promise<void> {
  await page.addInitScript(
    ({ stashKey, failLead }) => {
      const prior = (() => {
        try {
          const raw = sessionStorage.getItem(stashKey);
          return raw ? (JSON.parse(raw) as unknown[][]) : [];
        } catch {
          return [];
        }
      })();
      const calls: unknown[][] = prior;
      (window as unknown as { __fbqCalls: unknown[][] }).__fbqCalls = calls;

      const persist = () => {
        try {
          sessionStorage.setItem(stashKey, JSON.stringify(calls));
        } catch {
          /* ignore */
        }
      };

      const record = (...args: unknown[]) => {
        calls.push(args);
        persist();
      };

      const wrap = (orig: unknown): ((...a: unknown[]) => void) => {
        const fn = typeof orig === 'function' ? (orig as (...a: unknown[]) => void) : undefined;
        const wrapped = (...args: unknown[]) => {
          if (failLead && args[0] === 'track' && args[1] === 'Lead') {
            calls.push(['__attempt_failed__', ...args]);
            persist();
            throw new Error('[test] Lead event blocked');
          }
          record(...args);
          try {
            fn?.(...args);
          } catch {
            /* ignore */
          }
        };
        (wrapped as unknown as { __isFbqRecorder?: boolean }).__isFbqRecorder = true;
        return wrapped;
      };

      const isWrapped = (v: unknown) =>
        typeof v === 'function' &&
        (v as unknown as { __isFbqRecorder?: boolean }).__isFbqRecorder === true;

      let current: unknown = wrap((window as unknown as { fbq?: unknown }).fbq);
      try {
        Object.defineProperty(window, 'fbq', {
          configurable: true,
          get() {
            return current;
          },
          set(v: unknown) {
            current = isWrapped(v) ? v : wrap(v);
          },
        });
      } catch {
        (window as unknown as { fbq: unknown }).fbq = current;
      }
      // Mirror onto _fbq so meta-pixel.ts's init short-circuit sees us.
      (window as unknown as { _fbq: unknown })._fbq = (window as unknown as { fbq: unknown }).fbq;
    },
    { stashKey: FBQ_STASH_KEY, failLead: options.failLead === true }
  );
}

/** Read recorded gtag calls from the canonical store. Never reads dataLayer. */
export async function readGtagCalls(page: Page): Promise<GtagCall[]> {
  return page.evaluate(
    () => ((window as unknown as { __gtagCalls?: unknown[][] }).__gtagCalls ?? []) as GtagCall[]
  );
}

/** Read recorded fbq calls from the canonical store. */
export async function readFbqCalls(page: Page): Promise<FbqCall[]> {
  return page.evaluate(
    () => ((window as unknown as { __fbqCalls?: unknown[][] }).__fbqCalls ?? []) as FbqCall[]
  );
}

/** Count Google Ads `event:'conversion'` calls whose `send_to` matches `convId`. */
export function countAdsConversions(calls: GtagCall[], convId: string): number {
  return calls.filter((c) => {
    if (c[0] !== 'event' || c[1] !== 'conversion') return false;
    const params = c[2] as Record<string, unknown> | undefined;
    return typeof params?.send_to === 'string' && params.send_to === convId;
  }).length;
}

/** Count Meta Pixel `track:<name>` calls (excludes `__attempt_failed__` markers). */
export function countMetaEvent(calls: FbqCall[], eventName: string): number {
  return calls.filter((c) => c[0] === 'track' && c[1] === eventName).length;
}

/** Count GA4 `event:<name>` (non-conversion) calls — useful for `form_submit`. */
export function countGa4Event(calls: GtagCall[], eventName: string): number {
  return calls.filter((c) => c[0] === 'event' && c[1] === eventName).length;
}

// ───────────────────────── generic conversion waiters ─────────────────────────
//
// Every conversion assertion in the suite should go through one of these
// helpers instead of `await page.waitForTimeout(N)` followed by a one-shot
// `expect(...).toBe(N)`. Fixed sleeps are the #1 source of CI flake here:
// they either wait too little (false negative on slow workers) or too long
// (slow suite). The helpers below all use Playwright's `expect.poll` which
// retries until the condition is met OR a timeout elapses, with rich
// per-attempt diagnostics in the trace viewer.

const DEFAULT_POLL_TIMEOUT_MS = 10_000;
const DEFAULT_POLL_INTERVALS = [50, 100, 200, 250];

export interface WaitOpts {
  /** Hard upper bound, in ms. Default: 10_000. */
  timeout?: number;
  /** Backoff intervals in ms. Default: [50, 100, 200, 250]. */
  intervals?: number[];
  /** Friendly message attached to the failing expect call. */
  message?: string;
}

/**
 * Generic waiter — polls `read()` until its value equals `expected`.
 * Use this for every "X tracker fired exactly N times" assertion.
 *
 * Example:
 *   await waitForConversionCount(
 *     () => readGtagCalls(page).then((c) => countAdsConversions(c, CONV_ID)),
 *     1,
 *     { message: 'Google Ads conversion fires exactly once after submit' },
 *   );
 */
export async function waitForConversionCount<T>(
  read: () => Promise<T> | T,
  expected: T,
  opts: WaitOpts = {}
): Promise<void> {
  await expect
    .poll(read, {
      timeout: opts.timeout ?? DEFAULT_POLL_TIMEOUT_MS,
      intervals: opts.intervals ?? DEFAULT_POLL_INTERVALS,
      message: opts.message,
    })
    .toEqual(expected);
}

/**
 * Wait for an Ads conversion count to reach `expected` (reads `__gtagCalls`).
 * Convenience around `waitForConversionCount`.
 */
export async function waitForAdsConversionCount(
  page: Page,
  convId: string,
  expected: number,
  opts: WaitOpts = {}
): Promise<void> {
  await waitForConversionCount(
    async () => countAdsConversions(await readGtagCalls(page), convId),
    expected,
    {
      ...opts,
      message: opts.message ?? `Google Ads conversion (${convId}) reaches ${expected}`,
    }
  );
}

/**
 * Wait for a Meta Pixel `track:<name>` count to reach `expected`
 * (reads `__fbqCalls`).
 */
export async function waitForMetaEventCount(
  page: Page,
  eventName: string,
  expected: number,
  opts: WaitOpts = {}
): Promise<void> {
  await waitForConversionCount(
    async () => countMetaEvent(await readFbqCalls(page), eventName),
    expected,
    {
      ...opts,
      message: opts.message ?? `Meta Pixel ${eventName} reaches ${expected}`,
    }
  );
}

/**
 * Wait for a GA4 `event:<name>` count to reach `expected`. Useful for
 * `form_submit` assertions that should NOT double-fire.
 */
export async function waitForGa4EventCount(
  page: Page,
  eventName: string,
  expected: number,
  opts: WaitOpts = {}
): Promise<void> {
  await waitForConversionCount(
    async () => countGa4Event(await readGtagCalls(page), eventName),
    expected,
    {
      ...opts,
      message: opts.message ?? `GA4 ${eventName} reaches ${expected}`,
    }
  );
}

/**
 * Assert a count STAYS at `expected` for `windowMs` (default 1500ms). Use
 * after a possible re-fire trigger (reload, back-nav, remount) to prove no
 * additional fire happened. Replaces the `waitForTimeout(500); expect(...).toBe(N)`
 * pattern, which only proved "no fire in the first 500ms" and frequently
 * masked late re-fires.
 */
export async function expectCountStable<T>(
  read: () => Promise<T> | T,
  expected: T,
  opts: { windowMs?: number; intervalMs?: number; message?: string } = {}
): Promise<void> {
  const windowMs = opts.windowMs ?? 1500;
  const intervalMs = opts.intervalMs ?? 100;
  const deadline = Date.now() + windowMs;
  while (Date.now() < deadline) {
    const actual = await read();
    expect(actual as unknown, opts.message ?? `count must stay at ${String(expected)}`).toEqual(
      expected as unknown
    );
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/**
 * Wait for a `localStorage` key to exist (non-null). Used to deterministically
 * detect that a persistent dedup mirror (`conversion_fired_*`,
 * `conversion_fired_meta_lead`, …) has been armed by the production code.
 * Far more reliable than waiting for a fixed delay after navigation.
 */
export async function waitForLocalStorageKey(
  page: Page,
  key: string,
  opts: WaitOpts = {}
): Promise<void> {
  await expect
    .poll(
      () => page.evaluate((k) => localStorage.getItem(k), key),
      {
        timeout: opts.timeout ?? DEFAULT_POLL_TIMEOUT_MS,
        intervals: opts.intervals ?? DEFAULT_POLL_INTERVALS,
        message: opts.message ?? `localStorage["${key}"] must be armed`,
      }
    )
    .not.toBeNull();
}

/**
 * Wait until ALL provided localStorage keys are present. Convenient for
 * combined Ads + Meta scenarios where both mirrors must be armed before
 * we read the call counts.
 */
export async function waitForLocalStorageKeys(
  page: Page,
  keys: string[],
  opts: WaitOpts = {}
): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(
          (ks) => ks.every((k) => localStorage.getItem(k) !== null),
          keys
        ),
      {
        timeout: opts.timeout ?? DEFAULT_POLL_TIMEOUT_MS,
        intervals: opts.intervals ?? DEFAULT_POLL_INTERVALS,
        message: opts.message ?? `localStorage keys must all be armed: ${keys.join(', ')}`,
      }
    )
    .toBe(true);
}