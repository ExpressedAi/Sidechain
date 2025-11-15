// Learning loop - feedback and rating updates

import { MemoryRating, MemoryInteraction } from './types';
import { updateRating, initializeRating } from './trueskill';
import { makeRatingKey } from './utils';

// Storage will be injected via adapter
let storage: any = null;

export function setStorage(storageAdapter: any) {
  storage = storageAdapter;
}

/**
 * Load all ratings from storage
 */
export async function loadRatings(profileId: string): Promise<Map<string, MemoryRating>> {
  if (!storage) throw new Error('Storage not initialized');

  const stored = await storage.getSetting(`memory_ratings_${profileId}`);
  if (!stored) {
    return new Map();
  }

  try {
    const ratings: MemoryRating[] = JSON.parse(stored);
    const map = new Map<string, MemoryRating>();
    for (const rating of ratings) {
      map.set(makeRatingKey(rating.memoryId, rating.kernelId), rating);
    }
    return map;
  } catch (e) {
    console.error('Error loading ratings:', e);
    return new Map();
  }
}

/**
 * Save all ratings to storage
 */
export async function saveRatings(profileId: string, ratings: Map<string, MemoryRating>): Promise<void> {
  if (!storage) throw new Error('Storage not initialized');

  const array = Array.from(ratings.values());
  await storage.saveSetting(`memory_ratings_${profileId}`, JSON.stringify(array));
}

/**
 * Load interaction history
 */
export async function loadInteractions(profileId: string): Promise<MemoryInteraction[]> {
  if (!storage) throw new Error('Storage not initialized');

  const stored = await storage.getSetting(`memory_interactions_${profileId}`);
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error loading interactions:', e);
    return [];
  }
}

/**
 * Save interaction history
 */
async function saveInteractions(profileId: string, interactions: MemoryInteraction[]): Promise<void> {
  if (!storage) throw new Error('Storage not initialized');

  // Keep only recent interactions (last 1000)
  const recent = interactions.slice(-1000);
  await storage.saveSetting(`memory_interactions_${profileId}`, JSON.stringify(recent));
}

/**
 * Apply feedback for selected memories
 */
export async function applyFeedback(
  profileId: string,
  kernelId: string,
  contextId: string,
  rewards: Array<{ memoryId: string; reward: -1 | 0 | 1 }>
): Promise<void> {
  const ratings = await loadRatings(profileId);
  const interactions = await loadInteractions(profileId);

  for (const { memoryId, reward } of rewards) {
    // Get or initialize rating
    const key = makeRatingKey(memoryId, kernelId);
    const currentRating = ratings.get(key) || initializeRating(memoryId, kernelId);

    // Update rating
    const newRating = updateRating(currentRating, reward);
    ratings.set(key, newRating);

    // Log interaction
    interactions.push({
      id: crypto.randomUUID(),
      memoryId,
      kernelId,
      contextId,
      reward,
      timestamp: Date.now()
    });
  }

  await saveRatings(profileId, ratings);
  await saveInteractions(profileId, interactions);
}

/**
 * Record implicit positive feedback (memory was selected and used)
 */
export async function recordUsage(
  profileId: string,
  kernelId: string,
  contextId: string,
  memoryIds: string[]
): Promise<void> {
  const rewards = memoryIds.map(memoryId => ({
    memoryId,
    reward: 1 as const // Implicit positive
  }));

  await applyFeedback(profileId, kernelId, contextId, rewards);
}
