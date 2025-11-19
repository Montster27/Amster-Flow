# Implementation Plan - Extract Hardcoded Values

## Goal
Centralize configuration values and hardcoded strings to improve maintainability and make it easier to update global settings (like support emails or logic thresholds).

## User Review Required
> [!NOTE]
> I will be creating a new `src/config` directory to house these constants.

## Proposed Changes

### Configuration (`src/config`)

#### [NEW] `constants.ts`
*   **Purpose**: Store application-wide constants.
*   **Content**:
    ```typescript
    export const APP_CONFIG = {
      SUPPORT_EMAIL: 'Monty_Sharma@brown.edu',
      THRESHOLDS: {
        MIN_INTERVIEWS_FOR_PIVOT: 3,
      },
      LINKS: {
        // Any other external links
      }
    };
    ```

### Components (`src/components`)

#### [MODIFY] `Sidebar.tsx`
*   **Import**: `APP_CONFIG` from `../config/constants`.
*   **Replace**:
    *   `"mailto:Monty_Sharma@brown.edu"` -> `\`mailto:${APP_CONFIG.SUPPORT_EMAIL}\``
    *   `totalInterviews >= 3` -> `totalInterviews >= APP_CONFIG.THRESHOLDS.MIN_INTERVIEWS_FOR_PIVOT`

## Verification Plan

### Manual Verification
1.  **Support Email**: Open the "About / Help" modal in the Sidebar and verify the email is still displayed correctly and the link works.
2.  **Pivot Logic**: Verify that the "Pivot or Proceed" button is enabled/disabled correctly based on the interview count (currently 3).
