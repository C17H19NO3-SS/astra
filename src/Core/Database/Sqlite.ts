import { Database } from "bun:sqlite";
import type { QueryResult } from "mysql2/promise";

// Custom QueryResult for SQLite to match MySQL interface
interface SQLiteQueryResult {
  insertId?: number;
  affectedRows?: number;
  changedRows?: number;
}

export class SQLiteDriver {
  private database: string;
  private connection: Database;

  constructor(database: string) {
    this.database = database;
    this.connection = new Database(database, { create: true });
    this.initializeConnection();
  }

  private initializeConnection(): void {
    // Enable WAL mode for better performance
    this.connection.exec("PRAGMA journal_mode = WAL;");
    // Enable foreign key constraints
    this.connection.exec("PRAGMA foreign_keys = ON;");
    // Set timeout for busy database
    this.connection.exec("PRAGMA busy_timeout = 10000;");
  }

  getConnection(): Database {
    if (!this.connection) {
      this.connection = new Database(this.database, { create: true });
      this.initializeConnection();
    }
    return this.connection;
  }

  // Execute SELECT queries
  query<T = any>(
    sql: string,
    parameters: any[] = []
  ): Promise<[T[], SQLiteQueryResult]> {
    return new Promise((resolve, reject) => {
      try {
        const conn = this.getConnection();
        const stmt = conn.prepare(sql);
        const result = stmt.all(...parameters) as T[];

        const queryResult: SQLiteQueryResult = {
          insertId: 0,
          affectedRows: result.length,
          changedRows: 0,
        };

        resolve([result, queryResult]);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Execute INSERT, UPDATE, DELETE queries
  execute<T = any>(
    sql: string,
    parameters: any[] = []
  ): Promise<[T[], SQLiteQueryResult]> {
    return new Promise((resolve, reject) => {
      try {
        const conn = this.getConnection();
        const stmt = conn.prepare(sql);
        const result = stmt.run(...parameters);

        const queryResult: SQLiteQueryResult = {
          insertId: Number(result.lastInsertRowid) || 0,
          affectedRows: result.changes,
          changedRows: result.changes,
        };

        resolve([[] as T[], queryResult]);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get a single row
  async queryOne<T = any>(
    sql: string,
    parameters: any[] = []
  ): Promise<T | null> {
    const [results] = await this.query<T>(sql, parameters);
    return results.length > 0 ? (results[0] as T) : null;
  }

  // Begin transaction
  beginTransaction(): void {
    this.connection.exec("BEGIN TRANSACTION;");
  }

  // Commit transaction
  commit(): void {
    this.connection.exec("COMMIT;");
  }

  // Rollback transaction
  rollback(): void {
    this.connection.exec("ROLLBACK;");
  }

  // Execute within transaction
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    this.beginTransaction();
    try {
      const result = await callback();
      this.commit();
      return result;
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  // Close connection
  close(): void {
    if (this.connection) {
      this.connection.close();
    }
  }

  // Check if table exists
  async tableExists(tableName: string): Promise<boolean> {
    const [result] = await this.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return result.length > 0;
  }

  // Get table schema
  async getTableSchema(tableName: string): Promise<any[]> {
    const [result] = await this.query(`PRAGMA table_info(${tableName})`);
    return result;
  }
}
