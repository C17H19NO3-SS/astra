import { type Handler } from "elysia";

/**
 * Example middleware for Elysia.
 *
 * Middlewares run before the main route handler.
 * They can be used for:
 * - Logging requests
 * - Checking authentication
 * - Modifying request/response objects
 *
 * This is currently a no-op middleware (does nothing).
 * Replace the logic with your own implementation.
 */
export const exampleMiddleware: Handler = (ctx) => {
  // Example: log each request
  console.log(`[${ctx.request.method}] ${ctx.request.url}`);
};
