// Memory Engine Types

export interface MemoryRating {
  memoryId: string;
  kernelId: string;
  mu: number;          // Mean utility
  sigma: number;       // Uncertainty
  uses: number;        // Times selected
  lastUpdatedAt: number;
}

export interface MemoryInteraction {
  id: string;
  memoryId: string;
  kernelId: string;
  contextId: string;   // Chat session/turn ID
  reward: -1 | 0 | 1;  // Negative, neutral, positive
  timestamp: number;
}

export interface Posting {
  token: string;
  memoryId: string;
  tf: number;          // Term frequency
}

export interface CorpusStats {
  id: 'stats';
  N: number;           // Total documents
  docLenSum: number;   // Sum of all doc lengths
}

export interface SelectedMemory {
  memoryId: string;
  content: string;
  tags: string[];
  score: number;
  signals: {
    importance: number;
    tagRelevance: number;
    lexicalScore: number;
    recency: number;
    centrality: number;
    thompson: number;
  };
}

export interface MemoryChunk {
  id: string;
  content: string;
  tags: string[];
  importance: number;
  timestamp: string;
  associations?: string[];
  episodeId?: string;
}
