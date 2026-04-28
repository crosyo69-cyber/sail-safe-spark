import { test as base } from '@playwright/test';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RETRYABLE_PATTERNS, isRetryable } from './retry-patterns';

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
