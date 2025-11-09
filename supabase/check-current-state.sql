-- ============================================================================
-- CHECK CURRENT DATABASE STATE
-- Three simple queries that will definitely return results
-- ============================================================================

-- QUERY 1: Show all tables
SELECT '1. TABLES' as section, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- QUERY 2: Show all RLS policies (check if ANY exist)
SELECT '2. POLICIES' as section, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- QUERY 3: Show all functions
SELECT '3. FUNCTIONS' as section, routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- QUERY 4: Check if is_admin column exists on profiles
SELECT '4. PROFILES STRUCTURE' as section, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- QUERY 5: Show all indexes
SELECT '5. INDEXES' as section, indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
