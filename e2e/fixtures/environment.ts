/**
 * Environment detection and configuration helpers for E2E tests
 *
 * Provides utilities to:
 * - Detect which environment tests are running against
 * - Check environment-specific capabilities
 * - Generate environment-aware test data
 */

export type TestEnvironment = 'local' | 'preview' | 'production';

/**
 * Get the current test environment
 * @returns The current test environment (local, preview, or production)
 */
export function getTestEnvironment(): TestEnvironment {
  const env = process.env.TEST_ENV || 'local';
  if (!['local', 'preview', 'production'].includes(env)) {
    throw new Error(
      `Invalid TEST_ENV: ${env}. Must be one of: local, preview, production`
    );
  }
  return env as TestEnvironment;
}

/**
 * Check if running in local environment
 */
export function isLocal(): boolean {
  return getTestEnvironment() === 'local';
}

/**
 * Check if running in preview environment
 */
export function isPreview(): boolean {
  return getTestEnvironment() === 'preview';
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return getTestEnvironment() === 'production';
}

/**
 * Check if test data creation is allowed
 * Production environments should avoid creating test data
 */
export function shouldCreateTestData(): boolean {
  return !isProduction();
}

/**
 * Get a unique prefix for test data
 * Includes environment and timestamp for easy identification
 */
export function getTestDataPrefix(): string {
  const env = getTestEnvironment();
  const timestamp = Date.now();
  return `E2E-${env.toUpperCase()}-${timestamp}`;
}

/**
 * Get the base URL for the current environment
 */
export function getBaseURL(): string {
  return process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:3001';
}

/**
 * Get comprehensive environment configuration
 */
export function getEnvironmentConfig() {
  return {
    environment: getTestEnvironment(),
    baseURL: getBaseURL(),
    supabaseURL: process.env.VITE_SUPABASE_URL,
    canCreateData: shouldCreateTestData(),
    testUserEmail: process.env.TEST_USER_EMAIL,
    isCI: !!process.env.CI,
  };
}

/**
 * Log environment info (useful for debugging)
 */
export function logEnvironmentInfo() {
  const config = getEnvironmentConfig();
  console.log('\n🧪 E2E Test Environment Info:');
  console.log(`  Environment: ${config.environment}`);
  console.log(`  Base URL: ${config.baseURL}`);
  console.log(`  Supabase: ${config.supabaseURL}`);
  console.log(`  Can create data: ${config.canCreateData}`);
  console.log(`  Test user: ${config.testUserEmail}`);
  console.log(`  CI: ${config.isCI}\n`);
}
