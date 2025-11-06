-- ============================================================================
-- CLEANUP ALL DUPLICATE ORGANIZATIONS
-- Keep only the organization with the most recent project
-- ============================================================================

-- Step 1: Find the organization with the most recent project (has "new idea")
DO $$
DECLARE
  v_keep_org_id UUID;
  v_owner_user_id UUID;
BEGIN
  -- Get the organization that has the "new idea" project (most recent)
  SELECT organization_id INTO v_keep_org_id
  FROM projects
  WHERE name = 'new idea'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get the owner user ID (7ad9c7e3...)
  SELECT id INTO v_owner_user_id
  FROM profiles
  WHERE email = 'monty@thesharmas.us'
  LIMIT 1;

  RAISE NOTICE 'Keeping organization: %', v_keep_org_id;
  RAISE NOTICE 'Owner user ID: %', v_owner_user_id;

  -- Step 2: Delete all organization_members EXCEPT for the kept org
  DELETE FROM organization_members
  WHERE organization_id != v_keep_org_id;

  RAISE NOTICE 'Deleted members from duplicate organizations';

  -- Step 3: Add both users to the kept organization if not already there
  -- Add owner
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_keep_org_id, v_owner_user_id, 'owner')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- Add invited user (monty.sharma@gmail.com)
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (
    v_keep_org_id,
    (SELECT id FROM profiles WHERE email = 'monty.sharma@gmail.com' LIMIT 1),
    'editor'
  )
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RAISE NOTICE 'Added both users to the kept organization';

  -- Step 4: Delete all projects EXCEPT those in the kept org
  DELETE FROM projects
  WHERE organization_id != v_keep_org_id;

  RAISE NOTICE 'Deleted projects from duplicate organizations';

  -- Step 5: Delete all organizations EXCEPT the kept one
  DELETE FROM organizations
  WHERE id != v_keep_org_id;

  RAISE NOTICE 'Deleted all duplicate organizations';
  RAISE NOTICE 'Cleanup complete! Only one organization remains.';
END $$;

-- Verify the results
SELECT 'Organizations remaining:' as check_type, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'Members in kept org:', COUNT(*) FROM organization_members
UNION ALL
SELECT 'Projects in kept org:', COUNT(*) FROM projects;
