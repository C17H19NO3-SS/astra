import type { Handler } from "elysia";
import { HelloController } from "../Controllers/HelloController";
import { exampleMiddleware } from "../Middleware/example";

export const Middlewares = [
  {
    Class: HelloController,
    middleware: exampleMiddleware as Handler,
    priority: 1,
  },
];
