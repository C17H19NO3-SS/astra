import type { LogLevel, LoggerOptions } from "../src/types";

/**
 * Enhanced Logger utility for Astra Framework with performance tracking
 */
export class Logger {
  private static instance: Logger;
  private options: LoggerOptions;
  private logLevels: { [key in LogLevel]: number } = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  // Active timers for console.time/timeEnd
  private activeTimers: Map<string, number> = new Map();

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      level: (process.env.LOG_LEVEL as LogLevel) || "info",
      timestamp: true,
      colorize: process.env.NODE_ENV === "development",
      ...options,
    };
  }

  static getInstance(options?: Partial<LoggerOptions>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] <= this.logLevels[this.options.level];
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    let formatted = "";

    // Add timestamp
    if (this.options.timestamp) {
      const timestamp = new Date().toISOString();
      formatted += `[${timestamp}] `;
    }

    // Add level
    const levelStr = level.toUpperCase().padEnd(5);
    if (this.options.colorize) {
      formatted += this.colorize(levelStr, level);
    } else {
      formatted += `[${levelStr}]`;
    }

    formatted += ` ${message}`;

    // Add metadata
    if (meta) {
      if (typeof meta === "object" && !(meta instanceof Error)) {
        formatted += ` ${JSON.stringify(meta, null, 2)}`;
      } else {
        formatted += ` ${meta}`;
      }
    }

    return formatted;
  }

  private colorize(text: string, level: LogLevel): string {
    const colors = {
      error: "\x1b[31m", // Red
      warn: "\x1b[33m", // Yellow
      info: "\x1b[36m", // Cyan
      debug: "\x1b[90m", // Gray
    };
    const reset = "\x1b[0m";
    return `${colors[level]}[${text}]${reset}`;
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }

  // Performance timing methods using console.time/timeEnd
  time(label: string, message?: string): void {
    if (this.shouldLog("debug")) {
      if (message) {
        this.debug(`⏱️  Starting: ${message}`, { label });
      }
      console.time(label);
      this.activeTimers.set(label, Date.now());
    }
  }

  timeEnd(label: string, message?: string): number {
    let duration = 0;
    
    if (this.activeTimers.has(label)) {
      duration = Date.now() - this.activeTimers.get(label)!;
      this.activeTimers.delete(label);
    }

    if (this.shouldLog("debug")) {
      console.timeEnd(label);
      if (message) {
        this.debug(`✅ Completed: ${message}`, { 
          label, 
          duration: `${duration}ms`,
          performance: duration > 1000 ? 'slow' : duration > 500 ? 'medium' : 'fast'
        });
      }
    }

    return duration;
  }

  // HTTP request logging with enhanced formatting
  request(
    method: string,
    path: string,
    statusCode?: number,
    responseTime?: number
  ): void {
    const status = statusCode ? `${statusCode}` : "pending";
    const time = responseTime ? ` - ${responseTime}ms` : "";
    const level = statusCode && statusCode >= 400 ? "warn" : "info";
    
    // Add request performance indicators
    let perfIndicator = "";
    if (responseTime) {
      if (responseTime > 2000) perfIndicator = "🐌";
      else if (responseTime > 1000) perfIndicator = "⚠️";
      else if (responseTime > 500) perfIndicator = "⏳";
      else perfIndicator = "⚡";
    }

    const statusEmoji = this.getStatusEmoji(statusCode);
    this[level](`${statusEmoji} ${method.padEnd(6)} ${path} ${status}${time} ${perfIndicator}`);
  }

  private getStatusEmoji(statusCode?: number): string {
    if (!statusCode) return "📤";
    
    if (statusCode >= 200 && statusCode < 300) return "✅";
    if (statusCode >= 300 && statusCode < 400) return "↪️";
    if (statusCode >= 400 && statusCode < 500) return "❌";
    if (statusCode >= 500) return "💥";
    return "❓";
  }

  // Database query logging with timing
  query(sql: string, params?: any[], executionTime?: number): void {
    if (this.shouldLog("debug")) {
      const time = executionTime ? ` (${executionTime}ms)` : "";
      let perfIndicator = "";
      
      if (executionTime) {
        if (executionTime > 1000) perfIndicator = "🐌 SLOW";
        else if (executionTime > 500) perfIndicator = "⚠️ MEDIUM";
        else if (executionTime > 100) perfIndicator = "⏳ NORMAL";
        else perfIndicator = "⚡ FAST";
      }

      const truncatedSql = sql.length > 100 ? sql.substring(0, 100) + "..." : sql;
      this.debug(`🗃️  SQL Query${time} ${perfIndicator}:`, { 
        sql: truncatedSql, 
        params,
        fullSql: sql.length > 100 ? sql : undefined
      });
    }
  }

  // Database connection logging
  connection(
    action: "connect" | "disconnect" | "reconnect" | "error",
    database: string,
    details?: any
  ): void {
    const emojis = {
      connect: "🔌",
      disconnect: "🔌",
      reconnect: "🔄",
      error: "💥"
    };
    
    const level = action === "error" ? "error" : "info";
    this[level](`${emojis[action]} Database ${action}: ${database}`, details);
  }

  // Authentication logging
  auth(
    event: "login" | "logout" | "failed_login" | "register" | "refresh_token",
    userId?: number | string,
    ip?: string,
    details?: any
  ): void {
    const emojis = {
      login: "🔐",
      logout: "🚪",
      failed_login: "❌",
      register: "👤",
      refresh_token: "🔄"
    };

    const message = `${emojis[event]} Auth ${event}${userId ? ` for user ${userId}` : ""}${
      ip ? ` from ${ip}` : ""
    }`;
    
    const level = event === "failed_login" ? "warn" : "info";
    this[level](message, details);
  }

  // Server lifecycle logging
  server(
    event: "starting" | "started" | "stopping" | "stopped" | "error",
    port?: number,
    details?: any
  ): void {
    const emojis = {
      starting: "🚀",
      started: "✅",
      stopping: "⏹️",
      stopped: "🔴",
      error: "💥"
    };

    const portInfo = port ? ` on port ${port}` : "";
    const level = event === "error" ? "error" : "info";
    this[level](`${emojis[event]} Server ${event}${portInfo}`, details);
  }

  // API endpoint registration
  route(action: "register" | "error", name: string, details?: any): void {
    const emoji = action === "register" ? "📍" : "❌";
    const level = action === "error" ? "error" : "info";
    this[level](`${emoji} Route ${action}: ${name}`, details);
  }

  // Middleware logging
  middleware(action: "apply" | "error", name: string, details?: any): void {
    const emoji = action === "apply" ? "🔧" : "❌";
    const level = action === "error" ? "error" : "debug";
    this[level](`${emoji} Middleware ${action}: ${name}`, details);
  }

  // Cache operations
  cache(
    action: "hit" | "miss" | "set" | "delete" | "clear" | "error",
    key?: string,
    details?: any
  ): void {
    const emojis = {
      hit: "🎯",
      miss: "❌",
      set: "💾",
      delete: "🗑️",
      clear: "🧹",
      error: "💥"
    };

    const keyInfo = key ? ` key: ${key}` : "";
    const level = action === "error" ? "error" : "debug";
    this[level](`${emojis[action]} Cache ${action}${keyInfo}`, details);
  }

  // File operations
  file(
    action: "read" | "write" | "delete" | "upload" | "error",
    filename?: string,
    size?: number,
    details?: any
  ): void {
    const emojis = {
      read: "📖",
      write: "💾",
      delete: "🗑️",
      upload: "📤",
      error: "💥"
    };

    const fileInfo = filename ? ` ${filename}` : "";
    const sizeInfo = size ? ` (${this.formatBytes(size)})` : "";
    const level = action === "error" ? "error" : "debug";
    this[level](`${emojis[action]} File ${action}${fileInfo}${sizeInfo}`, details);
  }

  // Validation logging
  validation(success: boolean, field?: string, details?: any): void {
    const emoji = success ? "✅" : "❌";
    const fieldInfo = field ? ` field: ${field}` : "";
    const level = success ? "debug" : "warn";
    this[level](`${emoji} Validation${fieldInfo}`, details);
  }

  // Memory and performance monitoring
  memory(action: "usage" | "gc" | "leak_warning", details?: any): void {
    const emojis = {
      usage: "📊",
      gc: "🧹",
      leak_warning: "⚠️"
    };

    const level = action === "leak_warning" ? "warn" : "debug";
    this[level](`${emojis[action]} Memory ${action}`, {
      ...details,
      memoryUsage: process.memoryUsage()
    });
  }

  // External API calls
  external(
    action: "request" | "response" | "error",
    service: string,
    endpoint?: string,
    responseTime?: number,
    details?: any
  ): void {
    const emojis = {
      request: "📤",
      response: "📥",
      error: "💥"
    };

    const endpointInfo = endpoint ? ` ${endpoint}` : "";
    const timeInfo = responseTime ? ` (${responseTime}ms)` : "";
    const level = action === "error" ? "error" : "debug";
    
    this[level](`${emojis[action]} External API ${action} ${service}${endpointInfo}${timeInfo}`, details);
  }

  // Helper method to format bytes
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Performance logging with automatic threshold detection
  performance(operation: string, duration: number, threshold?: number): void {
    const defaultThreshold = threshold || 1000;
    let level: LogLevel = "debug";
    let emoji = "📊";

    if (duration > defaultThreshold * 2) {
      level = "warn";
      emoji = "🐌";
    } else if (duration > defaultThreshold) {
      level = "info";
      emoji = "⚠️";
    } else if (duration < 100) {
      emoji = "⚡";
    }

    this[level](`${emoji} Performance: ${operation} took ${duration}ms`, {
      duration,
      threshold: defaultThreshold,
      performance: duration > defaultThreshold ? 'slow' : 'fast'
    });
  }

  // Create child logger with context
  child(context: Record<string, any>): ChildLogger {
    return new ChildLogger(this, context);
  }
}

/**
 * Child logger that includes context in all log messages
 */
class ChildLogger {
  constructor(private parent: Logger, private context: Record<string, any>) {}

  error(message: string, meta?: any): void {
    this.parent.error(message, { ...this.context, ...meta });
  }

  warn(message: string, meta?: any): void {
    this.parent.warn(message, { ...this.context, ...meta });
  }

  info(message: string, meta?: any): void {
    this.parent.info(message, { ...this.context, ...meta });
  }

  debug(message: string, meta?: any): void {
    this.parent.debug(message, { ...this.context, ...meta });
  }

  time(label: string, message?: string): void {
    this.parent.time(label, message);
  }

  timeEnd(label: string, message?: string): number {
    return this.parent.timeEnd(label, message);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenient logging functions with all new methods
export const log = {
  // Basic logging
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),

  // Performance timing
  time: (label: string, message?: string) => logger.time(label, message),
  timeEnd: (label: string, message?: string) => logger.timeEnd(label, message),

  // HTTP requests
  request: (method: string, path: string, statusCode?: number, responseTime?: number) => 
    logger.request(method, path, statusCode, responseTime),

  // Database operations
  query: (sql: string, params?: any[], executionTime?: number) =>
    logger.query(sql, params, executionTime),
  connection: (action: "connect" | "disconnect" | "reconnect" | "error", database: string, details?: any) =>
    logger.connection(action, database, details),

  // Authentication
  auth: (event: "login" | "logout" | "failed_login" | "register" | "refresh_token", userId?: number | string, ip?: string, details?: any) =>
    logger.auth(event, userId, ip, details),

  // Server lifecycle
  server: (event: "starting" | "started" | "stopping" | "stopped" | "error", port?: number, details?: any) =>
    logger.server(event, port, details),

  // Routes and middleware
  route: (action: "register" | "error", name: string, details?: any) =>
    logger.route(action, name, details),
  middleware: (action: "apply" | "error", name: string, details?: any) =>
    logger.middleware(action, name, details),

  // Cache operations
  cache: (action: "hit" | "miss" | "set" | "delete" | "clear" | "error", key?: string, details?: any) =>
    logger.cache(action, key, details),

  // File operations
  file: (action: "read" | "write" | "delete" | "upload" | "error", filename?: string, size?: number, details?: any) =>
    logger.file(action, filename, size, details),

  // Validation
  validation: (success: boolean, field?: string, details?: any) =>
    logger.validation(success, field, details),

  // Memory and performance
  memory: (action: "usage" | "gc" | "leak_warning", details?: any) =>
    logger.memory(action, details),
  performance: (operation: string, duration: number, threshold?: number) =>
    logger.performance(operation, duration, threshold),

  // External API calls
  external: (action: "request" | "response" | "error", service: string, endpoint?: string, responseTime?: number, details?: any) =>
    logger.external(action, service, endpoint, responseTime, details),

  // Child logger
  child: (context: Record<string, any>) => logger.child(context),
};
