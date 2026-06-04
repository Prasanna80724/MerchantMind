const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number.parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || "20", 10);

/** @type {Map<number, number[]>} */
const requestLog = new Map();

function pruneOld(timestamps, now) {
  return timestamps.filter((t) => now - t < WINDOW_MS);
}

/**
 * Per-user rate limit for AI chat endpoint.
 */
export function aiRateLimiter(req, res, next) {
  const userId = req.user?.user_id;
  if (!userId) {
    return next();
  }

  const now = Date.now();
  const history = pruneOld(requestLog.get(userId) || [], now);

  if (history.length >= MAX_REQUESTS) {
    console.warn("[AI] Rate limit exceeded", { userId, count: history.length });
    return res.status(429).json({
      error: `Too many AI requests. Limit is ${MAX_REQUESTS} per minute. Please wait and try again.`,
    });
  }

  history.push(now);
  requestLog.set(userId, history);
  next();
}

export default aiRateLimiter;
