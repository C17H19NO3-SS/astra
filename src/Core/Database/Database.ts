import {
  DATABASE_CONFIG,
  DEFAULT_DATABASE,
  type DatabaseType,
} from "../../../Config/Database";
import { log } from "../../../Utils/Logger";
import { MysqlDriver } from "./Mysql";
import { SQLiteDriver } from "./Sqlite";

/**
 * Enhanced Database class with connection pooling, health checks, and error handling
 */
export class Database {
  private static instance: Database;
  private drivers: Map<DatabaseType, MysqlDriver | SQLiteDriver> = new Map();
  private defaultDriver: DatabaseType;

  private constructor() {
    this.defaultDriver = DEFAULT_DATABASE;
    this.initializeDrivers();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Initialize database drivers based on environment configuration
   */
  private initializeDrivers(): void {
    try {
      const activeDatabase =
        (process.env.DATABASE_TYPE as DatabaseType) || DEFAULT_DATABASE;

      // Only initialize the active database driver
      if (activeDatabase === "mysql") {
        // Initialize MySQL driver if configured and active
        if (DATABASE_CONFIG.mysql.host && DATABASE_CONFIG.mysql.user) {
          const connectionString = this.buildMySQLConnectionString();
          const mysqlDriver = new MysqlDriver(connectionString);
          this.drivers.set("mysql", mysqlDriver);
          this.defaultDriver = "mysql";
          log.info("MySQL driver initialized as active database");
        } else {
          log.error(
            "MySQL is selected but configuration is incomplete, falling back to SQLite"
          );
          this.initializeSQLite();
        }
      } else {
        // Default to SQLite
        this.initializeSQLite();
      }

      // Verify default driver exists
      if (!this.drivers.has(this.defaultDriver)) {
        log.error(
          `Selected database driver '${this.defaultDriver}' failed to initialize`
        );
        throw new Error(
          `Database driver '${this.defaultDriver}' is not available`
        );
      }

      log.info(`Database initialized: ${this.defaultDriver}`);
    } catch (error) {
      log.error("Failed to initialize database drivers", error);
      throw error;
    }
  }

  /**
   * Initialize SQLite driver
   */
  private initializeSQLite(): void {
    const sqliteDriver = new SQLiteDriver(DATABASE_CONFIG.sqlite.filename);
    this.drivers.set("sqlite", sqliteDriver);
    this.defaultDriver = "sqlite";
    log.info("SQLite driver initialized as active database");
  }

  /**
   * Build MySQL connection string from config
   */
  private buildMySQLConnectionString(): string {
    const config = DATABASE_CONFIG.mysql;
    return `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }

  /**
   * Get database driver by type
   */
  getDriver(
    driver: DatabaseType = this.defaultDriver
  ): MysqlDriver | SQLiteDriver {
    const dbDriver = this.drivers.get(driver);

    if (!dbDriver) {
      throw new Error(
        `Database driver '${driver}' is not available or not initialized`
      );
    }

    return dbDriver;
  }

  /**
   * Get the default database driver
   */
  getDefaultDriver(): MysqlDriver | SQLiteDriver {
    return this.getDriver(this.defaultDriver);
  }

  /**
   * Get active database type
   */
  getActiveDatabaseType(): DatabaseType {
    return this.defaultDriver;
  }

  /**
   * Execute query on default database
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<[T[], any]> {
    const startTime = Date.now();

    try {
      const driver = this.getDefaultDriver();
      // Remove type arguments from untyped function call
      const result = await (driver as any).query(sql, params);

      const executionTime = Date.now() - startTime;
      log.query(sql, params, executionTime);

      return result;
    } catch (error) {
      log.error("Database query failed", { sql, params, error });
      throw error;
    }
  }

  /**
   * Execute statement on default database
   */
  async execute<T = any>(sql: string, params: any[] = []): Promise<[T[], any]> {
    const startTime = Date.now();

    try {
      const driver = this.getDefaultDriver();
      // Remove type arguments from untyped function call
      const result = await (driver as any).execute(sql, params);

      const executionTime = Date.now() - startTime;
      log.query(sql, params, executionTime);

      return result;
    } catch (error) {
      log.error("Database execute failed", { sql, params, error });
      throw error;
    }
  }

  /**
   * Get single row from default database
   */
  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const [results] = await this.query<T>(sql, params);
    // Fix undefined to null conversion
    const firstResult =
      Array.isArray(results) && results.length > 0 ? results[0] : undefined;
    return firstResult !== undefined ? firstResult : null;
  }

  /**
   * Execute transaction on default database
   */
  async transaction<T>(
    callback: (driver: MysqlDriver | SQLiteDriver) => Promise<T>
  ): Promise<T> {
    const driver = this.getDefaultDriver();

    if ("transaction" in driver && typeof driver.transaction === "function") {
      return await driver.transaction(callback as any);
    } else {
      // Fallback for drivers without transaction support
      return await callback(driver);
    }
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<{ [key in DatabaseType]?: boolean }> {
    const health: { [key in DatabaseType]?: boolean } = {};

    // Only check the active database
    const activeType = this.getActiveDatabaseType();
    const driver = this.getDefaultDriver();

    try {
      if (activeType === "mysql" && "ping" in driver) {
        health[activeType] = await (driver as MysqlDriver).ping();
      } else {
        // For SQLite, try a simple query
        await (driver as any).query("SELECT 1", []);
        health[activeType] = true;
      }
    } catch {
      health[activeType] = false;
    }

    return health;
  }

  /**
   * Get connection statistics
   */
  getStats(): { [key in DatabaseType]?: any } {
    const stats: { [key in DatabaseType]?: any } = {};

    // Only get stats for the active database
    const activeType = this.getActiveDatabaseType();
    const driver = this.getDefaultDriver();

    if (activeType === "mysql" && "getStats" in driver) {
      stats[activeType] = (driver as MysqlDriver).getStats();
    } else {
      stats[activeType] = {
        type: activeType,
        available: true,
        active: true,
      };
    }

    return stats;
  }

  /**
   * Close all database connections
   */
  async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const [type, driver] of this.drivers) {
      if ("close" in driver && typeof driver.close === "function") {
        // Ensure close() always returns a Promise
        const closeResult = driver.close();
        if (closeResult instanceof Promise) {
          closePromises.push(closeResult);
        } else {
          closePromises.push(Promise.resolve());
        }
      }
    }

    await Promise.all(closePromises);
    this.drivers.clear();
    log.info("All database connections closed");
  }

  /**
   * Check if table exists
   */
  async tableExists(
    tableName: string,
    driver?: DatabaseType
  ): Promise<boolean> {
    const db = driver ? this.getDriver(driver) : this.getDefaultDriver();

    if ("tableExists" in db && typeof db.tableExists === "function") {
      return await db.tableExists(tableName);
    }

    return false;
  }

  /**
   * Get table schema
   */
  async getTableSchema(
    tableName: string,
    driver?: DatabaseType
  ): Promise<any[]> {
    const db = driver ? this.getDriver(driver) : this.getDefaultDriver();

    if ("getTableSchema" in db && typeof db.getTableSchema === "function") {
      return await db.getTableSchema(tableName);
    }

    return [];
  }

  /**
   * Run database migrations (placeholder)
   */
  async runMigrations(): Promise<void> {
    log.info("Running database migrations...");

    try {
      // Check if migrations table exists
      const migrationsExist = await this.tableExists("migrations");

      if (!migrationsExist) {
        // Create migrations table
        const createMigrationsTable = `
          CREATE TABLE migrations (
            id INTEGER PRIMARY KEY ${
              this.defaultDriver === "mysql"
                ? "AUTO_INCREMENT"
                : "AUTOINCREMENT"
            },
            name VARCHAR(255) NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;

        await this.execute(createMigrationsTable);
        log.info("Migrations table created");
      }

      log.info("Database migrations completed");
    } catch (error) {
      log.error("Failed to run migrations", error);
      throw error;
    }
  }
}

// Export singleton instance and factory function
export const db = Database.getInstance();

export default {
  getInstance: () => Database.getInstance(),
  getDriver: (driver: DatabaseType) => Database.getInstance().getDriver(driver),
};
