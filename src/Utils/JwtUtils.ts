import jwt from "jsonwebtoken";

export class JwtUtils {
  static encrypt(payload: any) {
    return jwt.sign(payload, process.env.JWT_SECRET as string);
  }

  static decrypt<T>(token: string): T | false {
    try {
      return jwt.verify(token, process.env.JWT_SECRET as string) as T;
    } catch {
      return false;
    }
  }
}
