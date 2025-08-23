import { BaseAuth } from "../Core/Auth/BaseAuth";
import type { User } from "../types";
import { JwtUtils } from "../Utils/JwtUtils";

export class ExampleAuth extends BaseAuth<User> {
  override authenticate(token?: string) {
    return {} as User;
  }

  override isAuthenticated(token?: string): boolean {
    if (!token) return false;

    return JwtUtils.decrypt<User>(token) !== false;
  }
}
