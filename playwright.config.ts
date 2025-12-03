import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine which environment to test
// Options: 'local' (default), 'preview', 'production'
const TEST_ENV = process.env.TEST_ENV || 'local';

// Load environment-specific configuration
const envFile = `.env.test.${TEST_ENV}`;
console.log(`\n🧪 E2E Test Environment: ${TEST_ENV.toUpperCase()}`);
console.log(`📄 Loading config from: ${envFile}\n`);

dotenv.config({ path: resolve(__dirname, envFile) });
dotenv.config({ path: resolve(__dirname, '.env') }); // Fallback

// Validate required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
];

const missingVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingVars.length > 0) {
  throw new Error(
    `❌ Missing required environment variables: ${missingVars.join(', ')}\n` +
    `Please check that ${envFile} exists and contains all required variables.\n` +
    `See .env.test.example for a template.`
  );
}

// Get base URL from env or use defaults
const baseURL = process.env.PLAYWRIGHT_BASE_URL ||
  (TEST_ENV === 'local' ? 'https://127.0.0.1:3001' : '');

if (!baseURL) {
  throw new Error(
    `❌ PLAYWRIGHT_BASE_URL not set for ${TEST_ENV} environment.\n` +
    `Please set it in ${envFile}`
  );
}

console.log(`🌐 Base URL: ${baseURL}`);
console.log(`🗄️  Supabase: ${process.env.VITE_SUPABASE_URL}`);
console.log(`👤 Test User: ${process.env.TEST_USER_EMAIL}\n`);

// Environment-specific settings
const isLocal = TEST_ENV === 'local';
const isProduction = TEST_ENV === 'production';
const isCI = !!process.env.CI;

/**
 * Playwright E2E Test Configuration - Multi-Environment
 *
 * Supports three environments:
 * - local: Tests against local dev server (https://127.0.0.1:3001)
 * - preview: Tests against Vercel preview deployments
 * - production: Smoke tests against production (tagged with @smoke)
 *
 * Usage:
 *   TEST_ENV=local npm run test:e2e      # Default
 *   TEST_ENV=preview npm run test:e2e    # Preview deployment
 *   TEST_ENV=production npm run test:e2e # Production smoke tests
 */
export default defineConfig({
  testDir: './e2e',

  // Global setup: Login once before all tests and save session
  globalSetup: resolve(__dirname, 'e2e/global-setup.ts'),

  // Adjust timeout based on environment (production may be slower)
  timeout: isProduction ? 90 * 1000 : 60 * 1000,

  // Test execution settings
  fullyParallel: false, // Run tests serially to avoid conflicts
  forbidOnly: isCI || isProduction, // Prevent test.only in CI and production
  retries: isCI ? 2 : (isProduction ? 1 : 0), // Retry in CI and production
  workers: 1, // Single worker to avoid race conditions

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ...(isCI ? [['github'] as const] : []), // GitHub Actions reporter in CI
  ],

  // Shared settings for all tests
  use: {
    baseURL,

    // More aggressive tracing in CI/production
    trace: isCI ? 'on-first-retry' : (isProduction ? 'retain-on-failure' : 'on-first-retry'),

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video settings (disable in production to save storage)
    video: isProduction ? 'off' : 'retain-on-failure',

    // Browser context options
    viewport: { width: 1280, height: 720 },

    // Only ignore HTTPS errors locally (self-signed certs)
    ignoreHTTPSErrors: isLocal,

    // Timeouts (longer for production due to potential latency)
    actionTimeout: isProduction ? 20 * 1000 : 15 * 1000,
    navigationTimeout: isProduction ? 45 * 1000 : 30 * 1000,
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use the saved authenticated session for all tests
        storageState: 'e2e/.auth/user.json',
      },
    },

    // Run on multiple browsers in production for better coverage
    ...(isProduction ? [
      {
        name: 'firefox',
        use: {
          ...devices['Desktop Firefox'],
          storageState: 'e2e/.auth/user.json',
        },
      },
      {
        name: 'webkit',
        use: {
          ...devices['Desktop Safari'],
          storageState: 'e2e/.auth/user.json',
        },
      },
    ] : []),
  ],

  // Only run local dev server for local tests
  // Preview and production tests run against deployed environments
  ...(isLocal ? {
    webServer: {
      command: 'npm run dev',
      url: baseURL,
      reuseExistingServer: !isCI,
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  } : {}),
});
