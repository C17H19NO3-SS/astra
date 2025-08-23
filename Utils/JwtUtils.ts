import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types";

/**
 * Enhanced utility class for handling JSON Web Tokens (JWT).
 * Provides methods for encrypting (signing) and decrypting (verifying) JWTs
 * with additional security features and error handling.
 */
export class JwtUtils {
  private static readonly DEFAULT_EXPIRES_IN = "24h";
  private static readonly ALGORITHM = "HS256";

  /**
   * Get JWT secret from environment variables with validation
   */
  private static getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }
    if (secret.length < 32) {
      console.warn(
        "JWT_SECRET should be at least 32 characters long for security"
      );
    }
    return secret;
  }

  /**
   * Get JWT expiration time from environment variables
   */
  private static getExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || this.DEFAULT_EXPIRES_IN;
  }

  /**
   * Generates a JWT from a given payload with enhanced security options.
   * @param payload - The data to be encoded into the JWT.
   * @param options - Optional JWT sign options
   * @returns A signed JWT string.
   */
  static encrypt(
    payload: any,
    options?: {
      expiresIn?: string;
      issuer?: string;
      audience?: string;
      subject?: string;
    }
  ): string {
    try {
      const secret = this.getSecret();

      const signOptions: jwt.SignOptions = {
        algorithm: this.ALGORITHM,
        expiresIn: Number(options?.expiresIn || this.getExpiresIn()),
        issuer: options?.issuer || "astra-framework",
        audience: options?.audience,
        subject: options?.subject,
      };

      return jwt.sign(payload, secret, signOptions);
    } catch (error) {
      console.error("JWT encryption error:", error);
      throw new Error("Failed to generate JWT token");
    }
  }

  /**
   * Verifies and decodes a JWT with comprehensive error handling.
   * @param token - The JWT string to decode.
   * @param options - Optional verification options
   * @returns The decoded payload of type T if valid, or false if verification fails.
   */
  static decrypt<T = any>(
    token: string,
    options?: {
      issuer?: string;
      audience?: string;
      subject?: string;
      ignoreExpiration?: boolean;
    }
  ): T | false {
    try {
      if (!token || typeof token !== "string") {
        return false;
      }

      const secret = this.getSecret();

      const verifyOptions: jwt.VerifyOptions = {
        algorithms: [this.ALGORITHM],
        issuer: options?.issuer || "astra-framework",
        audience: options?.audience,
        subject: options?.subject,
        ignoreExpiration: options?.ignoreExpiration || false,
      };

      const decoded = jwt.verify(token, secret, verifyOptions);
      return decoded as T;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.warn("JWT token has expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.warn("Invalid JWT token:", error.message);
      } else {
        console.error("JWT decryption error:", error);
      }
      return false;
    }
  }

  /**
   * Decode JWT without verification (for debugging purposes only)
   * @param token - JWT token to decode
   * @returns Decoded payload or null
   */
  static decodeWithoutVerification(token: string): any | null {
    try {
      return jwt.decode(token);
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired without full verification
   * @param token - JWT token to check
   * @returns true if expired, false if valid or unable to determine
   */
  static isExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      if (!decoded || !decoded.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration date
   * @param token - JWT token
   * @returns Date object or null if unable to determine
   */
  static getExpirationDate(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      if (!decoded || !decoded.exp) return null;

      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Get remaining time before token expires
   * @param token - JWT token
   * @returns Remaining time in milliseconds, or 0 if expired/invalid
   */
  static getRemainingTime(token: string): number {
    try {
      const expDate = this.getExpirationDate(token);
      if (!expDate) return 0;

      const remaining = expDate.getTime() - Date.now();
      return Math.max(0, remaining);
    } catch {
      return 0;
    }
  }

  /**
   * Refresh a token by extending its expiration time
   * @param token - Current JWT token
   * @param newExpiresIn - New expiration time
   * @returns New JWT token or false if original token is invalid
   */
  static refresh(token: string, newExpiresIn?: string): string | false {
    try {
      const decoded = this.decrypt(token, { ignoreExpiration: true });
      if (!decoded) return false;

      // Remove JWT standard claims to avoid conflicts
      const payload = { ...decoded };
      delete (payload as any).iat;
      delete (payload as any).exp;
      delete (payload as any).nbf;

      return this.encrypt(payload, { expiresIn: newExpiresIn });
    } catch {
      return false;
    }
  }

  /**
   * Generate a secure random secret for JWT signing
   * @param length - Length of the secret (default: 64)
   * @returns Random hex string
   */
  static generateSecret(length: number = 64): string {
    const crypto = require("crypto");
    return crypto.randomBytes(length).toString("hex");
  }
}
