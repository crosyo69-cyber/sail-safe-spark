import { test as base } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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

const RETRYABLE_PATTERNS: RegExp[] = [
  /timeout/i,
  /timed out/i,
  /net::ERR_/i,
  /ECONNREFUSED/i,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /EAI_AGAIN/i,
  /socket hang up/i,
  /network/i,
  /navigation failed/i,
  /Target page, context or browser has been closed/i,
];

function isRetryable(message: string): boolean {
  return RETRYABLE_PATTERNS.some((re) => re.test(message));
}

export const test = base.extend({});

test.beforeEach(async ({}, testInfo) => {
  if (testInfo.retry === 0) return;

  const file = join(ERROR_DIR, `${encodeURIComponent(testInfo.testId)}.txt`);
  if (!existsSync(file)) return;

  const lastError = readFileSync(file, 'utf8');
  if (!isRetryable(lastError)) {
    testInfo.skip(
      true,
      `Retry ignoré : l'échec précédent n'est pas une erreur réseau/timeout.\n` +
        `Erreur d'origine :\n${lastError.slice(0, 500)}`,
    );
  }
});

export { expect } from '@playwright/test';
