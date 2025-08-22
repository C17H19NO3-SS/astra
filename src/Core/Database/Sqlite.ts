import { SQL } from "bun";

export class SQLiteDriver {
  private database: string;
  private connection: SQL;

  constructor(database: string) {
    this.database = database;
    this.connection = new SQL(database);
  }

  getConnecetion(): SQL {
    if (!this.connection)
      return (this.connection = new SQL(this.database)) as SQL;
    else return this.connection;
  }

  query<T>(sql: TemplateStringsArray): SQL.Query<T> {
    return this.getConnecetion()<T>(sql);
  }
}
