import Elysia, { type Context } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { db } from "../Core/Database/Database";
import { log } from "../../Utils/Logger";
import { Routes } from "../../Config/Routes";
import { Middlewares } from "../../Config/Middleware";

// Extend Request type to include custom properties
declare global {
  namespace globalThis {
    interface Request {
      startTime?: number;
    }
  }
}

/**
 * Initializes and configures the web server using Elysia framework.
 * Sets up routes, applies middlewares, error handling, and health monitoring.
 */
export const InitWebServer = (): Elysia => {
  const app = new Elysia();

  // Global error handling - proper error handler setup
  app.onError(({ error, code, set }) => {
    console.error(`[${new Date().toISOString()}] Error:`, error);

    // Default error response
    let statusCode = 500;
    let message = "Internal Server Error";
    let errors: string[] = [];
    let errorCode = "INTERNAL_ERROR";

    // Handle Elysia validation errors using proper string comparison
    if (String(code) === "VALIDATION") {
      statusCode = 400;
      message = "Validation Error";
      errorCode = "VALIDATION_ERROR";
      errors = [String(error)];
    }
    // Handle not found errors
    else if (String(code) === "NOT_FOUND") {
      statusCode = 404;
      message = "Not Found";
      errorCode = "NOT_FOUND";
    }
    // Handle parse errors
    else if (String(code) === "PARSE") {
      statusCode = 400;
      message = "Parse Error";
      errorCode = "PARSE_ERROR";
      errors = [String(error)];
    }
    // Handle internal server errors
    else if (String(code) === "INTERNAL_SERVER_ERROR") {
      statusCode = 500;
      message = "Internal Server Error";
      errorCode = "INTERNAL_ERROR";
    }
    // Handle generic errors
    else {
      if (process.env.NODE_ENV === "development") {
        message = String(error);
        // Only try to get stack if error is an Error object
        if (error instanceof Error) {
          errors = [error.stack || String(error)];
        } else {
          errors = [String(error)];
        }
      }
    }

    set.status = statusCode;
    return {
      success: false,
      message,
      errors: errors.length > 0 ? errors : undefined,
    };
  });

  // CORS middleware setup using onRequest hook
  if (process.env.NODE_ENV === "production") {
    app.onRequest(({ request, set }) => {
      // Get origin from request
      const requestOrigin = request.headers.get("origin") || "";

      // Set CORS headers
      set.headers["Access-Control-Allow-Origin"] =
        process.env.CORS_ORIGIN || requestOrigin || "*";
      set.headers["Access-Control-Allow-Methods"] =
        "GET, POST, PUT, DELETE, OPTIONS, PATCH";
      set.headers["Access-Control-Allow-Headers"] =
        "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name";
      set.headers["Access-Control-Allow-Credentials"] = "true";
      set.headers["Access-Control-Max-Age"] = "86400";
    });

    // Handle preflight OPTIONS requests
    app.options("*", ({ set }) => {
      set.status = 204;
      return "";
    });
  }

  // Request logging middleware
  app.onRequest(({ request }) => {
    const startTime = Date.now();
    (request as any).startTime = startTime;
  });

  app.onAfterResponse(({ request, set }) => {
    const responseTime =
      Date.now() - ((request as any).startTime || Date.now());
    const method = request.method;
    const path = new URL(request.url).pathname;
    const statusCode = set.status;

    log.request(method, path, statusCode as number, responseTime);
  });

  // Health check endpoint
  app.get("/health", async () => {
    try {
      const dbHealth = await db.healthCheck();
      const dbStats = db.getStats();

      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: dbHealth,
        stats: dbStats,
      };

      return health;
    } catch (error) {
      log.error("Health check failed", error);
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // API info endpoint
  app.get("/info", () => {
    return {
      name: "Astra Framework",
      version: process.env.API_VERSION || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    };
  });

  // Swagger documentation in development
  if (
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_SWAGGER !== "false"
  ) {
    app.use(
      swagger({
        documentation: {
          info: {
            title: "Astra Framework API",
            version: process.env.API_VERSION || "1.0.0",
            description: "API documentation for Astra Framework",
          },
          servers: [
            {
              url: `http://localhost:${process.env.PORT || 3000}`,
              description: "Development server",
            },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Enter your JWT token",
              },
            },
          },
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
        path: "/swagger",
      })
    );

    log.info("Swagger documentation enabled at /swagger");
  }

  // Sort routes by priority
  const sortedRoutes = Routes.sort((a, b) => a.priority - b.priority);

  // Register routes with their middlewares
  sortedRoutes.forEach((route) => {
    try {
      const controller = new route.Class();

      // Filter and sort middlewares for this controller
      const applicableMiddlewares = Middlewares.filter(
        (mw) => mw.Class === route.Class
      ).sort((a, b) => a.priority - b.priority);

      // Apply middlewares to controller
      applicableMiddlewares.forEach((mw) => {
        controller.getBeforeHandlers().push(mw.middleware);
        log.debug(`Applied middleware to ${route.name}`, {
          priority: mw.priority,
        });
      });

      // Register controller with app
      app.use(controller as any);

      log.info(`Registered route: ${route.name} (priority: ${route.priority})`);
    } catch (error) {
      log.error(`Failed to register route: ${route.name}`, error);
      throw error;
    }
  });

  // 404 handler for unmatched routes
  app.all("*", ({ set }) => {
    set.status = 404;
    return {
      success: false,
      message: "Route not found",
      timestamp: new Date().toISOString(),
    };
  });

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    log.info("Shutting down server gracefully...");

    try {
      await db.closeAll();
      log.info("Database connections closed");
    } catch (error) {
      log.error("Error closing database connections", error);
    }

    process.exit(0);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  // Unhandled promise rejection handling
  process.on("unhandledRejection", (reason, promise) => {
    log.error("Unhandled Promise Rejection", { reason, promise });
  });

  // Uncaught exception handling
  process.on("uncaughtException", (error) => {
    log.error("Uncaught Exception", error);
    process.exit(1);
  });

  return app;
};
