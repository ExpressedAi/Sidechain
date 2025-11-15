// TrueSkill-style rating system with Thompson sampling

import { MemoryRating } from './types';

const SIGMA_OBSERVATION = 1.0;  // Observation noise
const SIGMA_DRIFT = 0.01;        // Uncertainty drift over time

/**
 * Thompson sampling - sample from normal distribution (mu, sigma)
 * This balances exploration (high sigma) vs exploitation (high mu)
 */
export function thompsonSample(mu: number, sigma: number): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random() || 1e-9;
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  return mu + sigma * z;
}

/**
 * Update rating using Kalman filter approach
 */
export function updateRating(
  currentRating: MemoryRating,
  reward: -1 | 0 | 1
): MemoryRating {
  const variance = currentRating.sigma * currentRating.sigma;
  const observationVariance = SIGMA_OBSERVATION * SIGMA_OBSERVATION;

  // Kalman gain
  const K = variance / (variance + observationVariance);

  // Update mean
  const newMu = currentRating.mu + K * (reward - currentRating.mu);

  // Update variance (with drift to maintain exploration)
  const newSigma = Math.sqrt(
    Math.max(1e-6, (1 - K) * variance)
  ) + SIGMA_DRIFT;

  return {
    ...currentRating,
    mu: newMu,
    sigma: Math.max(0.1, Math.min(2.0, newSigma)), // Bound sigma
    uses: currentRating.uses + 1,
    lastUpdatedAt: Date.now()
  };
}

/**
 * Initialize new rating for memory-kernel pair
 */
export function initializeRating(memoryId: string, kernelId: string): MemoryRating {
  return {
    memoryId,
    kernelId,
    mu: 0,        // Neutral starting point
    sigma: 1.0,   // High uncertainty initially
    uses: 0,
    lastUpdatedAt: Date.now()
  };
}
