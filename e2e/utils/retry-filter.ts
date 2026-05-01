import { test as base } from '@playwright/test';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RETRYABLE_PATTERNS, isRetryable } from './retry-patterns';
import { clearDedupStorage } from './dedup-storage';

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
  const optedOut = testInfo.annotations.some(
    (a) => a.type === 'dedupAutoReset' && a.description === 'false',
  );
  if (optedOut) return;
  try {
    await page.goto('/');
    await clearDedupStorage(page);
  } catch {
    // page may not be navigable yet (e.g. webServer still warming up on
    // the very first test) — clearDedupStorage itself tolerates this.
  }
});

test.beforeEach(async (_fixtures, testInfo) => {
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
