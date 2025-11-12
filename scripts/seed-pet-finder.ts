/**
 * Script to populate Pet Finder project with amusing mock data
 * Run with: npx tsx scripts/seed-pet-finder.ts
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment or config
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedPetFinderData() {
  console.log('🔍 Finding Pet Finder project...');

  // Find the Pet Finder project
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, name')
    .ilike('name', '%pet%finder%')
    .limit(1);

  if (projectError) {
    console.error('❌ Error finding project:', projectError);
    return;
  }

  if (!projects || projects.length === 0) {
    console.error('❌ Pet Finder project not found');
    console.log('Available projects:');
    const { data: allProjects } = await supabase
      .from('projects')
      .select('name')
      .limit(10);
    allProjects?.forEach(p => console.log(`  - ${p.name}`));
    return;
  }

  const projectId = projects[0].id;
  console.log(`✅ Found project: ${projects[0].name} (${projectId})`);

  // Get user ID
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  console.log('\n📝 Creating assumptions...');

  // Create assumptions
  const assumptions = [
    {
      project_id: projectId,
      type: 'customer-need',
      description: 'Pet owners panic within 3.7 seconds of realizing their pet is missing and will immediately check their phone',
      status: 'testing',
      confidence: 4,
      evidence: ['Observed neighbor running down street in pajamas yelling "Mr. Whiskers!" while frantically refreshing Facebook'],
      created_by: userId,
    },
    {
      project_id: projectId,
      type: 'customer-need',
      description: 'People trust their neighbors more than professional pet recovery services, except for Craig who never returns borrowed tools',
      status: 'validated',
      confidence: 5,
      evidence: ['Neighborhood watch meeting devolved into 45-minute discussion about Craig', 'Craig was not invited'],
      created_by: userId,
    },
    {
      project_id: projectId,
      type: 'customer-need',
      description: 'Pet owners will describe their pets with the accuracy of an eyewitness who saw Bigfoot for 0.3 seconds',
      status: 'validated',
      confidence: 5,
      evidence: ['"She\'s a medium-sized... or maybe large... brownish... possibly black... dog? Could be a cat."'],
      created_by: userId,
    },
    {
      project_id: projectId,
      type: 'customer-need',
      description: 'Cats are not actually lost, they are just ignoring their owners on purpose',
      status: 'invalidated',
      confidence: 2,
      evidence: ['Survey of 50 "lost" cats found 47 were within 20 feet of home, judging their owners silently'],
      created_by: userId,
    },
    {
      project_id: projectId,
      type: 'solution',
      description: 'A mobile app with push notifications will be more effective than the current system of stapling blurry photocopies to telephone poles',
      status: 'validated',
      confidence: 5,
      evidence: ['Telephone pole union has filed complaint', 'Local staple shortage resolved'],
      created_by: userId,
    },
    {
      project_id: projectId,
      type: 'solution',
      description: 'Real-time pet sighting map will not devolve into people reporting every squirrel as a "small furry creature"',
      status: 'invalidated',
      confidence: 1,
      evidence: ['Beta test had 847 squirrel reports in first hour', 'One user reported their own reflection'],
      created_by: userId,
    },
    {
      project_id: projectId,
      type: 'solution',
      description: 'Users will pay $2.99/month for premium features like "Pet Psychic Connection" and "Quantum Pet Locator"',
      status: 'testing',
      confidence: 3,
      evidence: ['3 users upgraded for the psychic feature unironically', '127 users think it actually works'],
      created_by: userId,
    },
    {
      project_id: projectId,
      type: 'customer-segment',
      description: 'Dog owners form 73% of the market because cat owners have accepted their fate',
      status: 'validated',
      confidence: 4,
      evidence: ['Cat owners survey: "My cat will come back when they feel like it, probably"'],
      created_by: userId,
    },
    {
      project_id: projectId,
      type: 'customer-segment',
      description: 'Retirees are the most active users because they have binoculars, time, and a deep need to know neighborhood gossip',
      status: 'validated',
      confidence: 5,
      evidence: ['Barbara (72) has reported 15 pet sightings this week', 'None were the actual lost pets', 'All reports included detailed backstory of homeowners'],
      created_by: userId,
    },
  ];

  const { error: assumptionsError } = await supabase
    .from('project_assumptions')
    .insert(assumptions);

  if (assumptionsError) {
    console.error('❌ Error creating assumptions:', assumptionsError);
    return;
  }

  console.log(`✅ Created ${assumptions.length} assumptions`);

  console.log('\n💬 Creating enhanced interviews...');

  // Create enhanced interviews
  const interviews = [
    {
      project_id: projectId,
      interviewee_type: 'customer',
      segment_name: 'Panicked Pet Parents',
      interview_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      context: 'Met Jennifer at dog park while her golden retriever was literally right behind her',
      status: 'completed',
      main_pain_points: 'Can\'t post on enough Facebook groups fast enough. Tried 47 groups. Kicked out of 12 for spam. One admin thought she was a bot. Currently banned from "Suburban Moms Who Wine."',
      problem_importance: 5,
      problem_importance_quote: '"I WOULD PAY ONE MILLION DOLLARS RIGHT NOW IF SOMEONE COULD FIND BAILEY! Wait, there he is. Never mind. BUT I WOULD HAVE PAID IT!"',
      current_alternatives: 'Posting on Facebook, Instagram, NextDoor, Twitter, carrier pigeon network. Considered hiring skywriter. Actually did hire skywriter (it just said "DOG"). Called local TV station 3 times. They blocked her number.',
      memorable_quotes: [
        'My other dog seemed relieved Bailey was gone. Is that... is that normal?',
        'I described Bailey as golden but looking at photos now, he might be beige? Cream? Is there a difference?',
        'The most helpful response was from a guy who said "dogs usually come back" which really put things in perspective'
      ],
      surprising_feedback: 'When asked if she would use an app, she said yes WHILE ALREADY DOWNLOADING IT before I finished explaining what it does. Then tried to pay me personally to find Bailey (who was, again, right there).',
      student_reflection: 'The level of panic is real and immediate. Users in this state will click anything, download anything, pay anything. This is either our biggest opportunity or biggest ethical concern. Jennifer has now signed up for 3 different pet-finding services including one that\'s definitely a scam. Market insight: panic = poor decision making = high conversion rate?',
      created_by: userId,
    },
    {
      project_id: projectId,
      interviewee_type: 'customer',
      segment_name: 'The Observant Retirees',
      interview_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      context: 'Interview with Robert (68) who called me over because I "looked suspicious walking down the street with a clipboard." I was literally conducting interviews.',
      status: 'completed',
      main_pain_points: 'Cannot effectively communicate the 47 different pets he\'s observed this week to the 23 different owners who don\'t know their pets are "missing." Has detailed spreadsheet. Color-coded. Cross-referenced with weather patterns. May have too much time.',
      problem_importance: 5,
      problem_importance_quote: '"I saw a tabby cat, approximately 12 pounds, heading north-northwest at 14:37 hours. Appeared to be pursuing a bird. Owner didn\'t even know cat was gone. People these days have no SITUATIONAL AWARENESS."',
      current_alternatives: 'Personal patrol 3x daily with binoculars, phone tree of other retirees, detailed log book, neighborhood WhatsApp group (that he moderates with an iron fist), walking stick "for pointing at suspicious pets."',
      memorable_quotes: [
        'I\'ve been doing this for free. Are you telling me I could have been PAID?',
        'My wife says I need a hobby. I told her this IS my hobby. She meant a "normal" hobby.',
        'Last week I reunited 4 pets with owners who didn\'t know they were lost. They seemed... annoyed? Young people.',
        'I have 847 photos of neighborhood pets on my phone. My grandchildren\'s photos? Maybe 12.'
      ],
      surprising_feedback: 'When showed the app concept, asked if he could be designated "Official Neighborhood Scout" with a badge. Then asked if badge could be physical. When told no, asked if his verification status could at least say "Supreme Commander of Pet Surveillance." Compromise: we\'ll give him "Top Contributor" status. He accepted but seemed disappointed.',
      student_reflection: 'We accidentally created a power user segment we didn\'t expect. Retirees have: time, dedication, territorial instinct, and smartphones with excellent cameras. Robert has a BETTER phone than me specifically for "pet documentation." He upgraded for the camera. This is a weird but valuable user segment. Question: How do we gamify this without encouraging stalking?',
      created_by: userId,
    },
    {
      project_id: projectId,
      interviewee_type: 'customer',
      segment_name: 'Cat Owners (Defeated)',
      interview_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      context: 'Interviewed Marcus while his cat, Lord Fluffington, sat on the fence behind him, making direct eye contact with me the entire time. The cat KNEW.',
      status: 'completed',
      main_pain_points: 'Cat has been "missing" for 3 days. Cat is currently visible from Marcus\'s kitchen window. Marcus is aware. Cat is aware that Marcus is aware. This is apparently normal. The problem is not finding the cat. The problem is accepting that the cat simply does not care.',
      problem_importance: 2,
      problem_importance_quote: '"Look, I know WHERE Lord Fluffington is. He\'s right there, judging me. But he won\'t COME HOME. That\'s the problem. Can your app... make cats less terrible? No? Then I don\'t need it."',
      current_alternatives: 'Leaving food outside, shaking treat bag, making pathetic "pspsps" sounds, crying softly, acceptance, denial, more acceptance. Sometimes just staring out window hoping for eye contact (which cat provides but as a power move).',
      memorable_quotes: [
        'Cats are not lost. They\'re just... elsewhere. On purpose.',
        'My neighbor found my cat and returned him three times. Each time, Lord Fluffington looked personally offended.',
        'I spent $80 on a GPS collar. He removed it in 4 minutes. The collar is lost now. Maybe I need to find THAT.',
        'The vet told me "indoor cats live longer." Lord Fluffington disagrees with this assessment.'
      ],
      surprising_feedback: 'Showed him the app. He laughed. Then asked if there\'s a feature to report "my cat is being a jerk, location: that tree, probably judging you too." When I said no, he suggested we pivot the entire business model. His exact words: "You\'re solving the wrong problem. The problem isn\'t lost cats. It\'s cats."',
      student_reflection: 'Hypothesis invalidated: Cat owners are not our primary market. They\'ve achieved enlightenment through suffering. They don\'t want to find their cat - they want their cat to WANT to be found. This is a spiritual journey, not a technical problem. Possible pivot: Pet therapy app? "Acceptance as a Service"? Maybe we just focus on dogs. Dogs actually like their owners.',
      created_by: userId,
    },
    {
      project_id: projectId,
      interviewee_type: 'customer',
      segment_name: 'The Helpers',
      interview_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      context: 'Interview with Sarah who has helped find 8 pets this month, none of which were actually lost. One was a lawn ornament. She remains enthusiastic.',
      status: 'completed',
      main_pain_points: 'Wants to help find lost pets but can\'t tell the difference between lost pets and pets that are just... existing. Also can\'t tell difference between real pets and remarkably realistic lawn decorations (one incident). Enthusiasm level: concerning.',
      problem_importance: 4,
      problem_importance_quote: '"Every pet I see COULD be lost! Better safe than sorry! That statue? COULD be a very still dog! That\'s just how committed I am!"',
      current_alternatives: 'Stops every pet owner on street, maintains spreadsheet of "suspicious pet activity," created neighborhood Facebook group called "IS THIS YOUR PET?" (all caps required), printed 500 flyers saying "DID YOU LOSE A PET? ANY PET? I CAN HELP!"',
      memorable_quotes: [
        'I once spent 2 hours trying to catch a "lost" rabbit. It was wild. Like, actual wildlife. That lives here.',
        'People seem less grateful than expected when I knock on their door at 6 AM to report their dog is in their yard.',
        'My therapist says I need "boundaries." I told her lost pets don\'t respect boundaries so why should I?',
        'I\'ve been blocked by 3 neighbors on NextDoor for "excessive pet vigilance." That\'s not even a real rule!'
      ],
      surprising_feedback: 'When shown the app, immediately asked if there\'s a leaderboard. When told not yet, suggested rewards system: Bronze Helper (5 pets), Silver Savior (10 pets), Gold Guardian (25 pets), Platinum... she had a whole hierarchy planned. Also asked if she could report pets BEFORE they\'re lost, "as a preventative measure." Had to explain that\'s called stalking.',
      student_reflection: 'Discovered a user type we didn\'t anticipate: The Overly Helpful. They mean well but might actually make things worse. Sarah has caused 3 neighborhood feuds by "reuniting" pets with wrong owners. On the plus side, she\'ll definitely use the app. On the minus side, she\'ll use it TOO much. Need to consider: rate limiting? Cooldown period between reports? "Chill out" notification?',
      created_by: userId,
    },
  ];

  const { error: interviewsError } = await supabase
    .from('project_interviews_enhanced')
    .insert(interviews);

  if (interviewsError) {
    console.error('❌ Error creating interviews:', interviewsError);
    return;
  }

  console.log(`✅ Created ${interviews.length} enhanced interviews`);

  console.log('\n🎉 Mock data creation complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - ${assumptions.length} assumptions created`);
  console.log(`   - ${interviews.length} enhanced interviews created`);
  console.log('');
  console.log('🔗 The Pivot or Proceed button should now be enabled!');
}

seedPetFinderData().catch(console.error);
