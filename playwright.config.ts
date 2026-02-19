import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E config. Base URL: PLAYWRIGHT_BASE_URL or http://localhost:3330 (Vite default).
 * Backend API must be running (e.g. API_PORT=3332) for full E2E.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3330',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Chromium only by default so `make test-e2e` works without installing Firefox/WebKit. CI uses same.
  // To run all browsers: npx playwright install && npx playwright test (no --project).
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3330',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
})
