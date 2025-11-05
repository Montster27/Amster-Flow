-- Clean up duplicate organizations created due to RLS bug
-- Keep only the earliest organization for each user

-- First, identify which orgs to keep (earliest one per user)
WITH orgs_to_keep AS (
  SELECT DISTINCT ON (created_by) id
  FROM organizations
  ORDER BY created_by, created_at ASC
)

-- Delete all organization_members for duplicate orgs
DELETE FROM organization_members
WHERE organization_id NOT IN (SELECT id FROM orgs_to_keep);

-- Delete all projects for duplicate orgs
DELETE FROM projects
WHERE organization_id NOT IN (SELECT id FROM orgs_to_keep);

-- Delete duplicate organizations
DELETE FROM organizations
WHERE id NOT IN (SELECT id FROM orgs_to_keep);

-- Verify cleanup
SELECT
  o.id,
  o.name,
  o.created_by,
  o.created_at,
  COUNT(om.id) as member_count
FROM organizations o
LEFT JOIN organization_members om ON om.organization_id = o.id
GROUP BY o.id, o.name, o.created_by, o.created_at
ORDER BY o.created_by, o.created_at;
