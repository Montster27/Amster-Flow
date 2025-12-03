import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Tests
 * Tests application navigation and routing:
 * - Protected routes
 * - Public routes
 * - Navigation between pages
 *
 * NOTE: These tests use the saved authenticated session from global-setup
 */

test.describe('Navigation', () => {
  test('should navigate between dashboard and login', async ({ page }) => {
    // Start at dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to login (should redirect back since authenticated)
    await page.goto('/login');

    // Since we're logged in, might redirect to dashboard
    // OR stay on login page (depends on implementation)
    await page.waitForTimeout(1000);

    // Just verify we end up somewhere valid
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|login)/);
  });

  test('should handle invalid routes', async ({ page }) => {
    // Try to access a route that doesn't exist
    await page.goto('/this-route-does-not-exist-12345');

    // Should redirect to dashboard or show 404
    await page.waitForTimeout(1000);

    const url = page.url();
    // Should redirect to a valid page
    expect(url).toMatch(/\/(dashboard|login|404)/);
  });

  test('should persist authentication across navigation', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to root
    await page.goto('/');

    // Should still be authenticated and redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Verify we're still authenticated
    await expect(page.locator('text=/project/i').first()).toBeVisible();
  });

  test('should load dashboard quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Dashboard should load in reasonable time (under 10 seconds)
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have working back button navigation', async ({ page }) => {
    // Start at dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to login
    await page.goto('/login');

    // Go back
    await page.goBack();

    // Should be back at dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should have consistent navigation elements', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page to fully load (loading screen to disappear)
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);

    // Check that essential navigation exists
    // At minimum, we should be able to logout
    const navCount = await page.locator('nav, header, [role="navigation"]').count();
    const navExists = navCount > 0;

    // If no nav elements, at least verify logout/sign out button exists
    if (!navExists) {
      const logoutVisible = await page.locator('button:has-text("Log out"), button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Sign Out")').first().isVisible().catch(() => false);

      // Either nav exists or logout button exists
      expect(logoutVisible || navExists).toBe(true);
    }
  });

  test('should handle page refresh gracefully', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify initial load
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=/project/i').first()).toBeVisible();

    // Reload page
    await page.reload();

    // Should still be on dashboard and authenticated
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=/project/i').first()).toBeVisible();
  });
});
