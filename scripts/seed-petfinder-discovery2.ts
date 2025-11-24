#!/usr/bin/env tsx

/**
 * Script to seed Pet Finder Discovery 2.0 data
 * Run with: npx tsx scripts/seed-petfinder-discovery2.ts
 */

import { createClient } from '@supabase/supabase-js';
import { petFinderAssumptions, petFinderInterviews } from '../src/data/petFinderSeedData';
import type { AssumptionTag } from '../src/types/discovery';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('   - VITE_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) console.error('   - VITE_SUPABASE_ANON_KEY');
  console.error('');
  console.error('Please set these variables in your .env file or environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seedPetFinderDiscovery2() {
  try {
    console.log('🌱 Finding Pet Finder project...');

    // Find Pet Finder project
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, name, created_by')
      .ilike('name', '%pet%finder%')
      .limit(1);

    if (projectError || !projects || projects.length === 0) {
      throw new Error('Pet Finder project not found');
    }

    const project = projects[0];
    const projectId = project.id;
    const userId = project.created_by;

    console.log(`✅ Found Pet Finder project: ${project.name} (${projectId})`);

    // Delete existing Discovery 2.0 data
    console.log('🗑️  Deleting existing Discovery 2.0 data...');

    await supabase
      .from('project_interviews_enhanced')
      .delete()
      .eq('project_id', projectId);

    await supabase
      .from('project_assumptions')
      .delete()
      .eq('project_id', projectId)
      .not('canvas_area', 'is', null);

    console.log('✅ Cleaned up existing data');

    // Insert assumptions
    console.log('📝 Inserting 17 assumptions...');
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
      throw assumptionsError;
    }

    console.log(`✅ Inserted ${insertedAssumptions?.length || 0} assumptions`);

    // Create assumption ID mapping
    const assumptionMap = new Map<string, string>();
    petFinderAssumptions.forEach((original, index) => {
      if (insertedAssumptions && insertedAssumptions[index]) {
        assumptionMap.set(original.description, insertedAssumptions[index].id);
      }
    });

    // Insert interviews with assumption tags
    console.log('💬 Inserting 3 interviews...');
    const interviewRows = petFinderInterviews.map((interview, index) => {
      const tags: AssumptionTag[] = [];

      // Interview 0: First-time adopter
      if (index === 0) {
        const problemId = assumptionMap.get('Pet adopters struggle to find suitable pets because shelter websites are outdated and hard to navigate');
        const uvpId = assumptionMap.get('Our personality quiz will match adopters with compatible pets better than traditional search filters');

        if (problemId) {
          tags.push({
            assumptionId: problemId,
            validationEffect: 'supports',
            confidenceChange: 1,
            quote: 'I gave up trying to use the shelter website after 10 minutes',
          });
        }
        if (uvpId) {
          tags.push({
            assumptionId: uvpId,
            validationEffect: 'supports',
            confidenceChange: 1,
            quote: 'This would have saved me so much time!',
          });
        }
      }

      // Interview 1: Suburban family (invalidates video)
      if (index === 1) {
        const videoId = assumptionMap.get('Video profiles of pets will increase adoption applications by 2x compared to photos alone');
        if (videoId) {
          tags.push({
            assumptionId: videoId,
            validationEffect: 'contradicts',
            confidenceChange: -2,
            quote: 'I don\'t have time to watch videos, just show me photos and key info',
          });
        }
      }

      // Interview 2: Shelter director (supports metrics)
      if (index === 2) {
        const metricsId = assumptionMap.get('Successful adoption rate (applications that result in adoption) is our North Star metric');
        if (metricsId) {
          tags.push({
            assumptionId: metricsId,
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
      throw interviewsError;
    }

    console.log(`✅ Inserted ${insertedInterviews?.length || 0} interviews`);
    console.log('');
    console.log('🎉 Pet Finder Discovery 2.0 data loaded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('   ✅ 17 assumptions across all LBMC areas');
    console.log('   ✅ 3 enhanced interviews with assumption tags');
    console.log('   ✅ Status mix: validated, invalidated, testing, untested');
    console.log('   ✅ Risk scores range from 4 to 20');
    console.log('');
    console.log('🔄 Please refresh your browser to see the data!');
  } catch (error) {
    console.error('❌ Error seeding Pet Finder Discovery 2.0 data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedPetFinderDiscovery2();
