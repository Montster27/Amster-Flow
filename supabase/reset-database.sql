-- RESET DATABASE - Complete wipe of all user data
-- WARNING: This deletes EVERYTHING. Cannot be undone!

-- Delete all project data (child tables first)
DELETE FROM project_modules;
DELETE FROM project_assumptions;
DELETE FROM project_interviews;
DELETE FROM project_iterations;
DELETE FROM project_competitors;
DELETE FROM project_decision_makers;
DELETE FROM project_first_target;

-- Delete all projects
DELETE FROM projects;

-- Delete all organization members
DELETE FROM organization_members;

-- Delete all organizations
DELETE FROM organizations;

-- Delete all profiles
DELETE FROM profiles;

-- Verify everything is empty
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'organizations', COUNT(*) FROM organizations
UNION ALL
SELECT 'organization_members', COUNT(*) FROM organization_members
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'project_modules', COUNT(*) FROM project_modules;

-- Note: This does NOT delete auth.users
-- Users can still log in, but will get fresh orgs/profiles created
-- If you want to delete auth.users too, go to Authentication > Users in Supabase dashboard
