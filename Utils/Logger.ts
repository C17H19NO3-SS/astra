import chalk from "chalk";
import type { LogLevel, LoggerOptions } from "../types";

/**
 * Enhanced logging utility with different log levels and formatting
 */
export class Logger {
  private static options: LoggerOptions = {
    level: (process.env.LOG_LEVEL as LogLevel) || "info",
    timestamp: true,
    colorize: true,
  };

  private static levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  private static shouldLog(level: LogLevel): boolean {
    return this.levels[level] <= this.levels[this.options.level];
  }

  private static formatMessage(
    level: LogLevel,
    message: string,
    meta?: any
  ): string {
    let formattedMessage = "";

    // Add timestamp
    if (this.options.timestamp) {
      const timestamp = new Date().toISOString();
      formattedMessage += this.options.colorize
        ? chalk.gray(`[${timestamp}]`)
        : `[${timestamp}]`;
    }

    // Add level
    const levelStr = level.toUpperCase().padEnd(5);
    if (this.options.colorize) {
      switch (level) {
        case "error":
          formattedMessage += ` ${chalk.red(levelStr)}`;
          break;
        case "warn":
          formattedMessage += ` ${chalk.yellow(levelStr)}`;
          break;
        case "info":
          formattedMessage += ` ${chalk.blue(levelStr)}`;
          break;
        case "debug":
          formattedMessage += ` ${chalk.magenta(levelStr)}`;
          break;
      }
    } else {
      formattedMessage += ` ${levelStr}`;
    }

    // Add message
    formattedMessage += ` ${message}`;

    // Add metadata
    if (meta) {
      formattedMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return formattedMessage;
  }

  static error(message: string, meta?: any): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, meta));
    }
  }

  static warn(message: string, meta?: any): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, meta));
    }
  }

  static info(message: string, meta?: any): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message, meta));
    }
  }

  static debug(message: string, meta?: any): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }

  // HTTP request logging
  static request(
    method: string,
    url: string,
    statusCode?: number,
    responseTime?: number
  ): void {
    const message = `${method} ${url}`;
    const meta = {
      statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
    };

    if (statusCode && statusCode >= 400) {
      this.warn(message, meta);
    } else {
      this.info(message, meta);
    }
  }

  // Database query logging
  static query(sql: string, parameters?: any[], executionTime?: number): void {
    if (this.shouldLog("debug")) {
      const message = `Database query executed`;
      const meta = {
        sql: sql.replace(/\s+/g, " ").trim(),
        parameters,
        executionTime: executionTime ? `${executionTime}ms` : undefined,
      };
      this.debug(message, meta);
    }
  }

  // Authentication logging
  static auth(
    action: string,
    userId?: number,
    email?: string,
    success: boolean = true
  ): void {
    const message = `Authentication ${action}`;
    const meta = {
      userId,
      email,
      success,
      ip: "unknown", // Can be enhanced to get real IP
    };

    if (success) {
      this.info(message, meta);
    } else {
      this.warn(message, meta);
    }
  }

  // Performance logging
  static performance(operation: string, duration: number, meta?: any): void {
    const message = `Performance: ${operation}`;
    const logMeta = {
      duration: `${duration}ms`,
      ...meta,
    };

    if (duration > 1000) {
      this.warn(message, logMeta);
    } else {
      this.debug(message, logMeta);
    }
  }

  // Configuration
  static configure(options: Partial<LoggerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  // Get current configuration
  static getConfig(): LoggerOptions {
    return { ...this.options };
  }
}
