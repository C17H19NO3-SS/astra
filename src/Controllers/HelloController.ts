import { BaseController } from "../Core/Controller/BaseController";
import type { RouteSchema } from "../types";

export class HelloController<T extends ""> extends BaseController<T> {
  constructor() {
    super("" as T, false);

    this.Route("get", "/", this.index.handler, this.index.schema || {});
  }

  index: RouteSchema<T> = {
    handler: () =>
      this.json({
        message: "Hello Elysia",
      }),
  };
}
