import { Page, expect } from '@playwright/test';

/**
 * Authentication helpers for E2E tests
 * Provides reusable functions for login, signup, and logout
 */

export interface TestUser {
  email: string;
  password: string;
}

/**
 * Get test user credentials from environment
 */
export function getTestUser(): TestUser {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Test user credentials not found. Please set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test'
    );
  }

  return { email, password };
}

/**
 * Sign up a new user
 * Note: This will fail if user already exists - use login instead
 */
export async function signUp(page: Page, email: string, password: string) {
  await page.goto('/');

  // Wait for auth UI to load
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // Fill in signup form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Click sign up button (Supabase Auth UI)
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard after signup
  await page.waitForURL('/dashboard', { timeout: 15000 });

  // Verify we're logged in
  await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
}

/**
 * Log in an existing user
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/');

  // Wait for auth UI to load
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // Fill in login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Click sign in button
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard after login
  await page.waitForURL('/dashboard', { timeout: 15000 });

  // Verify we're logged in by checking for dashboard content
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Log out the current user
 */
export async function logout(page: Page) {
  // Look for logout button (adjust selector based on your UI)
  await page.click('button:has-text("Log out"), button:has-text("Logout"), button:has-text("Sign out")');

  // Wait for redirect to landing/login page
  await page.waitForURL('/', { timeout: 10000 });

  // Verify we're logged out
  await expect(page.locator('input[type="email"]')).toBeVisible();
}

/**
 * Ensure user is logged in before test
 * Reusable helper for test setup
 */
export async function ensureLoggedIn(page: Page) {
  const user = getTestUser();

  // Try to navigate to dashboard
  await page.goto('/dashboard');

  // If redirected to login page, log in
  if (page.url().includes('/') && !page.url().includes('/dashboard')) {
    await login(page, user.email, user.password);
  }

  // Verify we're on dashboard
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Clear all browser storage (cookies, localStorage, sessionStorage)
 * Useful for ensuring clean state between authentication tests
 *
 * NOTE: Most tests don't need this - they use the saved authenticated session
 * from global-setup. Only auth tests need to clear state.
 */
export async function clearAuth(page: Page) {
  // Clear cookies first
  await page.context().clearCookies();

  // Navigate to login page to ensure we're on a valid page
  // Use waitUntil: 'domcontentloaded' for faster navigation
  try {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
  } catch (error) {
    console.warn('Navigation failed during clearAuth, continuing anyway');
  }

  // Clear storage - wrap in try-catch for safety
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Silently ignore - might be in a context where storage isn't available
    }
  }).catch(() => {
    // Ignore evaluate errors
  });
}
