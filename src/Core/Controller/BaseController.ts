import Elysia, { type Handler } from "elysia";
import type { Schema } from "../../types";
import { BaseAuth } from "../Auth/BaseAuth";

/**
 * BaseController is an abstract class that extends the Elysia framework.
 *
 * It provides:
 * - A shared authentication mechanism
 * - Common JSON response formatting
 * - A mechanism to run pre-route handlers (before request handlers)
 * - Simplified helper methods for registering routes (GET, POST, etc.)
 *
 * This class should be extended by specific controllers in your application.
 */
export abstract class BaseController<T extends ""> extends Elysia<T> {
  /** List of functions that will run before each route handler */
  private beforeHandlers: Handler[] = [];

  /** Authentication strategy (default is BaseAuth) */
  public authentication: BaseAuth = new BaseAuth();

  public authRequired: Boolean = false;

  /**
   * Create a new controller with a route prefix.
   *
   * @param prefix - Route prefix for this controller (e.g. "/users")
   */
  constructor(prefix: T) {
    super({ prefix });
  }

  /** Set a custom authentication method */
  set auth(method: BaseAuth) {
    this.authentication = method;
  }

  /** Get the current authentication method */
  get auth(): BaseAuth {
    return this.authentication;
  }

  public get getBeforeHandlers(): Handler[] {
    return this.beforeHandlers;
  }

  /**
   * Helper method to return a JSON response.
   *
   * @param data - Data to be serialized into JSON
   * @returns Response with `Content-Type: application/json`
   */
  protected json(data: unknown): Response {
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Builds a schema with all registered before-handlers.
   *
   * This ensures that all `beforeHandlers` run before
   * the actual route handler is executed.
   *
   * @param schema - Optional schema to extend
   * @returns Schema with beforeHandle logic applied
   */
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
   * Registers a route with a given HTTP method.
   *
   * @param method - HTTP method (get, post, put, patch, head, delete)
   * @param path - The route path (e.g. "/list")
   * @param handler - Request handler function
   * @param schema - Optional validation schema
   */
  protected registerRoute(
    method: "get" | "post" | "put" | "patch" | "head" | "delete",
    path: string,
    handler: Handler,
    schema?: Schema<T>
  ) {
    return this[method](path, handler, this.buildSchema(schema));
  }

  /** Register a GET route */
  protected routeGet(path: string, handler: Handler, schema?: Schema<T>) {
    return this.registerRoute("get", path, handler, schema);
  }

  /** Register a POST route */
  protected routePost(path: string, handler: Handler, schema?: Schema<T>) {
    return this.registerRoute("post", path, handler, schema);
  }

  /** Register a PUT route */
  protected routePut(path: string, handler: Handler, schema?: Schema<T>) {
    return this.registerRoute("put", path, handler, schema);
  }

  /** Register a PATCH route */
  protected routePatch(path: string, handler: Handler, schema?: Schema<T>) {
    return this.registerRoute("patch", path, handler, schema);
  }

  /** Register a HEAD route */
  protected routeHead(path: string, handler: Handler, schema?: Schema<T>) {
    return this.registerRoute("head", path, handler, schema);
  }

  /** Register a DELETE route */
  protected routeDelete(path: string, handler: Handler, schema?: Schema<T>) {
    return this.registerRoute("delete", path, handler, schema);
  }
}
