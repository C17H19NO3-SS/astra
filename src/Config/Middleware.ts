import type { Handler } from "elysia";
import { HelloController } from "../Controllers/HelloController";
import { exampleMiddleware } from "../Middleware/example";
import { rateLimiter } from "../Middleware/RateLimiter";

export const Middlewares = [
  {
    Class: HelloController,
    middleware: exampleMiddleware as Handler,
    priority: 1,
  },
  {
    Class: HelloController,
    middleware: rateLimiter({
      maxRequests: 10,
      windowMs: 10 * 1000,
    }),
    priority: 2,
  },
];
