export interface PostReflectionResult {
  shouldContinue: boolean;
  nextActions: string[];
  reflection: string;
  progressAssessment?: {
    goalId?: string;
    progressPercentage?: number;
    remainingTasks?: number;
    nextSteps?: string[];
  };
}

export interface ReflectionContext {
  threadId: string;
  goalId?: string;
  userQuery: string;
  aiResponse: string;
  conversationHistory?: Array<{ role: 'user' | 'ai'; content: string }>;
  availableContext?: {
    people?: any[];
    concepts?: any[];
    calendar?: any[];
    journal?: any[];
    agenda?: any[];
    tasks?: any[];
  };
}
