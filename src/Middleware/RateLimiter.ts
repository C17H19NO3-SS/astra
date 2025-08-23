import type { Handler } from "elysia";

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  keyGenerator?: (request: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * In-memory rate limiting middleware
 * For production use, consider using Redis or another external store
 */
class MemoryStore {
  private store: RateLimitStore = {};
  private cleanupInterval: Timer;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (
        (
          this.store[key] as {
            count: number;
            resetTime: number;
          }
        ).resetTime <= now
      ) {
        delete this.store[key];
      }
    });
  }

  increment(
    key: string,
    windowMs: number
  ): { count: number; resetTime: number } {
    const now = Date.now();

    if (!this.store[key] || this.store[key].resetTime <= now) {
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      this.store[key].count++;
    }

    return this.store[key];
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store = {};
  }
}

const defaultStore = new MemoryStore();

/**
 * Rate limiting middleware factory
 */
export const rateLimiter = (options: RateLimitOptions = {}): Handler => {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW || "900000"), // 15 minutes
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
    message = "Too many requests, please try again later.",
    keyGenerator = (request: Request) => {
      // Extract IP from various possible headers
      const xForwardedFor = request.headers.get("x-forwarded-for");
      const xRealIp = request.headers.get("x-real-ip");
      const cfConnectingIp = request.headers.get("cf-connecting-ip");

      if (xForwardedFor) {
        return (xForwardedFor.split(",")[0] as string).trim();
      }
      if (xRealIp) {
        return xRealIp;
      }
      if (cfConnectingIp) {
        return cfConnectingIp;
      }

      return "unknown";
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (ctx) => {
    const { request } = ctx;
    const key = keyGenerator(request);

    // Get current count and reset time
    const { count, resetTime } = defaultStore.increment(key, windowMs);

    // Calculate remaining time
    const remainingTime = Math.ceil((resetTime - Date.now()) / 1000);

    // Set rate limit headers
    ctx.set.headers = {
      ...ctx.set.headers,
      "X-RateLimit-Limit": maxRequests.toString(),
      "X-RateLimit-Remaining": Math.max(0, maxRequests - count).toString(),
      "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
    } as Record<string, string>;

    // Check if rate limit exceeded
    if (count > maxRequests) {
      ctx.set.headers["Retry-After"] = remainingTime.toString();

      return new Response(
        JSON.stringify({
          success: false,
          message,
          meta: {
            limit: maxRequests,
            remaining: 0,
            reset: Math.ceil(resetTime / 1000),
            retryAfter: remainingTime,
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...ctx.set.headers,
          } as Record<string, string>,
        }
      );
    }
  };
};

/**
 * Default rate limiter with common settings
 */
export const defaultRateLimiter: Handler = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: "Too many requests from this IP, please try again later.",
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter: Handler = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Only 5 attempts per 15 minutes
  message: "Too many authentication attempts, please try again later.",
});

/**
 * Lenient rate limiter for API endpoints
 */
export const apiRateLimiter: Handler = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000,
  message: "API rate limit exceeded, please slow down your requests.",
});
