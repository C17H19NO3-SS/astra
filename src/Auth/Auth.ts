import type { Handler } from "elysia";
import { BaseAuth } from "../Core/Auth/BaseAuth";
import { JwtUtils } from "../Utils/JwtUtils";

export class Auth extends BaseAuth {
  /**
   * Elysia middleware handler function
   * @param ctx - Elysia context (request, response, store, vb.)
   */
  middleware: Handler = async (ctx) => {
    // örnek: header kontrolü
    const auth = ctx.request.headers.get("authorization");

    if (!auth || JwtUtils.decrypt(auth)) {
      return ctx.status(401, { error: "Unauthorized" });
    }
  };
}
