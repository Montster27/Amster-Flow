-- Create table for Visual Sector Map data
-- Stores the entire visual sector map as a JSON blob for simplicity and flexibility

CREATE TABLE IF NOT EXISTS "public"."project_visual_sector_map" (
    "project_id" UUID NOT NULL REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "data" JSONB NOT NULL DEFAULT '{
        "scope": {"sector": "", "question": ""},
        "actors": [],
        "connections": [],
        "annotations": [],
        "activeLayers": ["value", "information", "regulation"]
    }'::jsonb,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_by" UUID REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
    PRIMARY KEY ("project_id")
);

-- Enable RLS
ALTER TABLE "public"."project_visual_sector_map" ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can access visual sector maps for projects they have access to
DROP POLICY IF EXISTS "Users can view visual sector maps for accessible projects" ON "public"."project_visual_sector_map";
CREATE POLICY "Users can view visual sector maps for accessible projects"
    ON "public"."project_visual_sector_map"
    FOR SELECT
    USING (
        user_can_access_project(project_id)
    );

DROP POLICY IF EXISTS "Users can insert visual sector maps for accessible projects" ON "public"."project_visual_sector_map";
CREATE POLICY "Users can insert visual sector maps for accessible projects"
    ON "public"."project_visual_sector_map"
    FOR INSERT
    WITH CHECK (
        user_can_edit_project(project_id)
    );

DROP POLICY IF EXISTS "Users can update visual sector maps for accessible projects" ON "public"."project_visual_sector_map";
CREATE POLICY "Users can update visual sector maps for accessible projects"
    ON "public"."project_visual_sector_map"
    FOR UPDATE
    USING (
        user_can_edit_project(project_id)
    )
    WITH CHECK (
        user_can_edit_project(project_id)
    );

DROP POLICY IF EXISTS "Users can delete visual sector maps for accessible projects" ON "public"."project_visual_sector_map";
CREATE POLICY "Users can delete visual sector maps for accessible projects"
    ON "public"."project_visual_sector_map"
    FOR DELETE
    USING (
        user_can_edit_project(project_id)
    );

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_project_visual_sector_map_updated_at ON "public"."project_visual_sector_map";
CREATE TRIGGER update_project_visual_sector_map_updated_at
    BEFORE UPDATE ON "public"."project_visual_sector_map"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_visual_sector_map_project_id
    ON "public"."project_visual_sector_map"("project_id");

-- Add comment
COMMENT ON TABLE "public"."project_visual_sector_map" IS 'Stores visual sector map data (actors, connections, annotations) as JSON for each project';
