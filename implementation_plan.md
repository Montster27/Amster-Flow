# Implementation Plan - Enhanced Discovery & Interview System

## Goal
Finalize the integration of the **Enhanced Interview System** into the ArmsterFlow Discovery Module. This feature introduces structured interview capture, assumption tagging, automated synthesis, and a validation board.

## Significance of Change
- **User Experience (High Impact)**: This is a **complete overhaul** of the UI. We are moving from a linear, scrolling form to a **dashboard-style layout**. This will make the feature feel much more modern and easier to digest at a glance.
- **Code Structure (Moderate Impact)**: The monolithic `SectorMapModule.tsx` (480+ lines) will be refactored into smaller, focused components (`SectorMapHeader`, `TargetCustomerCard`, `CompetitorGrid`, etc.).
- **Data Model (No Impact)**: The underlying data structure (`SectorMapContext`, Supabase tables) remains exactly the same. No database migrations are needed.

## Detailed Design Proposal

### 1. The "Sector Map Dashboard" Layout
Instead of one long page, the view is divided into two distinct zones:

**Zone A: The Target (Left Column / Top on Mobile)**
*Focus: Who are we serving?*
- **Visual Style**: A prominent, sticky card that anchors the map.
- **Content**:
    - **Header**: "First Target Customer" with an "Edit" pencil icon.
    - **Display**: Key fields (Description, Location, Company Size) shown as a clean definition list.
    - **Interaction**: Clicking "Edit" opens a modal, keeping the main view stable.

**Zone B: The Ecosystem (Right Column / Bottom on Mobile)**
*Focus: Who else is in the play?*
- **Tabs/Toggles**: Switch between "Competitors" and "Decision Makers" (if B2C).
- **Competitors Grid**:
    - **Cards**: Each competitor is a card, not a table row.
    - **Card Header**: Competitor Name + Menu dots (Edit/Delete).
    - **Card Body**: Brief description.
    - **Card Footer**: Two distinct sections for "Suppliers" and "Customers".
        - *Empty State*: "No suppliers added" (in gray).
        - *Populated*: Tags/Chips for each supplier/customer.
    - **"Add New" Card**: A dashed-border card at the end of the grid that triggers the "Add Competitor" modal.

### 2. Interaction Design
- **Modals over Inline Editing**:
    - Currently, the UI shifts and expands when editing.
    - **New Approach**: Editing happens in a centered Modal dialog. This focuses the user on the task (e.g., "Editing Competitor Details") without cluttering the dashboard.
- **Empty States**:
    - Instead of blank white space, use friendly text: *"No competitors mapped yet. Who are you fighting against?"*

### 3. Visual Style (Tailwind)
- **Background**: Light gray (`bg-gray-50`) for the page, White (`bg-white`) for cards to create depth.
- **Typography**:
    - Headings: `text-gray-900 font-semibold`
    - Body: `text-gray-600`
    - Labels: `text-xs font-bold uppercase tracking-wider text-gray-500`
- **Accents**:
    - **B2B Mode**: Blue/Indigo theme.
    - **B2C Mode**: Emerald/Teal theme (to visually distinguish the modes).

## Proposed Component Structure
```text
src/components/sector-map/
├── SectorMapDashboard.tsx       # Main container (Grid layout)
├── SectorMapHeader.tsx          # Title + B2B/B2C Toggle
├── TargetCustomerCard.tsx       # Zone A display
├── CompetitorGrid.tsx           # Zone B container
├── CompetitorCard.tsx           # Individual competitor card
├── DecisionMakerList.tsx        # Zone B alternative (B2C)
└── modals/
    ├── EditTargetModal.tsx
    ├── ManageCompetitorModal.tsx
    └── ManageDecisionMakerModal.tsx
```
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
