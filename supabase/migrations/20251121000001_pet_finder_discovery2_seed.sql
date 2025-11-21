-- ============================================================================
-- DISCOVERY 2.0 SEED DATA FOR PET FINDER PROJECT
-- Assumptions and Enhanced Interviews
-- ============================================================================

DO $$
DECLARE
  project_uuid UUID;
  user_uuid UUID;

  -- Assumption IDs (we'll generate these)
  assumption_problem_1 UUID := gen_random_uuid();
  assumption_problem_2 UUID := gen_random_uuid();
  assumption_customer_1 UUID := gen_random_uuid();
  assumption_alt_1 UUID := gen_random_uuid();
  assumption_alt_2 UUID := gen_random_uuid();
  assumption_segment_1 UUID := gen_random_uuid();
  assumption_segment_2 UUID := gen_random_uuid();
  assumption_early_1 UUID := gen_random_uuid();
  assumption_solution_1 UUID := gen_random_uuid();
  assumption_solution_2 UUID := gen_random_uuid();
  assumption_uvp_1 UUID := gen_random_uuid();
  assumption_channels_1 UUID := gen_random_uuid();
  assumption_revenue_1 UUID := gen_random_uuid();
  assumption_revenue_2 UUID := gen_random_uuid();
  assumption_cost_1 UUID := gen_random_uuid();
  assumption_metrics_1 UUID := gen_random_uuid();
  assumption_unfair_1 UUID := gen_random_uuid();
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

  -- Get user
  SELECT id INTO user_uuid
  FROM profiles
  WHERE email = 'monty.sharma@massdigi.org'
  LIMIT 1;

  IF user_uuid IS NULL THEN
    SELECT id INTO user_uuid FROM profiles LIMIT 1;
  END IF;

  RAISE NOTICE '✅ Found Pet Finder project: %', project_uuid;
  RAISE NOTICE '📝 Seeding Discovery 2.0 data...';

  -- Delete existing Discovery 2.0 data to avoid duplicates
  DELETE FROM project_interviews_enhanced WHERE project_id = project_uuid;
  DELETE FROM project_assumptions WHERE project_id = project_uuid AND canvas_area IS NOT NULL;

  -- ============================================================================
  -- PART 1: ASSUMPTIONS
  -- ============================================================================

  INSERT INTO project_assumptions (
    id, project_id, type, description, status, confidence, importance, priority,
    risk_score, evidence, created_at, updated_at, created_by, canvas_area,
    interview_count, last_tested_date
  ) VALUES

  -- Problem Assumptions
  (
    assumption_problem_1,
    project_uuid,
    'problem',
    'Pet adopters struggle to find suitable pets because shelter websites are outdated and hard to navigate',
    'validated',
    4, 5, 'high', 10,
    ARRAY[
      'Interview 2024-01-15: Supports - "I gave up trying to use the shelter website after 10 minutes"',
      'Interview 2024-01-18: Supports - 8/10 users complained about difficult navigation'
    ],
    NOW(), NOW(), user_uuid, 'problem', 5, '2024-01-20'
  ),
  (
    assumption_problem_2,
    project_uuid,
    'problem',
    'Shelters lose potential adopters because their adoption process takes too long (3-5 weeks on average)',
    'testing',
    3, 4, 'medium', 12,
    ARRAY['Interview 2024-01-12: Supports - "By the time the shelter called me back, I found a pet elsewhere"'],
    NOW(), NOW(), user_uuid, 'problem', 2, '2024-01-15'
  ),
  (
    assumption_customer_1,
    project_uuid,
    'customer',
    'First-time pet owners are anxious about choosing the right pet for their lifestyle',
    'validated',
    5, 4, 'medium', 4,
    ARRAY[
      'Interview 2024-01-14: Supports - "I had no idea if I was ready for a high-energy dog"',
      'Survey data shows 78% of first-time adopters felt overwhelmed'
    ],
    NOW(), NOW(), user_uuid, 'problem', 6, '2024-01-18'
  ),

  -- Existing Alternatives
  (
    assumption_alt_1,
    project_uuid,
    'customer',
    'Pet adopters currently use Petfinder.com but find the search filters inadequate',
    'validated',
    4, 3, 'medium', 6,
    ARRAY['Interview 2024-01-16: Supports - "Petfinder doesn''t let me filter by apartment-friendly"'],
    NOW(), NOW(), user_uuid, 'existingAlternatives', 4, '2024-01-17'
  ),
  (
    assumption_alt_2,
    project_uuid,
    'problem',
    'Shelters pay $200-500/month for outdated listing services that don''t drive adoptions',
    'testing',
    2, 5, 'high', 20,
    ARRAY[]::text[],
    NOW(), NOW(), user_uuid, 'existingAlternatives', 1, '2024-01-10'
  ),

  -- Customer Segments
  (
    assumption_segment_1,
    project_uuid,
    'customer',
    'Urban millennials (25-40) with apartments are our primary adopter segment',
    'validated',
    5, 5, 'high', 5,
    ARRAY[
      'Census data shows 65% of adopters are 25-40',
      'Interview 2024-01-13: Pattern confirmed across 8 interviews'
    ],
    NOW(), NOW(), user_uuid, 'customerSegments', 8, '2024-01-19'
  ),
  (
    assumption_segment_2,
    project_uuid,
    'customer',
    'Small to medium shelters (10-100 animals) struggle most with adoption marketing',
    'validated',
    4, 4, 'medium', 8,
    ARRAY['Interview 2024-01-11: Shelter director confirmed limited marketing budget'],
    NOW(), NOW(), user_uuid, 'customerSegments', 3, '2024-01-16'
  ),

  -- Early Adopters
  (
    assumption_early_1,
    project_uuid,
    'customer',
    'Tech-savvy pet lovers who already use social media to follow shelter accounts will try our platform first',
    'untested',
    3, 4, 'medium', 12,
    ARRAY[]::text[],
    NOW(), NOW(), user_uuid, 'earlyAdopters', 0, NULL
  ),

  -- Solution
  (
    assumption_solution_1,
    project_uuid,
    'solution',
    'A mobile-first search experience with personality-based matching will convert 30% better than current solutions',
    'untested',
    2, 5, 'high', 20,
    ARRAY[]::text[],
    NOW(), NOW(), user_uuid, 'solution', 0, NULL
  ),
  (
    assumption_solution_2,
    project_uuid,
    'solution',
    'Video profiles of pets will increase adoption applications by 2x compared to photos alone',
    'invalidated',
    4, 3, 'low', 6,
    ARRAY[
      'Interview 2024-01-17: Contradicts - "I don''t have time to watch videos, just show me photos"',
      'A/B test showed videos increased time on site but not applications'
    ],
    NOW(), NOW(), user_uuid, 'solution', 4, '2024-01-19'
  ),

  -- Unique Value Proposition
  (
    assumption_uvp_1,
    project_uuid,
    'solution',
    'Our personality quiz will match adopters with compatible pets better than traditional search filters',
    'testing',
    3, 5, 'high', 15,
    ARRAY['Interview 2024-01-18: Supports - "This would have saved me so much time!"'],
    NOW(), NOW(), user_uuid, 'uniqueValueProposition', 3, '2024-01-18'
  ),

  -- Channels
  (
    assumption_channels_1,
    project_uuid,
    'customer',
    'Instagram and TikTok are the most effective channels for reaching millennial pet adopters',
    'validated',
    5, 4, 'medium', 4,
    ARRAY[
      'Social media analytics show 80% engagement from these platforms',
      'Interview 2024-01-14: All 6 interviewees discovered pets via social media'
    ],
    NOW(), NOW(), user_uuid, 'channels', 6, '2024-01-17'
  ),

  -- Revenue Streams
  (
    assumption_revenue_1,
    project_uuid,
    'solution',
    'Shelters will pay $99/month for premium listings and analytics',
    'untested',
    2, 5, 'high', 20,
    ARRAY[]::text[],
    NOW(), NOW(), user_uuid, 'revenueStreams', 0, NULL
  ),
  (
    assumption_revenue_2,
    project_uuid,
    'customer',
    'Adopters are willing to pay $5-10 for premium matching and support features',
    'invalidated',
    4, 3, 'low', 6,
    ARRAY[
      'Interview 2024-01-20: Contradicts - "I would never pay for pet adoption help"',
      '9/10 users rejected paid features'
    ],
    NOW(), NOW(), user_uuid, 'revenueStreams', 5, '2024-01-20'
  ),

  -- Cost Structure
  (
    assumption_cost_1,
    project_uuid,
    'solution',
    'Our primary costs will be platform development ($50k) and shelter onboarding ($2k/month)',
    'untested',
    3, 3, 'low', 9,
    ARRAY[]::text[],
    NOW(), NOW(), user_uuid, 'costStructure', 0, NULL
  ),

  -- Key Metrics
  (
    assumption_metrics_1,
    project_uuid,
    'solution',
    'Successful adoption rate (applications that result in adoption) is our North Star metric',
    'validated',
    4, 5, 'high', 10,
    ARRAY['Shelter directors confirmed this is what they care about most'],
    NOW(), NOW(), user_uuid, 'keyMetrics', 3, '2024-01-16'
  ),

  -- Unfair Advantage
  (
    assumption_unfair_1,
    project_uuid,
    'solution',
    'Our founder''s 10-year relationship with regional shelter network gives us exclusive partnership access',
    'validated',
    5, 4, 'medium', 4,
    ARRAY['Signed LOIs with 5 major shelters in our network'],
    NOW(), NOW(), user_uuid, 'unfairAdvantage', 5, '2024-01-15'
  );

  RAISE NOTICE '✅ Inserted 17 assumptions';

  -- ============================================================================
  -- PART 2: ENHANCED INTERVIEWS
  -- ============================================================================

  INSERT INTO project_interviews_enhanced (
    id, project_id, interviewee_type, segment_name, interview_date,
    context, status, main_pain_points, problem_importance,
    problem_importance_quote, current_alternatives, memorable_quotes,
    surprising_feedback, assumption_tags, student_reflection,
    created_at, updated_at, created_by
  ) VALUES

  -- Interview 1: First-time adopter
  (
    gen_random_uuid(),
    project_uuid,
    'customer',
    'First-time Pet Adopter - Urban Millennial',
    '2024-01-15',
    'Coffee shop in downtown, 30-minute interview with recent adopter',
    'completed',
    'Shelter websites were impossible to navigate. Most had broken search features or missing photos. I spent hours browsing different sites and couldn''t filter by apartment-friendly pets.',
    5,
    'This was so frustrating I almost gave up on adopting',
    'Used Petfinder.com, Google searches for local shelters, and scrolled through Instagram hashtags like #adoptdontshop',
    ARRAY[
      'I gave up trying to use the shelter website after 10 minutes',
      'I wish there was a Tinder for pets - swipe right on the cute ones!'
    ],
    'They wanted MORE information about pet personalities, not less. They were willing to fill out a detailed quiz to find the right match.',
    jsonb_build_array(
      jsonb_build_object(
        'assumptionId', assumption_problem_1,
        'validationEffect', 'supports',
        'confidenceChange', 1,
        'quote', 'I gave up trying to use the shelter website after 10 minutes'
      ),
      jsonb_build_object(
        'assumptionId', assumption_uvp_1,
        'validationEffect', 'supports',
        'confidenceChange', 1,
        'quote', 'This would have saved me so much time!'
      )
    ),
    'This interview validated our core problem hypothesis. Users are definitely struggling with current shelter websites. The Tinder comment sparked an idea for swipe-based UI. Need to test personality matching concept more.',
    NOW(), NOW(), user_uuid
  ),

  -- Interview 2: Suburban family
  (
    gen_random_uuid(),
    project_uuid,
    'customer',
    'Experienced Pet Owner - Suburban Family',
    '2024-01-18',
    'Video call, 45-minute interview with mom of 2 kids',
    'completed',
    'Finding a dog that was good with kids and had the right energy level for our family was nearly impossible. Shelters barely had any information about temperament.',
    4,
    'We ended up getting a dog from a breeder because we couldn''t risk getting the wrong fit',
    'Visited multiple shelters in person, used Adopt-a-Pet website, joined local Facebook groups for pet adoption',
    ARRAY[
      'I don''t have time to watch videos, just show me photos and key info',
      'Personality matching would have saved us 3 shelter visits'
    ],
    'Video profiles were seen as a waste of time - they just wanted quick, digestible information. Photos and bullet points were preferred.',
    jsonb_build_array(
      jsonb_build_object(
        'assumptionId', assumption_solution_2,
        'validationEffect', 'contradicts',
        'confidenceChange', -2,
        'quote', 'I don''t have time to watch videos, just show me photos and key info'
      )
    ),
    'This invalidated our video assumption! Users want efficiency over rich media. The personality matching idea got strong positive reaction though. Families are a different segment with different needs than millennials.',
    NOW(), NOW(), user_uuid
  ),

  -- Interview 3: Shelter director
  (
    gen_random_uuid(),
    project_uuid,
    'customer',
    'Small Shelter Director',
    '2024-01-11',
    'In-person at shelter, 1-hour interview',
    'completed',
    'We pay $300/month for a listing service but get very few applications. Our website is outdated but we can''t afford to hire a developer. We spend 10 hours/week manually posting pets to different sites.',
    5,
    'Every day a pet stays with us costs $15. We need to increase adoptions or we can''t keep operating',
    'Petfinder.com, Adopt-a-Pet, manual Facebook posts, local newspaper ads',
    ARRAY[
      'If you can get me 10 more adoptions per month, I''ll pay whatever you charge',
      'I need to see which listings are actually working - I have no analytics right now'
    ],
    'Shelters desperately want data and analytics. They''re flying blind and would pay for insights into what works.',
    jsonb_build_array(
      jsonb_build_object(
        'assumptionId', assumption_metrics_1,
        'validationEffect', 'supports',
        'confidenceChange', 1,
        'quote', 'Every day a pet stays with us costs $15. We need to increase adoptions'
      )
    ),
    'Shelters are much more motivated buyers than I expected. They see this as a business problem, not just a nice-to-have. Analytics and data could be a huge value prop. Price sensitivity might be lower than we thought.',
    NOW(), NOW(), user_uuid
  );

  RAISE NOTICE '✅ Inserted 3 enhanced interviews';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Pet Finder Discovery 2.0 data loaded successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   ✅ 17 assumptions across all LBMC areas';
  RAISE NOTICE '   ✅ 3 enhanced interviews with assumption tags';
  RAISE NOTICE '   ✅ Status mix: validated, invalidated, testing, untested';
  RAISE NOTICE '   ✅ Risk scores range from 4 to 20';
  RAISE NOTICE '';

END $$;
