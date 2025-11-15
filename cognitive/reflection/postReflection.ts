import { PostReflectionResult, ReflectionContext } from './types';

/**
 * Perform post-reflection on an AI response
 * This analyzes the response and determines if autonomous continuation is needed
 */
export async function performPostReflection(
  context: ReflectionContext,
  apiCall: (messages: any[], options: any) => Promise<string>,
  apiKey: string,
  model: string
): Promise<PostReflectionResult> {
  // Gather context (simplified for SideChain - extend as needed)
  const availableContext = context.availableContext || {};
  const goal = null; // TODO: integrate with SideChain's goal system
  const totalTasks = 0;
  const completedTasks = 0;
  const progressPercentage = 0;

  // Build reflection prompt
  const reflectionPrompt = `You are performing POST-REFLECTION on a response you just generated. This is different from pre-reflection (which happens before responding). Post-reflection happens AFTER you've responded, allowing you to assess your work and continue autonomously.

CONTEXT:
- Thread ID: ${context.threadId}
- User Query: "${context.userQuery}"
- Your Response: "${context.aiResponse}"
${context.goalId ? `- Goal Progress: ${completedTasks}/${totalTasks} tasks completed (${progressPercentage}%)` : ''}

AVAILABLE CONTEXT:
- ${availableContext.people?.length || 0} people in network
- ${availableContext.concepts?.length || 0} concepts tracked
- ${availableContext.calendar?.length || 0} calendar events
- ${availableContext.journal?.length || 0} journal entries
- ${availableContext.agenda?.length || 0} agenda items
- ${availableContext.tasks?.length || 0} tasks total

POST-REFLECTION TASKS:
1. **Assess Response Quality**: Did you fully address the user's query? Is anything missing?
2. **Check Goal Progress**: ${goal ? `Are you making progress toward the goal?` : 'No active goal'}
3. **Identify Next Steps**: What should happen next? Are there follow-up questions or actions?
4. **Determine Autonomy**: Should you continue autonomously, or wait for user input?

AUTONOMOUS CONTINUATION CRITERIA:
- Continue if: You've identified clear next steps that don't require user input
- Continue if: You need to gather more information or complete sub-tasks
- Continue if: You're working toward a goal and have more tasks to complete
- Wait if: You need user clarification or approval
- Wait if: The response fully addresses the query with no follow-up needed

RESPOND WITH:
1. **Reflection**: Your assessment of the response and current state (2-3 sentences)
2. **Should Continue**: true/false - whether to continue autonomously
3. **Next Actions**: Array of specific actions to take next (if continuing)
4. **Progress Assessment**: Current progress, remaining work, next steps

Format your response as JSON:
{
  "reflection": "Your reflection here",
  "shouldContinue": true/false,
  "nextActions": ["action1", "action2", ...],
  "progressAssessment": {
    "goalId": "${context.goalId || ''}",
    "progressPercentage": ${progressPercentage},
    "remainingTasks": ${totalTasks - completedTasks},
    "nextSteps": ["step1", "step2", ...]
  }
}`;

  try {
    const response = await apiCall(
      [
        {
          role: 'system',
          content: 'You are a post-reflection agent. After generating a response, you reflect on it and determine if autonomous continuation is needed. Respond ONLY with valid JSON.'
        },
        {
          role: 'user',
          content: reflectionPrompt
        }
      ],
      {
        apiKey,
        model,
        temperature: 0.7,
        maxTokens: 2000,
        response_format: { type: 'json_object' }
      }
    );

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        shouldContinue: false,
        nextActions: [],
        reflection: 'Failed to parse reflection response'
      };
    }

    const result = JSON.parse(jsonMatch[0]) as PostReflectionResult;

    // Log reflection (TODO: integrate with SideChain's logging)
    console.log('[Post-Reflection]', result.reflection);

    return result;
  } catch (error) {
    console.error('[Post-Reflection] Error:', error);
    return {
      shouldContinue: false,
      nextActions: [],
      reflection: `Error during reflection: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
