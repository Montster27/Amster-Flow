import type { Assumption, EnhancedInterview } from '../types/discovery';

/**
 * Seed data for Pet Finder project - Discovery
 * Demonstrates a realistic pet adoption platform discovery process
 */

export const petFinderAssumptions: Omit<Assumption, 'id' | 'created' | 'lastUpdated'>[] = [
  // Problem Assumptions (Stage 1)
  {
    type: 'problem',
    canvasArea: 'problem',
    validationStage: 1,
    description: 'Pet adopters struggle to find suitable pets because shelter websites are outdated and hard to navigate',
    status: 'validated',
    confidence: 4,
    importance: 5,
    priority: 'high',
    riskScore: 10,
    evidence: [
      'Interview 2024-01-15: Supports - "I gave up trying to use the shelter website after 10 minutes"',
      'Interview 2024-01-18: Supports - 8/10 users complained about difficult navigation',
    ],
    interviewCount: 5,
    lastTestedDate: '2024-01-20',
  },
  {
    type: 'problem',
    canvasArea: 'problem',
    validationStage: 1,
    description: 'Shelters lose potential adopters because their adoption process takes too long (3-5 weeks on average)',
    status: 'testing',
    confidence: 3,
    importance: 4,
    priority: 'medium',
    riskScore: 12,
    evidence: [
      'Interview 2024-01-12: Supports - "By the time the shelter called me back, I found a pet elsewhere"',
    ],
    interviewCount: 2,
    lastTestedDate: '2024-01-15',
  },
  {
    type: 'customer',
    canvasArea: 'problem',
    validationStage: 1,
    description: 'First-time pet owners are anxious about choosing the right pet for their lifestyle',
    status: 'validated',
    confidence: 5,
    importance: 4,
    priority: 'medium',
    riskScore: 4,
    evidence: [
      'Interview 2024-01-14: Supports - "I had no idea if I was ready for a high-energy dog"',
      'Survey data shows 78% of first-time adopters felt overwhelmed',
    ],
    interviewCount: 6,
    lastTestedDate: '2024-01-18',
  },

  // Existing Alternatives (Stage 2)
  {
    type: 'customer',
    canvasArea: 'existingAlternatives',
    validationStage: 2,
    description: 'Pet adopters currently use Petfinder.com but find the search filters inadequate',
    status: 'validated',
    confidence: 4,
    importance: 3,
    priority: 'medium',
    riskScore: 6,
    evidence: [
      'Interview 2024-01-16: Supports - "Petfinder doesn\'t let me filter by apartment-friendly"',
    ],
    interviewCount: 4,
    lastTestedDate: '2024-01-17',
  },
  {
    type: 'problem',
    canvasArea: 'existingAlternatives',
    validationStage: 2,
    description: 'Shelters pay $200-500/month for outdated listing services that don\'t drive adoptions',
    status: 'testing',
    confidence: 2,
    importance: 5,
    priority: 'high',
    riskScore: 20,
    evidence: [],
    interviewCount: 1,
    lastTestedDate: '2024-01-10',
  },

  // Customer Segments (Stage 1)
  {
    type: 'customer',
    canvasArea: 'customerSegments',
    validationStage: 1,
    description: 'Urban millennials (25-40) with apartments are our primary adopter segment',
    status: 'validated',
    confidence: 5,
    importance: 5,
    priority: 'high',
    riskScore: 5,
    evidence: [
      'Census data shows 65% of adopters are 25-40',
      'Interview 2024-01-13: Pattern confirmed across 8 interviews',
    ],
    interviewCount: 8,
    lastTestedDate: '2024-01-19',
  },
  {
    type: 'customer',
    canvasArea: 'customerSegments',
    validationStage: 1,
    description: 'Small to medium shelters (10-100 animals) struggle most with adoption marketing',
    status: 'validated',
    confidence: 4,
    importance: 4,
    priority: 'medium',
    riskScore: 8,
    evidence: [
      'Interview 2024-01-11: Shelter director confirmed limited marketing budget',
    ],
    interviewCount: 3,
    lastTestedDate: '2024-01-16',
  },

  // Early Adopters (Stage 2)
  {
    type: 'customer',
    canvasArea: 'earlyAdopters',
    validationStage: 2,
    description: 'Tech-savvy pet lovers who already use social media to follow shelter accounts will try our platform first',
    status: 'untested',
    confidence: 3,
    importance: 4,
    priority: 'medium',
    riskScore: 12,
    evidence: [],
    interviewCount: 0,
  },

  // Solution (Stage 2)
  {
    type: 'solution',
    canvasArea: 'solution',
    validationStage: 2,
    description: 'A mobile-first search experience with personality-based matching will convert 30% better than current solutions',
    status: 'untested',
    confidence: 2,
    importance: 5,
    priority: 'high',
    riskScore: 20,
    evidence: [],
    interviewCount: 0,
  },
  {
    type: 'solution',
    canvasArea: 'solution',
    validationStage: 2,
    description: 'Video profiles of pets will increase adoption applications by 2x compared to photos alone',
    status: 'invalidated',
    confidence: 4,
    importance: 3,
    priority: 'low',
    riskScore: 6,
    evidence: [
      'Interview 2024-01-17: Contradicts - "I don\'t have time to watch videos, just show me photos"',
      'A/B test showed videos increased time on site but not applications',
    ],
    interviewCount: 4,
    lastTestedDate: '2024-01-19',
  },

  // Unique Value Proposition (Stage 2)
  {
    type: 'solution',
    canvasArea: 'uniqueValueProposition',
    validationStage: 2,
    description: 'Our personality quiz will match adopters with compatible pets better than traditional search filters',
    status: 'testing',
    confidence: 3,
    importance: 5,
    priority: 'high',
    riskScore: 15,
    evidence: [
      'Interview 2024-01-18: Supports - "This would have saved me so much time!"',
    ],
    interviewCount: 3,
    lastTestedDate: '2024-01-18',
  },

  // Channels (Stage 3)
  {
    type: 'customer',
    canvasArea: 'channels',
    validationStage: 3,
    description: 'Instagram and TikTok are the most effective channels for reaching millennial pet adopters',
    status: 'validated',
    confidence: 5,
    importance: 4,
    priority: 'medium',
    riskScore: 4,
    evidence: [
      'Social media analytics show 80% engagement from these platforms',
      'Interview 2024-01-14: All 6 interviewees discovered pets via social media',
    ],
    interviewCount: 6,
    lastTestedDate: '2024-01-17',
  },

  // Revenue Streams (Stage 3)
  {
    type: 'solution',
    canvasArea: 'revenueStreams',
    validationStage: 3,
    description: 'Shelters will pay $99/month for premium listings and analytics',
    status: 'untested',
    confidence: 2,
    importance: 5,
    priority: 'high',
    riskScore: 20,
    evidence: [],
    interviewCount: 0,
  },
  {
    type: 'customer',
    canvasArea: 'revenueStreams',
    validationStage: 3,
    description: 'Adopters are willing to pay $5-10 for premium matching and support features',
    status: 'invalidated',
    confidence: 4,
    importance: 3,
    priority: 'low',
    riskScore: 6,
    evidence: [
      'Interview 2024-01-20: Contradicts - "I would never pay for pet adoption help"',
      '9/10 users rejected paid features',
    ],
    interviewCount: 5,
    lastTestedDate: '2024-01-20',
  },

  // Cost Structure (Stage 3)
  {
    type: 'solution',
    canvasArea: 'costStructure',
    validationStage: 3,
    description: 'Our primary costs will be platform development ($50k) and shelter onboarding ($2k/month)',
    status: 'untested',
    confidence: 3,
    importance: 3,
    priority: 'low',
    riskScore: 9,
    evidence: [],
    interviewCount: 0,
  },

  // Key Metrics (Stage 3)
  {
    type: 'solution',
    canvasArea: 'keyMetrics',
    validationStage: 3,
    description: 'Successful adoption rate (applications that result in adoption) is our North Star metric',
    status: 'validated',
    confidence: 4,
    importance: 5,
    priority: 'high',
    riskScore: 10,
    evidence: [
      'Shelter directors confirmed this is what they care about most',
    ],
    interviewCount: 3,
    lastTestedDate: '2024-01-16',
  },

  // Unfair Advantage (Stage 3)
  {
    type: 'solution',
    canvasArea: 'unfairAdvantage',
    validationStage: 3,
    description: 'Our founder\'s 10-year relationship with regional shelter network gives us exclusive partnership access',
    status: 'validated',
    confidence: 5,
    importance: 4,
    priority: 'medium',
    riskScore: 4,
    evidence: [
      'Signed LOIs with 5 major shelters in our network',
    ],
    interviewCount: 5,
    lastTestedDate: '2024-01-15',
  },
];

export const petFinderInterviews: Omit<EnhancedInterview, 'id' | 'created' | 'lastUpdated'>[] = [
  {
    intervieweeType: 'customer',
    segmentName: 'First-time Pet Adopter - Urban Millennial',
    date: '2024-01-15',
    context: 'Coffee shop in downtown, 30-minute interview with recent adopter',
    status: 'completed',
    mainPainPoints: 'Shelter websites were impossible to navigate. Most had broken search features or missing photos. I spent hours browsing different sites and couldn\'t filter by apartment-friendly pets.',
    problemImportance: 5,
    problemImportanceQuote: 'This was so frustrating I almost gave up on adopting',
    currentAlternatives: 'Used Petfinder.com, Google searches for local shelters, and scrolled through Instagram hashtags like #adoptdontshop',
    memorableQuotes: [
      'I gave up trying to use the shelter website after 10 minutes',
      'I wish there was a Tinder for pets - swipe right on the cute ones!',
    ],
    surprisingFeedback: 'They wanted MORE information about pet personalities, not less. They were willing to fill out a detailed quiz to find the right match.',
    assumptionTags: [
      // Will be populated with actual assumption IDs when seeding
    ],
    studentReflection: 'This interview validated our core problem hypothesis. Users are definitely struggling with current shelter websites. The Tinder comment sparked an idea for swipe-based UI. Need to test personality matching concept more.',
  },
  {
    intervieweeType: 'customer',
    segmentName: 'Experienced Pet Owner - Suburban Family',
    date: '2024-01-18',
    context: 'Video call, 45-minute interview with mom of 2 kids',
    status: 'completed',
    mainPainPoints: 'Finding a dog that was good with kids and had the right energy level for our family was nearly impossible. Shelters barely had any information about temperament.',
    problemImportance: 4,
    problemImportanceQuote: 'We ended up getting a dog from a breeder because we couldn\'t risk getting the wrong fit',
    currentAlternatives: 'Visited multiple shelters in person, used Adopt-a-Pet website, joined local Facebook groups for pet adoption',
    memorableQuotes: [
      'I don\'t have time to watch videos, just show me photos and key info',
      'Personality matching would have saved us 3 shelter visits',
    ],
    surprisingFeedback: 'Video profiles were seen as a waste of time - they just wanted quick, digestible information. Photos and bullet points were preferred.',
    assumptionTags: [],
    studentReflection: 'This invalidated our video assumption! Users want efficiency over rich media. The personality matching idea got strong positive reaction though. Families are a different segment with different needs than millennials.',
  },
  {
    intervieweeType: 'customer',
    segmentName: 'Small Shelter Director',
    date: '2024-01-11',
    context: 'In-person at shelter, 1-hour interview',
    status: 'completed',
    mainPainPoints: 'We pay $300/month for a listing service but get very few applications. Our website is outdated but we can\'t afford to hire a developer. We spend 10 hours/week manually posting pets to different sites.',
    problemImportance: 5,
    problemImportanceQuote: 'Every day a pet stays with us costs $15. We need to increase adoptions or we can\'t keep operating',
    currentAlternatives: 'Petfinder.com, Adopt-a-Pet, manual Facebook posts, local newspaper ads',
    memorableQuotes: [
      'If you can get me 10 more adoptions per month, I\'ll pay whatever you charge',
      'I need to see which listings are actually working - I have no analytics right now',
    ],
    surprisingFeedback: 'Shelters desperately want data and analytics. They\'re flying blind and would pay for insights into what works.',
    assumptionTags: [],
    studentReflection: 'Shelters are much more motivated buyers than I expected. They see this as a business problem, not just a nice-to-have. Analytics and data could be a huge value prop. Price sensitivity might be lower than we thought.',
  },
];
