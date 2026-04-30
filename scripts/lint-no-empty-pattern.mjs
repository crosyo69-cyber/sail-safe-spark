#!/usr/bin/env node
/**
 * CI guard: fail the build if any file under src/ or e2e/ violates the
 * ESLint rule `no-empty-pattern`. Runs the project's full ESLint config
 * (so language/parser options match the editor) and then filters the JSON
 * output to surface ONLY no-empty-pattern violations. All other rules are
 * ignored — this script's single responsibility is blocking empty
 * destructuring patterns like `({}, ctx) => …` before merge.
 */
import { spawnSync } from 'node:child_process';

const RULE = 'no-empty-pattern';
const TARGETS = ['src/**/*.{ts,tsx}', 'e2e/**/*.{ts,tsx}'];

const result = spawnSync(
  'npx',
  ['eslint', '--format=json', ...TARGETS],
  { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
);

// ESLint exits 1 when it finds problems; we still parse stdout in that case.
const stdout = result.stdout || '';
if (!stdout.trim()) {
  console.error('lint-no-empty-pattern: ESLint produced no output.');
  console.error(result.stderr || '');
  process.exit(2);
}

let report;
try {
  report = JSON.parse(stdout);
} catch (err) {
  console.error('lint-no-empty-pattern: failed to parse ESLint JSON output.');
  console.error(err);
  process.exit(2);
}

const hits = report.flatMap((file) =>
  (file.messages || [])
    .filter((m) => m.ruleId === RULE)
    .map((m) => ({ file: file.filePath, line: m.line, column: m.column, message: m.message })),
);

if (hits.length === 0) {
  console.log(`✓ ${RULE}: no violations across src/ and e2e/`);
  process.exit(0);
}

console.error(`✗ ${RULE}: ${hits.length} violation(s) found:`);
for (const h of hits) {
  console.error(`  ${h.file}:${h.line}:${h.column} — ${h.message}`);
}
process.exit(1);