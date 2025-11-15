import { MemoryChunk } from '../memory/types';
import { MEMORY_EXTRACTION_SYSTEM_PROMPT } from './prompts';

/**
 * Extract memory chunks from a conversation turn
 */
export async function extractMemoriesFromTurn(
  userText: string,
  assistantText: string,
  apiCall: (messages: any[], options: any) => Promise<string>,
  apiKey: string,
  model: string,
  existingMemories: MemoryChunk[] = []
): Promise<MemoryChunk[]> {
  const conversationTurn = `User: "${userText}"\nAssistant: "${assistantText}"`;

  try {
    const response = await apiCall(
      [
        { role: 'system', content: MEMORY_EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: conversationTurn }
      ],
      {
        apiKey,
        model,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }
    );

    // Parse JSON response
    const parsed = JSON.parse(response);
    const snippets = parsed.snippets || [];

    if (!Array.isArray(snippets) || snippets.length === 0) {
      return [];
    }

    // Convert to MemoryChunks
    return snippets.map((snippet: any) => ({
      id: crypto.randomUUID(),
      content: snippet.text,
      tags: snippet.tags || [],
      importance: snippet.importance || 5,
      timestamp: new Date().toISOString(),
      associations: [] // TODO: detect associations with existing memories
    }));
  } catch (error) {
    console.error('[Memory Extraction] Error:', error);
    return [];
  }
}

/**
 * Extract keywords from user input
 */
export async function extractKeywords(
  text: string,
  apiCall: (messages: any[], options: any) => Promise<string>,
  apiKey: string,
  model: string
): Promise<string[]> {
  try {
    const response = await apiCall(
      [
        {
          role: 'system',
          content: 'Extract 5-20 keywords/phrases. Return JSON: { "keywords": [...] }'
        },
        { role: 'user', content: text }
      ],
      {
        apiKey,
        model,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }
    );

    const parsed = JSON.parse(response);
    return parsed.keywords || [];
  } catch (error) {
    console.error('[Keyword Extraction] Error:', error);
    // Fallback: simple word extraction
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10);
  }
}

/**
 * Suggest tags for a memory snippet
 */
export async function suggestTags(
  content: string,
  apiCall: (messages: any[], options: any) => Promise<string>,
  apiKey: string,
  model: string
): Promise<string[]> {
  try {
    const response = await apiCall(
      [
        {
          role: 'system',
          content: 'Suggest 3-10 tags for this memory. Return JSON: { "tags": [...] }'
        },
        { role: 'user', content }
      ],
      {
        apiKey,
        model,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }
    );

    const parsed = JSON.parse(response);
    return parsed.tags || [];
  } catch (error) {
    console.error('[Tag Suggestion] Error:', error);
    return [];
  }
}
