# Manual Verification Guide: App.tsx Refactoring

This guide details how to manually verify the recent refactoring of `App.tsx` and the introduction of `ProjectDataProvider`.

## Prerequisites
*   Ensure the development server is running (`npm run dev`).
*   Open the browser to `http://localhost:5173` (or your local port).
*   Open the Browser Developer Tools (F12 or Right Click -> Inspect -> Console).

## Test Scenarios

### 1. Initial Load & Context Initialization
*   **Action**: Log in and navigate to the **Dashboard**. Click on any existing project to open it.
*   **Expected Behavior**:
    *   You should see a loading spinner briefly ("Loading project...").
    *   The project view should load successfully.
    *   **Critical**: The Sidebar should appear on the left with a list of modules.
    *   **Critical**: The main content area should show the "Problem" module (or whichever was last active).
    *   **Console Check**: Ensure there are NO red errors in the console, specifically looking for "useProjectContext must be used within a ProjectContextProvider".

### 2. Data Availability (Context Check)
*   **Action**: Look at the questions displayed in the main panel.
*   **Expected Behavior**:
    *   The Title (e.g., "The Problem") and Intro text should be visible.
    *   The specific questions (e.g., "What is the specific problem...?") should be visible.
    *   *Note*: If these are visible, it proves `ProjectDataProvider` successfully loaded `questions.json` and passed it via `ProjectDataContext`.

### 3. Data Persistence (Hook Integration)
*   **Action**:
    1.  Navigate to the **"Problem"** module.
    2.  Find the first question.
    3.  Type a unique string (e.g., "Test Refactor [Timestamp]").
    4.  Wait 2-3 seconds (to allow the auto-save debounce to fire).
    5.  **Reload the page** (Cmd+R / Ctrl+R).
*   **Expected Behavior**:
    *   After reload, the text "Test Refactor [Timestamp]" should still be in the input field.
    *   *Note*: This proves `useProjectData` is correctly integrated within `ProjectDataProvider` and syncing with Supabase.

### 4. Navigation & State Preservation
*   **Action**:
    1.  Click on a different module in the Sidebar (e.g., "Solution").
    2.  Verify the content changes to the Solution module.
    3.  Click back to the "Problem" module.
*   **Expected Behavior**:
    *   The view should switch instantly.
    *   Your previous answer in "Problem" should still be there.

### 5. Error Boundary Test (Optional but Recommended)
*   **Action**:
    1.  In your code editor, temporarily modify `src/components/ProjectDataProvider.tsx`.
    2.  Change the fetch URL from `/questions.json` to `/non-existent.json`.
    3.  Save and reload the app.
*   **Expected Behavior**:
    *   You should see the Error UI: "Error Loading Guide" with a "Retry" button.
    *   **Recovery**: Undo the change in code, save, and click "Retry". The app should load normally.

## Troubleshooting
If you see a blank screen or errors:
1.  **Blank Screen**: Check the Console. If you see `ProjectContext is undefined`, it means `App` is not correctly wrapped by `ProjectDataProvider` in `ProjectPage.tsx`.
2.  **Infinite Loading**: Check the Network tab. Ensure `questions.json` is returning 200 OK and `project_modules` requests are succeeding.
