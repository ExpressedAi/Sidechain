// Main memory selection algorithm

import { MemoryChunk } from './types';
import { MemoryRating, SelectedMemory } from './types';
import { tokenize } from './tokenizer';
import { calculateBM25, buildDocumentFrequencies } from './bm25';
import {
  normalizeImportance,
  calculateTagRelevance,
  calculateRecencyBoost,
  calculateCentrality
} from './signals';
import { thompsonSample, initializeRating } from './trueskill';
import { selectByMMR, weightedSample, ScoredItem } from './diversity';
import { makeRatingKey } from './utils';

export interface PromptKernel {
  id: string;
  name: string;
  prompt: string;
  keywords: string[];
}

export interface SelectionOptions {
  queryTerms?: string[];
  bypassTagFilter?: boolean;
}

// Weights for combining signals
const WEIGHTS = {
  IMPORTANCE: 0.10,
  TAG_RELEVANCE: 0.25,
  LEXICAL: 0.30,
  RECENCY: 0.10,
  CENTRALITY: 0.10,
  THOMPSON: 0.15
};

/**
 * Calculate composite utility score for a memory given a kernel
 */
function calculateUtility(
  memory: MemoryChunk,
  kernel: PromptKernel,
  bm25Score: number,
  thompsonScore: number
): { total: number; signals: SelectedMemory['signals'] } {
  const importance = normalizeImportance(memory.importance);
  const tagRelevance = calculateTagRelevance(memory.tags, kernel.keywords);
  const recency = calculateRecencyBoost(memory.timestamp);
  const centrality = calculateCentrality(memory, kernel.keywords);

  // Normalize BM25 (log scale)
  const lexical = bm25Score > 0 ? Math.log(1 + bm25Score) / 5 : 0;

  const total =
    WEIGHTS.IMPORTANCE * importance +
    WEIGHTS.TAG_RELEVANCE * tagRelevance +
    WEIGHTS.LEXICAL * lexical +
    WEIGHTS.RECENCY * recency +
    WEIGHTS.CENTRALITY * centrality +
    WEIGHTS.THOMPSON * Math.max(0, Math.min(1, (thompsonScore + 1) / 2)); // Normalize Thompson to [0,1]

  return {
    total,
    signals: {
      importance,
      tagRelevance,
      lexicalScore: lexical,
      recency,
      centrality,
      thompson: thompsonScore
    }
  };
}

/**
 * Main memory selection algorithm
 */
export async function selectMemories(
  memories: MemoryChunk[],
  kernel: PromptKernel,
  ratings: Map<string, MemoryRating>,
  limit: number = 20,
  options: SelectionOptions = {}
): Promise<SelectedMemory[]> {
  if (memories.length === 0) {
    return [];
  }

  const { queryTerms = [], bypassTagFilter = false } = options;

  // Quick pre-filter: only consider memories with tag overlap OR if bypass flag is set
  const keywordSet = new Set(kernel.keywords.map(k => k.toLowerCase()));
  const shouldFilterByTags = kernel.keywords.length > 0 && !bypassTagFilter;
  const candidates = shouldFilterByTags
    ? memories.filter(m => m.tags.some(t => keywordSet.has(t.toLowerCase())))
    : memories;

  if (candidates.length === 0) {
    return [];
  }

  // Build BM25 components
  const df = buildDocumentFrequencies(candidates);
  const totalDocs = candidates.length;
  const avgDocLength = candidates.reduce((sum, m) => sum + tokenize(m.content).length, 0) / totalDocs;

  // Build query from kernel
  const queryParts = [kernel.name, kernel.prompt];
  if (kernel.keywords.length > 0) {
    queryParts.push(kernel.keywords.join(' '));
  }
  if (queryTerms.length > 0) {
    queryParts.push(queryTerms.join(' '));
  }
  const queryText = queryParts.join(' ');
  const queryTokens = tokenize(queryText);

  // Score each candidate
  const scored: Array<ScoredItem & { memory: MemoryChunk; signals: SelectedMemory['signals'] }> = [];

  for (const memory of candidates) {
    const docTokens = tokenize(memory.content);
    const bm25Score = calculateBM25(queryTokens, docTokens, df, totalDocs, avgDocLength);

    // Get or initialize rating
    const ratingKey = makeRatingKey(memory.id, kernel.id);
    const rating = ratings.get(ratingKey) || initializeRating(memory.id, kernel.id);

    // Thompson sampling for exploration/exploitation
    const thompsonScore = thompsonSample(rating.mu, rating.sigma);

    // Calculate composite utility
    const { total, signals } = calculateUtility(memory, kernel, bm25Score, thompsonScore);

    scored.push({
      id: memory.id,
      content: memory.content,
      score: total,
      tags: memory.tags,
      memory,
      signals: { ...signals, thompson: thompsonScore }
    });
  }

  // 1. Weighted RNG oversample for exploration
  const oversampleK = Math.min(limit * 3, scored.length);
  const oversampled = weightedSample(
    scored,
    scored.map(s => s.score),
    oversampleK
  );

  // 2. MMR diversity filtering
  const diverse = selectByMMR(oversampled, 0.7, limit);

  // 3. Convert to SelectedMemory format
  return diverse.map(item => ({
    memoryId: item.memory.id,
    content: item.memory.content,
    tags: item.memory.tags,
    score: item.score,
    signals: item.signals
  }));
}
