# Implementation Plan - Optimize Data Saving

## Goal
Refactor `useProjectData.ts` to eliminate redundant database writes. Currently, the hook saves *all* project data (every answer in every module) whenever *any* single piece of data changes. This is inefficient (O(N) operations per change).

## User Review Required
> [!NOTE]
> This change introduces local state comparison (diffing) to determine what to save. This is a standard optimization pattern but adds slightly more logic to the hook.

## Proposed Changes

### Hooks (`src/hooks`)

#### [MODIFY] `useProjectData.ts`
1.  **Introduce `lastSavedProgress` Ref**: Store the state of data that was last successfully saved to the database.
2.  **Implement Diffing Logic**:
    *   Inside the save effect, compare the current `progress` with `lastSavedProgress.current`.
    *   Identify specific modules where `answers` or `completed` status have changed.
    *   For changed modules, identify specific answers that have changed.
3.  **Targeted Updates**:
    *   Only call `supabase.upsert` for the specific answers that changed.
    *   Only call `supabase.upsert` for module completion if it changed.
4.  **Update Ref**: After successful save, update `lastSavedProgress.current` to match the current `progress`.

## Verification Plan

### Manual Verification (Step-by-Step)

#### 1. Setup
*   Open the application in your browser (e.g., `http://localhost:5173`).
*   Open **Developer Tools** (F12 or `Cmd+Option+I` on Mac).
*   Select the **Network** tab.
*   In the "Filter" box at the top left of the Network tab, type: `project_modules`.
*   Ensure the "Fetch/XHR" filter is selected.

#### 2. Verify Optimization
*   **Action**: Go to any module (e.g., "Problem") and type a single character into one of the answer boxes.
*   **Wait**: Wait for about 1 second (the debounce time).
*   **Observation**:
    *   **Before Fix**: You might see multiple requests or a request with a large payload containing *all* answers for that module.
    *   **After Fix**: You should see **exactly one** network request appear.
*   **Inspect Payload**:
    *   Click on the network request name (e.g., `project_modules?...`).
    *   Click on the **Payload** (or **Request**) tab in the side panel.
    *   **Success Criteria**: The payload should contain **ONLY** the `answer` you just modified (along with `project_id`, `module_name`, `question_index`). It should NOT contain answers for other questions.

#### 3. Verify Persistence
*   Refresh the page.
*   Check that your change is still there. This confirms the targeted save actually worked.
