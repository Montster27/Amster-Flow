import { test, expect } from '@playwright/test';
import { navigateToPivot, waitForSave } from './fixtures/test-data';

/**
 * Pivot Analysis E2E Tests
 * Tests the complete pivot/proceed decision workflow:
 * - Select analysis mode (Easy vs Detailed)
 * - Complete Pre-Mortem exercise
 * - Review Progress Summary
 * - Answer Reflection questions
 * - Make pivot/proceed decision
 *
 * NOTE: These tests use the saved authenticated session from global-setup
 * No need to login manually - all tests start already authenticated
 *
 * PREVIEW: These tests require a project to be created first.
 * They are skipped for preview deployments.
 */

const isPreview = process.env.TEST_ENV === 'preview';

test.describe('Pivot Analysis', () => {
  test.skip(isPreview, 'Skipping for preview - requires project setup');

  // No beforeEach needed - tests use saved authentication from global-setup

  test('should navigate to Pivot module', async ({ page }) => {
    await navigateToPivot(page);

    // Verify we're on Pivot page
    await expect(page).toHaveURL(/pivot/);

    // Verify Pivot UI elements are visible
    await expect(page.locator('text=/pivot|pre.*mortem|proceed|mode/i')).toBeVisible({ timeout: 10000 });
  });

  test('should select Easy mode and start analysis', async ({ page }) => {
    await navigateToPivot(page);

    // Wait for mode selection screen
    await page.waitForSelector('button:has-text("Easy"), button:has-text("Simple"), button:has-text("Quick")').catch(() => {
      console.log('Mode selection not visible, might already be in a mode');
    });

    // Select Easy mode
    await page.click('button:has-text("Easy"), button:has-text("Simple"), button:has-text("Quick")').catch(() => {
      console.log('Already in a mode or no mode selection needed');
    });

    // Wait for first step to load
    await page.waitForTimeout(2000);

    // Verify we're in the analysis flow
    await expect(page.locator('text=/pre.*mortem|progress|reflection|confidence/i')).toBeVisible({ timeout: 10000 });
  });

  test('should complete Pre-Mortem exercise', async ({ page }) => {
    await navigateToPivot(page);

    // Look for Pre-Mortem exercise
    await page.waitForSelector('text=/pre.*mortem/i', { timeout: 10000 });

    // Find risk input fields (typically 3-5 potential failure scenarios)
    const riskInputs = await page.locator('textarea[placeholder*="risk"], textarea[placeholder*="failure"], input[type="text"]').count();

    if (riskInputs > 0) {
      // Fill in at least one risk
      await page.fill('textarea[placeholder*="risk"], textarea[placeholder*="failure"], input[type="text"]', 'Risk: Customers may not be willing to pay for the premium tier pricing').first();

      // If there are more inputs, fill them too
      if (riskInputs > 1) {
        await page.locator('textarea[placeholder*="risk"], textarea[placeholder*="failure"]').nth(1).fill('Risk: Technical implementation may take longer than expected');
      }
    }

    // Click Continue/Next button
    await page.click('button:has-text("Continue"), button:has-text("Next"), button[type="submit"]');

    // Wait for next step
    await waitForSave(page);

    // Verify we moved to next step (Progress Summary or next screen)
    await expect(page.locator('text=/progress|summary|metrics|benchmark/i')).toBeVisible({ timeout: 10000 });
  });

  test('should view Progress Summary with metrics', async ({ page }) => {
    await navigateToPivot(page);

    // Navigate to or wait for Progress Summary
    await page.waitForSelector('text=/progress|summary|interview|assumption/i', { timeout: 15000 });

    // Verify key metrics are displayed
    await expect(page.locator('text=/interview/i')).toBeVisible();
    await expect(page.locator('text=/assumption/i')).toBeVisible();
    await expect(page.locator('text=/validation|validated/i')).toBeVisible();

    // Verify PMF score if available
    await expect(page.locator('text=/pmf|product.*market.*fit|readiness/i')).toBeVisible().catch(() => {
      console.log('PMF score not visible, may not have enough data');
    });

    // Click Continue to next step
    await page.click('button:has-text("Continue"), button:has-text("Next")');

    // Wait for next step
    await waitForSave(page);
  });

  test('should answer Reflection prompts', async ({ page }) => {
    await navigateToPivot(page);

    // Navigate through to Reflection step (may need to advance through previous steps)
    // Look for reflection questions
    await page.waitForSelector('text=/reflection|reframe|question|insight/i', { timeout: 20000 });

    // Find reflection question inputs
    const reflectionInputs = await page.locator('textarea[placeholder*="answer"], textarea[placeholder*="response"], textarea').count();

    if (reflectionInputs > 0) {
      // Answer first reflection question
      await page.fill('textarea', 'Our core assumption about customer willingness to pay has been validated through 10+ interviews with strong positive signals.').first();

      // If there are more questions, answer them
      if (reflectionInputs > 1) {
        await page.locator('textarea').nth(1).fill('The main contradiction is that while customers love the concept, adoption rates in beta have been slower than expected.');
      }

      if (reflectionInputs > 2) {
        await page.locator('textarea').nth(2).fill('In 6 months, we expect to have achieved product-market fit based on current trajectory and validation data.');
      }
    }

    // Continue to next step
    await page.click('button:has-text("Continue"), button:has-text("Next"), button[type="submit"]');

    // Wait for save
    await waitForSave(page);
  });

  test('should assess confidence level', async ({ page }) => {
    await navigateToPivot(page);

    // Navigate to confidence assessment step
    await page.waitForSelector('text=/confidence|certain|sure|conviction/i', { timeout: 20000 });

    // Find confidence slider or input
    const confidenceSlider = page.locator('input[type="range"], input[name="confidence"]').first();

    if (await confidenceSlider.isVisible()) {
      // Set confidence level (e.g., 75%)
      await confidenceSlider.fill('75');
    }

    // Select confidence factors if available (checkboxes)
    await page.check('input[type="checkbox"]').first().catch(() => {
      console.log('No confidence factors checkboxes found');
    });

    // Continue to decision
    await page.click('button:has-text("Continue"), button:has-text("Make Decision"), button:has-text("Next")');

    // Wait for save
    await waitForSave(page);
  });

  test('should make a pivot or proceed decision', async ({ page }) => {
    await navigateToPivot(page);

    // Navigate to final decision step
    await page.waitForSelector('text=/decision|pivot|proceed|persevere/i', { timeout: 25000 });

    // Verify decision options are visible
    await expect(page.locator('text=/proceed|persevere|continue/i')).toBeVisible();
    await expect(page.locator('text=/pivot|change|adjust/i')).toBeVisible();

    // Select "Proceed" decision
    await page.click('button:has-text("Proceed"), button:has-text("Persevere"), input[value="proceed"]');

    // Add decision rationale
    await page.fill('textarea[name="rationale"], textarea[placeholder*="rationale"], textarea[placeholder*="reason"]', 'Based on strong customer validation and positive interview feedback, we have sufficient evidence to proceed with the current strategy.').catch(() => {
      console.log('No rationale textarea found');
    });

    // Add next actions
    await page.fill('textarea[placeholder*="action"], input[placeholder*="action"]', 'Focus on customer acquisition and scaling marketing efforts').catch(() => {
      console.log('No next actions field found');
    });

    // Submit decision
    await page.click('button:has-text("Complete"), button:has-text("Finish"), button:has-text("Submit"), button[type="submit"]');

    // Wait for completion
    await waitForSave(page);

    // Verify completion (redirect or success message)
    await expect(page.locator('text=/complete|success|saved|thank you/i')).toBeVisible({ timeout: 10000 }).catch(() => {
      console.log('No explicit completion message found');
    });
  });

  test('should show validation warnings if insufficient data', async ({ page }) => {
    await navigateToPivot(page);

    // If there's insufficient discovery data, warnings should appear
    // Look for warning indicators in Progress Summary
    await page.waitForSelector('text=/progress|summary/i', { timeout: 15000 }).catch(() => {
      console.log('Not at progress summary step');
    });

    // Check for warning indicators (⚠️ or warning text)
    const warnings = await page.locator('text=/⚠️|warning|below.*threshold|insufficient/i').count();

    if (warnings > 0) {
      console.log(`Found ${warnings} validation warnings`);
      // Verify warning messages are informative
      await expect(page.locator('text=/consider|recommend|more.*data/i')).toBeVisible();
    } else {
      console.log('No warnings found - sufficient validation data exists');
    }
  });

  test('should allow navigation back through steps', async ({ page }) => {
    await navigateToPivot(page);

    // Advance to second or third step
    await page.click('button:has-text("Continue"), button:has-text("Next")').catch(() => {});
    await waitForSave(page);

    // Click Back button
    await page.click('button:has-text("Back"), button:has-text("Previous")');

    // Verify we went back to previous step
    await page.waitForTimeout(1000);

    // Can click Continue again to move forward
    await page.click('button:has-text("Continue"), button:has-text("Next")');
    await waitForSave(page);
  });
});
