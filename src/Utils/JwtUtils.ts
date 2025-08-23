import jwt from "jsonwebtoken";

/**
 * Utility class for handling JSON Web Tokens (JWT).
 * Provides methods for encrypting (signing) and decrypting (verifying) JWTs.
 */
export class JwtUtils {
  /**
   * Generates a JWT from a given payload.
   * @param payload - The data to be encoded into the JWT.
   * @returns A signed JWT string.
   *
   * Notes:
   * - Uses the secret defined in environment variable JWT_SECRET.
   * - The payload can be any object or primitive data that should be encoded.
   */
  static encrypt(payload: any): string {
    return jwt.sign(payload, process.env.JWT_SECRET as string);
  }

  /**
   * Verifies and decodes a JWT.
   * @param token - The JWT string to decode.
   * @returns The decoded payload of type T if valid, or false if verification fails.
   *
   * Notes:
   * - The method uses a generic <T> to allow type-safe retrieval of the decoded payload.
   * - If the token is invalid or expired, the method returns false.
   * - Errors during verification are caught to prevent exceptions from propagating.
   */
  static decrypt<T>(token: string): T | false {
    try {
      return jwt.verify(token, process.env.JWT_SECRET as string) as T;
    } catch {
      return false;
    }
  }
}
