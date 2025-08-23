import {
  createPool,
  type Pool,
  type QueryResult,
  type PoolConnection,
} from "mysql2/promise";

export class MysqlDriver {
  private connectionString: string;
  private connection: Pool | null = null;
  private config: any;
  private isInitialized: boolean = false;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
    this.parseConnectionString(connectionString);
    this.initialize();
  }

  private parseConnectionString(connectionString: string): void {
    try {
      const url = new URL(connectionString);
      this.config = {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
        connectionLimit: 10,
        multipleStatements: false,
        timezone: "+00:00",
        charset: "utf8mb4",
        ssl: false,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
      };
    } catch (error) {
      // Fallback to default config if URL parsing fails
      this.config = {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "",
        database: "astra_db",
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
      };
    }
  }

  private initialize(): void {
    try {
      if (!this.connection) {
        this.connection = createPool(this.config);
        this.isInitialized = true;

        // Handle pool events using type assertion to avoid overload issues
        const poolAny = this.connection as any;

        // Handle new connections
        poolAny.on("connection", (connection: any) => {
          console.log("New MySQL connection established");

          // Handle individual connection errors
          connection.on("error", (err: any) => {
            console.error("MySQL Connection Error:", err);
            if (
              err.code === "PROTOCOL_CONNECTION_LOST" ||
              err.code === "ECONNRESET"
            ) {
              this.reconnect();
            }
          });
        });

        // Handle pool-level errors
        poolAny.on("error", (err: any) => {
          console.error("MySQL Pool Error:", err);
          if (
            err.code === "PROTOCOL_CONNECTION_LOST" ||
            err.code === "ECONNRESET"
          ) {
            this.reconnect();
          }
        });
      }
    } catch (error) {
      console.error("Failed to initialize MySQL pool:", error);
      this.isInitialized = false;
    }
  }

  private reconnect(): void {
    console.log("Reconnecting to MySQL...");
    if (this.connection) {
      this.connection.end().catch(console.error);
    }
    this.connection = null;
    this.isInitialized = false;
    this.initialize();
  }

  getConnection(): Pool {
    if (!this.connection || !this.isInitialized) {
      this.initialize();
    }

    if (!this.connection) {
      throw new Error("MySQL connection pool is not available");
    }

    return this.connection;
  }

  // Execute SELECT queries
  async query<T extends QueryResult>(
    sql: string,
    parameters: any[] = []
  ): Promise<[T, any]> {
    try {
      const pool = this.getConnection();
      return await pool.query<T>(sql, parameters);
    } catch (error) {
      console.error("MySQL query failed:", error);
      throw error;
    }
  }

  // Execute INSERT, UPDATE, DELETE queries
  async execute<T extends QueryResult>(
    sql: string,
    parameters: any[] = []
  ): Promise<[T, any]> {
    try {
      const pool = this.getConnection();
      return await pool.execute<T>(sql, parameters);
    } catch (error) {
      console.error("MySQL execute failed:", error);
      throw error;
    }
  }

  // Get a single row
  async queryOne<T extends QueryResult>(
    sql: string,
    parameters: any[] = []
  ): Promise<any | null> {
    const [results] = await this.query<T>(sql, parameters);
    const rows = results as any[];
    return rows.length > 0 ? rows[0] : null;
  }

  // Get connection from pool for transactions
  async getPoolConnection(): Promise<PoolConnection> {
    const pool = this.getConnection();
    return await pool.getConnection();
  }

  // Execute within transaction
  async transaction<T>(
    callback: (connection: PoolConnection) => Promise<T>
  ): Promise<T> {
    const connection = await this.getPoolConnection();

    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Check connection health
  async ping(): Promise<boolean> {
    try {
      const pool = this.getConnection();
      await pool.execute("SELECT 1");
      return true;
    } catch (error) {
      console.error("MySQL ping failed:", error);
      return false;
    }
  }

  // Close all connections
  async close(): Promise<void> {
    try {
      if (this.connection) {
        await this.connection.end();
        this.connection = null;
        this.isInitialized = false;
      }
    } catch (error) {
      console.error("Error closing MySQL connections:", error);
    }
  }

  // Get connection stats - with safe property access
  getStats() {
    try {
      const pool = this.getConnection();

      // Safe access to pool internal properties
      const poolAny = pool as any;

      return {
        acquiringConnections: poolAny._acquiringConnections?.length || 0,
        allConnections: poolAny._allConnections?.length || 0,
        freeConnections: poolAny._freeConnections?.length || 0,
        connectionLimit: this.config.connectionLimit || 10,
        isInitialized: this.isInitialized,
        activeDatabase: "mysql",
        config: {
          host: this.config.host,
          port: this.config.port,
          database: this.config.database,
          connectionLimit: this.config.connectionLimit,
        },
      };
    } catch (error) {
      console.error("Error getting MySQL stats:", error);
      return {
        acquiringConnections: 0,
        allConnections: 0,
        freeConnections: 0,
        connectionLimit: this.config.connectionLimit || 10,
        isInitialized: this.isInitialized,
        activeDatabase: "mysql",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Check if table exists
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const [rows] = await this.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
        [tableName]
      );
      const result = rows as any[];
      return result[0].count > 0;
    } catch (error) {
      console.error("Error checking table existence:", error);
      return false;
    }
  }

  // Get table schema
  async getTableSchema(tableName: string): Promise<any[]> {
    try {
      const [rows] = await this.query("DESCRIBE ??", [tableName]);
      return rows as any[];
    } catch (error) {
      console.error("Error getting table schema:", error);
      return [];
    }
  }
}
