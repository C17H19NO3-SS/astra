import type { LogLevel, LoggerOptions } from "../src/types";

/**
 * Enhanced Logger utility for Astra Framework
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
    const levelStr = level.toUpperCase();
    if (this.options.colorize) {
      formatted += this.colorize(levelStr, level);
    } else {
      formatted += `[${levelStr}]`;
    }

    formatted += ` ${message}`;

    // Add metadata
    if (meta) {
      formatted += ` ${JSON.stringify(meta, null, 2)}`;
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

  // HTTP request logging
  request(
    method: string,
    path: string,
    statusCode?: number,
    responseTime?: number
  ): void {
    const status = statusCode ? `${statusCode}` : "pending";
    const time = responseTime ? ` - ${responseTime}ms` : "";
    const level = statusCode && statusCode >= 400 ? "warn" : "info";

    this[level](`${method} ${path} ${status}${time}`);
  }

  // Database query logging
  query(sql: string, params?: any[], executionTime?: number): void {
    if (this.shouldLog("debug")) {
      const time = executionTime ? ` (${executionTime}ms)` : "";
      this.debug(`SQL Query${time}:`, { sql, params });
    }
  }

  // Authentication logging
  auth(
    event: "login" | "logout" | "failed_login",
    userId?: number | string,
    ip?: string
  ): void {
    const message = `Auth ${event}${userId ? ` for user ${userId}` : ""}${
      ip ? ` from ${ip}` : ""
    }`;
    const level = event === "failed_login" ? "warn" : "info";
    this[level](message);
  }

  // Performance logging
  performance(operation: string, duration: number, threshold?: number): void {
    const level = threshold && duration > threshold ? "warn" : "debug";
    this[level](`Performance: ${operation} took ${duration}ms`);
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
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenient logging functions
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  request: (
    method: string,
    path: string,
    statusCode?: number,
    responseTime?: number
  ) => logger.request(method, path, statusCode, responseTime),
  query: (sql: string, params?: any[], executionTime?: number) =>
    logger.query(sql, params, executionTime),
  auth: (
    event: "login" | "logout" | "failed_login",
    userId?: number | string,
    ip?: string
  ) => logger.auth(event, userId, ip),
  performance: (operation: string, duration: number, threshold?: number) =>
    logger.performance(operation, duration, threshold),
};
