/**
 * Generic base authentication class.
 * T: Type of the payload contained in JWT.
 * This class can be extended to override authentication behavior.
 */
export abstract class BaseAuth<T> {
  /**
   * Checks if the provided JWT token is valid.
   * Can be overridden in subclasses to implement custom logic.
   * @param token - JWT token string, usually from Authorization header
   * @returns boolean - true if token is valid, false otherwise
   */
  abstract isAuthenticated(token?: string): boolean;

  /**
   * Authenticates a request using a JWT token and returns decoded payload.
   * Can be overridden in subclasses to implement custom logic.
   * @param token - JWT token string
   * @returns T | false - Returns decoded payload if token is valid, otherwise false
   */
  abstract authenticate(token?: string): T | false;
}
