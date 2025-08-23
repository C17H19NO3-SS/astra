import { BaseAuth } from "../Core/Auth/BaseAuth";
import type { User } from "../types";
import { JwtUtils } from "../Utils/JwtUtils";

export class ExampleAuth extends BaseAuth<User> {
  override authenticate(token?: string): User | false {
    if (!token) return false;

    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, "");

      // Decrypt and validate the JWT token
      const decoded = JwtUtils.decrypt<User>(cleanToken);

      if (!decoded) return false;

      // Additional validation can be added here
      // e.g., check if user exists in database, is active, etc.

      return decoded;
    } catch (error) {
      console.error("Authentication error:", error);
      return false;
    }
  }

  override isAuthenticated(token?: string): boolean {
    return this.authenticate(token) !== false;
  }

  // Generate token for user
  generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    return JwtUtils.encrypt(payload);
  }

  // Validate user credentials (example implementation)
  async validateCredentials(
    email: string,
    password: string
  ): Promise<User | false> {
    // This is where you would typically:
    // 1. Query the database for the user
    // 2. Compare the hashed password
    // 3. Return the user if valid

    // Example mock validation
    if (email === "admin@example.com" && password === "password") {
      return {
        id: 1,
        email: "admin@example.com",
        role: "admin",
        name: "Administrator",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return false;
  }

  // Refresh token
  refreshToken(token: string): string | false {
    const user = this.authenticate(token);
    if (!user) return false;

    return this.generateToken(user);
  }

  // Logout / Invalidate token
  logout(token: string): boolean {
    // In a real implementation, you might want to:
    // 1. Add token to a blacklist
    // 2. Store invalidated tokens in Redis/Database
    // 3. Or use shorter token expiry times

    console.log(`Token invalidated: ${token.substring(0, 20)}...`);
    return true;
  }
}
