import { test, expect } from '@playwright/test';
import { login, logout, clearAuth, getTestUser } from './fixtures/auth';

/**
 * Authentication E2E Tests
 * Tests the complete authentication flow: login → logout → login again
 */

test.describe('Authentication', () => {
  // Note: These tests need to clear auth to test login flow
  // Other tests use the saved authentication from global-setup
  test.beforeEach(async ({ page }) => {
    // Clear auth state before each test
    await clearAuth(page);
  });

  test('should login with valid credentials @smoke @critical', async ({ page }) => {
    const user = getTestUser();

    // Navigate to login page
    await page.goto('/');

    // Verify we're on login page
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Login
    await login(page, user.email, user.password);

    // Verify successful login - should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify dashboard content is visible
    await expect(page.locator('text=/dashboard|welcome/i')).toBeVisible({ timeout: 10000 });
  });

  test('should show error with invalid credentials @local @preview', async ({ page }) => {
    await page.goto('/');

    // Try to login with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should remain on login page
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/');

    // Should show error message (Supabase Auth UI shows error)
    // Note: Exact error message depends on Supabase Auth UI configuration
    await expect(page.locator('text=/invalid|error|wrong/i')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    const user = getTestUser();

    // Login first
    await page.goto('/');
    await login(page, user.email, user.password);

    // Verify logged in
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await logout(page);

    // Verify logged out - should be on login page
    await expect(page).toHaveURL('/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should persist session after page reload', async ({ page }) => {
    const user = getTestUser();

    // Login
    await page.goto('/');
    await login(page, user.email, user.password);

    // Verify logged in
    await expect(page).toHaveURL(/\/dashboard/);

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=/dashboard|welcome/i')).toBeVisible({ timeout: 10000 });
  });

  test('should redirect to login when accessing protected route while logged out', async ({ page }) => {
    // Clear any existing auth
    await clearAuth(page);

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
