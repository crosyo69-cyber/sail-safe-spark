import { test as base } from '@playwright/test';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RETRYABLE_PATTERNS, isRetryable } from './retry-patterns';
import {
  clearDedupStorage,
  getDedupAutoResetSkipReason,
  hasDedupAutoResetSkip,
  snapshotDedupStorage,
} from './dedup-storage';
import {
  DIAG_ENABLED,
  captureFullState,
  diffMaps,
  recordDiag,
  type FullStateSnapshot,
} from './state-diagnostics';

/**
 * Filtre les retries Playwright : on n'autorise un retry QUE si l'échec
 * précédent ressemble à une erreur réseau ou un timeout. Les autres échecs
 * (assertions, erreurs de logique) sont considérés comme déterministes et
 * sont marqués `skip` au retry pour éviter de masquer un vrai bug.
 *
 * Fonctionnement : le reporter `retry-filter-reporter.ts` écrit le message
 * d'erreur du dernier échec dans `.playwright-last-errors/<testId>.txt`.
 * Au retry, ce hook lit ce fichier et décide.
 */

const ERROR_DIR = join(process.cwd(), '.playwright-last-errors');
const STATS_DIR = join(process.cwd(), '.playwright-retry-stats');
const STOPPED_LOG = join(STATS_DIR, 'stopped.log');

export const test = base.extend({});

/**
 * TEMPORARY (LOT 0.5 diagnostic): full browser-state snapshot before/after
 * each test, with automatic diff. Active only when DEDUP_DIAG=1.
 */
const diagBefore = new WeakMap<object, FullStateSnapshot | null>();

if (DIAG_ENABLED) {
  test.beforeEach(async ({ page }, testInfo) => {
    try {
      const url = page.url();
      if (!url || url === 'about:blank') await page.goto('/');
    } catch { /* ignore */ }
    const snap = await captureFullState(page);
    diagBefore.set(testInfo as unknown as object, snap);
    recordDiag(testInfo, 'before', snap);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const after = await captureFullState(page);
    const before = diagBefore.get(testInfo as unknown as object) ?? null;
    recordDiag(testInfo, 'after', after, {
      diff: {
        localStorage: diffMaps(before?.localStorage, after?.localStorage),
        sessionStorage: diffMaps(before?.sessionStorage, after?.sessionStorage),
      },
      failed: testInfo.status !== testInfo.expectedStatus,
      errors: (testInfo.errors ?? []).map((e) => (e.message ?? '').slice(0, 400)),
    });
  });
}

/**
 * GLOBAL dedup-storage auto-reset.
 *
 * Every test that imports `test` from `./utils/retry-filter` automatically
 * gets sessionStorage + localStorage wiped of all conversion-dedup keys
 * (`__gads_conv_*`, `__ga4_form_submit_*`, `__meta_pixel_lead`,
 * `conversion_fired_*`, `ksp_conv_*`) BEFORE the test body runs.
 *
 * This kills the cross-test leak caused by Playwright reusing the same
 * BrowserContext within a file: the persistent `conversion_fired_<id>`
 * mirror written by test N can no longer block the conversion fire
 * expected by test N+1.
 *
 * Specs that still import directly from `@playwright/test` keep their
 * old behavior; migrate them to `./utils/retry-filter` to opt in.
 *
 * Opt-out (rare): set the test annotation `dedupAutoReset: false` via
 * `test.info().annotations.push({ type: 'dedupAutoReset', description: 'false' })`
 * inside the test before any navigation.
 */
test.beforeEach(async ({ page }, testInfo) => {
  if (hasDedupAutoResetSkip(testInfo)) {
    // Debug trace: when a test opts out of the auto-reset, dump what dedup
    // state is currently sitting in the browser context. A later "conversion
    // did not fire" assertion can then be cross-referenced against this
    // concrete snapshot instead of guessing what leaked from a prior test.
    const reason = getDedupAutoResetSkipReason(testInfo) ?? '(unknown)';
    let snapshot: Awaited<ReturnType<typeof snapshotDedupStorage>> | null = null;
    try {
      // Snapshot needs a real origin; navigate only if we're on about:blank.
      const url = page.url();
      if (!url || url === 'about:blank' || url.startsWith('chrome-error://')) {
        await page.goto('/');
      }
      snapshot = await snapshotDedupStorage(page);
    } catch {
      /* page not navigable yet — leave snapshot null */
    }

    const header =
      `[dedup-reset SKIPPED] test="${testInfo.title}" ` +
      `retry=${testInfo.retry} reason=${reason}`;
    if (snapshot) {
      const sessionKeys = Object.keys(snapshot.sessionStorage);
      const localKeys = Object.keys(snapshot.localStorage);
      // eslint-disable-next-line no-console
      console.log(
        `${header} | origin=${snapshot.origin} | totalDedupKeys=${snapshot.totalKeys} ` +
        `| session=[${sessionKeys.join(', ')}] | local=[${localKeys.join(', ')}]`,
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(`${header} | snapshot=unavailable (no real origin yet)`);
    }

    // Attach the structured snapshot so it shows up in the HTML / JSON report.
    let attachmentUrl: string | null = null;
    try {
      // Write to a stable path under the test's outputDir so we can hand the
      // user a clickable file:// URL that survives test teardown.
      const onDiskPath = testInfo.outputPath('dedup-storage-snapshot.json');
      const payload = JSON.stringify(
        { reason, retry: testInfo.retry, snapshot },
        null,
        2,
      );
      writeFileSync(onDiskPath, payload, 'utf8');
      await testInfo.attach('dedup-storage-snapshot.json', {
        path: onDiskPath,
        contentType: 'application/json',
      });
      attachmentUrl = pathToFileURL(resolve(onDiskPath)).href;
    } catch {
      /* attach can fail if testInfo isn't ready — non-blocking */
    }

    if (attachmentUrl) {
      // eslint-disable-next-line no-console
      console.log(`[dedup-reset SKIPPED] snapshot → ${attachmentUrl}`);
    }
    return;
  }
  try {
    await page.goto('/');
    await clearDedupStorage(page);
  } catch {
    // page may not be navigable yet (e.g. webServer still warming up on
    // the very first test) — clearDedupStorage itself tolerates this.
  }
});

test.beforeEach(async ({}, testInfo) => {
  if (testInfo.retry === 0) return;

  const file = join(ERROR_DIR, `${encodeURIComponent(testInfo.testId)}.txt`);
  if (!existsSync(file)) return;

  const lastError = readFileSync(file, 'utf8');
  if (!isRetryable(lastError)) {
    try {
      mkdirSync(STATS_DIR, { recursive: true });
      appendFileSync(
        STOPPED_LOG,
        `${testInfo.testId}\t${(testInfo.titlePath || []).join(' › ')}\n`,
      );
    } catch {
      // ignore
    }
    testInfo.skip(
      true,
      `Retry ignoré : l'échec précédent n'est pas une erreur réseau/timeout.\n` +
        `Erreur d'origine :\n${lastError.slice(0, 500)}`,
    );
  }
});

export { expect } from '@playwright/test';
export { RETRYABLE_PATTERNS };
