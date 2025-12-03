/**
 * Test data cleanup utilities
 *
 * Provides functions to clean up test data after test execution
 * Behavior varies by environment to ensure production safety
 */

import { Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { getTestEnvironment, isProduction, getTestDataPrefix } from '../fixtures/environment';

/**
 * Clean up test data from browser storage
 * Safe for all environments
 */
export async function clearBrowserStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear browser storage:', error);
    }
  });
}

/**
 * Clean up test projects from database
 * Production: Browser storage only (no database cleanup)
 * Non-production: Delete test projects created during this test run
 */
export async function cleanupTestData(page: Page): Promise<void> {
  const env = getTestEnvironment();

  // Production: only clear browser state, don't delete data
  if (isProduction()) {
    console.log('🔒 Production environment: Only clearing browser storage');
    await clearBrowserStorage(page);
    return;
  }

  // Non-production: can delete test projects
  console.log(`🧹 Cleaning up test data for ${env} environment`);

  try {
    await clearBrowserStorage(page);

    // Optional: Add database cleanup here if needed
    // await deleteTestProjects();
  } catch (error) {
    console.warn('Cleanup partially failed:', error);
  }
}

/**
 * Delete test projects from the database
 * Only for non-production environments
 */
export async function deleteTestProjects(): Promise<void> {
  if (isProduction()) {
    throw new Error('Cannot delete test projects in production environment');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const testUserEmail = process.env.TEST_USER_EMAIL;
  const testUserPassword = process.env.TEST_USER_PASSWORD;

  if (!supabaseUrl || !supabaseKey || !testUserEmail || !testUserPassword) {
    console.warn('Missing Supabase credentials, skipping database cleanup');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Login as test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (authError) {
      console.warn('Failed to authenticate for cleanup:', authError.message);
      return;
    }

    // Delete all test projects (those starting with E2E prefix)
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, name')
      .like('name', 'E2E-%');

    if (fetchError) {
      console.warn('Failed to fetch test projects:', fetchError.message);
      return;
    }

    if (projects && projects.length > 0) {
      console.log(`Deleting ${projects.length} test project(s)...`);

      for (const project of projects) {
        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .eq('id', project.id);

        if (deleteError) {
          console.warn(`Failed to delete project ${project.name}:`, deleteError.message);
        } else {
          console.log(`✓ Deleted project: ${project.name}`);
        }
      }
    }

    // Sign out
    await supabase.auth.signOut();
  } catch (error) {
    console.warn('Database cleanup failed:', error);
  }
}

/**
 * Delete old test data (older than specified hours)
 * Useful for periodic cleanup
 */
export async function deleteOldTestData(hoursOld: number = 24): Promise<void> {
  if (isProduction()) {
    throw new Error('Cannot delete test data in production environment');
  }

  const cutoffTime = Date.now() - (hoursOld * 60 * 60 * 1000);
  console.log(`Deleting test data older than ${hoursOld} hours (before ${new Date(cutoffTime).toISOString()})...`);

  // Implementation would parse timestamp from project name
  // and delete projects older than cutoff
  // Left as exercise for future enhancement
}
