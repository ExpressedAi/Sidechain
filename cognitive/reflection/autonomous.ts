import { PostReflectionResult, ReflectionContext } from './types';
import { performPostReflection } from './postReflection';

/**
 * Execute autonomous continuation based on post-reflection
 * This takes the next actions and executes them autonomously
 */
export async function executeAutonomousContinuation(
  reflectionResult: PostReflectionResult,
  context: ReflectionContext,
  apiCall: (messages: any[], options: any) => Promise<string>,
  apiKey: string,
  model: string,
  executeAction?: (actionId: string, payload: string) => Promise<void>,
  maxDepth: number = 3 // Prevent infinite recursion
): Promise<void> {
  if (!reflectionResult.shouldContinue || reflectionResult.nextActions.length === 0) {
    return;
  }

  if (maxDepth <= 0) {
    console.warn('[Autonomous Continuation] Max recursion depth reached');
    return;
  }

  console.log('[Post-Reflection] Continuing autonomously with actions:', reflectionResult.nextActions);

  // Execute each next action
  for (const action of reflectionResult.nextActions) {
    try {
      if (action.startsWith('ACTION:')) {
        // Execute action directly
        const actionString = action.replace('ACTION:', '');
        const [actionId, ...payloadParts] = actionString.split('|');
        const payload = payloadParts.join('|');

        if (executeAction) {
          await executeAction(actionId, payload);
        } else {
          console.warn('[Autonomous Continuation] No executeAction handler provided');
        }
      } else {
        // Treat as a query to the agent
        const response = await apiCall(
          [
            {
              role: 'user',
              content: action
            }
          ],
          {
            apiKey,
            model
          }
        );

        // Feed response back into memory (TODO: integrate with memory system)
        console.log('[Autonomous Continuation] Response:', response.substring(0, 200));

        // Perform post-reflection on this response
        const nextReflection = await performPostReflection(
          {
            ...context,
            userQuery: action,
            aiResponse: response
          },
          apiCall,
          apiKey,
          model
        );

        // Recursively continue if needed
        if (nextReflection.shouldContinue) {
          await executeAutonomousContinuation(
            nextReflection,
            context,
            apiCall,
            apiKey,
            model,
            executeAction,
            maxDepth - 1 // Decrease depth
          );
        }
      }
    } catch (error) {
      console.error(`[Post-Reflection] Error executing action "${action}":`, error);
    }
  }
}

/**
 * Feed a response back into the memory system
 * This ensures responses are captured for future context
 */
export async function feedResponseToMemory(
  response: string,
  context: ReflectionContext
): Promise<void> {
  // TODO: Integrate with SideChain's memory system
  console.log('[Memory Feed] Capturing response for thread:', context.threadId);
}
