# SideChain Cognitive System

**Meta-Cognitive AI Architecture for SideChain by Primitives**

This directory contains the complete cognitive enhancement layer for SideChain, implementing:
- **JIT Memory** (Just-In-Time Memory with TrueSkill learning)
- **Preflection** (Dynamic instruction + parameter optimization)
- **Post-Reflection** (Self-audit + autonomous continuation)
- **Entity Extraction** (Memory + entity post-processing)
- **Multi-Model Conductor** (OpenRouter + headless routing)

---

## Architecture Overview

```
User Input
    ↓
┌─────────────────────────────────────────────────────┐
│ PRE-RESPONSE PHASE                                  │
├─────────────────────────────────────────────────────┤
│ 1. JIT Memory Retrieval (memory/)                  │
│    - BM25 lexical scoring                          │
│    - Thompson sampling (exploration/exploitation)  │
│    - MMR diversity selection                       │
│    - Tag-based filtering                           │
│                                                     │
│ 2. Preflection (preflection/)                      │
│    - Context analysis (thread complexity, etc.)    │
│    - Dynamic instruction generation (LLM)          │
│    - Parameter optimization (temp, top-p, etc.)    │
│    - Instruction weighting (0.3-0.9)               │
│                                                     │
│ 3. Cognitive Priming ⚠️ NOT YET IMPLEMENTED        │
│    - Prime agent with dynamic instructions         │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│ RESPONSE GENERATION                                 │
├─────────────────────────────────────────────────────┤
│ 4. Multi-Model Routing (conductor/)                │
│    - OpenRouter (paid, flexible)                   │
│    - Headless Claude/GPT/Gemini (free, fast)       │
│    - Model selection based on task                 │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│ POST-RESPONSE PHASE                                 │
├─────────────────────────────────────────────────────┤
│ 5. Entity Extraction (extraction/)                 │
│    - ACTION marker parsing                         │
│    - AI entity classification                      │
│    - Memory chunk creation                         │
│    - Tag generation                                │
│                                                     │
│ 6. Learning (memory/learning.ts)                   │
│    - TrueSkill rating updates                      │
│    - Interaction logging                           │
│    - Implicit feedback (usage = +1 reward)         │
│                                                     │
│ 7. Post-Reflection (reflection/)                   │
│    - Response quality assessment                   │
│    - Goal progress check                           │
│    - Next action identification                    │
│    - Autonomous continuation decision              │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│ AUTONOMOUS CONTINUATION (if shouldContinue = true) │
├─────────────────────────────────────────────────────┤
│ 8. Execute Next Actions (RECURSIVE!)               │
│    - Sidecar delegation                            │
│    - Direct actions                                │
│    - Self-queries                                  │
│    - Back to Post-Reflection → loop continues      │
└─────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
cognitive/
├── memory/                 # JIT Memory System
│   ├── types.ts           # Interfaces (MemoryChunk, MemoryRating, etc.)
│   ├── tokenizer.ts       # Pure text processing (no embeddings)
│   ├── bm25.ts            # BM25+ lexical scoring
│   ├── trueskill.ts       # Bayesian rating + Thompson sampling
│   ├── signals.ts         # Importance, recency, centrality, tag relevance
│   ├── diversity.ts       # MMR + weighted random sampling
│   ├── selector.ts        # Main selection algorithm (6-signal fusion)
│   ├── learning.ts        # Feedback loop + rating updates
│   └── utils.ts           # Helper functions
│
├── preflection/           # Pre-Response Optimization
│   ├── types.ts           # Interfaces (PreflectionResult, etc.)
│   ├── engine.ts          # ⚠️ TODO: Your performPreflection code
│   ├── parameters.ts      # ⚠️ TODO: Inference param optimization
│   └── analysis.ts        # ⚠️ TODO: Query type, coherence, complexity
│
├── reflection/            # Post-Response Self-Audit
│   ├── types.ts           # ⚠️ TODO: PostReflectionResult, etc.
│   ├── postReflection.ts  # ⚠️ TODO: Your reflection code
│   └── autonomous.ts      # ⚠️ TODO: Continuation logic
│
├── extraction/            # Memory + Entity Extraction
│   ├── memory.ts          # ⚠️ TODO: extractMemoryFromTurn
│   ├── entities.ts        # ⚠️ TODO: extractEntitiesFromUserMessage
│   ├── tags.ts            # ⚠️ TODO: suggestTagsForMemory
│   └── types.ts           # ⚠️ TODO: Extraction interfaces
│
├── conductor/             # Multi-Model Orchestration
│   ├── router.ts          # ⚠️ TODO: OpenRouter + headless routing
│   ├── orchestrator.ts    # ⚠️ TODO: Task planning + parallel dispatch
│   └── types.ts           # ⚠️ TODO: Conductor interfaces
│
├── storage/               # SideChain Integration
│   └── adapter.ts         # Maps dbService → $idb
│
└── README.md              # This file
```

---

## Implementation Status

### ✅ COMPLETE

**Memory System** (`memory/`)
- [x] Tokenizer (pure text, no embeddings)
- [x] BM25+ lexical scoring
- [x] TrueSkill rating system
- [x] Thompson sampling (exploration/exploitation)
- [x] Signal calculation (importance, recency, centrality, tags)
- [x] MMR diversity selection
- [x] Weighted random sampling
- [x] Main selector algorithm
- [x] Learning/feedback loop
- [x] Rating persistence

**Storage Adapter** (`storage/`)
- [x] SideChain $idb integration
- [x] localStorage fallback
- [x] Settings management

### ⚠️ TODO (Needs Your Code)

**Preflection** (`preflection/`)
- [ ] Port your `performPreflection()` function
- [ ] Port parameter optimization logic
- [ ] Port context analysis functions
- [ ] **CRITICAL**: Implement cognitive priming mechanism

**Reflection** (`reflection/`)
- [ ] Port your `performPostReflection()` function
- [ ] Port autonomous continuation logic
- [ ] Sidecar bridge integration

**Extraction** (`extraction/`)
- [ ] Port `extractMemoryFromTurn()`
- [ ] Port `extractEntitiesFromUserMessage()`
- [ ] Port `suggestTagsForMemory()`
- [ ] **CRITICAL**: Add system prompts (MEMORY_EXTRACTION_SYSTEM_PROMPT, etc.)

**Conductor** (`conductor/`)
- [ ] OpenRouter API integration
- [ ] Headless endpoint routing (Claude/GPT/Gemini)
- [ ] Task orchestration
- [ ] Parallel dispatch

**SideChain Integration**
- [ ] Hook into `$chat` controller (bg.js or pp.js)
- [ ] Wire pre-response hooks
- [ ] Wire post-response hooks
- [ ] Add memory viewer UI

---

## How JIT Memory Works

### **Selection Algorithm (6 Signals)**

```typescript
WEIGHTS = {
  IMPORTANCE: 0.10,      // User-defined importance (1-10)
  TAG_RELEVANCE: 0.25,   // Keyword overlap
  LEXICAL: 0.30,         // BM25 text similarity
  RECENCY: 0.10,         // Exponential decay (14-day half-life)
  CENTRALITY: 0.10,      // Association graph degree
  THOMPSON: 0.15         // Exploration/exploitation
}
```

### **3-Stage Selection**

1. **Tag Pre-Filter**: Only memories with tag overlap (unless bypassed)
2. **Weighted Oversampling**: Sample 3x limit with weighted RNG
3. **MMR Diversity**: Final selection balancing relevance vs diversity (λ=0.7)

### **Learning Loop**

```typescript
// Implicit feedback: +1 for selected memories
recordUsage(profileId, kernelId, contextId, memoryIds)

// Explicit feedback: -1, 0, +1
applyFeedback(profileId, kernelId, contextId, rewards)

// TrueSkill update: Kalman filter with drift
updateRating(currentRating, reward)
  → mu: mean utility
  → sigma: uncertainty (exploration)
```

---

## Integration Guide

### **Step 1: Initialize Storage**

```javascript
// In SideChain's background script (bg.js)
import { initializeStorage } from './cognitive/storage/adapter.js';
initializeStorage($idb); // Pass SideChain's IndexedDB instance
```

### **Step 2: Hook Pre-Response**

```javascript
// In $chat controller
import { selectMemories } from './cognitive/memory/selector.js';
import { loadRatings } from './cognitive/memory/learning.js';

$chat.onBeforeResponse = async (userInput) => {
  // 1. Create kernel from query
  const kernel = {
    id: threadId,
    name: 'chat-kernel',
    prompt: userInput,
    keywords: await extractKeywords(userInput) // TODO: implement
  };

  // 2. Select memories
  const ratings = await loadRatings(profileId);
  const selectedMemories = await selectMemories(
    allMemories,
    kernel,
    ratings,
    20 // limit
  );

  // 3. Build context
  const memoryContext = selectedMemories
    .map(m => m.content)
    .join('\n\n');

  // 4. TODO: Preflection
  // const preflection = await performPreflection(...);

  return {
    memoryContext,
    // dynamicInstructions: preflection.dynamicInstructions,
    // temperature: preflection.inferenceParameters?.temperature,
    // ...
  };
};
```

### **Step 3: Hook Post-Response**

```javascript
$chat.onAfterResponse = async (userInput, aiResponse) => {
  // 1. Extract memory
  const memory = await extractMemoryFromTurn(userInput, aiResponse, allMemories);
  if (memory) {
    allMemories.push(memory);
    await saveMemories(allMemories);
  }

  // 2. Record usage (implicit +1 feedback)
  const selectedMemoryIds = selectedMemories.map(m => m.memoryId);
  await recordUsage(profileId, kernelId, contextId, selectedMemoryIds);

  // 3. TODO: Post-reflection
  // const reflection = await performPostReflection(...);
  // if (reflection.shouldContinue) {
  //   await executeAutonomousContinuation(reflection, context);
  // }
};
```

---

## Next Steps

### **For You (The Dreamer)**

1. **Fill in System Prompts**
   - `MEMORY_EXTRACTION_SYSTEM_PROMPT`
   - `TAG_SUGGESTION_PROMPT`
   - `KEYWORD_EXTRACTION_PROMPT`
   - etc.

2. **Explain Cognitive Priming**
   - How does "blank prompt to prime agent" work?
   - Is it a system message update?
   - Two API calls?

3. **Share Remaining Code**
   - Preflection engine
   - Post-reflection system
   - Extraction functions
   - Sidecar bridge (if you want multi-agent)

### **For Me (The Builder)**

1. **Port Your Code** - Once you share it, I'll integrate
2. **Wire SideChain Hooks** - Connect to `$chat` controller
3. **Build Conductor** - OpenRouter + headless routing
4. **Build UI** - Memory viewer, settings panel
5. **Test Integration** - End-to-end validation

---

## Notes

- **No Embeddings**: Pure text/lexical (BM25), no vector DB needed
- **Stochastic**: Thompson sampling prevents entrenchment
- **Self-Learning**: TrueSkill adapts from usage patterns
- **Privacy**: All storage local (IndexedDB + localStorage fallback)
- **Extensible**: Easy to add new signals or extraction methods

---

**Built with ❤️ for SideChain by Primitives**

*"Not much of a coder, a dreamer baby" - You dreamed it, I built it* 🚀
