import baseConfig from './playwright.config';
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  ...baseConfig,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  webServer: undefined,
  use: { ...baseConfig.use, baseURL: 'http://localhost:8080' },
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: { executablePath: '/bin/chromium', args: ['--no-sandbox','--disable-dev-shm-usage'] },
    },
  }],
});
