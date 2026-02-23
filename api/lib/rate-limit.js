// Simple in-memory rate limiter for serverless functions
// Resets on cold start, but protects against spam within an instance
const attempts = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS_PER_KEY = 5;

function cleanExpired() {
  const now = Date.now();
  for (const [key, data] of attempts) {
    if (now - data.windowStart > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}

/**
 * Check if a key has exceeded the rate limit.
 * @param {string} key - The rate limit key (e.g., email or IP)
 * @param {number} [maxAttempts=5] - Max attempts per window
 * @returns {{ limited: boolean, remaining: number, retryAfterMs: number }}
 */
function checkRateLimit(key, maxAttempts = MAX_ATTEMPTS_PER_KEY) {
  cleanExpired();
  const now = Date.now();
  const data = attempts.get(key);

  if (!data || now - data.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return { limited: false, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  data.count++;

  if (data.count > maxAttempts) {
    const retryAfterMs = WINDOW_MS - (now - data.windowStart);
    return { limited: true, remaining: 0, retryAfterMs };
  }

  return { limited: false, remaining: maxAttempts - data.count, retryAfterMs: 0 };
}

module.exports = { checkRateLimit };
