import type { ValidationRule, ValidationSchema } from "../src/types";

/**
 * Validation utility class for input validation
 */
export class ValidationUtils {
  /**
   * Validate data against a schema
   */
  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = this.validateField(field, value, rule);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a single field against a rule
   */
  private static validateField(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required
    if (
      rule.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push({
        field,
        message: `${field} is required`,
        code: "REQUIRED",
      });
      return errors; // If required field is missing, don't check other rules
    }

    // Skip other validations if value is empty and not required
    if (value === undefined || value === null || value === "") {
      return errors;
    }

    // Check type
    if (rule.type) {
      const typeError = this.validateType(field, value, rule.type);
      if (typeError) errors.push(typeError);
    }

    // Check min length/value
    if (rule.min !== undefined) {
      const minError = this.validateMin(field, value, rule.min, rule.type);
      if (minError) errors.push(minError);
    }

    // Check max length/value
    if (rule.max !== undefined) {
      const maxError = this.validateMax(field, value, rule.max, rule.type);
      if (maxError) errors.push(maxError);
    }

    // Check pattern
    if (rule.pattern) {
      const patternError = this.validatePattern(field, value, rule.pattern);
      if (patternError) errors.push(patternError);
    }

    // Check custom validation
    if (rule.custom) {
      const customError = this.validateCustom(field, value, rule.custom);
      if (customError) errors.push(customError);
    }

    return errors;
  }

  /**
   * Validate type
   */
  private static validateType(
    field: string,
    value: any,
    type: string
  ): ValidationError | null {
    switch (type) {
      case "string":
        if (typeof value !== "string") {
          return {
            field,
            message: `${field} must be a string`,
            code: "TYPE_ERROR",
          };
        }
        break;
      case "number":
        if (typeof value !== "number" || isNaN(value)) {
          return {
            field,
            message: `${field} must be a number`,
            code: "TYPE_ERROR",
          };
        }
        break;
      case "boolean":
        if (typeof value !== "boolean") {
          return {
            field,
            message: `${field} must be a boolean`,
            code: "TYPE_ERROR",
          };
        }
        break;
      case "email":
        if (typeof value !== "string" || !this.isValidEmail(value)) {
          return {
            field,
            message: `${field} must be a valid email address`,
            code: "INVALID_EMAIL",
          };
        }
        break;
      case "url":
        if (typeof value !== "string" || !this.isValidUrl(value)) {
          return {
            field,
            message: `${field} must be a valid URL`,
            code: "INVALID_URL",
          };
        }
        break;
    }
    return null;
  }

  /**
   * Validate minimum value/length
   */
  private static validateMin(
    field: string,
    value: any,
    min: number,
    type?: string
  ): ValidationError | null {
    if (type === "number" && value < min) {
      return {
        field,
        message: `${field} must be at least ${min}`,
        code: "MIN_VALUE",
      };
    }
    if (
      (type === "string" || typeof value === "string") &&
      value.length < min
    ) {
      return {
        field,
        message: `${field} must be at least ${min} characters long`,
        code: "MIN_LENGTH",
      };
    }
    return null;
  }

  /**
   * Validate maximum value/length
   */
  private static validateMax(
    field: string,
    value: any,
    max: number,
    type?: string
  ): ValidationError | null {
    if (type === "number" && value > max) {
      return {
        field,
        message: `${field} must be at most ${max}`,
        code: "MAX_VALUE",
      };
    }
    if (
      (type === "string" || typeof value === "string") &&
      value.length > max
    ) {
      return {
        field,
        message: `${field} must be at most ${max} characters long`,
        code: "MAX_LENGTH",
      };
    }
    return null;
  }

  /**
   * Validate pattern
   */
  private static validatePattern(
    field: string,
    value: any,
    pattern: RegExp
  ): ValidationError | null {
    if (typeof value === "string" && !pattern.test(value)) {
      return {
        field,
        message: `${field} format is invalid`,
        code: "PATTERN_MISMATCH",
      };
    }
    return null;
  }

  /**
   * Validate custom rule
   */
  private static validateCustom(
    field: string,
    value: any,
    custom: (value: any) => boolean | string
  ): ValidationError | null {
    const result = custom(value);
    if (result === false) {
      return {
        field,
        message: `${field} is invalid`,
        code: "CUSTOM_VALIDATION",
      };
    }
    if (typeof result === "string") {
      return { field, message: result, code: "CUSTOM_VALIDATION" };
    }
    return null;
  }

  /**
   * Check if email is valid
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if URL is valid
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(value: string): string {
    return value
      .trim()
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/['"]/g, ""); // Remove quotes
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Check password strength
   */
  static checkPasswordStrength(password: string): PasswordStrength {
    const length = password.length;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let score = 0;
    const feedback: string[] = [];

    if (length >= 8) score++;
    else feedback.push("Password should be at least 8 characters long");

    if (hasLowercase) score++;
    else feedback.push("Password should contain lowercase letters");

    if (hasUppercase) score++;
    else feedback.push("Password should contain uppercase letters");

    if (hasNumbers) score++;
    else feedback.push("Password should contain numbers");

    if (hasSpecialChars) score++;
    else feedback.push("Password should contain special characters");

    let strength: "weak" | "fair" | "good" | "strong";
    if (score < 2) strength = "weak";
    else if (score < 3) strength = "fair";
    else if (score < 4) strength = "good";
    else strength = "strong";

    return {
      score,
      strength,
      feedback,
      isStrong: score >= 4,
    };
  }
}

// Types for validation
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface PasswordStrength {
  score: number;
  strength: "weak" | "fair" | "good" | "strong";
  feedback: string[];
  isStrong: boolean;
}

// Common validation schemas
export const CommonValidations = {
  email: {
    required: true,
    type: "email" as const,
    custom: (value: string) => {
      const sanitized = ValidationUtils.sanitizeEmail(value);
      return sanitized.length <= 254; // RFC 5321 limit
    },
  },

  password: {
    required: true,
    type: "string" as const,
    min: 8,
    max: 128,
    custom: (value: string) => {
      const strength = ValidationUtils.checkPasswordStrength(value);
      return strength.isStrong || strength.feedback.join(", ");
    },
  },

  name: {
    required: true,
    type: "string" as const,
    min: 2,
    max: 50,
    pattern: /^[a-zA-Z\s]+$/,
  },

  phone: {
    type: "string" as const,
    pattern: /^\+?[\d\s\-\(\)]+$/,
  },

  username: {
    required: true,
    type: "string" as const,
    min: 3,
    max: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
};
