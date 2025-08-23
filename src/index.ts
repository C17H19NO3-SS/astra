import chalk from "chalk";
import { InitWebServer } from "./Init/WebServer";
import type { Server } from "elysia/universal";

console.time(chalk.green(`Web server initialization time!`));
InitWebServer().listen(3000, (server: Server) => {
  console.log(
    chalk.green`----------------------------------------------------`
  );
  console.log(chalk.green(`Server started on ${server.url}`));
  console.log(
    chalk.green`----------------------------------------------------`
  );
});
console.timeEnd(chalk.green(`Web server initialization time!`));
console.log(
  chalk.green(`----------------------------------------------------`)
);
