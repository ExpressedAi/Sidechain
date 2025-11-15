import { PreflectionResult, PreflectionContext, InferenceParameters } from './types';

/**
 * Analyze query type based on keywords and patterns
 */
function analyzeQueryType(query: string): 'factual' | 'technical' | 'creative' | 'exploratory' | 'mixed' {
  const lowerQuery = query.toLowerCase();

  const factualKeywords = ['what', 'when', 'where', 'who', 'how many', 'list', 'tell me', 'explain', 'define'];
  const technicalKeywords = ['code', 'function', 'api', 'implementation', 'debug', 'error', 'bug', 'technical', 'algorithm', 'architecture'];
  const creativeKeywords = ['create', 'design', 'imagine', 'brainstorm', 'idea', 'concept', 'write', 'story', 'generate'];
  const exploratoryKeywords = ['explore', 'analyze', 'investigate', 'research', 'compare', 'evaluate', 'consider', 'think about'];

  const factualScore = factualKeywords.filter(kw => lowerQuery.includes(kw)).length;
  const technicalScore = technicalKeywords.filter(kw => lowerQuery.includes(kw)).length;
  const creativeScore = creativeKeywords.filter(kw => lowerQuery.includes(kw)).length;
  const exploratoryScore = exploratoryKeywords.filter(kw => lowerQuery.includes(kw)).length;

  const scores = [
    { type: 'factual' as const, score: factualScore },
    { type: 'technical' as const, score: technicalScore },
    { type: 'creative' as const, score: creativeScore },
    { type: 'exploratory' as const, score: exploratoryScore },
  ];

  const maxScore = Math.max(...scores.map(s => s.score));

  if (maxScore === 0) return 'mixed';

  const dominantType = scores.find(s => s.score === maxScore)?.type || 'mixed';

  // If multiple types have similar scores, return mixed
  const similarScores = scores.filter(s => s.score >= maxScore - 1 && s.type !== dominantType);
  if (similarScores.length > 0) return 'mixed';

  return dominantType;
}

/**
 * Analyze thread complexity
 */
function analyzeThreadComplexity(
  messageCount: number
): 'simple' | 'moderate' | 'complex' | 'very-complex' {
  if (messageCount <= 5) return 'simple';
  if (messageCount <= 15) return 'moderate';
  if (messageCount <= 40) return 'complex';
  return 'very-complex';
}

/**
 * Analyze topic coherence and detect topic shifts
 */
function analyzeTopicCoherence(
  messages: Array<{ role: string; content: string }>,
  currentQuery: string
): { topicCoherence: number; recentTopicShifts: number } {
  if (messages.length < 3) {
    return { topicCoherence: 1.0, recentTopicShifts: 0 };
  }

  // Extract keywords from recent messages (last 5)
  const recentMessages = messages.slice(-5);
  const allKeywords = new Set<string>();

  recentMessages.forEach(msg => {
    const words = msg.content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    words.forEach(word => allKeywords.add(word));
  });

  // Check current query keywords
  const queryWords = new Set(
    currentQuery.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  );

  // Calculate overlap
  const overlap = Array.from(queryWords).filter(w => allKeywords.has(w)).length;
  const topicCoherence = queryWords.size > 0 ? overlap / queryWords.size : 0.5;

  // Detect topic shifts by comparing recent messages
  let topicShifts = 0;
  for (let i = 1; i < recentMessages.length; i++) {
    const prevWords = new Set(
      recentMessages[i - 1].content.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    );
    const currWords = new Set(
      recentMessages[i].content.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    );

    const prevOverlap = Array.from(currWords).filter(w => prevWords.has(w)).length;
    const shiftRatio = prevWords.size > 0 ? 1 - (prevOverlap / prevWords.size) : 0;

    if (shiftRatio > 0.6) topicShifts++;
  }

  return {
    topicCoherence: Math.min(1.0, Math.max(0, topicCoherence)),
    recentTopicShifts: topicShifts,
  };
}

/**
 * Calculate memory relevance score
 */
function calculateMemoryRelevance(
  memorySnippets: Array<{ text: string; relevance?: number }>,
  query: string
): number {
  if (memorySnippets.length === 0) return 0;

  const queryWords = new Set(
    query.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  );

  let totalRelevance = 0;
  memorySnippets.forEach(snippet => {
    const snippetWords = new Set(
      snippet.text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    );
    const overlap = Array.from(queryWords).filter(w => snippetWords.has(w)).length;
    const relevance = queryWords.size > 0 ? overlap / queryWords.size : 0;
    totalRelevance += snippet.relevance !== undefined
      ? (relevance * snippet.relevance)
      : relevance;
  });

  return Math.min(1.0, totalRelevance / memorySnippets.length);
}

/**
 * Calculate instruction weight
 */
function calculateInstructionWeight(
  threadComplexity: 'simple' | 'moderate' | 'complex' | 'very-complex',
  topicCoherence: number,
  memoryRelevance: number,
  hasActiveEntity: boolean
): number {
  let weight = 0.5; // Base weight

  // Increase weight for complex threads
  switch (threadComplexity) {
    case 'very-complex':
      weight += 0.2;
      break;
    case 'complex':
      weight += 0.15;
      break;
    case 'moderate':
      weight += 0.1;
      break;
    case 'simple':
      weight += 0.05;
      break;
  }

  // Increase weight when topic coherence is low
  if (topicCoherence < 0.5) {
    weight += 0.15;
  }

  // Increase weight when highly relevant memories are available
  if (memoryRelevance > 0.7) {
    weight += 0.1;
  }

  // Increase weight when active entity is present
  if (hasActiveEntity) {
    weight += 0.1;
  }

  // Clamp between 0.3 and 0.9
  return Math.min(0.9, Math.max(0.3, weight));
}

/**
 * Analyze and optimize inference parameters
 */
function analyzeInferenceParameters(
  queryType: 'factual' | 'technical' | 'creative' | 'exploratory' | 'mixed',
  threadLength: number,
  memoryCount: number,
  threadComplexity: 'simple' | 'moderate' | 'complex' | 'very-complex',
  topicCoherence: number,
  memoryRelevance: number,
  recentTopicShifts: number
): { inferenceParameters: InferenceParameters; parameterReasoning: string } {
  const parameters: InferenceParameters = {};
  const reasoning: string[] = [];

  // Temperature based on query type
  switch (queryType) {
    case 'factual':
      parameters.temperature = 0.3;
      reasoning.push('Temperature set to 0.3 for factual precision');
      break;
    case 'technical':
      parameters.temperature = 0.4;
      reasoning.push('Temperature set to 0.4 for technical accuracy');
      break;
    case 'creative':
      parameters.temperature = 1.2;
      reasoning.push('Temperature set to 1.2 for creative exploration');
      break;
    case 'exploratory':
      parameters.temperature = 0.9;
      reasoning.push('Temperature set to 0.9 for exploratory reasoning');
      break;
    case 'mixed':
      parameters.temperature = 0.7;
      reasoning.push('Temperature set to 0.7 for balanced mixed query');
      break;
  }

  // Top-p
  if (queryType === 'factual' || queryType === 'technical') {
    parameters.topP = 0.85;
    reasoning.push('Top-p narrowed to 0.85 for precise token selection');
  } else if (queryType === 'creative' || queryType === 'exploratory') {
    parameters.topP = 0.95;
    reasoning.push('Top-p widened to 0.95 for exploratory reasoning');
  } else {
    parameters.topP = 0.9;
    reasoning.push('Top-p set to 0.9 for balanced sampling');
  }

  // Top-k for precise queries
  if (queryType === 'factual' || queryType === 'technical') {
    parameters.topK = 40;
    reasoning.push('Top-k limited to 40 for precise token selection');
  }

  // Frequency penalty for long threads
  if (threadLength > 15 || memoryCount > 3 || topicCoherence < 0.5) {
    let penalty = 0.2;
    if (threadComplexity === 'very-complex') penalty = 0.35;
    else if (threadComplexity === 'complex') penalty = 0.3;
    else if (threadLength > 30) penalty = 0.25;

    parameters.frequencyPenalty = penalty;
    reasoning.push(
      `Frequency penalty set to ${penalty} to reduce repetition (complexity: ${threadComplexity})`
    );
  }

  // Presence penalty for creative/exploratory
  if (queryType === 'exploratory' || queryType === 'creative') {
    parameters.presencePenalty = 0.2;
    reasoning.push('Presence penalty set to 0.2 to encourage new concepts');
  }

  // Repetition penalty for very long threads
  if (threadLength > 40 || recentTopicShifts > 2) {
    const penalty = threadComplexity === 'very-complex' ? 1.15 : 1.1;
    parameters.repetitionPenalty = penalty;
    reasoning.push(`Repetition penalty set to ${penalty} to prevent circular reasoning`);
  }

  // Adjust temperature based on topic coherence
  if (topicCoherence < 0.4 && queryType !== 'creative') {
    if (parameters.temperature && parameters.temperature > 0.5) {
      parameters.temperature = Math.max(0.4, parameters.temperature - 0.1);
      reasoning.push(
        `Temperature adjusted to ${parameters.temperature} due to low topic coherence`
      );
    }
  }

  // Adjust for high memory relevance
  if (memoryRelevance > 0.7 && (queryType === 'factual' || queryType === 'technical')) {
    if (parameters.temperature && parameters.temperature > 0.3) {
      parameters.temperature = Math.max(0.3, parameters.temperature - 0.05);
      reasoning.push(
        `Temperature adjusted to ${parameters.temperature} due to high memory relevance`
      );
    }
  }

  // Min-p for technical precision
  if (queryType === 'technical') {
    parameters.minP = 0.05;
    reasoning.push('Min-p set to 0.05 for technical precision');
  }

  return {
    inferenceParameters: parameters,
    parameterReasoning:
      reasoning.length > 0
        ? reasoning.join('\n')
        : 'Using default parameters (no optimization applied)',
  };
}

export {
  analyzeQueryType,
  analyzeThreadComplexity,
  analyzeTopicCoherence,
  calculateMemoryRelevance,
  calculateInstructionWeight,
  analyzeInferenceParameters,
};
