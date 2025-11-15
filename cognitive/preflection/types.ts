export interface InferenceParameters {
  temperature?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  repetitionPenalty?: number;
  minP?: number;
}

export interface PreflectionResult {
  dynamicInstructions: string;
  reasoning: string;
  contextAnalysis: {
    threadLength: number;
    memoryCount: number;
    hasActiveEntity: boolean;
    queryType: 'factual' | 'technical' | 'creative' | 'exploratory' | 'mixed';
    threadComplexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
    topicCoherence: number; // 0-1 score
    recentTopicShifts: number;
    memoryRelevance: number; // 0-1 score
  };
  inferenceParameters?: InferenceParameters;
  parameterReasoning?: string;
  instructionWeight?: number; // How much to weight dynamic instructions (0-1)
}

export interface PreflectionContext {
  threadId: string;
  userQuery: string;
  baseSystemInstruction: string;
  memorySnippets: Array<{ text: string; relevance?: number }>;
  threadMessages: Array<{ role: string; content: string }>;
  activeEntity: { type: string; data: any } | null;
}
