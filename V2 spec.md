# ArmsterFlow V2 Specification

## From Broad Exploration to Focused Validation

**Version:** 2.0  
**Date:** December 30, 2025  
**Status:** Draft Specification

---

## 1. Design Philosophy

### Core Principle: Progressive Narrowing

ArmsterFlow V2 embraces a **funnel approach** to customer discovery:

```
Step 0: EXPLORE (Broad)
   ↓
   Accept wide segments, many problems, multiple solutions
   Goal: Capture all possibilities without judgment
   ↓
Graduation: FOCUS (Transition)
   ↓
   Guide user to select beachhead segment
   Migrate assumptions with narrowing prompts
   ↓
Discovery: VALIDATE (Narrow)
   ↓
   Test specific assumptions about specific people
   Structured stages enforce progression
   ↓
Interviews: LEARN (Evidence)
   ↓
   Gather evidence from the focused segment
   Update confidence based on real conversations
```

### Key Design Changes from V1

|V1 Approach|V2 Approach|
|---|---|
|Step 0 pushes for "right" answers|Step 0 welcomes all inputs, defers narrowing|
|Data gap between Step 0 → Discovery|Explicit "Graduation" transition with data migration|
|Solution assumptions in Stage 1|Customer-Problem assumptions first, then Solution|
|Free-text segment in interviews|Pre-populated segment with deviation warnings|
|No minimum interview thresholds|Evidence requirements before validation|

---

## 2. Step 0: First Look Assessment (Revised)

### 2.1 Overall Flow

```
Part 0: Idea Statement (unchanged)
Part 1: Customers & Problems (allow breadth)
Part 2: Segment Ranking (educate, don't force)
Part 3: Assumption Generation (broad capture)
Part 4: Summary + Graduation Prompt
```

### 2.2 Part 1: Customers & Problems

**Change:** Remove pressure to narrow. Accept multiple segments and overlapping problems.

**UI Changes:**

- Remove any warning about "too many segments"
- Add encouraging copy: "Capture everyone who might have this problem. We'll narrow down later."
- Allow up to 6 customer segments (current limit) with positive framing

**Rationale:** Users often don't know their best segment upfront. Premature narrowing leads to wrong focus.

### 2.3 Part 2: Segment Ranking (Modified)

**Current State:** Ranks by Pain/Access/Willingness, user selects focus segment.

**V2 Changes:**

1. **Enhanced Scoring Guidance**

Add hover tooltips explaining each dimension:

```typescript
const scoringGuidance = {
  pain: {
    1: "Mild inconvenience - they can live with it",
    2: "Noticeable problem - they complain but don't act",
    3: "Significant issue - they've tried workarounds",
    4: "Severe problem - actively searching for solutions",
    5: "Desperate - will pay almost anything to solve it"
  },
  access: {
    1: "Very hard to reach - no clear channels",
    2: "Difficult - requires significant effort",
    3: "Moderate - some connections or channels exist",
    4: "Good access - clear path to reach them",
    5: "Immediate access - can contact within 48 hours"
  },
  willingness: {
    1: "Unlikely to talk - very private or busy",
    2: "Hesitant - would need strong incentive",
    3: "Neutral - might talk if approached well",
    4: "Open - generally willing to share experiences",
    5: "Eager - enjoys discussing challenges and solutions"
  }
};
```

2. **Add "Beachhead Readiness" Score**

Display alongside total score:

```typescript
const beachheadReadiness = (segment) => {
  const isSmallEnough = segment.size < 10000; // or user-defined
  const painIsAcute = segment.pain >= 4;
  const canReachNow = segment.access >= 4;
  
  return {
    ready: painIsAcute && canReachNow,
    score: (segment.pain * 2) + segment.access + segment.willingness,
    guidance: getBeachheadGuidance(segment)
  };
};
```

3. **Educational Tip Update**

**Current:**

> "High pain + high access = best for learning fast. Don't just pick the biggest market!"

**V2:**

> "Find your BEACHHEAD: the smallest group with pain so acute they're already trying to solve it. Narrow is better—you can always expand later. Ask yourself: Who would be DEVASTATED if this solution disappeared?"

4. **"Focus" Selection is Optional in Step 0**

- User CAN select a focus segment
- System RECOMMENDS top-scoring segment
- **No blocking if user doesn't select** — graduation process will prompt

### 2.4 Part 3: Assumption Generation (Modified)

**Current State:** Generates assumptions from problems only.

**V2 Changes:**

1. **Auto-Generate THREE Types of Assumptions**

```typescript
interface Step0Assumptions {
  customerIdentity: Assumption[];    // WHO has this problem?
  problemSeverity: Assumption[];     // HOW BAD is it for them?
  solutionHypothesis: Assumption[];  // WHAT might work?
}
```

2. **Auto-Generation Logic**

For each segment added in Part 1, generate:

```typescript
function generateStep0Assumptions(segment: CustomerSegment, problems: Problem[]): Step0Assumptions {
  return {
    customerIdentity: [
      {
        text: `${segment.name} experiences this problem regularly (at least weekly)`,
        type: 'customerIdentity',
        segment: segment.id,
        autogenerated: true
      },
      {
        text: `${segment.name} is actively looking for better solutions`,
        type: 'customerIdentity',
        segment: segment.id,
        autogenerated: true
      }
    ],
    problemSeverity: problems.map(p => ({
      text: `${segment.name} would pay to solve: "${p.description}"`,
      type: 'problemSeverity',
      segment: segment.id,
      problem: p.id,
      autogenerated: true
    })),
    solutionHypothesis: [] // User-added only in Step 0
  };
}
```

3. **UI Presentation**

Show auto-generated assumptions in a "review" mode:

- ✅ Checkboxes to confirm/remove
- ✏️ Edit button to customize wording
- ➕ "Add your own" for solution hypotheses

**Teaching Callout:**

> "Before testing if your SOLUTION works, you need to confirm your CUSTOMER exists and their PROBLEM is worth solving. We've created some starting assumptions about WHO and WHAT. Review them, then add any specific SOLUTION hypotheses you want to test."

### 2.5 Part 4: Summary + Graduation

**Current State:** Shows summary, link to Discovery.

**V2 Changes:**

1. **Graduation Panel**

Replace simple navigation with structured transition:

```
┌─────────────────────────────────────────────────────────────┐
│  🎓 Ready to Graduate to Discovery?                         │
│                                                             │
│  Your First Look captured:                                  │
│  • 4 customer segments                                      │
│  • 12 problems                                              │
│  • 8 assumptions to test                                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SELECT YOUR BEACHHEAD SEGMENT                      │   │
│  │                                                     │   │
│  │  🎯 Recommended: "Busy Parents" (Score: 14)         │   │
│  │     Why: Highest pain (5) + Good access (4)         │   │
│  │                                                     │   │
│  │  [Busy Parents      ▼]                              │   │
│  │                                                     │   │
│  │  💡 You can always come back and change this        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [← Back to Edit]              [Graduate to Discovery →]   │
└─────────────────────────────────────────────────────────────┘
```

2. **Graduation Action**

On "Graduate to Discovery" click:

```typescript
async function graduateToDiscovery(projectId: string, selectedSegmentId: string) {
  // 1. Get Step 0 data
  const step0Data = await getStep0Data(projectId);
  
  // 2. Create Discovery assumptions
  const discoveryAssumptions = transformStep0ToDiscovery(
    step0Data,
    selectedSegmentId
  );
  
  // 3. Store beachhead selection
  await storeBeachheadSegment(projectId, selectedSegmentId);
  
  // 4. Insert assumptions into Discovery
  await bulkCreateAssumptions(projectId, discoveryAssumptions);
  
  // 5. Navigate with success message
  navigateWithMessage('/discovery', 
    `Graduated! ${discoveryAssumptions.length} assumptions ready to validate.`
  );
}
```

---

## 3. Graduation: Step 0 → Discovery Migration

### 3.1 Data Transformation

**Step 0 Storage:** `project_step0` table (JSONB blob) **Discovery Storage:** `project_assumptions` table (individual records)

**Migration Function:**

```typescript
interface Step0ToDiscoveryMapping {
  step0Type: 'customerIdentity' | 'problemSeverity' | 'solutionHypothesis';
  discoveryCanvasArea: CanvasArea;
  discoveryStage: 1 | 2 | 3;
}

const MIGRATION_MAP: Step0ToDiscoveryMapping[] = [
  { step0Type: 'customerIdentity', discoveryCanvasArea: 'customerSegments', discoveryStage: 1 },
  { step0Type: 'problemSeverity', discoveryCanvasArea: 'problem', discoveryStage: 1 },
  { step0Type: 'solutionHypothesis', discoveryCanvasArea: 'solution', discoveryStage: 2 }
];

function transformStep0ToDiscovery(
  step0Data: Step0Data,
  focusedSegmentId: string
): DiscoveryAssumption[] {
  const focusedSegment = step0Data.segments.find(s => s.id === focusedSegmentId);
  
  return step0Data.assumptions
    .filter(a => a.segment === focusedSegmentId || a.segment === null)
    .map(a => {
      const mapping = MIGRATION_MAP.find(m => m.step0Type === a.type);
      return {
        id: generateId(),
        projectId: step0Data.projectId,
        text: a.text,
        canvasArea: mapping.discoveryCanvasArea,
        stage: mapping.discoveryStage,
        confidence: 2, // Start at "Unknown"
        importance: a.type === 'customerIdentity' ? 5 : 4, // WHO assumptions highest
        status: 'untested',
        migratedFromStep0: true,
        sourceSegment: focusedSegment.name
      };
    });
}
```

### 3.2 Beachhead Storage

Add to project metadata:

```typescript
interface ProjectBeachhead {
  segmentId: string;
  segmentName: string;
  selectedAt: timestamp;
  step0Score: number;
  // Track if user changes focus later
  focusHistory: {
    segmentId: string;
    changedAt: timestamp;
    reason?: string;
  }[];
}
```

**Database Change:**

```sql
ALTER TABLE projects ADD COLUMN beachhead_data JSONB DEFAULT NULL;
```

---

## 4. Discovery Module: Restructured Validation Stages

### 4.1 New Stage Structure

**V1 Structure (Current):**

```typescript
group1: ['problem', 'customerSegments', 'solution']  // Problem-Solution Fit
group2: ['existingAlternatives', 'earlyAdopters', 'uniqueValueProposition']  // Product-Market Fit
group3: ['channels', 'revenueStreams', 'costStructure', 'keyMetrics', 'unfairAdvantage']  // Business Viability
```

**V2 Structure (New):**

```typescript
const VALIDATION_STAGES = {
  stage1: {
    name: 'Customer-Problem Fit',
    question: 'WHO has this problem and HOW BAD is it?',
    areas: ['customerSegments', 'problem'],
    unlocked: true, // Always unlocked
    minimumInterviews: 5,
    graduationCriteria: {
      minConfidence: 4,  // At least "Likely True"
      maxInvalidated: 0  // No invalidated assumptions
    }
  },
  stage2: {
    name: 'Problem-Solution Fit',
    question: 'HOW should we solve it and for WHOM specifically?',
    areas: ['existingAlternatives', 'solution', 'uniqueValueProposition', 'earlyAdopters'],
    unlocked: false,
    unlocksWhen: 'stage1.validated',
    minimumInterviews: 5,
    graduationCriteria: {
      minConfidence: 4,
      maxInvalidated: 1  // Allow 1 invalidated if pivoted
    }
  },
  stage3: {
    name: 'Business Model Viability',
    question: 'Can we BUILD and SCALE this profitably?',
    areas: ['channels', 'revenueStreams', 'costStructure', 'keyMetrics', 'unfairAdvantage'],
    unlocked: false,
    unlocksWhen: 'stage2.validated',
    minimumInterviews: 3,
    graduationCriteria: {
      minConfidence: 3,
      maxInvalidated: 2
    }
  }
};
```

### 4.2 Stage Progression Logic

```typescript
function evaluateStageStatus(
  stage: ValidationStage,
  assumptions: Assumption[],
  interviews: Interview[]
): StageStatus {
  const stageAssumptions = assumptions.filter(a => 
    stage.areas.includes(a.canvasArea)
  );
  
  const stageInterviews = interviews.filter(i =>
    i.linkedAssumptions.some(la => 
      stageAssumptions.find(a => a.id === la.assumptionId)
    )
  );

  const avgConfidence = average(stageAssumptions.map(a => a.confidence));
  const invalidatedCount = stageAssumptions.filter(a => 
    a.status === 'invalidated'
  ).length;

  return {
    interviewCount: stageInterviews.length,
    interviewsNeeded: Math.max(0, stage.minimumInterviews - stageInterviews.length),
    avgConfidence,
    invalidatedCount,
    canGraduate: (
      stageInterviews.length >= stage.minimumInterviews &&
      avgConfidence >= stage.graduationCriteria.minConfidence &&
      invalidatedCount <= stage.graduationCriteria.maxInvalidated
    ),
    recommendation: getStageRecommendation(stageAssumptions, stageInterviews)
  };
}
```

### 4.3 Updated Type Definitions

**File:** `src/types/discovery.ts`

```typescript
// V2 Canvas Areas - Reorganized
export type CanvasArea = 
  // Stage 1: Customer-Problem Fit
  | 'customerSegments'
  | 'problem'
  // Stage 2: Problem-Solution Fit
  | 'existingAlternatives'
  | 'solution'
  | 'uniqueValueProposition'
  | 'earlyAdopters'
  // Stage 3: Business Model
  | 'channels'
  | 'revenueStreams'
  | 'costStructure'
  | 'keyMetrics'
  | 'unfairAdvantage';

export const CANVAS_AREA_LABELS: Record<CanvasArea, string> = {
  customerSegments: 'Customer Segments',
  problem: 'Problem',
  existingAlternatives: 'Existing Alternatives',
  solution: 'Solution',
  uniqueValueProposition: 'Unique Value Proposition',
  earlyAdopters: 'Early Adopters',
  channels: 'Channels',
  revenueStreams: 'Revenue Streams',
  costStructure: 'Cost Structure',
  keyMetrics: 'Key Metrics',
  unfairAdvantage: 'Unfair Advantage'
};

// V2 Stage Groupings
export const VALIDATION_STAGE_GROUPS = {
  1: ['customerSegments', 'problem'],
  2: ['existingAlternatives', 'solution', 'uniqueValueProposition', 'earlyAdopters'],
  3: ['channels', 'revenueStreams', 'costStructure', 'keyMetrics', 'unfairAdvantage']
} as const;

export const getStageForArea = (area: CanvasArea): 1 | 2 | 3 => {
  if (VALIDATION_STAGE_GROUPS[1].includes(area as any)) return 1;
  if (VALIDATION_STAGE_GROUPS[2].includes(area as any)) return 2;
  return 3;
};
```

### 4.4 UI Changes: Stage Gating

**AssumptionFrameworkTable Component Updates:**

1. **Visual Stage Separation**

```tsx
// Show stages as distinct sections with lock icons
<StageSection 
  stage={1} 
  title="Stage 1: Customer-Problem Fit"
  subtitle="WHO has this problem and HOW BAD is it?"
  status={stageStatuses[1]}
  assumptions={stage1Assumptions}
  locked={false}
/>

<StageSection 
  stage={2} 
  title="Stage 2: Problem-Solution Fit"
  subtitle="HOW should we solve it?"
  status={stageStatuses[2]}
  assumptions={stage2Assumptions}
  locked={!stageStatuses[1].canGraduate}
  lockMessage="Complete Stage 1 validation first"
/>
```

2. **Stage Progress Indicators**

```tsx
<StageProgressBar
  interviewCount={status.interviewCount}
  interviewsNeeded={status.interviewsNeeded}
  avgConfidence={status.avgConfidence}
  canGraduate={status.canGraduate}
/>
```

---

## 5. Interview System Enhancements

### 5.1 Interview Form Changes

**File:** `src/components/discovery/InterviewForm.tsx`

#### 5.1.1 Pre-Populated Segment Field

```tsx
interface InterviewFormProps {
  beachheadSegment: BeachheadSegment | null;
  // ... existing props
}

function InterviewForm({ beachheadSegment, ...props }: InterviewFormProps) {
  const [segment, setSegment] = useState(beachheadSegment?.name || '');
  const [showDeviation, setShowDeviation] = useState(false);

  const handleSegmentChange = (value: string) => {
    setSegment(value);
    
    // Check if deviating from beachhead
    if (beachheadSegment && value !== beachheadSegment.name) {
      setShowDeviation(true);
    } else {
      setShowDeviation(false);
    }
  };

  return (
    <Form>
      {/* Segment Field with Pre-Population */}
      <FormField label="Customer Segment">
        <Input
          value={segment}
          onChange={handleSegmentChange}
          placeholder="Who did you interview?"
        />
        
        {/* Beachhead Indicator */}
        {beachheadSegment && !showDeviation && (
          <HelpText icon="target">
            Focused on your beachhead: {beachheadSegment.name}
          </HelpText>
        )}
        
        {/* Deviation Warning */}
        {showDeviation && (
          <WarningBanner>
            <strong>Different segment detected.</strong> Your beachhead is "{beachheadSegment.name}".
            <p>
              Interviewing outside your focus is okay for exploration, but 
              <strong> 5 interviews with your beachhead</strong> are required to 
              validate Stage 1 assumptions.
            </p>
            <Checkbox 
              label="I understand - continue with this segment"
              onChange={() => setDeviationAcknowledged(true)}
            />
          </WarningBanner>
        )}
      </FormField>
      
      {/* ... rest of form */}
    </Form>
  );
}
```

#### 5.1.2 Prioritized Assumption Selection

```tsx
// Show assumptions ordered by: Stage → Risk Score → Status
function AssumptionSelector({ assumptions, stageStatuses }) {
  const sortedAssumptions = useMemo(() => {
    return [...assumptions].sort((a, b) => {
      // First: prioritize by stage (Stage 1 first)
      const stageA = getStageForArea(a.canvasArea);
      const stageB = getStageForArea(b.canvasArea);
      if (stageA !== stageB) return stageA - stageB;
      
      // Second: prioritize by risk score (highest first)
      const riskA = (6 - a.confidence) * a.importance;
      const riskB = (6 - b.confidence) * b.importance;
      if (riskA !== riskB) return riskB - riskA;
      
      // Third: untested before tested
      if (a.status !== b.status) {
        return a.status === 'untested' ? -1 : 1;
      }
      
      return 0;
    });
  }, [assumptions]);

  return (
    <FormField label="Which assumptions did this interview address?">
      {/* Stage 1 Assumptions - Always visible */}
      <AssumptionGroup 
        title="🎯 Stage 1: Customer-Problem (Test First)"
        assumptions={sortedAssumptions.filter(a => getStageForArea(a.canvasArea) === 1)}
        required={!stageStatuses[1].canGraduate}
      />
      
      {/* Stage 2 Assumptions - Visible if Stage 1 unlocked */}
      {stageStatuses[1].interviewCount >= 3 && (
        <AssumptionGroup 
          title="Stage 2: Problem-Solution"
          assumptions={sortedAssumptions.filter(a => getStageForArea(a.canvasArea) === 2)}
          locked={!stageStatuses[1].canGraduate}
        />
      )}
      
      {/* Stage 3 - Locked until Stage 2 complete */}
      {stageStatuses[2].canGraduate && (
        <AssumptionGroup 
          title="Stage 3: Business Model"
          assumptions={sortedAssumptions.filter(a => getStageForArea(a.canvasArea) === 3)}
        />
      )}
    </FormField>
  );
}
```

#### 5.1.3 Interview Count Tracking

```tsx
interface InterviewRequirements {
  stage1Interviews: number;
  stage1Required: number;
  beachheadInterviews: number;
  beachheadRequired: number;
}

function InterviewRequirementsDisplay({ requirements }: { requirements: InterviewRequirements }) {
  return (
    <RequirementsCard>
      <Requirement
        label="Stage 1 Interviews"
        current={requirements.stage1Interviews}
        required={requirements.stage1Required}
        complete={requirements.stage1Interviews >= requirements.stage1Required}
      />
      <Requirement
        label="Beachhead Segment Interviews"
        current={requirements.beachheadInterviews}
        required={requirements.beachheadRequired}
        complete={requirements.beachheadInterviews >= requirements.beachheadRequired}
      />
    </RequirementsCard>
  );
}
```

### 5.2 Interview Validation Thresholds

**New Validation Rules:**

```typescript
const INTERVIEW_VALIDATION_RULES = {
  // Minimum interviews before any assumption can be marked "validated"
  minimumInterviewsForValidation: 3,
  
  // Minimum interviews with beachhead segment for Stage 1
  minimumBeachheadInterviews: 5,
  
  // Confidence thresholds
  confidenceToValidate: 4,      // "Likely True" or higher
  confidenceToInvalidate: 2,    // "Unlikely True" or lower
  
  // Support ratio requirements
  minimumSupportRatio: 0.6,     // 60% of interviews must support
  
  // For invalidation
  maximumSupportRatio: 0.3      // If only 30% support, suggest invalidation
};

function canValidateAssumption(
  assumption: Assumption,
  linkedInterviews: InterviewLink[]
): ValidationEligibility {
  const beachheadInterviews = linkedInterviews.filter(i => i.isBeachheadSegment);
  const supportingInterviews = linkedInterviews.filter(i => i.effect === 'supports');
  const contradictingInterviews = linkedInterviews.filter(i => i.effect === 'contradicts');
  
  // Check minimum interview count
  if (linkedInterviews.length < INTERVIEW_VALIDATION_RULES.minimumInterviewsForValidation) {
    return {
      canValidate: false,
      reason: `Need ${INTERVIEW_VALIDATION_RULES.minimumInterviewsForValidation - linkedInterviews.length} more interviews`,
      suggestedStatus: 'untested'
    };
  }
  
  // Check beachhead requirement for Stage 1
  const stage = getStageForArea(assumption.canvasArea);
  if (stage === 1 && beachheadInterviews.length < INTERVIEW_VALIDATION_RULES.minimumBeachheadInterviews) {
    return {
      canValidate: false,
      reason: `Stage 1 requires ${INTERVIEW_VALIDATION_RULES.minimumBeachheadInterviews} beachhead interviews`,
      suggestedStatus: 'in-progress'
    };
  }
  
  // Calculate support ratio
  const supportRatio = supportingInterviews.length / linkedInterviews.length;
  
  if (supportRatio >= INTERVIEW_VALIDATION_RULES.minimumSupportRatio) {
    return {
      canValidate: true,
      suggestedStatus: 'validated',
      confidence: Math.min(5, assumption.confidence + 1)
    };
  }
  
  if (supportRatio <= INTERVIEW_VALIDATION_RULES.maximumSupportRatio) {
    return {
      canValidate: true,
      suggestedStatus: 'invalidated',
      suggestPivot: true,
      confidence: Math.max(1, assumption.confidence - 1)
    };
  }
  
  return {
    canValidate: false,
    reason: 'Mixed evidence - need more interviews for clarity',
    suggestedStatus: 'in-progress'
  };
}
```

### 5.3 Missing Interview Elements

Add the following fields to `InterviewForm`:

```typescript
interface InterviewFormData {
  // Existing fields
  interviewee: string;
  segment: string;
  date: Date;
  notes: string;
  linkedAssumptions: LinkedAssumption[];
  
  // NEW: Big 3 Structured Capture
  big3: {
    whatWentWell: string;      // "What's working for you today?"
    biggestChallenge: string;  // "What's your biggest challenge?"
    whyImportant: string;      // "Why does this matter to you?"
  };
  
  // NEW: Key Quote
  keyQuote: {
    quote: string;
    context: string;
  };
  
  // NEW: Interview Metadata
  metadata: {
    duration: number;           // minutes
    interviewType: 'in-person' | 'video' | 'phone' | 'written';
    intervieweeRole: string;    // Their job/role
    companySize?: string;       // If B2B
    warmthLevel: 1 | 2 | 3 | 4 | 5;  // How engaged were they?
    wouldReferOthers: boolean;  // Proxy for satisfaction
  };
  
  // NEW: Follow-up
  followUp: {
    requested: boolean;
    type?: 'prototype_feedback' | 'purchase_intent' | 'referral' | 'other';
    scheduledDate?: Date;
    notes?: string;
  };
  
  // NEW: Segment Match Verification
  segmentMatch: {
    matchesBeachhead: boolean;
    deviationAcknowledged: boolean;
    deviationReason?: string;
  };
}
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Sprint 1)

|Task|Files|Priority|
|---|---|---|
|Update type definitions with new stage structure|`src/types/discovery.ts`|P0|
|Create graduation function (Step 0 → Discovery)|`src/features/discovery/graduationService.ts`|P0|
|Add beachhead_data column to projects table|Database migration|P0|
|Update Step 0 Part 2 with scoring guidance tooltips|`Step0FirstLook.tsx:513-690`|P1|

### Phase 2: Step 0 Enhancements (Sprint 2)

|Task|Files|Priority|
|---|---|---|
|Auto-generate customer identity assumptions|`step0Store.tsx:213-241`|P0|
|Create Graduation UI panel in Part 4|`Step0FirstLook.tsx`|P0|
|Update beachhead tip text|`Step0FirstLook.tsx:541-546`|P1|
|Add assumption type indicators (WHO/WHAT/HOW)|`Step0FirstLook.tsx`|P2|

### Phase 3: Discovery Restructure (Sprint 3)

|Task|Files|Priority|
|---|---|---|
|Implement new 3-stage validation groups|`discovery.ts`, `AssumptionFrameworkTable.tsx`|P0|
|Add stage locking UI with progress indicators|`AssumptionFrameworkTable.tsx`|P0|
|Create stage status evaluation function|`src/utils/stageEvaluation.ts`|P1|
|Add "Ready for Stage 2/3" guidance banners|Discovery components|P2|

### Phase 4: Interview Enhancements (Sprint 4)

|Task|Files|Priority|
|---|---|---|
|Pre-populate segment from beachhead|`InterviewForm.tsx:230-256`|P0|
|Add segment deviation warning|`InterviewForm.tsx`|P0|
|Prioritize assumptions by stage in selector|`InterviewForm.tsx`|P1|
|Add interview count threshold checks|`InterviewForm.tsx`, validation utils|P1|
|Add Big 3 structured fields|`InterviewForm.tsx`|P2|
|Add interview metadata fields|`InterviewForm.tsx`|P2|

### Phase 5: Polish & Testing (Sprint 5)

|Task|Files|Priority|
|---|---|---|
|End-to-end journey testing|Test suite|P0|
|Migration for existing projects|Migration script|P0|
|User guidance/onboarding updates|Various|P1|
|Performance optimization|Various|P2|

---

## 7. Database Changes

### 7.1 New Columns

```sql
-- Add beachhead tracking to projects
ALTER TABLE projects 
ADD COLUMN beachhead_data JSONB DEFAULT NULL;

-- Add migration tracking to assumptions
ALTER TABLE project_assumptions 
ADD COLUMN migrated_from_step0 BOOLEAN DEFAULT FALSE,
ADD COLUMN source_segment VARCHAR(255);

-- Add stage to assumptions (denormalized for query performance)
ALTER TABLE project_assumptions 
ADD COLUMN validation_stage INTEGER DEFAULT 1;

-- Add segment match tracking to interviews
ALTER TABLE project_interviews 
ADD COLUMN matches_beachhead BOOLEAN DEFAULT NULL,
ADD COLUMN deviation_acknowledged BOOLEAN DEFAULT FALSE,
ADD COLUMN deviation_reason TEXT;
```

### 7.2 Indexes

```sql
-- Performance indexes for stage-based queries
CREATE INDEX idx_assumptions_stage ON project_assumptions(project_id, validation_stage);
CREATE INDEX idx_interviews_beachhead ON project_interviews(project_id, matches_beachhead);
```

---

## 8. Component Reference

### Files to Modify

|File|Changes|
|---|---|
|`src/types/discovery.ts`|New stage structure, updated canvas areas|
|`src/features/discovery/Step0FirstLook.tsx`|Scoring guidance, graduation UI, assumption auto-generation|
|`src/features/discovery/step0Store.tsx`|Customer identity assumption generation, graduation function|
|`src/components/discovery/AssumptionFrameworkTable.tsx`|Stage separation, locking, progress indicators|
|`src/components/discovery/InterviewForm.tsx`|Pre-populated segment, deviation warnings, prioritized assumptions|
|`src/components/discovery/EnhancedInterviews.tsx`|Interview count tracking, stage requirements display|

### New Files to Create

|File|Purpose|
|---|---|
|`src/features/discovery/graduationService.ts`|Step 0 → Discovery data migration|
|`src/utils/stageEvaluation.ts`|Stage status calculation functions|
|`src/components/discovery/StageProgressBar.tsx`|Visual progress indicator|
|`src/components/discovery/GraduationPanel.tsx`|Graduation UI for Step 0 Part 4|
|`src/components/discovery/SegmentDeviationWarning.tsx`|Reusable deviation warning|

---

## 9. Success Metrics

### User Journey Metrics

|Metric|Target|Measurement|
|---|---|---|
|Step 0 completion rate|> 80%|Users who complete all 4 parts|
|Graduation rate|> 70%|Users who click "Graduate to Discovery"|
|Data migration success|100%|Zero assumptions lost in migration|
|Stage 1 completion|> 60%|Users who validate Stage 1 assumptions|
|Interview quality|5+ per user|Average interviews before Stage 1 validation|

### System Health Metrics

|Metric|Target|Measurement|
|---|---|---|
|Migration errors|0|Failed Step 0 → Discovery migrations|
|Orphaned assumptions|0|Assumptions without valid stage assignment|
|UI responsiveness|< 200ms|Stage evaluation calculation time|

---

## 10. Appendix: Full Recommended Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARMSTERFLOW V2 JOURNEY                            │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 0: FIRST LOOK (Broad Exploration)
═══════════════════════════════════════

  Part 0: Idea Statement
    │
    ▼
  Part 1: Customers & Problems
    │   • Accept multiple segments (up to 6)
    │   • Capture all problems without judgment
    │   • "Capture everyone - we'll narrow later"
    │
    ▼
  Part 2: Segment Ranking
    │   • Score: Pain / Access / Willingness
    │   • NEW: Hover tooltips explain each score
    │   • NEW: "Beachhead Readiness" indicator
    │   • Selection is OPTIONAL here
    │
    ▼
  Part 3: Assumption Generation
    │   • AUTO-GENERATE: Customer Identity assumptions
    │   • AUTO-GENERATE: Problem Severity assumptions
    │   • USER ADDS: Solution Hypotheses
    │   • Review/edit/confirm all assumptions
    │
    ▼
  Part 4: Summary + Graduation
        │
        │   ┌─────────────────────────────────────────┐
        │   │  🎓 GRADUATION PANEL                    │
        │   │                                         │
        │   │  Select your BEACHHEAD segment          │
        │   │  (Recommended: highest scoring)         │
        │   │                                         │
        │   │  [Graduate to Discovery →]              │
        │   └─────────────────────────────────────────┘
        │
        ▼
GRADUATION: DATA MIGRATION
═══════════════════════════

  • Store beachhead selection in project
  • Transform Step 0 assumptions → Discovery format
  • Map assumption types to canvas areas:
      customerIdentity  → customerSegments (Stage 1)
      problemSeverity   → problem (Stage 1)
      solutionHypothesis → solution (Stage 2)
  • Insert into project_assumptions table
        │
        ▼
DISCOVERY: SYSTEMATIC VALIDATION (Narrow Focus)
════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────┐
  │  STAGE 1: Customer-Problem Fit                                  │
  │  "WHO has this problem and HOW BAD is it?"                      │
  │                                                                 │
  │  Canvas Areas: customerSegments, problem                        │
  │  Required: 5 interviews with beachhead segment                  │
  │  Goal: Confirm customer exists and problem is worth solving     │
  │                                                                 │
  │  [████████░░] 4/5 interviews │ Avg Confidence: 3.2              │
  └─────────────────────────────────────────────────────────────────┘
        │
        │  Stage 1 Validated?
        │  ├─ YES → Unlock Stage 2
        │  └─ NO (Invalidated) → Pivot Prompt
        │
        ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  STAGE 2: Problem-Solution Fit                     🔒 LOCKED     │
  │  "HOW should we solve it and for WHOM specifically?"            │
  │                                                                 │
  │  Canvas Areas: existingAlternatives, solution, UVP, earlyAdopters│
  │  Required: 5 interviews                                         │
  │  Goal: Confirm solution approach and early adopter profile      │
  │                                                                 │
  │  [Unlock by validating Stage 1]                                 │
  └─────────────────────────────────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  STAGE 3: Business Model Viability                 🔒 LOCKED     │
  │  "Can we BUILD and SCALE this profitably?"                      │
  │                                                                 │
  │  Canvas Areas: channels, revenue, cost, metrics, unfairAdvantage│
  │  Required: 3 interviews                                         │
  │  Goal: Confirm viable business model                            │
  │                                                                 │
  │  [Unlock by validating Stage 2]                                 │
  └─────────────────────────────────────────────────────────────────┘

INTERVIEWS: EVIDENCE GATHERING
══════════════════════════════

  ┌─────────────────────────────────────────────────────────────────┐
  │  NEW INTERVIEW                                                  │
  │                                                                 │
  │  Segment: [Busy Parents         ] ← Pre-populated from beachhead│
  │           ✓ Focused on your beachhead segment                   │
  │                                                                 │
  │  ─────────────────────────────────────────────────────────────  │
  │  ASSUMPTIONS TO TEST (Ordered by priority)                      │
  │                                                                 │
  │  🎯 STAGE 1 - Test First                                        │
  │  ☑ Busy parents experience meal planning stress weekly          │
  │  ☐ Busy parents would pay $20/month to solve this               │
  │                                                                 │
  │  STAGE 2 - After Stage 1 validated                              │
  │  ☐ An AI meal planner would save 3+ hours/week [LOCKED]         │
  │                                                                 │
  │  ─────────────────────────────────────────────────────────────  │
  │  BIG 3 + WHY                                                    │
  │                                                                 │
  │  What's working today? [                                      ] │
  │  Biggest challenge?    [                                      ] │
  │  Why does it matter?   [                                      ] │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  Interview Validation Rules:
  • Minimum 3 interviews before any assumption can be validated
  • Minimum 5 beachhead interviews for Stage 1
  • 60% support ratio required for validation
  • <30% support suggests invalidation
```

---

## Document History

|Version|Date|Author|Changes|
|---|---|---|---|
|2.0|2025-12-30|Claude (via Monty)|Initial V2 spec based on consistency review|

---

**End of Specification**