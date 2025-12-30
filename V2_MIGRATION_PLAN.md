# V2 Spec Migration Plan

This plan outlines the steps to migrate ArmsterFlow to the V2 specification, focusing on the "Funnel Approach" (Explore -> Focus -> Validate -> Learn).

## User Review Required

> [!IMPORTANT]
> **Database Changes**: This plan requires adding columns to `projects`, `project_assumptions`, and `project_interviews`.
> **Breaking Changes**: The validation stages are being restructured. Existing assumptions will need to be mapped to the new stages.

## Design Decisions

| Decision | Resolution |
|----------|------------|
| Beachhead selection at graduation | Highlight if missing, but let user proceed. Use system recommendation if not selected. |
| Stage locking enforcement | Warning only (soft lock) - users can view and interact but see "not recommended" message |
| Interview validation thresholds | Configurable via project settings or environment variables |
| Solution assumptions stage | Moving from Stage 1 to Stage 2 is acceptable breaking change |
| Interview form new fields (Big 3, metadata) | Deferred to Phase 5 |

---

## Proposed Changes

### Phase 0: Existing Data Migration (Pre-Sprint)

#### [NEW] [migrate_existing_projects.sql](file:///Users/montysharma/Documents/ArmsterFlow/supabase/migrations/v2_migrate_existing.sql)
- Migration script for existing projects in production
- Add `validation_stage` to existing assumptions based on `canvas_area`:
  - `customerSegments`, `problem` → Stage 1
  - `existingAlternatives`, `solution`, `uniqueValueProposition`, `earlyAdopters` → Stage 2
  - `channels`, `revenueStreams`, `costStructure`, `keyMetrics`, `unfairAdvantage` → Stage 3
- Set `migrated_from_step0 = false` for all existing assumptions
- Projects without beachhead get `beachhead_data = null` (will prompt on next Discovery visit)

#### [NEW] [v2MigrationService.ts](file:///Users/montysharma/Documents/ArmsterFlow/src/utils/v2MigrationService.ts)
- `migrateExistingProject(projectId)` - one-time migration for legacy projects
- `detectLegacyProject(project)` - check if project needs migration
- `showMigrationPrompt(project)` - UI prompt for existing users

#### Rollback Plan
- Keep `project_step0` data intact (don't delete after graduation)
- Add `v2_migrated_at` timestamp to projects for tracking
- Create `project_assumptions_backup` table before migration
- Provide admin script to revert individual projects if needed

---

### Phase 1: Foundation & Data Model (Sprint 1)

#### [MODIFY] [discovery.ts](file:///Users/montysharma/Documents/ArmsterFlow/src/types/discovery.ts)
- Update `CanvasArea` type to match V2 spec
- Replace `VALIDATION_GROUPS` with `VALIDATION_STAGES` structure:
  ```typescript
  stage1: ['customerSegments', 'problem']  // Customer-Problem Fit
  stage2: ['existingAlternatives', 'solution', 'uniqueValueProposition', 'earlyAdopters']  // Problem-Solution Fit
  stage3: ['channels', 'revenueStreams', 'costStructure', 'keyMetrics', 'unfairAdvantage']  // Business Viability
  ```
- Update `Assumption` interface with `migratedFromStep0`, `sourceSegment`, `validationStage`
- Update `EnhancedInterview` interface with new metadata fields

#### [NEW] [database_schema.sql](file:///Users/montysharma/Documents/ArmsterFlow/supabase/migrations/v2_schema_update.sql)
- SQL script to add `beachhead_data` to `projects`
- Add `migrated_from_step0`, `source_segment`, `validation_stage` to `project_assumptions`
- Add `matches_beachhead`, `deviation_acknowledged` to `project_interviews`
- Add `v2_migrated_at` timestamp to `projects`
- Create backup table for rollback capability

#### [NEW] [stageEvaluation.ts](file:///Users/montysharma/Documents/ArmsterFlow/src/utils/stageEvaluation.ts)
- Implement `evaluateStageStatus` logic
- Implement `canValidateAssumption` logic
- Implement `getStageRecommendation` for guidance messages

#### [NEW] [validationConfig.ts](file:///Users/montysharma/Documents/ArmsterFlow/src/config/validationConfig.ts)
- Configurable interview validation thresholds:
  ```typescript
  export const VALIDATION_CONFIG = {
    minimumInterviewsForValidation: 3,
    minimumBeachheadInterviews: 5,
    minimumSupportRatio: 0.6,
    maximumSupportRatioForInvalidation: 0.3,
    confidenceToValidate: 4,
    confidenceToInvalidate: 2,
  };
  ```
- Load from environment variables or project settings
- Provide defaults for new projects

---

### Phase 2: Step 0 Enhancements (Sprint 2)

#### [MODIFY] [Step0FirstLook.tsx](file:///Users/montysharma/Documents/ArmsterFlow/src/features/discovery/Step0FirstLook.tsx)
- **Part 1**: Update copy to encourage breadth ("Capture everyone who might have this problem. We'll narrow down later.")
- **Part 2**:
    - Implement `scoringGuidance` tooltips for Pain/Access/Willingness (1-5 scale explanations)
    - Add `beachheadReadiness` calculation and display
    - Update educational tip: "Find your BEACHHEAD: the smallest group with pain so acute they're already trying to solve it."
    - Make focus selection optional (highlight if missing, but don't block)
- **Part 3**:
    - Update assumption generation to create Identity, Severity, and Solution assumptions
    - Show assumption type indicators (WHO/WHAT/HOW labels)
    - Add review mode with checkboxes to confirm/remove auto-generated assumptions
- **Part 4**:
    - Replace simple summary with **Graduation Panel**
    - Implement beachhead selection UI with system recommendation
    - If no beachhead selected, auto-select highest scoring segment with message

#### [MODIFY] [step0Store.tsx](file:///Users/montysharma/Documents/ArmsterFlow/src/features/discovery/step0Store.tsx)
- Update store to handle new assumption types (`customerIdentity`, `problemSeverity`, `solutionHypothesis`)
- Add `graduation` action to trigger migration
- Add `getRecommendedBeachhead()` function based on scoring

#### [NEW] [graduationService.ts](file:///Users/montysharma/Documents/ArmsterFlow/src/features/discovery/graduationService.ts)
- Implement `graduateToDiscovery` function
- Implement `transformStep0ToDiscovery` mapping logic:
  - `customerIdentity` → `customerSegments` (Stage 1)
  - `problemSeverity` → `problem` (Stage 1)
  - `solutionHypothesis` → `solution` (Stage 2)
- Store beachhead selection in project
- Handle case where no beachhead selected (use system recommendation)

#### [NEW] [GraduationPanel.tsx](file:///Users/montysharma/Documents/ArmsterFlow/src/components/discovery/GraduationPanel.tsx)
- Summary of captured data (segments, problems, assumptions)
- Beachhead selection dropdown with recommendation indicator
- Warning if no beachhead selected (but allow proceed)
- "Graduate to Discovery" button with success message

---

### Phase 3: Discovery Restructure (Sprint 3)

#### [MODIFY] [AssumptionFrameworkTable.tsx](file:///Users/montysharma/Documents/ArmsterFlow/src/components/discovery/AssumptionFrameworkTable.tsx)
- Group assumptions by the new 3 stages (Customer-Problem, Problem-Solution, Business Model)
- Implement stage warning UI (soft lock):
  - Stage 2/3 assumptions visible but show "Complete Stage X first" warning
  - Allow interaction but display guidance banner
- Add progress indicators (interviews count / confidence / validation status)
- Show "Ready for Stage 2/3" guidance when previous stage validated

#### [MODIFY] [DiscoveryModule.tsx](file:///Users/montysharma/Documents/ArmsterFlow/src/components/discovery/DiscoveryModule.tsx)
- Update to use new stage definitions
- Load beachhead data from project
- Pass stage statuses to child components
- Show migration prompt for legacy projects

#### [NEW] [StageProgressBar.tsx](file:///Users/montysharma/Documents/ArmsterFlow/src/components/discovery/StageProgressBar.tsx)
- Visual progress indicator per stage
- Show: interviews completed, interviews needed, avg confidence, validation status

#### [NEW] [StageWarningBanner.tsx](file:///Users/montysharma/Documents/ArmsterFlow/src/components/discovery/StageWarningBanner.tsx)
- Reusable warning banner for locked stages
- "Stage X is not yet validated. We recommend completing it before working on Stage Y."
- Dismissible but reappears on page reload

---

### Phase 4: Interview Enhancements (Sprint 4)

#### [MODIFY] [InterviewForm.tsx](file:///Users/montysharma/Documents/ArmsterFlow/src/components/discovery/InterviewForm.tsx)
- Add `beachheadSegment` prop from project data
- Pre-populate segment field with beachhead segment name
- Add deviation warning banner (soft warning, not blocking):
  - "Different segment detected. Your beachhead is [X]. Interviewing outside your focus is okay for exploration, but 5 interviews with your beachhead are required to validate Stage 1."
  - Checkbox: "I understand - continue with this segment"
- Update assumption selector to prioritize Stage 1 assumptions
- Group assumptions by stage with visual separation
- Show stage warnings for Stage 2/3 assumptions if Stage 1 not validated

#### [MODIFY] [EnhancedInterviews.tsx](file:///Users/montysharma/Documents/ArmsterFlow/src/components/discovery/EnhancedInterviews.tsx)
- Display interview requirements (e.g., "3/5 Beachhead Interviews")
- Show progress toward Stage 1 validation
- Highlight which interviews count toward beachhead requirement

#### [NEW] [SegmentDeviationWarning.tsx](file:///Users/montysharma/Documents/ArmsterFlow/src/components/discovery/SegmentDeviationWarning.tsx)
- Reusable component for segment mismatch warning
- Tracks acknowledgment state

#### [NEW] [InterviewRequirementsCard.tsx](file:///Users/montysharma/Documents/ArmsterFlow/src/components/discovery/InterviewRequirementsCard.tsx)
- Shows current interview counts vs requirements
- Stage 1 interviews, beachhead interviews, total interviews

#### [NEW] [interviewValidation.ts](file:///Users/montysharma/Documents/ArmsterFlow/src/utils/interviewValidation.ts)
- Implement `canValidateAssumption(assumption, linkedInterviews)` function
- Check minimum interview counts from configurable thresholds
- Calculate support ratio
- Return validation eligibility with reason and suggested status

---

### Phase 5: Polish & Extended Features (Sprint 5)

#### [MODIFY] [InterviewForm.tsx](file:///Users/montysharma/Documents/ArmsterFlow/src/components/discovery/InterviewForm.tsx)
- Add Big 3 structured fields:
  - "What's working for you today?"
  - "What's your biggest challenge?"
  - "Why does this matter to you?"
- Add Key Quote capture with context field
- Add Interview Metadata fields:
  - Duration (minutes)
  - Interview type (in-person, video, phone, written)
  - Interviewee role
  - Company size (if B2B)
  - Warmth level (1-5)
  - Would refer others (boolean)
- Add Follow-up tracking:
  - Requested (boolean)
  - Type (prototype_feedback, purchase_intent, referral, other)
  - Scheduled date
  - Notes

#### [NEW] [analyticsService.ts](file:///Users/montysharma/Documents/ArmsterFlow/src/utils/analyticsService.ts)
- Implement success metrics instrumentation
- Track:
  - Step 0 completion rate
  - Graduation rate
  - Data migration success
  - Stage 1/2/3 completion rates
  - Average interviews before stage validation
  - Interview quality metrics

#### Database Updates for Phase 5
- Add columns for Big 3 fields to `project_interviews_enhanced`
- Add columns for interview metadata
- Add columns for follow-up tracking

---

## Database Schema Changes (Complete)

### Phase 0 Migration
```sql
-- Backup existing assumptions before migration
CREATE TABLE IF NOT EXISTS project_assumptions_backup AS
SELECT * FROM project_assumptions;

-- Add migration tracking to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS v2_migrated_at TIMESTAMP DEFAULT NULL;
```

### Phase 1 Schema
```sql
-- Add beachhead tracking to projects
ALTER TABLE projects
ADD COLUMN beachhead_data JSONB DEFAULT NULL;

-- Add migration tracking to assumptions
ALTER TABLE project_assumptions
ADD COLUMN migrated_from_step0 BOOLEAN DEFAULT FALSE,
ADD COLUMN source_segment VARCHAR(255),
ADD COLUMN validation_stage INTEGER DEFAULT 1;

-- Add segment match tracking to interviews
ALTER TABLE project_interviews_enhanced
ADD COLUMN matches_beachhead BOOLEAN DEFAULT NULL,
ADD COLUMN deviation_acknowledged BOOLEAN DEFAULT FALSE,
ADD COLUMN deviation_reason TEXT;

-- Performance indexes
CREATE INDEX idx_assumptions_stage ON project_assumptions(project_id, validation_stage);
CREATE INDEX idx_interviews_beachhead ON project_interviews_enhanced(project_id, matches_beachhead);
```

### Phase 5 Schema (Deferred)
```sql
-- Big 3 structured fields
ALTER TABLE project_interviews_enhanced
ADD COLUMN big3_whats_working TEXT,
ADD COLUMN big3_biggest_challenge TEXT,
ADD COLUMN big3_why_important TEXT;

-- Key quote
ALTER TABLE project_interviews_enhanced
ADD COLUMN key_quote TEXT,
ADD COLUMN key_quote_context TEXT;

-- Interview metadata
ALTER TABLE project_interviews_enhanced
ADD COLUMN duration_minutes INTEGER,
ADD COLUMN interview_type VARCHAR(50),
ADD COLUMN interviewee_role VARCHAR(255),
ADD COLUMN company_size VARCHAR(100),
ADD COLUMN warmth_level INTEGER CHECK (warmth_level BETWEEN 1 AND 5),
ADD COLUMN would_refer_others BOOLEAN;

-- Follow-up tracking
ALTER TABLE project_interviews_enhanced
ADD COLUMN followup_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN followup_type VARCHAR(50),
ADD COLUMN followup_scheduled_date DATE,
ADD COLUMN followup_notes TEXT;
```

---

## Verification Plan

### Automated Tests

#### New Unit Tests Required
- `graduationService.test.ts`:
  - Test `transformStep0ToDiscovery` mapping
  - Test beachhead selection (explicit and auto-selected)
  - Test assumption type mapping to stages
  - Test edge cases (empty assumptions, no segments)

- `stageEvaluation.test.ts`:
  - Test `evaluateStageStatus` with various interview/confidence combinations
  - Test stage unlock logic
  - Test graduation criteria evaluation

- `interviewValidation.test.ts`:
  - Test `canValidateAssumption` with configurable thresholds
  - Test support ratio calculations
  - Test beachhead interview counting

- `v2MigrationService.test.ts`:
  - Test legacy project detection
  - Test assumption stage assignment
  - Test rollback capability

#### Existing Tests
- Run existing tests to ensure no regressions: `npm run test`

### Manual Verification

#### Step 0 Flow
1. Create a new project
2. Go through Step 0, adding multiple segments (3+)
3. Verify scoring tooltips appear on hover for Pain/Access/Willingness
4. Verify beachhead readiness score displays for each segment
5. Verify auto-generated assumptions show 3 types (Identity, Severity, Solution)
6. Complete Step 0 WITHOUT selecting a beachhead
7. Verify warning appears but user can proceed
8. Verify system auto-selects highest scoring segment
9. Click "Graduate to Discovery"
10. Verify data is migrated to Discovery correctly
11. Verify assumptions appear in correct stages

#### Discovery Stages
1. Verify Stage 1 is accessible, Stage 2/3 show warnings
2. Verify assumptions are grouped correctly by stage
3. Verify progress indicators show interview counts
4. Try to interact with Stage 2 assumption - verify warning appears but action allowed
5. Complete 5 interviews for Stage 1 assumptions
6. Verify Stage 1 shows "validated" status
7. Verify Stage 2 warning changes to "unlocked"

#### Interview Flow
1. Start a new interview
2. Verify segment is pre-populated with beachhead
3. Change segment and verify deviation warning appears
4. Acknowledge warning and continue
5. Verify Stage 1 assumptions appear at top of list
6. Verify Stage 2 assumptions show "Stage 1 not validated" hint
7. Link interview to assumptions and save
8. Verify interview counts update in Discovery view

#### Legacy Project Migration
1. Load a project created before V2
2. Verify migration prompt appears
3. Accept migration
4. Verify assumptions have correct `validation_stage` assigned
5. Verify project continues to work normally

#### Rollback Testing
1. Migrate a project to V2
2. Simulate an issue
3. Run rollback script
4. Verify project returns to pre-migration state

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during graduation | Keep `project_step0` data intact; backup assumptions before migration |
| Legacy project breaks | Graceful degradation - show migration prompt, don't force |
| Stage locking too restrictive | Warning-only approach allows power users to proceed |
| Interview thresholds too high | Make configurable; can adjust per-project or globally |
| Users confused by new stages | Add onboarding tooltips; stage descriptions explain purpose |

---

## Success Metrics

### User Journey Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Step 0 completion rate | > 80% | Users who complete all 4 parts |
| Graduation rate | > 70% | Users who click "Graduate to Discovery" |
| Data migration success | 100% | Zero assumptions lost in migration |
| Stage 1 completion | > 60% | Users who validate Stage 1 assumptions |
| Interview quality | 5+ per user | Average interviews before Stage 1 validation |

### System Health Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Migration errors | 0 | Failed Step 0 → Discovery migrations |
| Orphaned assumptions | 0 | Assumptions without valid stage assignment |
| UI responsiveness | < 200ms | Stage evaluation calculation time |
| Rollback success | 100% | Successful rollbacks when needed |

---

## Sprint Summary

| Sprint | Phase | Key Deliverables |
|--------|-------|------------------|
| Pre-Sprint | Phase 0 | Existing data migration, rollback plan |
| Sprint 1 | Phase 1 | Types, database schema, stage evaluation, validation config |
| Sprint 2 | Phase 2 | Step 0 enhancements, graduation service, beachhead selection |
| Sprint 3 | Phase 3 | Discovery restructure, stage warnings, progress indicators |
| Sprint 4 | Phase 4 | Interview enhancements, segment pre-population, validation logic |
| Sprint 5 | Phase 5 | Big 3 fields, metadata, analytics, polish |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Claude | Initial migration plan |
| 2.0 | 2025-12-30 | Claude | Added Phase 0, rollback plan, configurable thresholds, unit tests, design decisions |
