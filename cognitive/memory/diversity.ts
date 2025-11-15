// MMR (Maximal Marginal Relevance) for diversity

import { jaccardSimilarity } from './tokenizer';

export interface ScoredItem {
  id: string;
  content: string;
  score: number;
  [key: string]: any;
}

/**
 * MMR Selection - balance relevance and diversity
 * λ closer to 1 = more relevance
 * λ closer to 0 = more diversity
 */
export function selectByMMR<T extends ScoredItem>(
  candidates: T[],
  lambda: number = 0.7,
  limit: number = 20
): T[] {
  const selected: T[] = [];
  const remaining = [...candidates].sort((a, b) => b.score - a.score);

  while (remaining.length > 0 && selected.length < limit) {
    let bestIdx = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];

      // Calculate max similarity to already selected items
      const maxSimilarity = selected.length > 0
        ? Math.max(...selected.map(s => jaccardSimilarity(candidate.content, s.content)))
        : 0;

      // MMR formula: λ * relevance - (1-λ) * similarity
      const mmrScore = lambda * candidate.score - (1 - lambda) * maxSimilarity;

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }

    // Move best candidate from remaining to selected
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  return selected;
}

/**
 * Weighted random sampling without replacement
 * Higher scores = higher probability of selection
 */
export function weightedSample<T>(
  items: T[],
  weights: number[],
  k: number
): T[] {
  const result: T[] = [];
  const pool = items.slice();
  const w = weights.slice();

  while (result.length < k && pool.length > 0) {
    // Calculate total weight
    const totalWeight = w.reduce((sum, weight) => sum + Math.max(0, weight), 0);

    if (totalWeight === 0) {
      // If no positive weights, sample uniformly
      const idx = Math.floor(Math.random() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
      w.splice(idx, 1);
      continue;
    }

    // Random selection based on weights
    let random = Math.random() * totalWeight;
    let idx = 0;

    while (idx < w.length && random > Math.max(0, w[idx])) {
      random -= Math.max(0, w[idx]);
      idx++;
    }

    if (idx >= pool.length) idx = pool.length - 1;

    result.push(pool.splice(idx, 1)[0]);
    w.splice(idx, 1);
  }

  return result;
}
