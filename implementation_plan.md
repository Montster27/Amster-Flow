# Implementation Plan - Enhanced Discovery & Interview System

## Goal
Finalize the integration of the **Enhanced Interview System** into the ArmsterFlow Discovery Module. This feature introduces structured interview capture, assumption tagging, automated synthesis, and a validation board.

## User Review Required
> [!IMPORTANT]
> **Coexistence Strategy**: The user has requested to **maintain the old system** alongside the new one. The new system will be titled **"Discovery 2.0"**.
> **Database Status**: The plan assumes the migration `20251110133543_add_enhanced_interview_system.sql` has been applied. I will verify this.

## Proposed Changes

### 1. Database Verification
*   **Verify Tables**: Confirm `project_interviews_enhanced`, `interview_assumption_tags`, and `interview_synthesis` exist.
*   **Verify RLS**: Ensure Row Level Security policies allow authenticated users to read/write their own project data.

### 2. Backend Integration (Frontend Hooks)
*   **Audit `useEnhancedInterviews.ts`**:
    *   Confirm it uses `supabase` client (not mocks).
    *   Verify `addInterview` correctly inserts into `project_interviews_enhanced` AND `interview_assumption_tags` (transactional integrity).
    *   Verify `updateInterview` handles tag updates correctly (delete old tags + insert new).
*   **Audit `useDiscoveryData.ts`**:
    *   Ensure it correctly syncs `assumptions` and `iterations` with Supabase.
    *   Confirm it does *not* conflict with `useEnhancedInterviews`.

### 3. UI Integration
*   **`DiscoveryModule.tsx`**:
    *   **Update Navigation**: Add a clear way to switch between "Classic Discovery" and "Discovery 2.0".
    *   **Labeling**: Ensure the new tab/section is clearly labeled "Discovery 2.0".
*   **`InterviewSystemWrapper.tsx`**:
    *   Verify "Synthesis Mode" and "Dashboard" switching.
    *   Ensure it functions independently of the legacy interview log.

### 4. Feature Verification
*   **Synthesis Mode**: Test `synthesizeInterviews` utility with real data.
*   **Assumption Board**: Verify it correctly calculates "Supported/Contradicted" counts from the new `interview_assumption_tags` table.

## Verification Plan

### Automated Tests
*   Run existing tests: `npm test`
*   Add new tests for `useEnhancedInterviews` if missing.

### Manual Verification
1.  **Create Assumption**: Add a new assumption in the "Assumptions" tab.
2.  **Conduct Interview**: Create a new interview in "Interviews" tab, tagging the assumption.
3.  **Check Board**: Verify the assumption moves to "Testing" or "Validated" on the "Validation Board".
4.  **Run Synthesis**: Select the interview in "Dashboard" and run "Synthesis" to see if patterns are detected.
