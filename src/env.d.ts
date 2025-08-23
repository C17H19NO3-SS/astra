declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "production" | "development";

      // JWT Configuration
      JWT_SECRET: string;
      JWT_EXPIRES_IN?: string;

      // Database Configuration
      DATABASE_TYPE?: "mysql" | "sqlite";
      DATABASE_URL?: string;

      // MySQL Configuration
      MYSQL_CONNECTION_STRING?: string;
      DB_HOST?: string;
      DB_PORT?: string;
      DB_USER?: string;
      DB_PASSWORD?: string;
      DB_NAME?: string;
      DB_CONNECTION_LIMIT?: string;
      DB_ACQUIRE_TIMEOUT?: string;
      DB_TIMEOUT?: string;

      // SQLite Configuration
      SQLITE_DATABASE?: string;
      SQLITE_PATH?: string;

      // Server Configuration
      PORT?: string;
      HOST?: string;

      // CORS Configuration
      CORS_ORIGIN?: string;
      CORS_METHODS?: string;
      CORS_HEADERS?: string;

      // Logging
      LOG_LEVEL?: "error" | "warn" | "info" | "debug";

      // Security
      BCRYPT_ROUNDS?: string;
      SESSION_SECRET?: string;

      // API Configuration
      API_VERSION?: string;
      API_PREFIX?: string;

      // Rate Limiting
      RATE_LIMIT_WINDOW?: string;
      RATE_LIMIT_MAX_REQUESTS?: string;
    }
  }
}

export {};
