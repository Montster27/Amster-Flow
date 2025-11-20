import { supabase } from '../lib/supabase';
import { petFinderAssumptions, petFinderInterviews } from '../data/petFinderSeedData';
import type { Discovery2Assumption, EnhancedInterview, AssumptionTag } from '../types/discovery';

/**
 * Seeds Discovery 2.0 data for Pet Finder project
 * @param projectId - The project ID to seed data into
 * @param userId - The user ID creating the data
 */
export async function seedPetFinderData(projectId: string, userId: string) {
  try {
    console.log('🌱 Starting Pet Finder data seed...');

    // Step 1: Insert assumptions
    console.log('📝 Inserting assumptions...');
    const assumptionRows = petFinderAssumptions.map(assumption => ({
      id: crypto.randomUUID(),
      project_id: projectId,
      type: assumption.type,
      description: assumption.description,
      status: assumption.status,
      confidence: assumption.confidence,
      evidence: assumption.evidence,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      canvas_area: assumption.canvasArea,
      importance: assumption.importance,
      priority: assumption.priority,
      risk_score: assumption.riskScore,
      interview_count: assumption.interviewCount,
      last_tested_date: assumption.lastTestedDate,
    }));

    const { data: insertedAssumptions, error: assumptionsError } = await supabase
      .from('project_assumptions')
      .insert(assumptionRows)
      .select();

    if (assumptionsError) {
      console.error('Error inserting assumptions:', assumptionsError);
      throw assumptionsError;
    }

    console.log(`✅ Inserted ${insertedAssumptions?.length || 0} assumptions`);

    // Step 2: Create assumption ID mapping for interviews
    const assumptionMap = new Map<string, string>();
    petFinderAssumptions.forEach((original, index) => {
      if (insertedAssumptions && insertedAssumptions[index]) {
        assumptionMap.set(original.description, insertedAssumptions[index].id);
      }
    });

    // Step 3: Insert interviews with assumption tags
    console.log('💬 Inserting interviews...');
    const interviewRows = petFinderInterviews.map((interview, index) => {
      // Build assumption tags based on interview context
      const tags: AssumptionTag[] = [];

      // Interview 0 (First-time adopter): Tests problem, UVP
      if (index === 0) {
        const problemAssumptionId = assumptionMap.get('Pet adopters struggle to find suitable pets because shelter websites are outdated and hard to navigate');
        const uvpAssumptionId = assumptionMap.get('Our personality quiz will match adopters with compatible pets better than traditional search filters');

        if (problemAssumptionId) {
          tags.push({
            assumptionId: problemAssumptionId,
            validationEffect: 'supports',
            confidenceChange: 1,
            quote: 'I gave up trying to use the shelter website after 10 minutes',
          });
        }
        if (uvpAssumptionId) {
          tags.push({
            assumptionId: uvpAssumptionId,
            validationEffect: 'supports',
            confidenceChange: 1,
            quote: 'This would have saved me so much time!',
          });
        }
      }

      // Interview 1 (Suburban family): Tests video assumption (invalidates it)
      if (index === 1) {
        const videoAssumptionId = assumptionMap.get('Video profiles of pets will increase adoption applications by 2x compared to photos alone');

        if (videoAssumptionId) {
          tags.push({
            assumptionId: videoAssumptionId,
            validationEffect: 'contradicts',
            confidenceChange: -2,
            quote: 'I don\'t have time to watch videos, just show me photos and key info',
          });
        }
      }

      // Interview 2 (Shelter director): Tests metrics assumption
      if (index === 2) {
        const metricsAssumptionId = assumptionMap.get('Successful adoption rate (applications that result in adoption) is our North Star metric');

        if (metricsAssumptionId) {
          tags.push({
            assumptionId: metricsAssumptionId,
            validationEffect: 'supports',
            confidenceChange: 1,
            quote: 'Every day a pet stays with us costs $15. We need to increase adoptions',
          });
        }
      }

      return {
        id: crypto.randomUUID(),
        project_id: projectId,
        interviewee_type: interview.intervieweeType,
        segment_name: interview.segmentName,
        interview_date: interview.date,
        context: interview.context,
        status: interview.status,
        main_pain_points: interview.mainPainPoints,
        problem_importance: interview.problemImportance,
        problem_importance_quote: interview.problemImportanceQuote,
        current_alternatives: interview.currentAlternatives,
        memorable_quotes: interview.memorableQuotes,
        surprising_feedback: interview.surprisingFeedback,
        assumption_tags: tags,
        student_reflection: interview.studentReflection,
        mentor_feedback: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userId,
      };
    });

    const { data: insertedInterviews, error: interviewsError } = await supabase
      .from('project_interviews_enhanced')
      .insert(interviewRows)
      .select();

    if (interviewsError) {
      console.error('Error inserting interviews:', interviewsError);
      throw interviewsError;
    }

    console.log(`✅ Inserted ${insertedInterviews?.length || 0} interviews`);
    console.log('🎉 Pet Finder data seed completed successfully!');

    return {
      success: true,
      assumptionsCreated: insertedAssumptions?.length || 0,
      interviewsCreated: insertedInterviews?.length || 0,
    };
  } catch (error) {
    console.error('❌ Error seeding Pet Finder data:', error);
    throw error;
  }
}

/**
 * Check if a project already has Discovery 2.0 data
 */
export async function hasDiscovery2Data(projectId: string): Promise<boolean> {
  const { data: assumptions } = await supabase
    .from('project_assumptions')
    .select('id')
    .eq('project_id', projectId)
    .not('canvas_area', 'is', null)
    .limit(1);

  return (assumptions?.length || 0) > 0;
}
