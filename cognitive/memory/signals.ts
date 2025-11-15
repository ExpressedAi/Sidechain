// Signal calculation for memory relevance

import { tokenize } from './tokenizer';
import { MemoryChunk } from './types';

/**
 * Normalize importance score (1-10) to 0-1
 */
export function normalizeImportance(importance: number): number {
  return Math.max(0, Math.min(1, (importance - 1) / 9));
}

/**
 * Calculate tag overlap between memory and kernel
 */
export function calculateTagRelevance(
  memoryTags: string[],
  kernelKeywords: string[]
): number {
  if (!memoryTags || !kernelKeywords || !memoryTags.length || !kernelKeywords.length) {
    return 0;
  }

  const memoryTagSet = new Set(memoryTags.map(t => t.toLowerCase()));
  let matches = 0;

  for (const keyword of kernelKeywords) {
    if (memoryTagSet.has(keyword.toLowerCase())) {
      matches++;
    }
  }

  return matches / kernelKeywords.length;
}

/**
 * Recency boost with exponential decay
 */
export function calculateRecencyBoost(
  timestamp: string,
  halfLifeDays: number = 14
): number {
  const HALF_LIFE = halfLifeDays * 24 * 3600 * 1000;
  const memoryTime = new Date(timestamp).getTime();
  const now = Date.now();
  const age = Math.max(0, now - memoryTime);

  return Math.exp(-age / HALF_LIFE);
}

/**
 * Calculate centrality based on associations and kernel alignment
 */
export function calculateCentrality(
  memory: MemoryChunk,
  kernelKeywords: string[]
): number {
  const degree = memory.associations?.length || 0;

  // "Spin" - boost if memory tags align with kernel
  if (!kernelKeywords || !memory.tags) {
    return Math.min(1, degree / 10);
  }

  const keywordSet = new Set(kernelKeywords.map(k => k.toLowerCase()));
  const hasAlignment = memory.tags.some(t => keywordSet.has(t.toLowerCase()));
  const spin = hasAlignment ? 1.25 : 1.0;

  // Normalize
  return Math.min(1, (degree * spin) / 10);
}
