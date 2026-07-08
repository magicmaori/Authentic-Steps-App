import type { Request, Response, NextFunction } from "express";

/**
 * Minimal in-memory sliding-window rate limiter keyed by a caller-provided
 * identity (e.g. authenticated user id, falling back to IP). Good enough to
 * stop a single misbehaving client from flooding a downstream system (like
 * filing duplicate Linear issues) without pulling in an external dependency
 * or shared store. Since the API server runs as a single process, this is
 * sufficient; it intentionally does not coordinate across instances.
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyFn: (req: Request) => string;
  message: string;
}) {
  const { windowMs, max, keyFn, message } = options;
  const hits = new Map<string, number[]>();

  return function rateLimit(req: Request, res: Response, next: NextFunction): void {
    const key = keyFn(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    const existing = hits.get(key) ?? [];
    const recent = existing.filter((ts) => ts > windowStart);

    if (recent.length >= max) {
      const retryAfterMs = recent[0]! + windowMs - now;
      res.setHeader("Retry-After", Math.max(1, Math.ceil(retryAfterMs / 1000)).toString());
      res.status(429).json({ error: message });
      return;
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  };
}
