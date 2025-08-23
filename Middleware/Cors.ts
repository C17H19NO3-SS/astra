import type { Handler } from "elysia";

interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

/**
 * CORS middleware for handling Cross-Origin Resource Sharing
 */
export const corsMiddleware = (options: CorsOptions = {}): Handler => {
  const {
    origin = process.env.CORS_ORIGIN || "*",
    methods = process.env.CORS_METHODS?.split(",") || [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
      "PATCH",
    ],
    allowedHeaders = process.env.CORS_HEADERS?.split(",") || [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400, // 24 hours
    optionsSuccessStatus = 204,
  } = options;

  return (ctx) => {
    const { request } = ctx;

    // Get origin from request
    const requestOrigin =
      request?.headers?.get("origin") || request?.headers?.get("host") || "";

    // Determine if origin is allowed
    let allowedOrigin = "*";
    if (typeof origin === "string") {
      allowedOrigin = origin;
    } else if (Array.isArray(origin)) {
      allowedOrigin = origin.includes(requestOrigin) ? requestOrigin : "false";
    } else if (typeof origin === "boolean") {
      allowedOrigin = origin ? requestOrigin : "false";
    }

    // Set CORS headers
    const headers: Record<string, string> = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": methods.join(", "),
      "Access-Control-Allow-Headers": allowedHeaders.join(", "),
      "Access-Control-Max-Age": maxAge.toString(),
    };

    if (exposedHeaders.length > 0) {
      headers["Access-Control-Expose-Headers"] = exposedHeaders.join(", ");
    }

    if (credentials) {
      headers["Access-Control-Allow-Credentials"] = "true";
    }

    // Handle preflight requests (OPTIONS)
    if (request?.method === "OPTIONS") {
      return new Response(null, {
        status: optionsSuccessStatus,
        headers,
      });
    }

    // Add CORS headers to response
    ctx.set.headers = headers;
  };
};
