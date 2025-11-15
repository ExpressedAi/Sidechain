import { PreflectionResult, PreflectionContext } from './types';
import {
  analyzeQueryType,
  analyzeThreadComplexity,
  analyzeTopicCoherence,
  calculateMemoryRelevance,
  calculateInstructionWeight,
  analyzeInferenceParameters,
} from './analysis';

/**
 * Perform preflection: analyze context and generate dynamic instructions + parameters
 *
 * @param context - Preflection context (query, thread, memories, etc.)
 * @param apiCall - Function to call LLM (messages, options) => Promise<string>
 * @param apiKey - API key for LLM
 * @param model - Model to use for preflection
 * @returns PreflectionResult with dynamic instructions and optimized parameters
 */
export async function performPreflection(
  context: PreflectionContext,
  apiCall: (messages: any[], options: any) => Promise<string>,
  apiKey: string,
  model: string
): Promise<PreflectionResult> {
  const {
    userQuery,
    baseSystemInstruction,
    memorySnippets,
    threadMessages,
    activeEntity,
  } = context;

  // Stage 1: Context Analysis
  const threadLength = threadMessages.length;
  const memoryCount = memorySnippets.length;
  const hasActiveEntity = activeEntity !== null;

  const queryType = analyzeQueryType(userQuery);
  const threadComplexity = analyzeThreadComplexity(threadLength);
  const { topicCoherence, recentTopicShifts } = analyzeTopicCoherence(
    threadMessages,
    userQuery
  );
  const memoryRelevance = calculateMemoryRelevance(memorySnippets, userQuery);
  const instructionWeight = calculateInstructionWeight(
    threadComplexity,
    topicCoherence,
    memoryRelevance,
    hasActiveEntity
  );

  const contextAnalysis = {
    threadLength,
    memoryCount,
    hasActiveEntity,
    queryType,
    threadComplexity,
    topicCoherence,
    recentTopicShifts,
    memoryRelevance,
  };

  // Stage 2: Generate dynamic instructions
  const analysisPrompt = `You are a context engineering system performing Preflection - dynamic instruction generation for an AI agent.

CONTEXT ANALYSIS:
- Thread Length: ${threadLength} messages
- Thread Complexity: ${threadComplexity}
- Relevant Memories: ${memoryCount} snippets available (Relevance: ${(memoryRelevance * 100).toFixed(0)}%)
- Topic Coherence: ${(topicCoherence * 100).toFixed(0)}%
- Recent Topic Shifts: ${recentTopicShifts}
- Active Entity: ${hasActiveEntity ? `User is viewing/working on: ${activeEntity.type}` : 'None'}
- Query Type: ${queryType}
- Instruction Weight: ${(instructionWeight * 100).toFixed(0)}% (${instructionWeight > 0.7 ? 'HIGH PRIORITY' : instructionWeight > 0.5 ? 'MODERATE PRIORITY' : 'SUPPLEMENTARY'})
- Base System Instructions: ${baseSystemInstruction.substring(0, 500)}${baseSystemInstruction.length > 500 ? '...' : ''}

USER QUERY:
"${userQuery}"

AVAILABLE MEMORY CONTEXT:
${memorySnippets.length > 0
  ? memorySnippets.map((s, i) => `${i + 1}. ${s.text.substring(0, 200)}${s.text.length > 200 ? '...' : ''}`).join('\n')
  : 'No relevant memories found'}

TASK:
Generate dynamic, query-specific system instructions that will be temporarily appended to the agent's base instruction set. These instructions should:

1. Address the specific requirements of this query
2. Leverage available context (thread history, memories, active entity)
3. Optimize for the detected query type (${queryType})
4. Provide enhanced guidance without contradicting base instructions
5. Be concise but comprehensive (aim for 2-4 sentences)

${threadLength > 20 ? 'NOTE: This is a long conversation. Focus on preventing repetition and maintaining coherence.' : ''}
${threadComplexity === 'very-complex' ? 'NOTE: This is a very complex conversation. Provide clear, structured guidance to maintain coherence.' : ''}
${topicCoherence < 0.5 ? `NOTE: Topic coherence is low (${(topicCoherence * 100).toFixed(0)}%). Recent topic shifts detected. Help maintain focus and clarity.` : ''}
${recentTopicShifts > 2 ? `NOTE: ${recentTopicShifts} topic shifts detected in recent messages. Help bridge context and maintain continuity.` : ''}
${memoryCount > 0 ? `NOTE: Leverage the available memory context (relevance: ${(memoryRelevance * 100).toFixed(0)}%) to provide more relevant responses.` : ''}
${hasActiveEntity ? 'NOTE: The user is currently focused on a specific entity. Tailor instructions to work with that context.' : ''}
${instructionWeight > 0.7 ? `NOTE: Dynamic instructions have HIGH PRIORITY (weight: ${(instructionWeight * 100).toFixed(0)}%). These instructions should strongly influence the response.` : ''}

Respond ONLY with the dynamic instructions to append. Do not include explanations or meta-commentary. Just the instructions themselves.`;

  try {
    const dynamicInstructions = await apiCall(
      [
        {
          role: 'system',
          content: 'You are a context engineering system. Generate dynamic instructions for AI agents based on query analysis. Respond only with the instructions, no explanations.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      {
        apiKey,
        model,
        temperature: 0.5, // Lower temperature for focused instruction generation
        maxTokens: 500,
      }
    );

    const reasoning = `Generated dynamic instructions for ${queryType} query. Thread: ${threadLength} messages, ${memoryCount} relevant memories${hasActiveEntity ? `, active entity: ${activeEntity.type}` : ''}.`;

    // Stage 3: Analyze and optimize inference parameters
    const { inferenceParameters, parameterReasoning } = analyzeInferenceParameters(
      queryType,
      threadLength,
      memoryCount,
      threadComplexity,
      topicCoherence,
      memoryRelevance,
      recentTopicShifts
    );

    return {
      dynamicInstructions: dynamicInstructions.trim(),
      reasoning,
      contextAnalysis,
      inferenceParameters,
      parameterReasoning,
      instructionWeight,
    };
  } catch (error) {
    // Fallback: return minimal instructions if Preflection fails
    console.error('[Preflection] Error:', error);
    return {
      dynamicInstructions: '',
      reasoning: `Preflection analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      contextAnalysis,
      instructionWeight: 0.5, // Default weight on failure
    };
  }
}
