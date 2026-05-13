/**
 * Rate limiting system for API keys
 * Uses in-memory storage for request counts per minute
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Timestamp when the counter resets
}

const rateLimitStore = new Map<number, RateLimitEntry>();

/**
 * Check if API key has exceeded rate limit
 * @param apiKeyId - The API key ID
 * @param rateLimit - Requests per minute allowed
 * @returns true if rate limit exceeded, false otherwise
 */
export function checkRateLimit(apiKeyId: number, rateLimit: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(apiKeyId);

  // No entry or expired - create new
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(apiKeyId, {
      count: 1,
      resetAt: now + 60000, // Reset after 1 minute
    });
    return false;
  }

  // Increment counter
  entry.count++;

  // Check if exceeded
  if (entry.count > rateLimit) {
    return true; // Rate limit exceeded
  }

  return false;
}

/**
 * Get current usage for an API key
 * @param apiKeyId - The API key ID
 * @returns Current request count and reset time
 */
export function getRateLimitUsage(apiKeyId: number): { count: number; resetAt: number } | null {
  const entry = rateLimitStore.get(apiKeyId);
  if (!entry) return null;
  
  const now = Date.now();
  if (now >= entry.resetAt) {
    rateLimitStore.delete(apiKeyId);
    return null;
  }
  
  return {
    count: entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  const keysToDelete: number[] = [];
  rateLimitStore.forEach((entry, apiKeyId) => {
    if (now >= entry.resetAt) {
      keysToDelete.push(apiKeyId);
    }
  });
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);
