import Elysia, { type Handler } from "elysia";
import { Routes } from "../Config/Routes";
import { swagger } from "@elysiajs/swagger";
import { Middlewares } from "../Config/Middleware";
import chalk from "chalk";

export const InitWebServer = () => {
  console.time(chalk.green(`Web server initialization time!`));
  const app = new Elysia();

  if (process.env.NODE_ENV === "development") app.use(swagger());

  for (const route of Routes.sort((a, b) => a.priority - b.priority)) {
    const controller = new route.Class();

    const mws = [];

    for (const mw of Middlewares) {
      if (mw.Class === route.Class) {
        mws.push(mw);
      }
    }

    mws
      .sort((a, b) => a.priority - b.priority)
      .forEach((v) => controller.getBeforeHandlers.push(v.middleware));

    app.use(controller as Elysia);
  }

  return app;
};
