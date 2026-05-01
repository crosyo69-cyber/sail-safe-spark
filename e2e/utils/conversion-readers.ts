import type { Page } from '@playwright/test';

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
      const prior = (() => {
        try {
          const raw = sessionStorage.getItem(stashKey);
          return raw ? (JSON.parse(raw) as unknown[][]) : [];
        } catch {
          return [];
        }
      })();
      const calls: unknown[][] = prior;
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

      const wrap = (orig: unknown): ((...a: unknown[]) => void) => {
        const fn = typeof orig === 'function' ? (orig as (...a: unknown[]) => void) : undefined;
        const wrapped = (...args: unknown[]) => {
          record(...args);
          try {
            fn?.(...args);
          } catch {
            /* ignore — we already recorded */
          }
        };
        (wrapped as unknown as { __isGtagRecorder?: boolean }).__isGtagRecorder = true;
        return wrapped;
      };

      const isWrapped = (v: unknown) =>
        typeof v === 'function' &&
        (v as unknown as { __isGtagRecorder?: boolean }).__isGtagRecorder === true;

      let current: unknown = wrap((window as unknown as { gtag?: unknown }).gtag);
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
        // If a previous defineProperty already locked the slot, fall back to
        // a plain assignment + re-pin loop.
        (window as unknown as { gtag: unknown }).gtag = current;
      }
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

/** Poll until a count reaches `expected`. Helps avoid fixed-sleep flakies. */
export async function waitForCount(
  read: () => Promise<number>,
  expected: number,
  opts: { timeout?: number } = {}
): Promise<void> {
  const timeout = opts.timeout ?? 5_000;
  const start = Date.now();
  // Simple poll; intentionally loose — callers usually wrap with expect.poll
  // when they need richer reporting.
  while (Date.now() - start < timeout) {
    if ((await read()) >= expected) return;
    await new Promise((r) => setTimeout(r, 100));
  }
}