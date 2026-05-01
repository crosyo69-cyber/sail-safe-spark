/**
 * Runtime telemetry: verifies that gtag.js was loaded with the expected
 * Google Ads conversion ID (AW-974052357). This catches regressions where a
 * stray VITE_GA_MEASUREMENT_ID secret (or any other config drift) silently
 * loads gtag.js with the wrong ID, which would break Google Ads conversion
 * reporting without any visible error.
 *
 * Strategy:
 *   1. Poll the DOM for the gtag.js <script> tag (it is loaded async, after
 *      requestIdleCallback in initGA4()).
 *   2. Parse the `?id=` query param from its src.
 *   3. If the loaded ID is missing, mismatched, or malformed, emit a loud
 *      console.error so it shows up in Lovable's runtime-error feed AND in
 *      the user's browser console. Otherwise log a single ✓ confirmation.
 *   4. Also expose the result on `window.__kspGtagIdCheck` so e2e/Tag
 *      Assistant flows can inspect the verdict without scraping the console.
 */

export const EXPECTED_ADS_ID = 'AW-974052357';

export type GtagIdCheckResult =
  | { status: 'ok'; loadedId: string }
  | { status: 'wrong-id'; loadedId: string; expected: string }
  | { status: 'not-loaded'; expected: string };

declare global {
  interface Window {
    __kspGtagIdCheck?: GtagIdCheckResult;
  }
}

function findGtagScriptId(): string | null {
  if (typeof document === 'undefined') return null;
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>(
      'script[src*="googletagmanager.com/gtag/js"]',
    ),
  );
  if (scripts.length === 0) return null;
  // Use the first matching tag; initGA4() only ever appends one.
  const src = scripts[0].src;
  try {
    const url = new URL(src);
    return url.searchParams.get('id');
  } catch {
    // Fallback: regex if URL parsing fails for any reason.
    const m = /[?&]id=([^&]+)/.exec(src);
    return m ? decodeURIComponent(m[1]) : null;
  }
}

function publishResult(result: GtagIdCheckResult): void {
  if (typeof window !== 'undefined') {
    window.__kspGtagIdCheck = result;
    try {
      window.dispatchEvent(
        new CustomEvent('ksp:gtag-id-check', { detail: result }),
      );
    } catch {
      /* ignore */
    }
  }

  if (result.status === 'ok') {
    // eslint-disable-next-line no-console
    console.log(
      `%c[Analytics] ✓ gtag.js loaded with expected ID ${result.loadedId}`,
      'color: #16a34a; font-weight: bold',
    );
    return;
  }

  if (result.status === 'wrong-id') {
    // eslint-disable-next-line no-console
    console.error(
      `%c[Analytics] ⚠ gtag.js loaded with WRONG id "${result.loadedId}" — expected "${result.expected}". ` +
        'Google Ads conversions will NOT be reported. ' +
        'Check VITE_GA_MEASUREMENT_ID and src/lib/analytics.ts.',
      'color: #dc2626; font-weight: bold',
    );
    return;
  }

  // not-loaded
  // eslint-disable-next-line no-console
  console.error(
    `%c[Analytics] ⚠ gtag.js script tag NOT found after timeout. ` +
      `Expected id="${result.expected}". Google Ads conversion will not fire. ` +
      'Possible causes: ad-blocker, CSP, or initGA4() never ran.',
    'color: #dc2626; font-weight: bold',
  );
}

/**
 * Polls for the gtag.js script tag and verifies its ID. Resolves once a
 * verdict is reached (either OK, wrong-id, or not-loaded after timeout).
 * Safe to call multiple times — guarded by `window.__kspGtagIdCheck`.
 */
export function verifyGtagId(
  expected: string = EXPECTED_ADS_ID,
  { timeoutMs = 8000, intervalMs = 250 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<GtagIdCheckResult> {
  if (typeof window === 'undefined') {
    return Promise.resolve({ status: 'not-loaded', expected });
  }

  // Idempotent: reuse any previous verdict to avoid double-logging.
  if (window.__kspGtagIdCheck) {
    return Promise.resolve(window.__kspGtagIdCheck);
  }

  return new Promise((resolve) => {
    const start = Date.now();

    const tick = () => {
      const loadedId = findGtagScriptId();
      if (loadedId) {
        const result: GtagIdCheckResult =
          loadedId === expected
            ? { status: 'ok', loadedId }
            : { status: 'wrong-id', loadedId, expected };
        publishResult(result);
        resolve(result);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        const result: GtagIdCheckResult = { status: 'not-loaded', expected };
        publishResult(result);
        resolve(result);
        return;
      }
      window.setTimeout(tick, intervalMs);
    };

    tick();
  });
}