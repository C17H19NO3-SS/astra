import Elysia from "elysia";
import { Routes } from "../Config/Routes";
import { swagger } from "@elysiajs/swagger";
import { Middlewares } from "../Config/Middleware";

/**
 * Initializes and configures the web server using Elysia framework.
 * Sets up routes, applies middlewares, and adds Swagger in development.
 */
export const InitWebServer = (): Elysia => {
  const app = new Elysia();

  // If in development environment, enable Swagger for API documentation
  if (process.env.NODE_ENV === "development") {
    app.use(
      swagger({
        documentation: {
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
              },
            },
          },
        },
      })
    ); // Attach Swagger middleware to document API endpoints
  }

  // Sort all routes by their priority to determine execution order
  const sortedRoutes = Routes.sort((a, b) => a.priority - b.priority);

  sortedRoutes.forEach((route) => {
    const controller = new route.Class();
    // Create an instance of the route controller

    // Filter middlewares that are applicable to this controller
    const applicableMiddlewares = Middlewares.filter(
      (mw) => mw.Class === route.Class
    ) // Only select middlewares meant for this route
      .sort((a, b) => a.priority - b.priority); // Sort middlewares by priority

    // Attach each middleware's handler function to the controller's before-handlers
    applicableMiddlewares.forEach((mw) =>
      controller.getBeforeHandlers().push(mw.middleware)
    );

    // Register the controller to the Elysia app
    app.use(controller as unknown as Elysia);
    // Type assertion is used here to satisfy Elysia's expected type
  });

  return app; // Return the fully configured Elysia app
};
