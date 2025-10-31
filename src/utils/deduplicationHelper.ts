// Utility to detect duplicate or similar content across modules

export interface DuplicateMatch {
  source: string; // Where the similar content was found
  content: string; // The similar content
  similarity: number; // Similarity score (0-1)
  location: string; // Specific location (e.g., "Customer Segments Q1")
}

/**
 * Calculate similarity between two strings using a simple approach
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1;

  // One string contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer * 0.9; // Slightly less than exact match
  }

  // Check for word overlap
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 3));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Find duplicate or similar content in module answers
 */
export function findDuplicatesInModules(
  currentText: string,
  progress: Record<string, any>,
  questionsData: Record<string, any>,
  threshold: number = 0.6
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  if (!currentText || currentText.length < 10) return matches;

  Object.entries(progress).forEach(([moduleKey, moduleProgress]) => {
    if (!moduleProgress?.answers || !questionsData[moduleKey]) return;

    moduleProgress.answers.forEach((answer: any) => {
      const similarity = calculateSimilarity(currentText, answer.answer);

      if (similarity >= threshold) {
        const question = questionsData[moduleKey].questions?.[answer.questionIndex];
        matches.push({
          source: questionsData[moduleKey].title || moduleKey,
          content: answer.answer,
          similarity,
          location: question ? `Q: ${question}` : `Question ${answer.questionIndex + 1}`,
        });
      }
    });
  });

  return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Find duplicates in sector map data
 */
export function findDuplicatesInSectorMap(
  currentText: string,
  sectorMapData: any,
  threshold: number = 0.6
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  if (!currentText || currentText.length < 10) return matches;

  // Check first target description
  if (sectorMapData.firstTarget?.description) {
    const similarity = calculateSimilarity(currentText, sectorMapData.firstTarget.description);
    if (similarity >= threshold) {
      matches.push({
        source: 'Sector Map',
        content: sectorMapData.firstTarget.description,
        similarity,
        location: 'First Target Customer - Description',
      });
    }
  }

  // Check competitors
  sectorMapData.competitors?.forEach((competitor: any) => {
    if (competitor.description) {
      const similarity = calculateSimilarity(currentText, competitor.description);
      if (similarity >= threshold) {
        matches.push({
          source: 'Sector Map',
          content: competitor.description,
          similarity,
          location: `Competitor: ${competitor.name}`,
        });
      }
    }
  });

  return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Find duplicates in discovery data
 */
export function findDuplicatesInDiscovery(
  currentText: string,
  discoveryData: any,
  threshold: number = 0.6
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  if (!currentText || currentText.length < 10) return matches;

  // Check assumptions
  discoveryData.assumptions?.forEach((assumption: any) => {
    const similarity = calculateSimilarity(currentText, assumption.description);
    if (similarity >= threshold) {
      matches.push({
        source: 'Customer Discovery',
        content: assumption.description,
        similarity,
        location: `Assumption (${assumption.type})`,
      });
    }
  });

  // Check interview notes
  discoveryData.interviews?.forEach((interview: any, idx: number) => {
    if (interview.notes) {
      const similarity = calculateSimilarity(currentText, interview.notes);
      if (similarity >= threshold) {
        matches.push({
          source: 'Customer Discovery',
          content: interview.notes,
          similarity,
          location: `Interview ${idx + 1} - Notes`,
        });
      }
    }
  });

  return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Find all duplicates across all sources
 */
export function findAllDuplicates(
  currentText: string,
  progress: Record<string, any>,
  questionsData: Record<string, any>,
  sectorMapData: any,
  discoveryData: any,
  threshold: number = 0.6
): DuplicateMatch[] {
  const allMatches = [
    ...findDuplicatesInModules(currentText, progress, questionsData, threshold),
    ...findDuplicatesInSectorMap(currentText, sectorMapData, threshold),
    ...findDuplicatesInDiscovery(currentText, discoveryData, threshold),
  ];

  return allMatches.sort((a, b) => b.similarity - a.similarity);
}
