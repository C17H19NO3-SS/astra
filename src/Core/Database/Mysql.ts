import {
  createPool,
  type Pool,
  type QueryResult,
  type PoolConnection,
} from "mysql2/promise";

export class MysqlDriver {
  private connectionString: string;
  private connection: Pool;
  private config: any;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
    this.parseConnectionString(connectionString);
    this.connection = createPool(this.config);
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
        acquireTimeout: 60000,
        timeout: 60000,
        multipleStatements: false,
        timezone: "+00:00",
        charset: "utf8mb4",
        ssl: false,
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
      };
    }
  }

  getConnection(): Pool {
    if (!this.connection) {
      this.connection = createPool(this.config);
    }
    return this.connection;
  }

  // Execute SELECT queries
  async query<T extends QueryResult>(
    sql: string,
    parameters: any[] = []
  ): Promise<[T, any]> {
    const pool = this.getConnection();
    return await pool.query<T>(sql, parameters);
  }

  // Execute INSERT, UPDATE, DELETE queries
  async execute<T extends QueryResult>(
    sql: string,
    parameters: any[] = []
  ): Promise<[T, any]> {
    const pool = this.getConnection();
    return await pool.execute<T>(sql, parameters);
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
    return await this.getConnection().getConnection();
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
    } catch {
      return false;
    }
  }

  // Close all connections
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
    }
  }

  // Get connection stats
  getStats() {
    const pool = this.getConnection();
    return {
      acquiringConnections: (pool as any)._acquiringConnections.length,
      allConnections: (pool as any)._allConnections.length,
      freeConnections: (pool as any)._freeConnections.length,
      connectionLimit: this.config.connectionLimit,
    };
  }

  // Check if table exists
  async tableExists(tableName: string): Promise<boolean> {
    const [rows] = await this.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
      [tableName]
    );
    const result = rows as any[];
    return result[0].count > 0;
  }

  // Get table schema
  async getTableSchema(tableName: string): Promise<any[]> {
    const [rows] = await this.query("DESCRIBE ??", [tableName]);
    return rows as any[];
  }
}
