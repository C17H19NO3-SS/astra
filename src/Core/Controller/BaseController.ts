import Elysia, { type Handler } from "elysia";
import type { Schema, User } from "../../types";
import { BaseAuth } from "../Auth/BaseAuth";
import { ExampleAuth } from "../../Auth/Auth";

/**
 * Optimized BaseController for Elysia framework.
 * Provides:
 * - Shared authentication
 * - JSON response helper
 * - Before-handlers for all routes
 * - Minimal route registration
 */
export abstract class BaseController<T extends ""> extends Elysia<T> {
  private beforeHandlers: Handler[] = [];
  public authentication: BaseAuth<User> | null = null;
  public authRequired;

  constructor(
    prefix: T,
    authRequired: boolean,
    authentication?: BaseAuth<User>
  ) {
    super({ prefix });

    this.authRequired = authRequired;
    if (authentication) this.authentication = authentication as BaseAuth<User>;
  }

  /** Getter / Setter for authentication strategy */
  set auth(method: typeof this.authentication) {
    this.authentication = method;
  }
  get auth(): typeof this.authentication {
    return this.authentication;
  }

  public getBeforeHandlers(): Handler[] {
    return this.beforeHandlers;
  }

  /** JSON response helper */
  protected json = (
    data: unknown,
    headers: Record<string, any> = {}
  ): Response =>
    new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", ...headers },
    });

  /** Builds schema with before-handlers */
  private buildSchema(schema: Schema<T> = {}): Schema<T> {
    schema.beforeHandle = async (ctx) => {
      for (const cb of this.beforeHandlers) {
        const res = await cb(ctx);
        if (res !== undefined) return res;
      }
    };
    return schema;
  }

  /**
   * Registers a route for any HTTP method.
   * Replaces individual routeGet / routePost / routePut etc.
   */
  Route(
    method: "get" | "post" | "put" | "patch" | "head" | "delete",
    path: string,
    handler: Handler,
    schema?: Schema<T>
  ): Elysia<T> {
    return this[method](path, handler, this.buildSchema(schema));
  }
}
