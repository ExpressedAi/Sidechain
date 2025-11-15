/**
 * Multi-Model Router
 * Routes requests to OpenRouter (paid) or headless endpoints (free)
 */

export interface RouterConfig {
  preferFree: boolean;
  openRouterApiKey?: string;
  openRouterModel?: string;
  headlessEndpoints?: {
    claude: boolean;
    chatgpt: boolean;
    gemini: boolean;
  };
}

export interface RouteDecision {
  target: 'openrouter' | 'claude-headless' | 'chatgpt-headless' | 'gemini-headless';
  reason: string;
}

/**
 * Decide which endpoint to use for a given task
 */
export function routeRequest(
  task: {
    type: 'code' | 'text' | 'vision' | 'audio' | 'general';
    preferredModel?: string;
    requiresTools?: boolean;
  },
  config: RouterConfig
): RouteDecision {
  // If user explicitly requested OpenRouter model, use it
  if (task.preferredModel?.startsWith('openrouter/')) {
    return {
      target: 'openrouter',
      reason: 'User requested specific OpenRouter model'
    };
  }

  // If tools required, use OpenRouter (headless may not support)
  if (task.requiresTools) {
    return {
      target: 'openrouter',
      reason: 'Tool calling required (OpenRouter supports this)'
    };
  }

  // If preferFree and headless available, route by task type
  if (config.preferFree) {
    switch (task.type) {
      case 'code':
        if (config.headlessEndpoints?.chatgpt) {
          return {
            target: 'chatgpt-headless',
            reason: 'Code task → ChatGPT headless (free, good at code)'
          };
        }
        break;

      case 'text':
        if (config.headlessEndpoints?.claude) {
          return {
            target: 'claude-headless',
            reason: 'Text task → Claude headless (free, good at long text)'
          };
        }
        break;

      case 'vision':
        if (config.headlessEndpoints?.gemini) {
          return {
            target: 'gemini-headless',
            reason: 'Vision task → Gemini headless (free, good at multimodal)'
          };
        }
        break;

      case 'general':
      default:
        // Use whichever headless endpoint is available
        if (config.headlessEndpoints?.claude) {
          return {
            target: 'claude-headless',
            reason: 'General task → Claude headless (free)'
          };
        }
        if (config.headlessEndpoints?.chatgpt) {
          return {
            target: 'chatgpt-headless',
            reason: 'General task → ChatGPT headless (free)'
          };
        }
        if (config.headlessEndpoints?.gemini) {
          return {
            target: 'gemini-headless',
            reason: 'General task → Gemini headless (free)'
          };
        }
    }
  }

  // Fallback to OpenRouter
  return {
    target: 'openrouter',
    reason: config.preferFree
      ? 'No free headless endpoints available → OpenRouter'
      : 'Paid OpenRouter preferred by config'
  };
}

/**
 * Execute a request using the routed endpoint
 */
export async function executeRoutedRequest(
  decision: RouteDecision,
  messages: any[],
  options: any,
  endpoints: {
    openrouter?: (messages: any[], options: any) => Promise<string>;
    claudeHeadless?: (messages: any[], options: any) => Promise<string>;
    chatgptHeadless?: (messages: any[], options: any) => Promise<string>;
    geminiHeadless?: (messages: any[], options: any) => Promise<string>;
  }
): Promise<string> {
  switch (decision.target) {
    case 'openrouter':
      if (!endpoints.openrouter) {
        throw new Error('OpenRouter endpoint not configured');
      }
      return await endpoints.openrouter(messages, options);

    case 'claude-headless':
      if (!endpoints.claudeHeadless) {
        throw new Error('Claude headless endpoint not configured');
      }
      return await endpoints.claudeHeadless(messages, options);

    case 'chatgpt-headless':
      if (!endpoints.chatgptHeadless) {
        throw new Error('ChatGPT headless endpoint not configured');
      }
      return await endpoints.chatgptHeadless(messages, options);

    case 'gemini-headless':
      if (!endpoints.geminiHeadless) {
        throw new Error('Gemini headless endpoint not configured');
      }
      return await endpoints.geminiHeadless(messages, options);

    default:
      throw new Error(`Unknown route target: ${decision.target}`);
  }
}
