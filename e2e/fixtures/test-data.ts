import { Page } from '@playwright/test';
import { getTestDataPrefix, shouldCreateTestData, isProduction } from './environment';
import { cleanupTestData as cleanupHelper } from '../helpers/cleanup';

/**
 * Test data generation helpers
 * Provides utilities for creating test data in E2E tests
 * Environment-aware: Prevents data creation in production
 */

/**
 * Generate a unique timestamp-based ID with environment prefix
 */
export function generateUniqueId(): string {
  const prefix = getTestDataPrefix();
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique project name with environment awareness
 * Production: Throws error to prevent accidental data creation
 */
export function generateProjectName(): string {
  if (!shouldCreateTestData()) {
    throw new Error('Test data creation not allowed in production environment');
  }

  const prefix = getTestDataPrefix();
  return `${prefix} Test Project`;
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
  if (!shouldCreateTestData()) {
    throw new Error('Test data creation not allowed in production environment');
  }

  const prefix = getTestDataPrefix();
  return {
    title: `${prefix} Assumption`,
    description: `Test assumption created at ${new Date().toISOString()}`,
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
  if (!shouldCreateTestData()) {
    throw new Error('Test data creation not allowed in production environment');
  }

  const prefix = getTestDataPrefix();
  return {
    participantName: `${prefix} Participant`,
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
  if (!shouldCreateTestData()) {
    throw new Error('Test data creation not allowed in production environment');
  }

  const prefix = getTestDataPrefix();
  return {
    name: `${prefix} Actor`,
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
  await page.getByRole('link', { name: /discovery/i }).click();
  await page.waitForURL(/discovery/);
}

/**
 * Navigate to Visual Sector Map
 */
export async function navigateToSectorMap(page: Page) {
  await page.goto('/dashboard');
  await page.getByRole('link', { name: /sector.*map/i }).click();
  await page.waitForURL(/sector/);
}

/**
 * Navigate to Pivot module
 */
export async function navigateToPivot(page: Page) {
  await page.goto('/dashboard');
  await page.getByRole('link', { name: /pivot/i }).click();
  await page.waitForURL(/pivot/);
}

/**
 * Clean up test data (call in afterEach)
 * Environment-aware: Production only clears browser storage
 */
export async function cleanupTestData(page: Page) {
  await cleanupHelper(page);
}
