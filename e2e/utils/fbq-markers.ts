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
 * Wait for an fbq marker to reach EXACTLY `count`. Backed by Playwright's
 * native `waitForSelector` (which already uses MutationObserver under the
 * hood). Convenient when a test needs a precise final count rather than
 * "any increase".
 */
export async function waitForFbqMarkerCount(
  page: Page,
  name: string,
  count: number,
  opts: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10_000 } = opts;
  await page.waitForSelector(fbqMarkerSelector(name, count), {
    state: 'attached',
    timeout,
  });
}

/** Read the current `data-count` of a marker (0 when absent). */
export async function readFbqMarkerCount(
  page: Page,
  name: string
): Promise<number> {
  return await page.evaluate(
    ({ id }) => {
      const el = document.getElementById(id);
      return el ? Number(el.getAttribute('data-count') || '0') : 0;
    },
    { id: fbqMarkerId(name) }
  );
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