// Pure text tokenization - no vectors

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for',
  'with', 'is', 'it', 'as', 'at', 'by', 'be', 'are', 'was', 'were',
  'this', 'that', 'from', 'we', 'you', 'they', 'i', 'me', 'my', 'your'
]);

/**
 * Tokenize text into normalized tokens
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[`~!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|]/g, ' ')
    .split(/\s+/)
    .filter(t => t && !STOP_WORDS.has(t) && t.length >= 2);
}

/**
 * Create n-gram shingles for diversity calculation
 */
export function shingles(tokens: string[], n: number = 3): Set<string> {
  const result = new Set<string>();
  for (let i = 0; i + n <= tokens.length; i++) {
    result.add(tokens.slice(i, i + n).join(' '));
  }
  return result;
}

/**
 * Calculate Jaccard similarity between two texts (for diversity)
 */
export function jaccardSimilarity(textA: string, textB: string): number {
  const shinglesA = shingles(tokenize(textA), 3);
  const shinglesB = shingles(tokenize(textB), 3);

  const intersection = [...shinglesA].filter(x => shinglesB.has(x)).length;
  const union = shinglesA.size + shinglesB.size - intersection;

  return union > 0 ? intersection / union : 0;
}
