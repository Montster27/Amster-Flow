-- Quick diagnostic to check if Pet Finder has sector map data
-- Run this in Supabase SQL Editor first to see current state

-- 1. Check if Pet Finder project exists
SELECT
  id,
  name,
  'Pet Finder Project' as status
FROM projects
WHERE LOWER(name) LIKE '%pet%' OR LOWER(name) LIKE '%finder%'
LIMIT 5;

-- 2. Check sector map data counts
WITH pet_project AS (
  SELECT id FROM projects WHERE LOWER(name) LIKE '%pet%finder%' LIMIT 1
)
SELECT
  'First Target' as data_type,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '❌ EMPTY' END as status
FROM project_first_target
WHERE project_id = (SELECT id FROM pet_project)

UNION ALL

SELECT
  'Competitors' as data_type,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '❌ EMPTY' END as status
FROM project_competitors
WHERE project_id = (SELECT id FROM pet_project)

UNION ALL

SELECT
  'Decision Makers' as data_type,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '❌ EMPTY' END as status
FROM project_decision_makers
WHERE project_id = (SELECT id FROM pet_project);

-- 3. Show actual first target data if it exists
WITH pet_project AS (
  SELECT id FROM projects WHERE LOWER(name) LIKE '%pet%finder%' LIMIT 1
)
SELECT
  customer_type,
  LEFT(description, 100) || '...' as description_preview
FROM project_first_target
WHERE project_id = (SELECT id FROM pet_project);
