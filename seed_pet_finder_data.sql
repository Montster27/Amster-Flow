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

  -- Create assumptions
  RAISE NOTICE '📝 Creating 9 assumptions...';

  INSERT INTO project_assumptions (
    project_id, type, description, status, confidence, evidence, created_by
  ) VALUES
    (project_uuid, 'problem',
     'Pet owners panic within 3.7 seconds of realizing their pet is missing and will immediately check their phone',
     'testing', 4,
     ARRAY['Observed neighbor running down street in pajamas yelling "Mr. Whiskers!" while frantically refreshing Facebook'],
     user_uuid),

    (project_uuid, 'customer',
     'People trust their neighbors more than professional pet recovery services, except for Craig who never returns borrowed tools',
     'validated', 5,
     ARRAY['Neighborhood watch meeting devolved into 45-minute discussion about Craig', 'Craig was not invited'],
     user_uuid),

    (project_uuid, 'problem',
     'Pet owners will describe their pets with the accuracy of an eyewitness who saw Bigfoot for 0.3 seconds',
     'validated', 5,
     ARRAY['"She''s a medium-sized... or maybe large... brownish... possibly black... dog? Could be a cat."'],
     user_uuid),

    (project_uuid, 'problem',
     'Cats are not actually lost, they are just ignoring their owners on purpose',
     'invalidated', 2,
     ARRAY['Survey of 50 "lost" cats found 47 were within 20 feet of home, judging their owners silently'],
     user_uuid),

    (project_uuid, 'solution',
     'A mobile app with push notifications will be more effective than the current system of stapling blurry photocopies to telephone poles',
     'validated', 5,
     ARRAY['Telephone pole union has filed complaint', 'Local staple shortage resolved'],
     user_uuid),

    (project_uuid, 'solution',
     'Real-time pet sighting map will not devolve into people reporting every squirrel as a "small furry creature"',
     'invalidated', 1,
     ARRAY['Beta test had 847 squirrel reports in first hour', 'One user reported their own reflection'],
     user_uuid),

    (project_uuid, 'solution',
     'Users will pay $2.99/month for premium features like "Pet Psychic Connection" and "Quantum Pet Locator"',
     'testing', 3,
     ARRAY['3 users upgraded for the psychic feature unironically', '127 users think it actually works'],
     user_uuid),

    (project_uuid, 'customer',
     'Dog owners form 73% of the market because cat owners have accepted their fate',
     'validated', 4,
     ARRAY['Cat owners survey: "My cat will come back when they feel like it, probably"'],
     user_uuid),

    (project_uuid, 'customer',
     'Retirees are the most active users because they have binoculars, time, and a deep need to know neighborhood gossip',
     'validated', 5,
     ARRAY['Barbara (72) has reported 15 pet sightings this week', 'None were the actual lost pets', 'All reports included detailed backstory of homeowners'],
     user_uuid);

  RAISE NOTICE '✅ Created 9 assumptions';

  -- Create enhanced interviews
  RAISE NOTICE '💬 Creating 4 enhanced interviews...';

  INSERT INTO project_interviews_enhanced (
    project_id, interviewee_type, segment_name, interview_date, context, status,
    main_pain_points, problem_importance, problem_importance_quote, current_alternatives,
    memorable_quotes, surprising_feedback, student_reflection, created_by
  ) VALUES
    -- Interview 1: Jennifer - The Panicked Dog Owner
    (project_uuid, 'customer', 'Panicked Pet Parents', NOW() - INTERVAL '2 days',
     'Met Jennifer at dog park while her golden retriever was literally right behind her',
     'completed',
     'Can''t post on enough Facebook groups fast enough. Tried 47 groups. Kicked out of 12 for spam. One admin thought she was a bot. Currently banned from "Suburban Moms Who Wine."',
     5,
     '"I WOULD PAY ONE MILLION DOLLARS RIGHT NOW IF SOMEONE COULD FIND BAILEY! Wait, there he is. Never mind. BUT I WOULD HAVE PAID IT!"',
     'Posting on Facebook, Instagram, NextDoor, Twitter, carrier pigeon network. Considered hiring skywriter. Actually did hire skywriter (it just said "DOG"). Called local TV station 3 times. They blocked her number.',
     ARRAY[
       'My other dog seemed relieved Bailey was gone. Is that... is that normal?',
       'I described Bailey as golden but looking at photos now, he might be beige? Cream? Is there a difference?',
       'The most helpful response was from a guy who said "dogs usually come back" which really put things in perspective'
     ],
     'When asked if she would use an app, she said yes WHILE ALREADY DOWNLOADING IT before I finished explaining what it does. Then tried to pay me personally to find Bailey (who was, again, right there).',
     'The level of panic is real and immediate. Users in this state will click anything, download anything, pay anything. This is either our biggest opportunity or biggest ethical concern. Jennifer has now signed up for 3 different pet-finding services including one that''s definitely a scam. Market insight: panic = poor decision making = high conversion rate?',
     user_uuid),

    -- Interview 2: Robert - The Retired Neighborhood Watch Captain
    (project_uuid, 'customer', 'The Observant Retirees', NOW() - INTERVAL '5 days',
     'Interview with Robert (68) who called me over because I "looked suspicious walking down the street with a clipboard." I was literally conducting interviews.',
     'completed',
     'Cannot effectively communicate the 47 different pets he''s observed this week to the 23 different owners who don''t know their pets are "missing." Has detailed spreadsheet. Color-coded. Cross-referenced with weather patterns. May have too much time.',
     5,
     '"I saw a tabby cat, approximately 12 pounds, heading north-northwest at 14:37 hours. Appeared to be pursuing a bird. Owner didn''t even know cat was gone. People these days have no SITUATIONAL AWARENESS."',
     'Personal patrol 3x daily with binoculars, phone tree of other retirees, detailed log book, neighborhood WhatsApp group (that he moderates with an iron fist), walking stick "for pointing at suspicious pets."',
     ARRAY[
       'I''ve been doing this for free. Are you telling me I could have been PAID?',
       'My wife says I need a hobby. I told her this IS my hobby. She meant a "normal" hobby.',
       'Last week I reunited 4 pets with owners who didn''t know they were lost. They seemed... annoyed? Young people.',
       'I have 847 photos of neighborhood pets on my phone. My grandchildren''s photos? Maybe 12.'
     ],
     'When showed the app concept, asked if he could be designated "Official Neighborhood Scout" with a badge. Then asked if badge could be physical. When told no, asked if his verification status could at least say "Supreme Commander of Pet Surveillance." Compromise: we''ll give him "Top Contributor" status. He accepted but seemed disappointed.',
     'We accidentally created a power user segment we didn''t expect. Retirees have: time, dedication, territorial instinct, and smartphones with excellent cameras. Robert has a BETTER phone than me specifically for "pet documentation." He upgraded for the camera. This is a weird but valuable user segment. Question: How do we gamify this without encouraging stalking?',
     user_uuid),

    -- Interview 3: Marcus - The Defeated Cat Owner
    (project_uuid, 'customer', 'Cat Owners (Defeated)', NOW() - INTERVAL '1 day',
     'Interviewed Marcus while his cat, Lord Fluffington, sat on the fence behind him, making direct eye contact with me the entire time. The cat KNEW.',
     'completed',
     'Cat has been "missing" for 3 days. Cat is currently visible from Marcus''s kitchen window. Marcus is aware. Cat is aware that Marcus is aware. This is apparently normal. The problem is not finding the cat. The problem is accepting that the cat simply does not care.',
     2,
     '"Look, I know WHERE Lord Fluffington is. He''s right there, judging me. But he won''t COME HOME. That''s the problem. Can your app... make cats less terrible? No? Then I don''t need it."',
     'Leaving food outside, shaking treat bag, making pathetic "pspsps" sounds, crying softly, acceptance, denial, more acceptance. Sometimes just staring out window hoping for eye contact (which cat provides but as a power move).',
     ARRAY[
       'Cats are not lost. They''re just... elsewhere. On purpose.',
       'My neighbor found my cat and returned him three times. Each time, Lord Fluffington looked personally offended.',
       'I spent $80 on a GPS collar. He removed it in 4 minutes. The collar is lost now. Maybe I need to find THAT.',
       'The vet told me "indoor cats live longer." Lord Fluffington disagrees with this assessment.'
     ],
     'Showed him the app. He laughed. Then asked if there''s a feature to report "my cat is being a jerk, location: that tree, probably judging you too." When I said no, he suggested we pivot the entire business model. His exact words: "You''re solving the wrong problem. The problem isn''t lost cats. It''s cats."',
     'Hypothesis invalidated: Cat owners are not our primary market. They''ve achieved enlightenment through suffering. They don''t want to find their cat - they want their cat to WANT to be found. This is a spiritual journey, not a technical problem. Possible pivot: Pet therapy app? "Acceptance as a Service"? Maybe we just focus on dogs. Dogs actually like their owners.',
     user_uuid),

    -- Interview 4: Sarah - The Overly Enthusiastic Helper
    (project_uuid, 'customer', 'The Helpers', NOW() - INTERVAL '3 days',
     'Interview with Sarah who has helped find 8 pets this month, none of which were actually lost. One was a lawn ornament. She remains enthusiastic.',
     'completed',
     'Wants to help find lost pets but can''t tell the difference between lost pets and pets that are just... existing. Also can''t tell difference between real pets and remarkably realistic lawn decorations (one incident). Enthusiasm level: concerning.',
     4,
     '"Every pet I see COULD be lost! Better safe than sorry! That statue? COULD be a very still dog! That''s just how committed I am!"',
     'Stops every pet owner on street, maintains spreadsheet of "suspicious pet activity," created neighborhood Facebook group called "IS THIS YOUR PET?" (all caps required), printed 500 flyers saying "DID YOU LOSE A PET? ANY PET? I CAN HELP!"',
     ARRAY[
       'I once spent 2 hours trying to catch a "lost" rabbit. It was wild. Like, actual wildlife. That lives here.',
       'People seem less grateful than expected when I knock on their door at 6 AM to report their dog is in their yard.',
       'My therapist says I need "boundaries." I told her lost pets don''t respect boundaries so why should I?',
       'I''ve been blocked by 3 neighbors on NextDoor for "excessive pet vigilance." That''s not even a real rule!'
     ],
     'When shown the app, immediately asked if there''s a leaderboard. When told not yet, suggested rewards system: Bronze Helper (5 pets), Silver Savior (10 pets), Gold Guardian (25 pets), Platinum... she had a whole hierarchy planned. Also asked if she could report pets BEFORE they''re lost, "as a preventative measure." Had to explain that''s called stalking.',
     'Discovered a user type we didn''t anticipate: The Overly Helpful. They mean well but might actually make things worse. Sarah has caused 3 neighborhood feuds by "reuniting" pets with wrong owners. On the plus side, she''ll definitely use the app. On the minus side, she''ll use it TOO much. Need to consider: rate limiting? Cooldown period between reports? "Chill out" notification?',
     user_uuid);

  RAISE NOTICE '✅ Created 4 enhanced interviews';

  -- ============================================================================
  -- PART 3: SECTOR MAP DATA
  -- ============================================================================

  RAISE NOTICE '🗺️  Creating Sector Map data...';

  -- First Target / Customer Type
  INSERT INTO project_first_target (project_id, customer_type, description, company_size, location)
  VALUES (
    project_uuid,
    'consumer',
    'Jennifer, 42, suburban dog owner with emotional attachment issues. Works from home, makes organic dog treats, refers to herself as "dog mom." Has 12,000 Instagram followers at @BaileysAdventures. Will download app while panicking. Apple Pay ready. Target income: $75k+. Must live in neighborhood with other anxious pet owners and at least one Robert (retiree with binoculars).',
    'N/A - Consumer Product',
    'Suburban neighborhoods with HOAs, specifically areas where people know neighbors by dog names ("Oh, that''s Cooper''s mom!"). Initial launch: affluent suburbs of major metro areas where people have disposable income and ring doorbells with cameras.'
  )
  ON CONFLICT (project_id)
  DO UPDATE SET
    customer_type = EXCLUDED.customer_type,
    description = EXCLUDED.description,
    company_size = EXCLUDED.company_size,
    location = EXCLUDED.location;

  -- Competitors
  INSERT INTO project_competitors (project_id, name, description, suppliers, customers)
  VALUES
    -- Direct Competitors
    (project_uuid,
     'NextDoor App',
     'Hyperlocal social network where people argue about whether Ring camera footage shows "suspicious activity" or just "existing while different." Pet owners post lost pet alerts but they get buried under garage sale announcements and people complaining about fireworks. FREE but full of arguments.',
     ARRAY['Local moderators (unpaid)', 'Community managers', 'People with too much time'],
     ARRAY['Everyone in your neighborhood', 'People who love drama', 'HOA presidents']),

    (project_uuid,
     'Facebook Groups ("Lost Pets of [City]")',
     'The current "solution." Requires joining 47 different groups. Posts get buried in 3 minutes. Every group has different rules. One admin is definitely on a power trip. Features include: blurry photos, people who comment "praying!" without helping, and someone who always suggests the pet was "probably stolen."',
     ARRAY['Overly zealous group admins', 'People who share every post', 'The one person who runs 12 groups'],
     ARRAY['Panicked pet owners', 'People who love sharing', 'Drama enthusiasts']),

    (project_uuid,
     'Traditional Flyers on Telephone Poles',
     'The OG solution. Requires: printer, staple gun, waterproof lamination (optional but recommended), telephone poles (abundant), ability to look desperate in public. Success rate: unclear. Definitely keeps telephone pole unions employed though.',
     ARRAY['FedEx/Kinkos ($47 for 100 color copies)', 'Staple manufacturers', 'Telephone pole union'],
     ARRAY['People without smartphones?', 'Old school pet owners', 'The desperate']),

    (project_uuid,
     'Local Animal Shelters',
     'Not really competitors - more like reluctant partners. They''re overwhelmed, understaffed, and have 847 photos of random pets people "found" (stole from yards). They try their best but they''re basically playing memory match with hundreds of pets.',
     ARRAY['Volunteers', 'Donations', 'The government (barely)', 'That one wealthy lady who loves animals'],
     ARRAY['People who lost pets', 'People who found pets', 'People adopting pets', 'Robert (visits daily)']),

    -- Indirect Competitors / Substitutes
    (project_uuid,
     'Pet Psychics',
     'YES, THIS IS REAL. People pay $50-200 for someone to "communicate telepathically" with their lost pet. Success rate: 0% but customer satisfaction: surprisingly high? They tell you what you want to hear: "Your pet is safe and thinking of you." Competitor or potential premium feature? TBD.',
     ARRAY['The universe', 'Gullible pet owners', 'Etsy'],
     ARRAY['Desperate people', 'Crystal collectors', 'People who also believe in horoscopes']),

    (project_uuid,
     'Ring/Nest Camera Neighborhood Networks',
     'People check camera footage for pet sightings. Effective but requires: owning Ring camera, neighbors with Ring cameras, pet actually walking past cameras, ability to identify small furry blob in night vision footage. Spoiler: every raccoon looks like a lost dog at 2 AM.',
     ARRAY['Amazon', 'Google', 'Paranoid neighbors'],
     ARRAY['Security-conscious homeowners', 'People who watch their neighbors', 'The surveillance state']),

    (project_uuid,
     'Professional Pet Trackers',
     'Actual businesses that will search for your pet. Cost: $500-2000. Success rate: good! Problem: expensive and not available everywhere. They''re like bounty hunters but for pets. Cool but intimidating. "We have a 95% success rate and tactical gear."',
     ARRAY['Ex-military tracking dogs', 'GPS equipment', 'Determination'],
     ARRAY['Wealthy pet owners', 'People with expensive pets', 'Celebrities']),

    (project_uuid,
     'Just Waiting and Hoping',
     'The most common "strategy." Free! Zero effort! Success rate depends on whether your pet actually wants to come home. Works great for dogs (they get hungry). Terrible for cats (they''re at a neighbor''s house being fed salmon).',
     ARRAY['Hope', 'Prayer', 'Denial', 'Cat food left outside'],
     ARRAY['Cat owners mostly', 'Optimists', 'People who can''t afford anything else']);

  -- Decision Makers (for Consumer product, these are influences on purchase decision)
  INSERT INTO project_decision_makers (project_id, role, influence, description)
  VALUES
    (project_uuid,
     'Pet Owner (Primary User)',
     'decision-maker',
     'Jennifer: Makes download decision in 3.7 seconds of panic. Will pay for ANYTHING if it might help find Bailey. Has Apple Pay ready before we finish explaining features. Downloads app, subscribes to premium, leaves 5-star review, tells all 47 Facebook groups about us.'),

    (project_uuid,
     'Spouse/Partner',
     'payer',
     'The person who sees the $2.99/month charge on credit card statement. Usually says "What''s this Pet Psychic Connection charge?" Gets explained the situation. Agrees because they also love Bailey. Sometimes THEY lost the pet (forgot to close gate) so they can''t really object.'),

    (project_uuid,
     'Kids in Household',
     'influencer',
     'Crying children asking "Where''s Mr. Whiskers?" are the ultimate conversion tool. No parent can resist a sobbing child. Kids don''t influence the purchase directly but their emotional devastation creates urgency. Also they''re surprisingly good at spotting pets in neighborhoods.'),

    (project_uuid,
     'Robert (Age 68, Neighborhood Watch)',
     'influencer',
     'Doesn''t make purchase decisions but influences EVERYONE. Has binoculars, detailed spreadsheets, and opinions. If Robert says "You should use that new app," people listen. He''s basically a grassroots marketing channel. Wants to be Supreme Commander of Pet Surveillance.'),

    (project_uuid,
     'Veterinarian',
     'influencer',
     'Trusted authority figure. If vet clinic has our poster/flyer, instant credibility. Vets see desperate pet owners daily and can recommend our app. Dr. Peterson is skeptical but admitted "it''s not the WORST idea I''ve heard today." High praise from Dr. Peterson.'),

    (project_uuid,
     'Local Pet Store Owner',
     'influencer',
     'Community hub for pet owners. If they recommend us, people trust it. Also these stores have bulletin boards covered in lost pet flyers. They KNOW the pain. Potential partner: "Found your pet using PetFinder? Get 10% off at Barky''s Pet Supply!"'),

    (project_uuid,
     'That One Friend Who''s "Good With Apps"',
     'influencer',
     'Every friend group has the "tech person." When Jennifer frantically asks "What should I do?" this person says "There''s probably an app for that." If THEY can''t find a good pet-finding app, they''ll remember us when they finally do search. Word of mouth gold.');

  RAISE NOTICE '✅ Created Sector Map with First Target, 8 Competitors, and 7 Decision Makers';

  -- ============================================================================
  -- PART 4: VISUAL SECTOR MAP DATA
  -- ============================================================================

  RAISE NOTICE '🎨 Creating Visual Sector Map data...';

  -- Insert visual sector map as JSON
  INSERT INTO project_visual_sector_map (project_id, data, updated_by)
  VALUES (
    project_uuid,
    jsonb_build_object(
      'scope', jsonb_build_object(
        'sector', 'Lost Pet Recovery / Neighborhood Pet Finding',
        'question', 'Who are the key players in helping panicked pet owners find their lost pets, and how do money, information, and trust flow between them?'
      ),
      'actors', jsonb_build_array(
        -- Customers
        jsonb_build_object('id', 'jennifer', 'name', 'Jennifer (Panicked Pet Owner)', 'category', 'customer', 'position', jsonb_build_object('x', 200, 'y', 300), 'description', 'Primary user: suburban dog owner, downloads app in 3.7 seconds of panic, Apple Pay ready', 'created', NOW()),
        jsonb_build_object('id', 'cat-owner', 'name', 'Marcus (Cat Owner)', 'category', 'customer', 'position', jsonb_build_object('x', 400, 'y', 300), 'description', 'Defeated cat owner. Lord Fluffington is visible but won''t come home. Has achieved zen acceptance.', 'created', NOW()),

        -- Influencers
        jsonb_build_object('id', 'robert', 'name', 'Robert (Age 68)', 'category', 'influencer', 'position', jsonb_build_object('x', 200, 'y', 100), 'description', 'Supreme Commander of Pet Surveillance. Has binoculars, spreadsheets, and 847 pet photos. Grassroots marketing channel.', 'created', NOW()),
        jsonb_build_object('id', 'vet', 'name', 'Dr. Peterson (Veterinarian)', 'category', 'influencer', 'position', jsonb_build_object('x', 600, 'y', 100), 'description', 'Trusted authority. Says "not the WORST idea I''ve heard today." High praise from Dr. Peterson.', 'created', NOW()),
        jsonb_build_object('id', 'pet-store', 'name', 'Local Pet Store', 'category', 'partner', 'position', jsonb_build_object('x', 500, 'y', 500), 'description', 'Community hub. Bulletin board covered in lost pet flyers. They KNOW the pain.', 'created', NOW()),

        -- Our Product
        jsonb_build_object('id', 'pet-finder', 'name', 'PetFinder App (Us!)', 'category', 'provider', 'position', jsonb_build_object('x', 400, 'y', 200), 'description', 'Mobile app for hyperlocal pet finding. Like Amber Alert but for pets. Premium features include "Pet Psychic Connection."', 'created', NOW()),

        -- Competitors
        jsonb_build_object('id', 'nextdoor', 'name', 'NextDoor', 'category', 'provider', 'position', jsonb_build_object('x', 600, 'y', 300), 'description', 'Social network where pet alerts get buried under garage sales and people argue about Ring cameras.', 'created', NOW()),
        jsonb_build_object('id', 'facebook', 'name', 'Facebook Groups', 'category', 'provider', 'position', jsonb_build_object('x', 700, 'y', 400), 'description', 'Requires joining 47 groups. One admin is definitely on a power trip. Posts buried in 3 minutes.', 'created', NOW()),
        jsonb_build_object('id', 'shelter', 'name', 'Animal Shelter', 'category', 'partner', 'position', jsonb_build_object('x', 100, 'y', 500), 'description', 'Overwhelmed, understaffed, playing memory match with hundreds of pets. Robert visits daily.', 'created', NOW()),
        jsonb_build_object('id', 'pet-psychic', 'name', 'Pet Psychics', 'category', 'provider', 'position', jsonb_build_object('x', 800, 'y', 200), 'description', 'YES, THIS IS REAL. $50-200 to "communicate telepathically" with pets. Success rate: 0%. Satisfaction: surprisingly high?', 'created', NOW())
      ),
      'connections', jsonb_build_array(
        -- Money flows
        jsonb_build_object('id', 'c1', 'sourceActorId', 'jennifer', 'targetActorId', 'pet-finder', 'type', 'money', 'description', '$2.99/month subscription (+ Pet Psychic premium)', 'layer', 'value', 'created', NOW()),
        jsonb_build_object('id', 'c2', 'sourceActorId', 'jennifer', 'targetActorId', 'pet-psychic', 'type', 'money', 'description', '$50-200 for telepathic pet communication (competitor threat)', 'layer', 'value', 'created', NOW()),
        jsonb_build_object('id', 'c3', 'sourceActorId', 'jennifer', 'targetActorId', 'pet-store', 'type', 'money', 'description', 'Regular customer, buys organic dog treats', 'layer', 'value', 'created', NOW()),

        -- Information flows
        jsonb_build_object('id', 'c4', 'sourceActorId', 'robert', 'targetActorId', 'jennifer', 'type', 'information', 'description', 'Robert spots pets, reports via app. Has 847 photos ready.', 'layer', 'information', 'created', NOW()),
        jsonb_build_object('id', 'c5', 'sourceActorId', 'jennifer', 'targetActorId', 'facebook', 'type', 'information', 'description', 'Posts in 47 groups simultaneously when panicking', 'layer', 'information', 'created', NOW()),
        jsonb_build_object('id', 'c6', 'sourceActorId', 'jennifer', 'targetActorId', 'nextdoor', 'type', 'information', 'description', 'Posts lost pet alerts (gets buried under garage sales)', 'layer', 'information', 'created', NOW()),
        jsonb_build_object('id', 'c7', 'sourceActorId', 'vet', 'targetActorId', 'pet-finder', 'type', 'support', 'description', 'Vet clinic can recommend our app. Instant credibility.', 'layer', 'information', 'created', NOW()),
        jsonb_build_object('id', 'c8', 'sourceActorId', 'pet-store', 'targetActorId', 'pet-finder', 'type', 'support', 'description', 'Partner: "Found pet using PetFinder? Get 10% off!"', 'layer', 'value', 'created', NOW()),
        jsonb_build_object('id', 'c9', 'sourceActorId', 'shelter', 'targetActorId', 'jennifer', 'type', 'information', 'description', 'Jennifer calls shelter 847 times checking for Bailey', 'layer', 'information', 'created', NOW())
      ),
      'annotations', jsonb_build_array(
        -- Pain points
        jsonb_build_object('id', 'a1', 'type', 'pain-point', 'targetId', 'c5', 'targetType', 'connection', 'content', 'PAIN: Jennifer is in 47 Facebook groups. Tired of this. Posts get buried in 3 minutes.', 'status', 'validated', 'created', NOW()),
        jsonb_build_object('id', 'a2', 'type', 'pain-point', 'targetId', 'c6', 'targetType', 'connection', 'content', 'PAIN: NextDoor buries pet alerts under garage sales and Ring camera arguments.', 'status', 'validated', 'created', NOW()),
        jsonb_build_object('id', 'a3', 'type', 'pain-point', 'targetId', 'shelter', 'targetType', 'actor', 'content', 'PAIN: Shelters overwhelmed. Playing memory match with hundreds of pets. Need better coordination.', 'status', 'validated', 'created', NOW()),

        -- Opportunities
        jsonb_build_object('id', 'a4', 'type', 'opportunity', 'targetId', 'robert', 'targetType', 'actor', 'content', 'OPPORTUNITY: Robert is a grassroots marketing channel. If he says "use the app," people listen. Give him "Supreme Commander" badge.', 'status', 'validated', 'created', NOW()),
        jsonb_build_object('id', 'a5', 'type', 'opportunity', 'targetId', 'c7', 'targetType', 'connection', 'content', 'OPPORTUNITY: Vets see desperate pet owners daily. Posters in vet clinics = instant credibility.', 'status', 'unvalidated', 'created', NOW()),
        jsonb_build_object('id', 'a6', 'type', 'opportunity', 'targetId', 'c8', 'targetType', 'connection', 'content', 'OPPORTUNITY: Partner with pet stores for cross-promotion. They have bulletin boards covered in lost pet flyers!', 'status', 'unvalidated', 'created', NOW()),

        -- Uncertainties
        jsonb_build_object('id', 'a7', 'type', 'uncertainty', 'targetId', 'cat-owner', 'targetType', 'actor', 'content', 'HYPOTHESIS: Cat owners have achieved zen acceptance. They don''t want to find their cat - they want their cat to WANT to be found. Maybe not our market?', 'status', 'needs-interview', 'created', NOW()),
        jsonb_build_object('id', 'a8', 'type', 'uncertainty', 'targetId', 'c2', 'targetType', 'connection', 'content', 'HYPOTHESIS: Pet Psychics are competitors OR potential premium feature? People pay $50-200 for this! Success rate 0% but satisfaction high??', 'status', 'needs-interview', 'created', NOW())
      ),
      'activeLayers', jsonb_build_array('value', 'information')
    ),
    user_uuid
  )
  ON CONFLICT (project_id)
  DO UPDATE SET
    data = EXCLUDED.data,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();

  RAISE NOTICE '✅ Created Visual Sector Map with 10 actors, 9 connections, and 8 annotations';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Pet Finder mock data loaded successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Complete Summary:';
  RAISE NOTICE '   ✅ Problem module: 4 questions answered';
  RAISE NOTICE '   ✅ Customer Segments module: 6 questions answered';
  RAISE NOTICE '   ✅ Solution module: 3 questions answered';
  RAISE NOTICE '   ✅ Assumptions: 9 created (customer, problem, solution)';
  RAISE NOTICE '   ✅ Enhanced Interviews: 4 completed';
  RAISE NOTICE '   ✅ Old Sector Map: First Target + 8 Competitors + 7 Decision Makers';
  RAISE NOTICE '   ✅ VISUAL Sector Map: 10 actors + 9 connections + 8 annotations';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 The Pivot or Proceed button is now enabled! (4 interviews >= 3 threshold)';
  RAISE NOTICE '🐕 Pet Finder is FULLY populated with hilarious mock data!';
  RAISE NOTICE '🗺️  Visual Sector Map shows: Jennifer, Robert, Pet Psychics, NextDoor, and connection flows';
  RAISE NOTICE '💡 The visual map includes pain points, opportunities, and hypotheses as annotations!';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Key characters:';
  RAISE NOTICE '   - Jennifer & Bailey (the dog who was right there)';
  RAISE NOTICE '   - Robert, age 68 (Supreme Commander of Pet Surveillance)';
  RAISE NOTICE '   - Marcus & Lord Fluffington (the judgmental cat)';
  RAISE NOTICE '   - Sarah (tried to rescue a lawn ornament)';
  RAISE NOTICE '   - Craig (never returns borrowed tools)';

END $$;
