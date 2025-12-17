-- Migration: Add Pivot or Proceed decision tracking
-- Created: 2025-11-11
-- Description: Table for storing pivot/proceed decisions with cognitive debiasing and evidence tracking

CREATE TABLE IF NOT EXISTS "public"."project_pivot_decisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "mode" TEXT NOT NULL CHECK (mode IN ('easy', 'detailed')),
    "iteration_id" UUID REFERENCES "public"."project_iterations"("id") ON DELETE SET NULL,
    "decision" TEXT CHECK (decision IN ('proceed', 'patch', 'pivot')),

    -- Cognitive debiasing
    "pre_mortem_insights" TEXT[] NOT NULL DEFAULT '{}',
    "contradictory_evidence" JSONB NOT NULL DEFAULT '[]',
    "reframing_responses" JSONB NOT NULL DEFAULT '{
        "inheritanceQuestion": "",
        "contradictionQuestion": "",
        "temporalQuestion": ""
    }',

    -- Quantitative metrics (optional for easy mode)
    "product_market_fit" JSONB,
    "retention_metrics" JSONB,
    "unit_economics" JSONB,

    -- Qualitative insights (optional for easy mode)
    "jobs_to_be_done" JSONB,
    "pain_points" JSONB NOT NULL DEFAULT '[]',
    "customer_quotes" JSONB NOT NULL DEFAULT '[]',

    -- Decision rationale
    "hypothesis_tested" JSONB,
    "decision_rationale" TEXT NOT NULL DEFAULT '',
    "next_actions" TEXT[] NOT NULL DEFAULT '{}',

    -- Confidence assessment (easy mode)
    "confidence_assessment" JSONB,

    -- PIVOT readiness (for pivot decisions)
    "pivot_readiness" JSONB,
    "recommended_pivot_type" TEXT,

    -- Reflection
    "lessons_learned" TEXT[] NOT NULL DEFAULT '{}',
    "biases_identified" TEXT[] NOT NULL DEFAULT '{}',
    "confidence_level" INTEGER DEFAULT 50 CHECK (confidence_level >= 0 AND confidence_level <= 100),

    -- Meta-data
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "completed_at" TIMESTAMP WITH TIME ZONE,
    "time_spent_minutes" INTEGER DEFAULT 0,
    "external_advisors_consulted" TEXT[] NOT NULL DEFAULT '{}',

    PRIMARY KEY ("id")
);

-- Add indexes for common queries
CREATE INDEX idx_pivot_decisions_project_id ON "public"."project_pivot_decisions"("project_id");
CREATE INDEX idx_pivot_decisions_iteration_id ON "public"."project_pivot_decisions"("iteration_id");
CREATE INDEX idx_pivot_decisions_decision ON "public"."project_pivot_decisions"("decision");
CREATE INDEX idx_pivot_decisions_created_at ON "public"."project_pivot_decisions"("created_at");

-- Enable Row Level Security
ALTER TABLE "public"."project_pivot_decisions" ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access pivot decisions for projects in their organizations

-- SELECT policy
CREATE POLICY "Users can view pivot decisions for their organization's projects"
    ON "public"."project_pivot_decisions"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."projects" p
            INNER JOIN "public"."organization_members" om ON p.organization_id = om.organization_id
            WHERE p.id = project_id
            AND om.user_id = auth.uid()
        )
    );

-- INSERT policy
CREATE POLICY "Users can create pivot decisions for their organization's projects"
    ON "public"."project_pivot_decisions"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."projects" p
            INNER JOIN "public"."organization_members" om ON p.organization_id = om.organization_id
            WHERE p.id = project_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'editor')
        )
    );

-- UPDATE policy
CREATE POLICY "Users can update pivot decisions for their organization's projects"
    ON "public"."project_pivot_decisions"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."projects" p
            INNER JOIN "public"."organization_members" om ON p.organization_id = om.organization_id
            WHERE p.id = project_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'editor')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."projects" p
            INNER JOIN "public"."organization_members" om ON p.organization_id = om.organization_id
            WHERE p.id = project_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'editor')
        )
    );

-- DELETE policy
CREATE POLICY "Users can delete pivot decisions for their organization's projects"
    ON "public"."project_pivot_decisions"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."projects" p
            INNER JOIN "public"."organization_members" om ON p.organization_id = om.organization_id
            WHERE p.id = project_id
            AND om.user_id = auth.uid()
            AND om.role = 'owner'
        )
    );

-- Admin bypass policy (for users with is_admin flag)
CREATE POLICY "Admins can view all pivot decisions"
    ON "public"."project_pivot_decisions"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."profiles"
            WHERE id = auth.uid()
            AND is_admin = TRUE
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pivot_decisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER trigger_update_pivot_decisions_updated_at
    BEFORE UPDATE ON "public"."project_pivot_decisions"
    FOR EACH ROW
    EXECUTE FUNCTION update_pivot_decisions_updated_at();

-- Comments for documentation
COMMENT ON TABLE "public"."project_pivot_decisions" IS 'Stores pivot, patch, or proceed decisions with cognitive debiasing and evidence tracking';
COMMENT ON COLUMN "public"."project_pivot_decisions"."mode" IS 'Easy (guided reflection) or Detailed (evidence-based analysis)';
COMMENT ON COLUMN "public"."project_pivot_decisions"."decision" IS 'Proceed, Patch, or Pivot decision';
COMMENT ON COLUMN "public"."project_pivot_decisions"."pre_mortem_insights" IS 'Three potential failure causes identified before reviewing data (reduces optimism bias)';
COMMENT ON COLUMN "public"."project_pivot_decisions"."contradictory_evidence" IS 'Evidence that contradicts current strategy (combats confirmation bias)';
COMMENT ON COLUMN "public"."project_pivot_decisions"."reframing_responses" IS 'Responses to bias-combating questions (inheritance, contradiction, temporal)';
COMMENT ON COLUMN "public"."project_pivot_decisions"."product_market_fit" IS 'Sean Ellis PMF score, sample size, and trend';
COMMENT ON COLUMN "public"."project_pivot_decisions"."retention_metrics" IS 'Day 1, 7, 30 retention rates and flattening indicator';
COMMENT ON COLUMN "public"."project_pivot_decisions"."unit_economics" IS 'LTV, CAC, ratio, and payback period';
COMMENT ON COLUMN "public"."project_pivot_decisions"."jobs_to_be_done" IS 'Functional, emotional, and social jobs from customer research';
COMMENT ON COLUMN "public"."project_pivot_decisions"."confidence_assessment" IS 'Confidence levels (0-100) for problem, customer, solution, business';
COMMENT ON COLUMN "public"."project_pivot_decisions"."pivot_readiness" IS 'PIVOT checklist: Proof, Insight, Viability, Organization, Timing';
COMMENT ON COLUMN "public"."project_pivot_decisions"."recommended_pivot_type" IS 'One of 10 pivot types (zoom-in, zoom-out, customer-segment, etc.)';
COMMENT ON COLUMN "public"."project_pivot_decisions"."biases_identified" IS 'Cognitive biases identified during decision process';
COMMENT ON COLUMN "public"."project_pivot_decisions"."confidence_level" IS 'Overall confidence in decision (0-100)';
