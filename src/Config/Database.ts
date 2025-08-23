// Database configuration with environment variable support
export const MYSQL_CONNECTION_STRING: string =
  process.env.MYSQL_CONNECTION_STRING ||
  process.env.DATABASE_URL ||
  "mysql://root:password@localhost:3306/astra_db";

export const SQLITE_DATABASE: string =
  process.env.SQLITE_DATABASE || process.env.SQLITE_PATH || "./database.sqlite";

// Database configuration options
export const DATABASE_CONFIG = {
  mysql: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "astra_db",
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10"),
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || "60000"),
    timeout: parseInt(process.env.DB_TIMEOUT || "60000"),
  },
  sqlite: {
    filename: SQLITE_DATABASE,
    options: {
      verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
    },
  },
};

export type DatabaseType = "mysql" | "sqlite";

// Get the default database type from environment
export const DEFAULT_DATABASE: DatabaseType =
  (process.env.DATABASE_TYPE as DatabaseType) || "sqlite";
