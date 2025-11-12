# Sector Map Data Not Showing - Complete Fix

## Problem
The sector map shows empty even though we created seed data. This is because:
1. **RLS (Row Level Security) is enabled** on the tables
2. **The seed data script hasn't been executed** in the database yet

## Solution: Run the Seed Script in Supabase Dashboard

### Step 1: Open SQL Editor
Go to: https://supabase.com/dashboard/project/blfwkdqnkjegimhgekgo/sql/new

### Step 2: First Run the Diagnostic (Optional but Recommended)
Copy and paste this query to check current state:

```sql
-- Check if Pet Finder project exists and has data
WITH pet_project AS (
  SELECT id, name FROM projects
  WHERE LOWER(name) LIKE '%pet%finder%'
  LIMIT 1
)
SELECT
  'PROJECT' as check_type,
  p.name as value,
  'Found' as status
FROM pet_project p

UNION ALL

SELECT
  'First Target',
  CAST(COUNT(*) as TEXT),
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '❌ EMPTY' END
FROM project_first_target
WHERE project_id = (SELECT id FROM pet_project)

UNION ALL

SELECT
  'Competitors',
  CAST(COUNT(*) as TEXT),
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '❌ EMPTY' END
FROM project_competitors
WHERE project_id = (SELECT id FROM pet_project)

UNION ALL

SELECT
  'Decision Makers',
  CAST(COUNT(*) as TEXT),
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '❌ EMPTY' END
FROM project_decision_makers
WHERE project_id = (SELECT id FROM pet_project);
```

**Expected Result if Empty:**
```
PROJECT          | Pet Finder      | Found
First Target     | 0               | ❌ EMPTY
Competitors      | 0               | ❌ EMPTY
Decision Makers  | 0               | ❌ EMPTY
```

### Step 3: Run the Seed Data Script

If the tables are empty, copy the ENTIRE contents of this file:
```
supabase/migrations/20251112_pet_finder_seed_data.sql
```

**Quick Copy Path:**
- Local file: `/Users/montysharma/Documents/ArmsterFlow/supabase/migrations/20251112_pet_finder_seed_data.sql`

Paste it into the SQL Editor and click **"Run"** (or Cmd/Ctrl + Enter)

**Expected Success Output:**
```
✅ Found Pet Finder project: [some-uuid-here]
📝 Creating answers for Problem, Customer Segments, and Solution modules...
✅ Created Problem, Customer Segments, and Solution content
🗺️  Creating Sector Map data...
✅ Created Sector Map with First Target, 8 Competitors, and 7 Decision Makers
🎉 Pet Finder Sector Map data loaded successfully!
```

### Step 4: Verify in ArmsterFlow

1. Go back to ArmsterFlow
2. **Refresh the page** (important!)
3. Navigate to: Pet Finder → Sector Map tab
4. You should now see:
   - **Customer Type**: Consumer (blue button selected)
   - **First Target**: Jennifer's description (42, suburban dog owner, @BaileysAdventures...)
   - **8 Competitors**: NextDoor App, Facebook Groups, Traditional Flyers, etc.
   - **7 Decision Makers**: Pet Owner, Spouse/Partner, Robert (age 68), etc.

## What the Seed Data Contains

**For Pet Finder Project:**
- **First Target**: Jennifer (Instagram influencer, panics in 3.7 seconds, Apple Pay ready)
- **8 Competitors**:
  1. NextDoor App (arguments and buried posts)
  2. Facebook Groups ("Lost Pets of [City]" - 47 groups!)
  3. Traditional Flyers (telephone pole union)
  4. Local Animal Shelters (overwhelmed, memory match with hundreds of pets)
  5. Pet Psychics ($50-200, 0% success rate, surprisingly high satisfaction)
  6. Ring/Nest Cameras (every raccoon looks like a dog at 2 AM)
  7. Professional Pet Trackers ($500-2000, tactical gear)
  8. Just Waiting and Hoping (free, requires hope)

- **7 Decision Makers**:
  1. Pet Owner (Primary User) - decision-maker
  2. Spouse/Partner - payer
  3. Kids in Household - influencer
  4. Robert (Age 68, Neighborhood Watch) - influencer
  5. Veterinarian - influencer
  6. Local Pet Store Owner - influencer
  7. That One Friend Who's "Good With Apps" - influencer

## Troubleshooting

### "Nothing shows after running the script"
1. Check browser console for errors (F12 → Console tab)
2. Verify you're logged in as the correct user
3. Make sure you're viewing the correct project (Pet Finder)
4. Try a hard refresh: Cmd/Ctrl + Shift + R

### "I don't see Pet Finder project"
Create it first, then run the seed script.

### "Permission denied errors"
Make sure your user (monty.sharma@massdigi.org) is the owner of the Pet Finder project or is in the same organization.

### "The script ran but I still see empty"
Run the diagnostic query again (Step 2) to verify data was inserted. If data shows in database but not in UI, it's a frontend loading issue - check browser console.

## Technical Details

**RLS Policies:**
- Tables have Row Level Security enabled
- Data is visible if you're:
  - An admin
  - A member of the organization that owns the project
  - Have edit permissions on the project

**Data Loading:**
- Hook: `src/hooks/useSectorMapData.ts`
- Context: `src/contexts/SectorMapContext.tsx`
- Component: `src/components/SectorMapModule.tsx`
- Tables: `project_first_target`, `project_competitors`, `project_decision_makers`
