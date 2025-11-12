-- ============================================================================
-- SEED DATA FOR PET FINDER PROJECT
-- Amusing mock assumptions and interviews for testing
-- ============================================================================

-- First, find the pet finder project
DO $$
DECLARE
  project_uuid UUID;
  user_uuid UUID;
  assumption_ids UUID[];
  interview_ids UUID[];
BEGIN

  -- Find Pet Finder project
  SELECT id INTO project_uuid
  FROM projects
  WHERE LOWER(name) LIKE '%pet%finder%'
  LIMIT 1;

  IF project_uuid IS NULL THEN
    RAISE NOTICE '❌ Pet Finder project not found. Please create it first.';
    RETURN;
  END IF;

  -- Get the user who will own this data
  SELECT id INTO user_uuid
  FROM profiles
  WHERE email = 'monty.sharma@massdigi.org'
  LIMIT 1;

  IF user_uuid IS NULL THEN
    -- Use the first available user
    SELECT id INTO user_uuid FROM profiles LIMIT 1;
  END IF;

  RAISE NOTICE '✅ Found Pet Finder project: %', project_uuid;

  -- ============================================================================
  -- PART 1: PROBLEM, CUSTOMER SEGMENTS, SOLUTION (Module Answers)
  -- ============================================================================

  RAISE NOTICE '📝 Creating answers for Problem, Customer Segments, and Solution modules...';

  -- Problem Module Answers
  INSERT INTO project_modules (project_id, module_name, question_index, answer)
  VALUES
    -- Q1: What's the biggest challenge or frustration your target customers face?
    (project_uuid, 'problem', 0,
     'Pet owners experience sheer existential terror when they realize their pet is missing. The current system of running around the neighborhood yelling a pet''s name while neighbors judge you is inefficient and emotionally devastating. Also, stapling blurry photocopies to telephone poles doesn''t work when it''s raining, which is apparently when pets prefer to escape.'),

    -- Q2: How are they suffering? What emotions do they feel when facing this problem?
    (project_uuid, 'problem', 1,
     'Panic, guilt, shame, and the crushing realization that their cat probably left on purpose. Dog owners feel betrayed ("I GAVE YOU EVERYTHING!"), while cat owners achieve a zen-like acceptance ("He''ll come back when he''s ready to disappoint me again"). There''s also frustration with well-meaning neighbors who report every vaguely similar animal including: squirrels, raccoons, and in one case, a mailbox.'),

    -- Q3: How are they currently dealing with this problem? What workarounds do they use?
    (project_uuid, 'problem', 2,
     'Current solutions include: posting in 47 Facebook groups simultaneously, walking around shaking treat bags like a deranged tambourine player, bribing neighborhood kids, hiring pet psychics (yes, really), and one person actually bought a drone. The drone found 3 other lost pets but not theirs. They kept the drone.'),

    -- Q4: Why is this problem worth solving? What's at stake if it goes unsolved?
    (project_uuid, 'problem', 3,
     'Beyond the obvious emotional trauma and potential loss of a family member, there''s the financial cost (lost pet posters, rewards, therapy bills). More importantly, pets that stay lost longer are more likely to be hit by cars, picked up by shelters, or in the case of cats, start a new life with a neighbor who feeds them better. The telephone pole unions are also getting rich off staple sales.')
  ON CONFLICT (project_id, module_name, question_index)
  DO UPDATE SET answer = EXCLUDED.answer;

  -- Customer Segments Module Answers
  INSERT INTO project_modules (project_id, module_name, question_index, answer)
  VALUES
    -- Q1: Who experiences this problem most intensely?
    (project_uuid, 'customerSegments', 0,
     'Suburban dog owners aged 30-65 with emotional attachment issues (guilty, all dog owners). Specifically: people who refer to themselves as "pet parents," have multiple photos of their pet as phone wallpaper, and celebrate their pet''s birthday with cake. Also includes retirees with binoculars and too much free time who have appointed themselves neighborhood pet surveillance officers.'),

    -- Q2: Tell me about the first person who will buy this. Paint a specific picture.
    (project_uuid, 'customerSegments', 1,
     'Meet Jennifer, 42, works from home, golden retriever named Bailey (who is currently behind her but she doesn''t know that). Has 12,000 followers on Instagram (@BaileysAdventures), makes organic dog treats, uses hashtags like #DogMom and #FurBaby unironically. When Bailey goes missing, she will download this app WHILE we''re still explaining what it does. Has Apple Pay ready. Will leave 5-star review before even using it.'),

    -- Q3: What are they doing to solve the problem now?
    (project_uuid, 'customerSegments', 2,
     'They''re in every neighborhood Facebook group, NextDoor (where they fight with people), and have created a phone tree of other anxious pet owners. They print color flyers at FedEx ($47 for 100 copies), staple them to every surface including some that might be private property, and have the local shelter on speed dial. They''ve also befriended Robert, the 68-year-old with binoculars, who somehow knows where every pet in a 2-mile radius is at all times.'),

    -- Q4: Why do they want change?
    (project_uuid, 'customerSegments', 3,
     'The current system is slow, inefficient, and makes them look unhinged to their neighbors. They want to find their pet FAST before it gets dark, before it rains, or before it reaches the highway. They''re motivated by love, guilt, and the fear of having to explain to their children why Mr. Whiskers isn''t coming home. Also, they''re tired of being in 47 Facebook groups.'),

    -- Q5: What makes this group different from others who might also have the problem?
    (project_uuid, 'customerSegments', 4,
     'Dog owners will actually use the app and pay for it. Cat owners have accepted their fate and see missing cats as a "personality trait" rather than a problem. Dog owners have smartphones, emotional urgency, and credit cards. They''re also more tech-savvy than you''d think (they already use 12 pet-related apps). Most importantly: they have HOPE. Cat owners have moved beyond hope into philosophical acceptance.'),

    -- Q6: Can you narrow it down further?
    (project_uuid, 'customerSegments', 5,
     'Initial target: Suburban dog owners in neighborhoods with HOAs (they have disposable income and care about community). Specifically: people who walk their dogs twice daily and know their neighbors by their dog''s names ("Oh, that''s Cooper''s mom!"). Secondary market: The Retiree Surveillance Network - older folks who want to be designated "official neighborhood scouts" and will use the app 847 times per day. They don''t have lost pets; they just really, really want to help.')
  ON CONFLICT (project_id, module_name, question_index)
  DO UPDATE SET answer = EXCLUDED.answer;

  -- Solution Module Answers
  INSERT INTO project_modules (project_id, module_name, question_index, answer)
  VALUES
    -- Q1: What's the simplest way you could address this problem?
    (project_uuid, 'solution', 0,
     'Mobile app with real-time pet sighting reports and push notifications. Users post their lost pet with photo/description. Neighbors in the area get notified and can report sightings with GPS location. It''s like Amber Alert but for pets. Simple map interface shows "last seen here" markers. No complicated features - just: Lost Pet → Neighbors See Alert → Someone Spots It → Owner Gets Notification → Reunion → Tears of Joy → 5-Star Review.'),

    -- Q2: What are the key features or steps that make your solution work?
    (project_uuid, 'solution', 1,
     'Core features: (1) Post lost pet with photo in under 30 seconds because they''re panicking, (2) Automatic alert to neighbors within 1-mile radius, (3) Sighting map that doesn''t require a PhD to understand, (4) Direct messaging between finder and owner, (5) "FOUND" button that''s big and obvious, (6) Optional premium features like "Pet Psychic Connection" for the people who will pay for literally anything. Key insight: Make it work for people who are currently crying.'),

    -- Q3: How is your approach different from what already exists?
    (project_uuid, 'solution', 2,
     'Unlike Facebook groups (chaos), NextDoor (arguments), or posting flyers (weather-dependent), we''re HYPERLOCAL and INSTANT. No joining 47 groups. No arguments about whether the suspicious person on Ring camera is "suspicious" or just "walking while Black." No waiting for your post to get buried under someone''s garage sale announcement. Just: alert → sighting → reunion. Also, we''ll probably add gamification because Robert needs a leaderboard. He NEEDS it.')
  ON CONFLICT (project_id, module_name, question_index)
  DO UPDATE SET answer = EXCLUDED.answer;

  -- Mark these modules as completed
  INSERT INTO project_module_completion (project_id, module_name, completed)
  VALUES
    (project_uuid, 'problem', true),
    (project_uuid, 'customerSegments', true),
    (project_uuid, 'solution', true)
  ON CONFLICT (project_id, module_name)
  DO UPDATE SET completed = true;

  RAISE NOTICE '✅ Created Problem, Customer Segments, and Solution content';

  -- ============================================================================
  -- PART 2: SECTOR MAP DATA
  -- ============================================================================

  RAISE NOTICE '🗺️  Creating Sector Map data...';

  -- First Target / Customer Type
  INSERT INTO project_first_target (project_id, customer_type, description, company_size, location, updated_by)
  VALUES (
    project_uuid,
    'consumer',
    'Jennifer, 42, suburban dog owner with emotional attachment issues. Works from home, makes organic dog treats, refers to herself as "dog mom." Has 12,000 Instagram followers at @BaileysAdventures. Will download app while panicking. Apple Pay ready. Target income: $75k+. Must live in neighborhood with other anxious pet owners and at least one Robert (retiree with binoculars).',
    'N/A - Consumer Product',
    'Suburban neighborhoods with HOAs, specifically areas where people know neighbors by dog names ("Oh, that''s Cooper''s mom!"). Initial launch: affluent suburbs of major metro areas where people have disposable income and ring doorbells with cameras.',
    user_uuid
  )
  ON CONFLICT (project_id)
  DO UPDATE SET
    customer_type = EXCLUDED.customer_type,
    description = EXCLUDED.description,
    company_size = EXCLUDED.company_size,
    location = EXCLUDED.location,
    updated_by = EXCLUDED.updated_by;

  -- Competitors
  INSERT INTO project_competitors (project_id, name, description, suppliers, customers, created_by)
  VALUES
    -- Direct Competitors
    (project_uuid,
     'NextDoor App',
     'Hyperlocal social network where people argue about whether Ring camera footage shows "suspicious activity" or just "existing while different." Pet owners post lost pet alerts but they get buried under garage sale announcements and people complaining about fireworks. FREE but full of arguments.',
     ARRAY['Local moderators (unpaid)', 'Community managers', 'People with too much time'],
     ARRAY['Everyone in your neighborhood', 'People who love drama', 'HOA presidents'],
     user_uuid),

    (project_uuid,
     'Facebook Groups ("Lost Pets of [City]")',
     'The current "solution." Requires joining 47 different groups. Posts get buried in 3 minutes. Every group has different rules. One admin is definitely on a power trip. Features include: blurry photos, people who comment "praying!" without helping, and someone who always suggests the pet was "probably stolen."',
     ARRAY['Overly zealous group admins', 'People who share every post', 'The one person who runs 12 groups'],
     ARRAY['Panicked pet owners', 'People who love sharing', 'Drama enthusiasts'],
     user_uuid),

    (project_uuid,
     'Traditional Flyers on Telephone Poles',
     'The OG solution. Requires: printer, staple gun, waterproof lamination (optional but recommended), telephone poles (abundant), ability to look desperate in public. Success rate: unclear. Definitely keeps telephone pole unions employed though.',
     ARRAY['FedEx/Kinkos ($47 for 100 color copies)', 'Staple manufacturers', 'Telephone pole union'],
     ARRAY['People without smartphones?', 'Old school pet owners', 'The desperate'],
     user_uuid),

    (project_uuid,
     'Local Animal Shelters',
     'Not really competitors - more like reluctant partners. They''re overwhelmed, understaffed, and have 847 photos of random pets people "found" (stole from yards). They try their best but they''re basically playing memory match with hundreds of pets.',
     ARRAY['Volunteers', 'Donations', 'The government (barely)', 'That one wealthy lady who loves animals'],
     ARRAY['People who lost pets', 'People who found pets', 'People adopting pets', 'Robert (visits daily)'],
     user_uuid),

    -- Indirect Competitors / Substitutes
    (project_uuid,
     'Pet Psychics',
     'YES, THIS IS REAL. People pay $50-200 for someone to "communicate telepathically" with their lost pet. Success rate: 0% but customer satisfaction: surprisingly high? They tell you what you want to hear: "Your pet is safe and thinking of you." Competitor or potential premium feature? TBD.',
     ARRAY['The universe', 'Gullible pet owners', 'Etsy'],
     ARRAY['Desperate people', 'Crystal collectors', 'People who also believe in horoscopes'],
     user_uuid),

    (project_uuid,
     'Ring/Nest Camera Neighborhood Networks',
     'People check camera footage for pet sightings. Effective but requires: owning Ring camera, neighbors with Ring cameras, pet actually walking past cameras, ability to identify small furry blob in night vision footage. Spoiler: every raccoon looks like a lost dog at 2 AM.',
     ARRAY['Amazon', 'Google', 'Paranoid neighbors'],
     ARRAY['Security-conscious homeowners', 'People who watch their neighbors', 'The surveillance state'],
     user_uuid),

    (project_uuid,
     'Professional Pet Trackers',
     'Actual businesses that will search for your pet. Cost: $500-2000. Success rate: good! Problem: expensive and not available everywhere. They''re like bounty hunters but for pets. Cool but intimidating. "We have a 95% success rate and tactical gear."',
     ARRAY['Ex-military tracking dogs', 'GPS equipment', 'Determination'],
     ARRAY['Wealthy pet owners', 'People with expensive pets', 'Celebrities'],
     user_uuid),

    (project_uuid,
     'Just Waiting and Hoping',
     'The most common "strategy." Free! Zero effort! Success rate depends on whether your pet actually wants to come home. Works great for dogs (they get hungry). Terrible for cats (they''re at a neighbor''s house being fed salmon).',
     ARRAY['Hope', 'Prayer', 'Denial', 'Cat food left outside'],
     ARRAY['Cat owners mostly', 'Optimists', 'People who can''t afford anything else'],
     user_uuid)
  ON CONFLICT (id) DO NOTHING;

  -- Decision Makers (for Consumer product, these are influences on purchase decision)
  INSERT INTO project_decision_makers (project_id, role, influence, description, created_by)
  VALUES
    (project_uuid,
     'Pet Owner (Primary User)',
     'decision-maker',
     'Jennifer: Makes download decision in 3.7 seconds of panic. Will pay for ANYTHING if it might help find Bailey. Has Apple Pay ready before we finish explaining features. Downloads app, subscribes to premium, leaves 5-star review, tells all 47 Facebook groups about us.',
     user_uuid),

    (project_uuid,
     'Spouse/Partner',
     'payer',
     'The person who sees the $2.99/month charge on credit card statement. Usually says "What''s this Pet Psychic Connection charge?" Gets explained the situation. Agrees because they also love Bailey. Sometimes THEY lost the pet (forgot to close gate) so they can''t really object.',
     user_uuid),

    (project_uuid,
     'Kids in Household',
     'influencer',
     'Crying children asking "Where''s Mr. Whiskers?" are the ultimate conversion tool. No parent can resist a sobbing child. Kids don''t influence the purchase directly but their emotional devastation creates urgency. Also they''re surprisingly good at spotting pets in neighborhoods.',
     user_uuid),

    (project_uuid,
     'Robert (Age 68, Neighborhood Watch)',
     'influencer',
     'Doesn''t make purchase decisions but influences EVERYONE. Has binoculars, detailed spreadsheets, and opinions. If Robert says "You should use that new app," people listen. He''s basically a grassroots marketing channel. Wants to be Supreme Commander of Pet Surveillance.',
     user_uuid),

    (project_uuid,
     'Veterinarian',
     'influencer',
     'Trusted authority figure. If vet clinic has our poster/flyer, instant credibility. Vets see desperate pet owners daily and can recommend our app. Dr. Peterson is skeptical but admitted "it''s not the WORST idea I''ve heard today." High praise from Dr. Peterson.',
     user_uuid),

    (project_uuid,
     'Local Pet Store Owner',
     'influencer',
     'Community hub for pet owners. If they recommend us, people trust it. Also these stores have bulletin boards covered in lost pet flyers. They KNOW the pain. Potential partner: "Found your pet using PetFinder? Get 10% off at Barky''s Pet Supply!"',
     user_uuid),

    (project_uuid,
     'That One Friend Who''s "Good With Apps"',
     'influencer',
     'Every friend group has the "tech person." When Jennifer frantically asks "What should I do?" this person says "There''s probably an app for that." If THEY can''t find a good pet-finding app, they''ll remember us when they finally do search. Word of mouth gold.',
     user_uuid)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Created Sector Map with First Target, 8 Competitors, and 7 Decision Makers';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Pet Finder Sector Map data loaded successfully!';

END $$;
