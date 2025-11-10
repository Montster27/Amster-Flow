import type { EnhancedInterview, Assumption } from '../types/discovery';

// Common English stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'been', 'be',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'can', 'of', 'at', 'by', 'for', 'with', 'about', 'as',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'that', 'this', 'these',
  'those', 'what', 'which', 'who', 'whom', 'whose', 'if', 'because', 'while',
  'it', 'its', 'they', 'them', 'their', 'we', 'our', 'you', 'your', 'i', 'my',
  'me', 'he', 'him', 'his', 'she', 'her', 'hers',
]);

export interface SynthesisResult {
  stats: {
    totalInterviews: number;
    avgImportance: number;
    dateRange: { first: string; last: string };
    segmentCount: number;
    intervieweeTypes: Record<string, number>;
  };
  topKeywords: { word: string; count: number }[];
  commonPhrases: { phrase: string; count: number }[];
  segmentInsights: {
    segment: string;
    count: number;
    avgImportance: number;
    topKeywords: string[];
  }[];
  assumptionSummary: {
    assumptionId: string;
    supports: number;
    contradicts: number;
    neutral: number;
    netEffect: 'supports' | 'contradicts' | 'neutral';
    totalConfidenceChange: number;
  }[];
  painPointThemes: { theme: string; count: number }[];
}

/**
 * Extract top keywords from text, filtering stop words
 */
function extractKeywords(texts: string[], topN: number = 20): { word: string; count: number }[] {
  const words = texts
    .join(' ')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3 && !STOP_WORDS.has(word));

  const wordFrequency: Record<string, number> = {};
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });

  return Object.entries(wordFrequency)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/**
 * Find common phrases (2-4 word sequences) mentioned multiple times
 */
function findCommonPhrases(texts: string[], minCount: number = 2): { phrase: string; count: number }[] {
  const phrases: Record<string, number> = {};

  texts.forEach(text => {
    const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
    const words = cleaned.split(/\s+/);

    // Extract 2-4 word phrases
    for (let len = 2; len <= 4; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');

        // Skip if contains stop words only
        const hasContentWord = words.slice(i, i + len).some(w => !STOP_WORDS.has(w));
        if (!hasContentWord) continue;

        phrases[phrase] = (phrases[phrase] || 0) + 1;
      }
    }
  });

  return Object.entries(phrases)
    .filter(([_, count]) => count >= minCount)
    .map(([phrase, count]) => ({ phrase, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15 phrases
}

/**
 * Group pain points by similar themes using simple keyword matching
 */
function groupPainPointThemes(painPoints: string[]): { theme: string; count: number }[] {
  const sentences = painPoints.flatMap(text =>
    text
      .split(/[.!?]+/)
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 10) // Ignore very short sentences
  );

  // Simple frequency counting
  const frequency: Record<string, number> = {};
  sentences.forEach(sentence => {
    frequency[sentence] = (frequency[sentence] || 0) + 1;
  });

  return Object.entries(frequency)
    .filter(([_, count]) => count >= 2) // Mentioned at least twice
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Calculate aggregate statistics across interviews
 */
function calculateStats(interviews: EnhancedInterview[]) {
  const dates = interviews.map(i => i.date).sort();
  const segments = new Set(interviews.map(i => i.segmentName));

  const intervieweeTypes: Record<string, number> = {};
  interviews.forEach(i => {
    intervieweeTypes[i.intervieweeType] = (intervieweeTypes[i.intervieweeType] || 0) + 1;
  });

  const avgImportance = interviews.reduce((sum, i) => sum + i.problemImportance, 0) / interviews.length;

  return {
    totalInterviews: interviews.length,
    avgImportance: Math.round(avgImportance * 10) / 10, // Round to 1 decimal
    dateRange: {
      first: dates[0],
      last: dates[dates.length - 1],
    },
    segmentCount: segments.size,
    intervieweeTypes,
  };
}

/**
 * Compare insights across segments
 */
function analyzeSegments(interviews: EnhancedInterview[]) {
  const bySegment: Record<string, EnhancedInterview[]> = {};

  interviews.forEach(interview => {
    if (!bySegment[interview.segmentName]) {
      bySegment[interview.segmentName] = [];
    }
    bySegment[interview.segmentName].push(interview);
  });

  return Object.entries(bySegment).map(([segment, segmentInterviews]) => {
    const avgImportance = segmentInterviews.reduce((sum, i) => sum + i.problemImportance, 0) / segmentInterviews.length;
    const painPoints = segmentInterviews.map(i => i.mainPainPoints);
    const topKeywords = extractKeywords(painPoints, 5).map(k => k.word);

    return {
      segment,
      count: segmentInterviews.length,
      avgImportance: Math.round(avgImportance * 10) / 10,
      topKeywords,
    };
  });
}

/**
 * Aggregate assumption validation across interviews
 */
function summarizeAssumptions(interviews: EnhancedInterview[]) {
  const assumptionStats: Record<string, {
    supports: number;
    contradicts: number;
    neutral: number;
    confidenceChanges: number[];
  }> = {};

  interviews.forEach(interview => {
    interview.assumptionTags.forEach(tag => {
      if (!assumptionStats[tag.assumptionId]) {
        assumptionStats[tag.assumptionId] = {
          supports: 0,
          contradicts: 0,
          neutral: 0,
          confidenceChanges: [],
        };
      }

      assumptionStats[tag.assumptionId][tag.validationEffect]++;
      assumptionStats[tag.assumptionId].confidenceChanges.push(tag.confidenceChange);
    });
  });

  return Object.entries(assumptionStats).map(([assumptionId, stats]) => {
    const totalConfidenceChange = stats.confidenceChanges.reduce((sum, c) => sum + c, 0);

    // Determine net effect
    let netEffect: 'supports' | 'contradicts' | 'neutral' = 'neutral';
    if (stats.supports > stats.contradicts && stats.supports > 0) {
      netEffect = 'supports';
    } else if (stats.contradicts > stats.supports && stats.contradicts > 0) {
      netEffect = 'contradicts';
    }

    return {
      assumptionId,
      supports: stats.supports,
      contradicts: stats.contradicts,
      neutral: stats.neutral,
      netEffect,
      totalConfidenceChange,
    };
  }).sort((a, b) => {
    // Sort by total mentions descending
    const aTotal = a.supports + a.contradicts + a.neutral;
    const bTotal = b.supports + b.contradicts + b.neutral;
    return bTotal - aTotal;
  });
}

/**
 * Main synthesis function - analyzes multiple interviews
 */
export function synthesizeInterviews(interviews: EnhancedInterview[]): SynthesisResult {
  if (interviews.length === 0) {
    return {
      stats: {
        totalInterviews: 0,
        avgImportance: 0,
        dateRange: { first: '', last: '' },
        segmentCount: 0,
        intervieweeTypes: {},
      },
      topKeywords: [],
      commonPhrases: [],
      segmentInsights: [],
      assumptionSummary: [],
      painPointThemes: [],
    };
  }

  const painPoints = interviews.map(i => i.mainPainPoints);

  return {
    stats: calculateStats(interviews),
    topKeywords: extractKeywords(painPoints, 20),
    commonPhrases: findCommonPhrases(painPoints, 2),
    segmentInsights: analyzeSegments(interviews),
    assumptionSummary: summarizeAssumptions(interviews),
    painPointThemes: groupPainPointThemes(painPoints),
  };
}

/**
 * Generate text summary for export
 */
export function generateSynthesisReport(
  synthesis: SynthesisResult,
  assumptions: Assumption[]
): string {
  const { stats, topKeywords, commonPhrases, segmentInsights, assumptionSummary, painPointThemes } = synthesis;

  let report = '# Interview Synthesis Report\n\n';

  // Overview
  report += '## Overview\n';
  report += `- Total Interviews: ${stats.totalInterviews}\n`;
  report += `- Date Range: ${new Date(stats.dateRange.first).toLocaleDateString()} - ${new Date(stats.dateRange.last).toLocaleDateString()}\n`;
  report += `- Segments: ${stats.segmentCount}\n`;
  report += `- Average Problem Importance: ${stats.avgImportance}/5\n\n`;

  // Interviewee Types
  report += '### Interviewee Types\n';
  Object.entries(stats.intervieweeTypes).forEach(([type, count]) => {
    report += `- ${type}: ${count}\n`;
  });
  report += '\n';

  // Top Keywords
  if (topKeywords.length > 0) {
    report += '## Top Keywords\n';
    topKeywords.slice(0, 10).forEach(({ word, count }) => {
      report += `- ${word} (${count} mentions)\n`;
    });
    report += '\n';
  }

  // Common Phrases
  if (commonPhrases.length > 0) {
    report += '## Common Phrases\n';
    commonPhrases.slice(0, 10).forEach(({ phrase, count }) => {
      report += `- "${phrase}" (${count} times)\n`;
    });
    report += '\n';
  }

  // Pain Point Themes
  if (painPointThemes.length > 0) {
    report += '## Recurring Pain Point Themes\n';
    painPointThemes.forEach(({ theme, count }) => {
      report += `- (${count}x) ${theme}\n`;
    });
    report += '\n';
  }

  // Segment Insights
  if (segmentInsights.length > 0) {
    report += '## Segment Comparison\n';
    segmentInsights.forEach(({ segment, count, avgImportance, topKeywords }) => {
      report += `\n### ${segment}\n`;
      report += `- Interviews: ${count}\n`;
      report += `- Avg Importance: ${avgImportance}/5\n`;
      report += `- Top Keywords: ${topKeywords.join(', ')}\n`;
    });
    report += '\n';
  }

  // Assumption Summary
  if (assumptionSummary.length > 0) {
    report += '## Assumption Validation Summary\n';
    assumptionSummary.forEach(({ assumptionId, supports, contradicts, neutral, netEffect, totalConfidenceChange }) => {
      const assumption = assumptions.find(a => a.id === assumptionId);
      const description = assumption?.description || assumptionId;

      report += `\n### ${description}\n`;
      report += `- Net Effect: ${netEffect.toUpperCase()}\n`;
      report += `- Supported: ${supports}, Contradicted: ${contradicts}, Neutral: ${neutral}\n`;
      report += `- Total Confidence Change: ${totalConfidenceChange > 0 ? '+' : ''}${totalConfidenceChange}\n`;
    });
    report += '\n';
  }

  report += '\n---\n';
  report += `Generated: ${new Date().toLocaleString()}\n`;

  return report;
}
