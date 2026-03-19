import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Test Configuration
 * Tests API routes and full calendar/reminder flows
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: 'html',

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Extra HTTP headers to be sent with every request
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4000',
    reuseExistingServer: false, // Always start fresh for tests
    timeout: 120000,
    // Don't set VERCEL_ENV - let it default to undefined (not production)
    // This allows cron routes to skip auth in test/dev
  },
})
