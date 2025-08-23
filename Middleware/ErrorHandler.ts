import type { Handler } from "elysia";
import { AppError, type ApiResponse } from "../src/types";

/**
 * Global error handler middleware for Astra Framework.
 * Catches and formats errors in a consistent API response format.
 */
export const errorHandler: Handler = (ctx) => {
  // This will be used as an onError handler in Elysia
  return {
    onError: ({ error, code }: { error: Error; code: string }) => {
      console.error(`[${new Date().toISOString()}] Error:`, error);

      // Default error response
      let statusCode = 500;
      let message = "Internal Server Error";
      let errors: string[] = [];
      let errorCode = "INTERNAL_ERROR";

      // Handle custom AppError
      if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        errorCode = error.code;
        if (error.details) {
          errors = Array.isArray(error.details)
            ? error.details
            : [error.details];
        }
      }
      // Handle Elysia validation errors
      else if (code === "VALIDATION") {
        statusCode = 400;
        message = "Validation Error";
        errorCode = "VALIDATION_ERROR";
        errors = [error.message];
      }
      // Handle authentication errors
      else if (code === "UNAUTHORIZED") {
        statusCode = 401;
        message = "Unauthorized";
        errorCode = "UNAUTHORIZED";
      }
      // Handle not found errors
      else if (code === "NOT_FOUND") {
        statusCode = 404;
        message = "Not Found";
        errorCode = "NOT_FOUND";
      }
      // Handle method not allowed
      else if (code === "METHOD_NOT_ALLOWED") {
        statusCode = 405;
        message = "Method Not Allowed";
        errorCode = "METHOD_NOT_ALLOWED";
      }
      // Handle generic errors
      else {
        if (process.env.NODE_ENV === "development") {
          message = error.message;
          errors = [error.stack || ""];
        }
      }

      const response: ApiResponse = {
        success: false,
        message,
        errors: errors.length > 0 ? errors : undefined,
      };

      return new Response(JSON.stringify(response), {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
  };
};

/**
 * Create a custom AppError with specific status code and message
 */
export const createError = (
  message: string,
  statusCode: number = 500,
  code: string = "INTERNAL_ERROR",
  details?: any
): AppError => {
  return new AppError(message, statusCode, code, details);
};

// Common error creators
export const BadRequestError = (message: string, details?: any) =>
  createError(message, 400, "BAD_REQUEST", details);

export const UnauthorizedError = (
  message: string = "Unauthorized",
  details?: any
) => createError(message, 401, "UNAUTHORIZED", details);

export const ForbiddenError = (message: string = "Forbidden", details?: any) =>
  createError(message, 403, "FORBIDDEN", details);

export const NotFoundError = (message: string = "Not Found", details?: any) =>
  createError(message, 404, "NOT_FOUND", details);

export const ConflictError = (message: string, details?: any) =>
  createError(message, 409, "CONFLICT", details);

export const ValidationError = (message: string, details?: any) =>
  createError(message, 422, "VALIDATION_ERROR", details);

export const InternalServerError = (
  message: string = "Internal Server Error",
  details?: any
) => createError(message, 500, "INTERNAL_ERROR", details);
