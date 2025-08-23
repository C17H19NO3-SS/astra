import type {
  BaseMacro,
  Handler,
  InputSchema,
  LocalHook,
  MergeSchema,
  SingletonBase,
  UnwrapRoute,
  Context,
} from "elysia";

export type Schema<T extends ""> = LocalHook<
  InputSchema<never>,
  MergeSchema<
    UnwrapRoute<InputSchema<never>, {}, `${T}/${string}`>,
    MergeSchema<{}, MergeSchema<{}, {}, "">, "">,
    ""
  >,
  SingletonBase,
  {},
  BaseMacro,
  never
>;

export interface RouteSchema<T extends ""> {
  handler: Handler;
  schema?: Schema<T>;
}

// User interface with proper structure
export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "user" | "moderator";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

// Database related types
export interface DatabaseConfig {
  type: "mysql" | "sqlite";
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  filename?: string; // for SQLite
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// Authentication related types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Middleware types
export interface MiddlewareOptions {
  skipRoutes?: string[];
  onError?: (error: Error, context: Context) => void;
}

// Route configuration types
export interface RouteConfig<T extends ""> {
  name: string;
  Class: new () => any;
  priority: number;
  middleware?: Handler[];
}

export interface MiddlewareConfig {
  Class: new () => any;
  middleware: Handler;
  priority: number;
  options?: MiddlewareOptions;
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: any
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Validation types
export interface ValidationRule {
  required?: boolean;
  type?: "string" | "number" | "boolean" | "email" | "url";
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Logger types
export type LogLevel = "error" | "warn" | "info" | "debug";

export interface LoggerOptions {
  level: LogLevel;
  timestamp: boolean;
  colorize: boolean;
}

// Configuration types
export interface AppConfig {
  server: {
    port: number;
    host: string;
  };
  database: DatabaseConfig;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string | string[];
    methods: string[];
    headers: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: LoggerOptions;
}
