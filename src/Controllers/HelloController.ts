import { BaseAuth } from "../Core/Auth/BaseAuth";
import { BaseController } from "../Core/Controller/BaseController";

export class HelloController<T extends ""> extends BaseController<T> {
  constructor() {
    super("" as T);

    this.authRequired = true;
    this.authentication = new BaseAuth();

    this.routeGet("/", () =>
      this.json({
        message: "Hello Elysia",
      })
    );
  }
}
