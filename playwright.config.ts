import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for E2E tests.
 * Tests run against the Vite dev server, which is started automatically.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  // Retries activés uniquement en CI. La logique de filtrage (réseau/timeout
  // uniquement) est appliquée par le hook `afterEach` dans e2e/retry-filter.ts,
  // qui marque comme "skipped on retry" les échecs non éligibles.
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['list'], ['json', { outputFile: 'playwright-report/results.json' }]]
    : [['list']],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});