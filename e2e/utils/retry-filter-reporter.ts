import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reporter compagnon de `retry-filter.ts` : sérialise sur disque le message
 * d'erreur de chaque test échoué afin que le retry suivant puisse décider
 * s'il doit s'exécuter (erreur réseau/timeout) ou être skippé.
 */
const ERROR_DIR = join(process.cwd(), '.playwright-last-errors');

export default class RetryFilterReporter implements Reporter {
  onBegin() {
    mkdirSync(ERROR_DIR, { recursive: true });
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status !== 'failed' && result.status !== 'timedOut') return;
    const message = [
      ...(result.errors || []).map((e) => e.message || e.stack || ''),
      result.error?.message || '',
      result.error?.stack || '',
    ]
      .filter(Boolean)
      .join('\n');
    const file = join(ERROR_DIR, `${encodeURIComponent(test.id)}.txt`);
    try {
      writeFileSync(file, message);
    } catch {
      // ignore
    }
  }
}
