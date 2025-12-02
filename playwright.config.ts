import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.test if it exists, otherwise .env
dotenv.config({ path: resolve(__dirname, '.env.test') });
dotenv.config({ path: resolve(__dirname, '.env') });

/**
 * Playwright E2E Test Configuration
 *
 * Tests run against local dev server (http://localhost:3000)
 * Requires:
 * - Test user credentials in .env.test
 * - Supabase instance (production, test, or local)
 */
export default defineConfig({
  testDir: './e2e',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: false, // Run tests serially to avoid conflicts
  forbidOnly: !!process.env.CI, // Fail if test.only in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 1 : 1, // Single worker to avoid race conditions

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Timeouts
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment to test in other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
