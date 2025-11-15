// BM25 lexical scoring (pure text, no vectors)

import { tokenize } from './tokenizer';

const BM25_K1 = 1.2;
const BM25_B = 0.75;

/**
 * Calculate BM25 score for a document given query tokens
 */
export function calculateBM25(
  queryTokens: string[],
  documentTokens: string[],
  documentFrequencies: Map<string, number>, // df for each term
  totalDocuments: number,
  avgDocLength: number
): number {
  if (queryTokens.length === 0 || documentTokens.length === 0) {
    return 0;
  }

  // Build term frequency map for document
  const tf = new Map<string, number>();
  for (const token of documentTokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  const docLength = documentTokens.length;
  let score = 0;

  // Unique query terms
  const uniqueQuery = [...new Set(queryTokens)];

  for (const term of uniqueQuery) {
    const termFreq = tf.get(term) || 0;
    if (termFreq === 0) continue;

    const df = documentFrequencies.get(term) || 0;
    if (df === 0) continue;

    // IDF calculation (BM25+ variant)
    const idf = Math.log((totalDocuments - df + 0.5) / (df + 0.5) + 1);

    // BM25 formula
    const numerator = termFreq * (BM25_K1 + 1);
    const denominator = termFreq + BM25_K1 * (1 - BM25_B + BM25_B * (docLength / Math.max(1, avgDocLength)));

    score += idf * (numerator / Math.max(1e-6, denominator));
  }

  return score;
}

/**
 * Build document frequency map from all memories
 */
export function buildDocumentFrequencies(allMemories: Array<{ content: string }>): Map<string, number> {
  const df = new Map<string, number>();

  for (const memory of allMemories) {
    const tokens = new Set(tokenize(memory.content));
    for (const token of tokens) {
      df.set(token, (df.get(token) || 0) + 1);
    }
  }

  return df;
}
