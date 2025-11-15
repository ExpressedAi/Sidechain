# SideChain Cognitive System - Integration Guide

Complete guide for integrating the cognitive system into SideChain's chat flow.

---

## Overview

The cognitive system enhances SideChain with:

1. **JIT Memory** - Context-aware memory retrieval
2. **Preflection** - Pre-response optimization (dynamic instructions + params)
3. **Post-Reflection** - Self-audit + autonomous continuation
4. **Extraction** - Memory + entity post-processing
5. **Conductor** - Multi-model routing (OpenRouter + headless)

---

## Complete Integration Example

```typescript
// In SideChain's chat controller (bg.js or pp.js)

import { selectMemories, loadRatings, recordUsage } from './cognitive/memory/selector';
import { performPreflection } from './cognitive/preflection';
import { performPostReflection, executeAutonomousContinuation } from './cognitive/reflection';
import { extractMemoriesFromTurn, extractKeywords } from './cognitive/extraction/memory';
import { routeRequest, executeRoutedRequest } from './cognitive/conductor/router';
import { initializeStorage } from './cognitive/storage/adapter';

// Initialize storage (run once on startup)
initializeStorage($idb);

// BASE SYSTEM PROMPT (configure as needed)
const BASE_SYSTEM_PROMPT = `You are SideChain, an AI assistant by Primitives.
You help users with browser automation, research, and task management.
You have access to memory snippets from past conversations.`;

/**
 * Main chat flow with full cognitive enhancement
 */
async function handleChatMessage(userInput: string, threadId: string) {
  const profileId = 'default'; // TODO: multi-user support

  // ============================================================
  // STAGE 1: JIT MEMORY RETRIEVAL
  // ============================================================

  // Extract keywords from user input
  const keywords = await extractKeywords(
    userInput,
    apiCallFunction,
    apiKey,
    preflectionModel
  );

  // Create kernel for this query
  const kernel = {
    id: threadId,
    name: 'chat-kernel',
    prompt: userInput,
    keywords
  };

  // Load existing memories and ratings
  const allMemories = await loadMemoriesFromStorage(profileId);
  const ratings = await loadRatings(profileId);

  // Select top 20 relevant memories
  const selectedMemories = await selectMemories(
    allMemories,
    kernel,
    ratings,
    20
  );

  // Build memory context string
  const memoryContext = selectedMemories.length > 0
    ? `\n\n# Relevant Context from Past Conversations:\n\n${selectedMemories.map((m, i) => `${i + 1}. ${m.content}`).join('\n\n')}`
    : '';

  // ============================================================
  // STAGE 2: PREFLECTION (Dynamic Optimization)
  // ============================================================

  const threadMessages = await getThreadMessages(threadId);
  const activeEntity = await getActiveEntity(); // TODO: implement

  const preflection = await performPreflection(
    {
      threadId,
      userQuery: userInput,
      baseSystemInstruction: BASE_SYSTEM_PROMPT,
      memorySnippets: selectedMemories.map(m => ({ text: m.content })),
      threadMessages,
      activeEntity
    },
    apiCallFunction,
    preflectionApiKey,
    preflectionModel
  );

  console.log('[Preflection] Context Analysis:', preflection.contextAnalysis);
  console.log('[Preflection] Dynamic Instructions:', preflection.dynamicInstructions);
  console.log('[Preflection] Parameters:', preflection.inferenceParameters);

  // ============================================================
  // STAGE 3: COGNITIVE PRIMING (Build System Message)
  // ============================================================

  // Combine base system prompt + dynamic instructions
  const primedSystemPrompt = BASE_SYSTEM_PROMPT +
    memoryContext +
    (preflection.dynamicInstructions
      ? `\n\n# Dynamic Context-Specific Instructions:\n${preflection.dynamicInstructions}`
      : '');

  // ============================================================
  // STAGE 4: MAIN RESPONSE GENERATION
  // ============================================================

  // Route to best endpoint
  const route = routeRequest(
    {
      type: 'general',
      requiresTools: false
    },
    {
      preferFree: true,
      openRouterApiKey: apiKey,
      openRouterModel: 'anthropic/claude-3.5-sonnet',
      headlessEndpoints: {
        claude: true,
        chatgpt: true,
        gemini: false
      }
    }
  );

  console.log('[Router] Decision:', route.reason);

  // Execute with primed system prompt + optimized parameters
  const aiResponse = await executeRoutedRequest(
    route,
    [
      { role: 'system', content: primedSystemPrompt },
      { role: 'user', content: userInput }
    ],
    {
      apiKey,
      ...preflection.inferenceParameters
    },
    {
      openrouter: openRouterApiCall,
      claudeHeadless: claudeHeadlessApiCall,
      chatgptHeadless: chatgptHeadlessApiCall
    }
  );

  // ============================================================
  // STAGE 5: POST-PROCESSING (Memory + Entities)
  // ============================================================

  // Extract memories from this turn
  const newMemories = await extractMemoriesFromTurn(
    userInput,
    aiResponse,
    apiCallFunction,
    apiKey,
    extractionModel,
    allMemories
  );

  if (newMemories.length > 0) {
    allMemories.push(...newMemories);
    await saveMemoriesToStorage(profileId, allMemories);
    console.log(`[Extraction] Created ${newMemories.length} new memory chunks`);
  }

  // Record usage for learning (implicit +1 feedback)
  const selectedMemoryIds = selectedMemories.map(m => m.memoryId);
  await recordUsage(profileId, kernel.id, threadId, selectedMemoryIds);

  // ============================================================
  // STAGE 6: POST-REFLECTION (Self-Audit)
  // ============================================================

  const reflection = await performPostReflection(
    {
      threadId,
      userQuery: userInput,
      aiResponse,
      conversationHistory: threadMessages
    },
    apiCallFunction,
    apiKey,
    reflectionModel
  );

  console.log('[Post-Reflection] Assessment:', reflection.reflection);

  // ============================================================
  // STAGE 7: AUTONOMOUS CONTINUATION (If Needed)
  // ============================================================

  if (reflection.shouldContinue) {
    console.log('[Autonomous] Continuing with actions:', reflection.nextActions);

    // Execute continuation (this may recurse)
    await executeAutonomousContinuation(
      reflection,
      {
        threadId,
        userQuery: userInput,
        aiResponse
      },
      apiCallFunction,
      apiKey,
      mainModel,
      executeActionFunction, // TODO: wire to action registry
      3 // max recursion depth
    );
  }

  // Return response to user
  return aiResponse;
}
```

---

## Key Integration Points

### **1. Storage Initialization**

```typescript
// In bg.js startup
import { initializeStorage } from './cognitive/storage/adapter';
initializeStorage($idb);
```

### **2. Memory Loading/Saving**

```typescript
// Load memories
async function loadMemoriesFromStorage(profileId: string): Promise<MemoryChunk[]> {
  const stored = await $idb.get(`memories_${profileId}`, []);
  return stored;
}

// Save memories
async function saveMemoriesToStorage(profileId: string, memories: MemoryChunk[]): Promise<void> {
  await $idb.set(`memories_${profileId}`, memories);
}
```

### **3. API Call Function**

```typescript
// Wrapper for LLM calls (OpenRouter or headless)
async function apiCallFunction(messages: any[], options: any): Promise<string> {
  // Use SideChain's existing API call mechanism
  // This should support both OpenRouter and headless endpoints
  return await $ai.call(messages, options);
}
```

### **4. Action Execution**

```typescript
// Wire to SideChain's action registry
async function executeActionFunction(actionId: string, payload: string): Promise<void> {
  // Parse and execute actions
  // Example: 'calendar.add', 'people.add', etc.
}
```

---

## Configuration

```typescript
// Recommended model assignments
const config = {
  preflectionModel: 'anthropic/claude-3-haiku', // Fast, cheap
  mainModel: 'anthropic/claude-3.5-sonnet',     // Smart, balanced
  reflectionModel: 'anthropic/claude-3-haiku',  // Fast, cheap
  extractionModel: 'anthropic/claude-3-haiku',  // Fast, cheap
};
```

---

## Performance Notes

- **Preflection**: ~500ms (single LLM call)
- **Memory Selection**: <50ms (local, no API)
- **Main Response**: Variable (depends on model)
- **Post-Reflection**: ~500ms (single LLM call)
- **Extraction**: ~300ms (single LLM call)

**Total overhead**: ~1-2 seconds per query (mostly LLM calls)

**Cost**: With Haiku for pre/post/extraction, ~$0.001-0.002 per query

---

## Testing

```typescript
// Test memory selection
const memories = await selectMemories(testMemories, testKernel, new Map(), 20);
console.log('Selected:', memories.length, 'memories');

// Test preflection
const preflection = await performPreflection(testContext, apiCall, apiKey, model);
console.log('Dynamic Instructions:', preflection.dynamicInstructions);
console.log('Parameters:', preflection.inferenceParameters);

// Test reflection
const reflection = await performPostReflection(testContext, apiCall, apiKey, model);
console.log('Should Continue:', reflection.shouldContinue);
console.log('Next Actions:', reflection.nextActions);
```

---

## Next Steps

1. **Wire into $chat controller** - Hook into message flow
2. **Add UI for memory viewer** - Show/edit/delete memories
3. **Tune prompts** - Adjust extraction and reflection prompts
4. **Add entity extraction** - Parse ACTION markers
5. **Optimize performance** - Cache, parallel calls

---

**Ready to ship!** 🚀
