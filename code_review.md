# ArmsterFlow Code Review

**Date:** 2025-11-19
**Reviewer:** Antigravity

## Executive Summary

The ArmsterFlow project is a React/Vite application with Supabase integration. The frontend architecture is generally sound, utilizing modern React patterns (Hooks, Context) and a clear component structure. However, the database layer is in a critical state with significant issues regarding schema consistency, RLS policies, and security.

**Overall Health:** ⚠️ **At Risk** (due to database issues)

---

## 1. 🚨 Critical Database Issues

The most urgent findings come from `DATABASE_ISSUES_REPORT.md`. These require immediate attention to ensure data integrity and security.

*   **Missing Tables**: `notifications` and `project_module_completion` are missing from `schema.sql`.
*   **Conflicting RLS Policies**: Multiple migration files define conflicting policies for the `projects` table.
*   **Security Risks**:
    *   `notifications` table allows ANY authenticated user to insert rows (potential spam/spoofing vector).
    *   Missing admin policies for several tables (e.g., `project_assumptions`, `project_interviews`).
*   **Data Integrity**: Missing `ON DELETE CASCADE` on foreign keys linking to `profiles`. If a user is deleted, their data becomes orphaned.

**Recommendation**: Prioritize the "Recommended Action Plan" in `DATABASE_ISSUES_REPORT.md` before adding new features.

---

## 2. Application Architecture

### Frontend Structure
*   **Framework**: Vite + React + TypeScript. Good choice for performance and developer experience.
*   **State Management**: `GuideContext` effectively manages the questionnaire state. `useProjectData` handles synchronization with Supabase.
*   **Routing**: React Router is used (implied by `package.json`), but `App.tsx` seems to handle some internal module navigation manually.

### Data Fetching
*   **Hooks**: Custom hooks like `useProjectData`, `useDiscoveryData`, etc., encapsulate data fetching logic well.
*   **Optimization**: `useProjectData` debounces saves to Supabase, which is good for reducing API calls.
    *   **Improvement**: The current implementation saves *all* module data on every save. It should be optimized to only `upsert` the specific records that changed.

---

## 3. Code Quality & Best Practices

### TypeScript
*   **Typing**: Generally good usage of TypeScript. Interfaces are defined in `App.tsx` and `types/database.ts`.
*   **Type Safety**: `validateQuestionsData` in `App.tsx` provides runtime validation for external JSON data, which is a robust practice.

### Component Design
*   **Modularity**: Components are small and focused (`QuestionPanel`, `Sidebar`).
*   **Accessibility (a11y)**:
    *   `Sidebar.tsx` uses `aria-label`, `role="status"`, and `aria-current`.
    *   `QuestionPanel.tsx` uses `aria-labelledby` and `role="progressbar"`.
    *   **Verdict**: Above average attention to accessibility.

### Error Handling
*   **Sentry**: `captureException` is used in `App.tsx` and `useProjectData.ts`. This is excellent for production monitoring.
*   **UI Feedback**: Loading and error states are handled gracefully in `App.tsx`.

---

## 4. Specific Code Observations

### `src/hooks/useProjectData.ts`
```typescript
// Current implementation saves everything
for (const [moduleName, moduleProgress] of Object.entries(progress)) {
  for (const answer of moduleProgress.answers) {
    await supabase.from('project_modules').upsert(...)
  }
}
```
**Issue**: This is O(N) where N is total answers. As the app grows, this will become slow and costly.
**Fix**: Track "dirty" fields or only save the specific answer that triggered the update.

### `src/components/Sidebar.tsx`
*   **Hardcoded Values**: Email `Monty_Sharma@brown.edu` is hardcoded.
    *   **Fix**: Move to a configuration file or environment variable.
*   **Logic**: The "Pivot or Proceed" logic (`totalInterviews >= 3`) is hardcoded. Consider moving this to a constant or config.

### `src/App.tsx`
*   **Mixed Responsibilities**: `App.tsx` handles data fetching, routing logic, and layout.
    *   **Refactor**: Consider moving the data fetching logic into a wrapper component (e.g., `ProjectDataProvider`) to clean up the main app component.

---

## 5. Recommendations

### Immediate (High Priority)
1.  **Fix Database**: Execute the remediation plan from `DATABASE_ISSUES_REPORT.md`.
2.  **Secure Notifications**: Fix the RLS policy for `notifications` to prevent unauthorized inserts.

### Short Term (Medium Priority)
3.  **Optimize Data Saving**: Refactor `useProjectData` to only save changed answers.
4.  **Refactor App.tsx**: Extract data loading logic into a dedicated provider.

### Long Term (Low Priority)
5.  **Hardcoded Strings**: Extract text and emails into a constants file or i18n system.
6.  **Testing**: Ensure `vitest` tests are running in CI/CD.

---

**Signed:** Antigravity
