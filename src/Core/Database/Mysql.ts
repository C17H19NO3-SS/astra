import { createPool, type Pool, type QueryResult } from "mysql2/promise";

export class MysqlDriver {
  private connectionString: string;
  private connection: Pool;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
    this.connection = createPool(connectionString);
  }

  getConnecetion() {
    if (!this.connection)
      return (this.connection = createPool(this.connectionString));
  }

  query<T extends QueryResult>(sql: string, ...parameters: any[]) {
    return this.getConnecetion()?.query<T>(sql, parameters);
  }

  execute<T extends QueryResult>(sql: string, ...parameters: any[]) {
    return this.getConnecetion()?.execute<T>(sql, parameters);
  }
}
