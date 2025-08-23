import {
  MYSQL_CONNECTION_STRING,
  SQLITE_DATABASE,
} from "../../../Config/Database";
import { MysqlDriver } from "./Mysql";
import { SQLiteDriver } from "./Sqlite";

type DatabaseOptions = "sqlite" | "mysql";

export default {
  getDriver(driver: DatabaseOptions) {
    switch (driver) {
      case "mysql":
        return new MysqlDriver(MYSQL_CONNECTION_STRING as string);
      case "sqlite":
        return new SQLiteDriver(SQLITE_DATABASE);
    }
  },
};
