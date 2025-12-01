import { Page } from '@playwright/test';

/**
 * Test data generation helpers
 * Provides utilities for creating test data in E2E tests
 */

/**
 * Generate a unique timestamp-based ID
 */
export function generateUniqueId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique project name
 */
export function generateProjectName(): string {
  return `Test Project ${Date.now()}`;
}

/**
 * Generate test assumption data
 */
export interface TestAssumption {
  title: string;
  description: string;
  category: 'customer' | 'problem' | 'solution' | 'market';
  risk: 'high' | 'medium' | 'low';
}

export function generateAssumption(overrides?: Partial<TestAssumption>): TestAssumption {
  const id = generateUniqueId();
  return {
    title: `Test Assumption ${id}`,
    description: `This is a test assumption created at ${new Date().toISOString()}`,
    category: 'customer',
    risk: 'high',
    ...overrides,
  };
}

/**
 * Generate test interview data
 */
export interface TestInterview {
  participantName: string;
  date: string;
  notes: string;
}

export function generateInterview(overrides?: Partial<TestInterview>): TestInterview {
  const id = generateUniqueId();
  return {
    participantName: `Test Participant ${id}`,
    date: new Date().toISOString().split('T')[0],
    notes: `Test interview notes created at ${new Date().toISOString()}`,
    ...overrides,
  };
}

/**
 * Generate test actor data for Visual Sector Map
 */
export interface TestActor {
  name: string;
  type: 'customer' | 'stakeholder' | 'partner' | 'competitor';
  description?: string;
}

export function generateActor(overrides?: Partial<TestActor>): TestActor {
  const id = generateUniqueId();
  return {
    name: `Test Actor ${id}`,
    type: 'customer',
    description: `Test actor description`,
    ...overrides,
  };
}

/**
 * Wait for data to be saved (useful after form submissions)
 */
export async function waitForSave(page: Page, timeout = 5000) {
  // Wait for any loading indicators to disappear
  await page.waitForSelector('[data-loading="true"]', { state: 'hidden', timeout }).catch(() => {});

  // Wait for success toast/message if present
  await page.waitForSelector('text=/saved|success/i', { timeout }).catch(() => {});

  // Small delay to ensure state updates
  await page.waitForTimeout(500);
}

/**
 * Navigate to Discovery module
 */
export async function navigateToDiscovery(page: Page) {
  await page.goto('/dashboard');
  await page.click('text=/discovery/i, a[href*="discovery"]');
  await page.waitForURL(/discovery/);
}

/**
 * Navigate to Visual Sector Map
 */
export async function navigateToSectorMap(page: Page) {
  await page.goto('/dashboard');
  await page.click('text=/sector.*map/i, a[href*="sector"]');
  await page.waitForURL(/sector/);
}

/**
 * Navigate to Pivot module
 */
export async function navigateToPivot(page: Page) {
  await page.goto('/dashboard');
  await page.click('text=/pivot/i, a[href*="pivot"]');
  await page.waitForURL(/pivot/);
}

/**
 * Clean up test data (call in afterEach)
 * Note: This requires database access - implement based on your cleanup strategy
 */
export async function cleanupTestData(page: Page) {
  // Option 1: Delete via UI (slower but safer)
  // Navigate to settings and delete test project

  // Option 2: Direct database cleanup (faster but requires setup)
  // Use Supabase client to delete test data

  // For now, just clear browser state
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
