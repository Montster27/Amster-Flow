-- ============================================================================
-- SEED DATA: Pet Finder — Step 0 "First Look"
-- Populates project_step0 for the Pet Finder template project so users browsing
-- it as a sample see a fully worked Step 0 (idea → customers → segments →
-- founder-market fit → why now → schlep → beachhead qualifiers → graduated).
-- ============================================================================

DO $$
DECLARE
  project_uuid UUID;
  user_uuid UUID;
BEGIN

  -- Find Pet Finder project
  SELECT id INTO project_uuid
  FROM projects
  WHERE LOWER(name) LIKE '%pet%finder%'
  LIMIT 1;

  IF project_uuid IS NULL THEN
    RAISE NOTICE '❌ Pet Finder project not found. Skipping Step 0 seed.';
    RETURN;
  END IF;

  -- Pick an owning user (prefer monty, else first profile)
  SELECT id INTO user_uuid
  FROM profiles
  WHERE email = 'monty.sharma@massdigi.org'
  LIMIT 1;

  IF user_uuid IS NULL THEN
    SELECT id INTO user_uuid FROM profiles LIMIT 1;
  END IF;

  RAISE NOTICE '✅ Found Pet Finder project: %', project_uuid;
  RAISE NOTICE '📝 Seeding Step 0 "First Look" data...';

  -- ============================================================================
  -- UPSERT project_step0 row
  -- ============================================================================
  INSERT INTO project_step0 (
    project_id,
    current_part,
    idea,
    customers,
    segments,
    focused_segment_id,
    focus_justification,
    has_graduated,
    founder_market_fit,
    why_now,
    schlep_assessment,
    beachhead_qualifiers,
    updated_by
  )
  VALUES (
    project_uuid,
    4, -- Finished all parts (0 Idea → 1 Customers → 2 Segments → 3 Rank → 4 Graduate)

    -- Part 0: Idea Statement
    jsonb_build_object(
      'building', 'a hyperlocal mobile app',
      'helps',    'panicked suburban pet owners',
      'achieve',  'find lost pets faster by crowdsourcing sightings from neighbors with push alerts — before 47 Facebook groups, pet psychics, or drones get involved'
    ),

    -- Part 1: Customers with Benefits (classified by 10 Need Categories)
    jsonb_build_array(
      -- Customer 1: Jennifer, the anxious dog parent (PRIMARY)
      jsonb_build_object(
        'id', 1001,
        'text', 'Jennifer — suburban dog parent (42, works from home, Bailey the golden retriever, 12k Instagram followers)',
        'benefits', jsonb_build_array(
          jsonb_build_object('text', 'Find my dog FAST — before it rains, gets dark, or reaches the highway', 'needCategory', 'risk'),
          jsonb_build_object('text', 'Skip posting in 47 Facebook groups while panicking', 'needCategory', 'efficiency'),
          jsonb_build_object('text', 'Stop feeling helpless — actually DO something in the first 10 minutes', 'needCategory', 'emotional'),
          jsonb_build_object('text', 'Avoid the "I told you so" from my spouse about leaving the gate open', 'needCategory', 'social'),
          jsonb_build_object('text', 'Not have to explain to the kids why Bailey isn''t coming home', 'needCategory', 'emotional')
        )
      ),
      -- Customer 2: Robert, the retiree neighborhood watcher (INFLUENCER / POWER USER)
      jsonb_build_object(
        'id', 1002,
        'text', 'Robert — 68, retiree with binoculars and a pet-spotting spreadsheet (self-appointed neighborhood watch)',
        'benefits', jsonb_build_array(
          jsonb_build_object('text', 'Feel useful and needed in retirement', 'needCategory', 'meaning'),
          jsonb_build_object('text', 'Earn recognition as the neighborhood''s "Supreme Commander of Pet Surveillance"', 'needCategory', 'identity'),
          jsonb_build_object('text', 'Connect with neighbors through a shared purpose (not just HOA disputes)', 'needCategory', 'social'),
          jsonb_build_object('text', 'Finally use the binoculars for something legitimate', 'needCategory', 'control')
        )
      ),
      -- Customer 3: Marcus, the defeated cat owner (ANTI-SEGMENT / contrast)
      jsonb_build_object(
        'id', 1003,
        'text', 'Marcus — 35, urban cat owner (Lord Fluffington has been "missing" since Tuesday, possibly at the neighbor''s getting fed salmon)',
        'benefits', jsonb_build_array(
          jsonb_build_object('text', 'Confirm the cat is alive somewhere, even if he''s chosen a new family', 'needCategory', 'emotional'),
          jsonb_build_object('text', 'Not get judged for "losing" a cat that clearly left on purpose', 'needCategory', 'social'),
          jsonb_build_object('text', 'Close the chapter so I can stop checking the door every 5 minutes', 'needCategory', 'emotional')
        )
      )
    ),

    -- Part 2: Segments (synced from customers, ranked by access)
    jsonb_build_array(
      jsonb_build_object(
        'id', 2001,
        'name', 'Jennifer — suburban dog parent (42, works from home, Bailey the golden retriever, 12k Instagram followers)',
        'customerId', 1001,
        'benefits', jsonb_build_array(
          jsonb_build_object('text', 'Find my dog FAST — before it rains, gets dark, or reaches the highway', 'needCategory', 'risk'),
          jsonb_build_object('text', 'Stop feeling helpless — actually DO something in the first 10 minutes', 'needCategory', 'emotional'),
          jsonb_build_object('text', 'Skip posting in 47 Facebook groups while panicking', 'needCategory', 'efficiency'),
          jsonb_build_object('text', 'Not have to explain to the kids why Bailey isn''t coming home', 'needCategory', 'emotional'),
          jsonb_build_object('text', 'Avoid the "I told you so" from my spouse about leaving the gate open', 'needCategory', 'social')
        ),
        'need', 'Find my dog FAST — before it rains, gets dark, or reaches the highway',
        'accessRank', 5
      ),
      jsonb_build_object(
        'id', 2002,
        'name', 'Robert — 68, retiree with binoculars and a pet-spotting spreadsheet (self-appointed neighborhood watch)',
        'customerId', 1002,
        'benefits', jsonb_build_array(
          jsonb_build_object('text', 'Feel useful and needed in retirement', 'needCategory', 'meaning'),
          jsonb_build_object('text', 'Earn recognition as the neighborhood''s "Supreme Commander of Pet Surveillance"', 'needCategory', 'identity'),
          jsonb_build_object('text', 'Connect with neighbors through a shared purpose (not just HOA disputes)', 'needCategory', 'social'),
          jsonb_build_object('text', 'Finally use the binoculars for something legitimate', 'needCategory', 'control')
        ),
        'need', 'Feel useful and needed in retirement',
        'accessRank', 4
      ),
      jsonb_build_object(
        'id', 2003,
        'name', 'Marcus — 35, urban cat owner (Lord Fluffington has been "missing" since Tuesday, possibly at the neighbor''s getting fed salmon)',
        'customerId', 1003,
        'benefits', jsonb_build_array(
          jsonb_build_object('text', 'Confirm the cat is alive somewhere, even if he''s chosen a new family', 'needCategory', 'emotional'),
          jsonb_build_object('text', 'Not get judged for "losing" a cat that clearly left on purpose', 'needCategory', 'social'),
          jsonb_build_object('text', 'Close the chapter so I can stop checking the door every 5 minutes', 'needCategory', 'emotional')
        ),
        'need', 'Confirm the cat is alive somewhere, even if he''s chosen a new family',
        'accessRank', 2
      )
    ),

    -- Focused segment: Jennifer (dog owners) is the beachhead
    2001,
    'Highest emotional urgency (panic = instant install + Apple Pay ready in 3.7 seconds), strongest willingness to pay (already spending on 47 Facebook groups, pet psychics at $50–200/session, and one documented drone purchase), and easiest to reach through existing HOA Facebook groups, Instagram pet-mom networks, and vet clinics. Cat owners (Marcus) have achieved zen acceptance and are not a buying segment. Robert is a force-multiplier distributor/influencer, not the primary buyer.',

    -- Has graduated — Pet Finder has moved on to full Discovery
    -- (assumptions + interviews live in project_assumptions / project_interviews_enhanced)
    true,

    -- Founder-Market Fit
    jsonb_build_object(
      'directExperience',   'adjacent',
      'domainCredibility',  'Spent 10+ years running tech for an animal-welfare nonprofit; personally lost two dogs (one recovered via a neighbor''s Ring camera after 36 hours) and helped organize three ad-hoc neighborhood searches. Run a 500+ member HOA Facebook group and have warm intros to two regional shelter directors.',
      'accessAdvantage',    'yes',
      'whyNowForYou',       'After cobbling together a custom Google Map to find a neighbor''s missing dog last summer, I saw how starved this space is for anything better than Facebook + staples. Every neighborhood has a Robert. Every neighborhood has a Jennifer. The infrastructure is obvious — nobody has bothered to build it.'
    ),

    -- Why Now
    jsonb_build_object(
      'catalystType', 'behavioral',
      'elaboration',  'Three behavioral shifts converge in 2024–2026: (1) post-COVID pet ownership spike — U.S. pet spending now >$136B/yr and rising, (2) Gen Z / millennial pet owners treat pets as family members worth premium app subscriptions (see: Rover, Fi collars, BarkBox), (3) hyperlocal networks (NextDoor, Citizen, Ring Neighbors) have normalized neighborhood-scoped push notifications. Combined with near-universal smartphone GPS, push-notification ubiquity, and one-tap Apple Pay, the infrastructure finally exists for what would have been science fiction 10 years ago.'
    ),

    -- Schlep Assessment
    jsonb_build_object(
      'attractiveness',      4,
      'messierAlternative',  'The real schlep: convincing neighbors to install an app just in case someone ELSE loses their pet (the classic cold-start / two-sided network problem). Also: moderating false sightings — at 2 AM every raccoon looks like a lost dog, and Robert will report all of them. Long-term schlep is one-by-one partnerships with shelters and vet clinics. We are deliberately ignoring the messier (but bigger) "unified pet health + lost + found" market to stay focused.'
    ),

    -- Beachhead Qualifiers
    jsonb_build_object(
      'howSmall',          'Suburban dog owners in HOA neighborhoods across three affluent Boston-area zip codes (02458 Newton, 02459 Newton Centre, 02460 Newtonville) — roughly 12,000 households with an estimated 6,500 dogs. Pilot radius: ~2 miles.',
      'activelySolving',   'yes',
      'canReachDirectly',  'yes'
    ),

    user_uuid
  )
  ON CONFLICT (project_id)
  DO UPDATE SET
    current_part          = EXCLUDED.current_part,
    idea                  = EXCLUDED.idea,
    customers             = EXCLUDED.customers,
    segments              = EXCLUDED.segments,
    focused_segment_id    = EXCLUDED.focused_segment_id,
    focus_justification   = EXCLUDED.focus_justification,
    has_graduated         = EXCLUDED.has_graduated,
    founder_market_fit    = EXCLUDED.founder_market_fit,
    why_now               = EXCLUDED.why_now,
    schlep_assessment     = EXCLUDED.schlep_assessment,
    beachhead_qualifiers  = EXCLUDED.beachhead_qualifiers,
    updated_by            = EXCLUDED.updated_by,
    updated_at            = NOW();

  RAISE NOTICE '✅ Pet Finder Step 0 seeded:';
  RAISE NOTICE '   • Idea statement (building/helps/achieve)';
  RAISE NOTICE '   • 3 customers (Jennifer, Robert, Marcus) with 12 need-classified benefits';
  RAISE NOTICE '   • 3 segments with access ranks (5, 4, 2)';
  RAISE NOTICE '   • Focused beachhead: Jennifer (dog-parent segment) with justification';
  RAISE NOTICE '   • Founder-Market Fit, Why Now, Schlep, Beachhead Qualifiers';
  RAISE NOTICE '   • has_graduated = true';

END $$;
