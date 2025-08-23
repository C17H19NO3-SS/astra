# Astra Framework

A lightweight, TypeScript-based web framework built on top of Elysia.js, designed for rapid API development with built-in authentication, database abstraction, and middleware support.

## 🚀 Features

- **Built on Elysia**: Leverages the high-performance Elysia.js framework
- **TypeScript First**: Full TypeScript support with type safety
- **Database Abstraction**: Support for MySQL and SQLite databases
- **JWT Authentication**: Built-in JWT-based authentication system
- **Middleware System**: Flexible middleware architecture with priority-based execution
- **Auto Documentation**: Automatic Swagger/OpenAPI documentation in development
- **Controller-Based**: Clean controller-based architecture
- **Modular Design**: Organized into logical modules for better maintainability

## 📁 Project Structure

```
src/
├── Auth/                    # Authentication implementations
│   └── Auth.ts             # Example authentication class
├── Config/                 # Configuration files
│   ├── Database.ts         # Database connection settings
│   ├── Middleware.ts       # Middleware registration
│   └── Routes.ts           # Route registration
├── Controllers/            # Application controllers
│   └── HelloController.ts  # Example controller
├── Core/                   # Framework core components
│   ├── Auth/              # Base authentication classes
│   ├── Controller/        # Base controller class
│   └── Database/          # Database drivers and abstractions
├── Init/                   # Application initialization
│   └── WebServer.ts       # Web server setup
├── Middleware/            # Custom middleware implementations
├── Utils/                 # Utility classes
│   └── JwtUtils.ts        # JWT utilities
└── types/                 # TypeScript type definitions
```

## 🛠️ Installation & Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd astra
   ```

2. **Install dependencies**

   ```bash
   bun install
   # or
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

   ```env
   NODE_ENV=development
   JWT_SECRET=your-jwt-secret-key
   ```

4. **Database Configuration** (optional)
   Update `src/Config/Database.ts` with your database connection strings:

   ```typescript
   export const MYSQL_CONNECTION_STRING =
     "mysql://user:password@localhost/database";
   export const SQLITE_DATABASE = "path/to/database.db";
   ```

5. **Start the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📖 Usage

### Creating a Controller

Controllers extend the `BaseController` class and define routes:

```typescript
import { BaseController } from "../Core/Controller/BaseController";
import type { RouteSchema } from "../types";

export class UserController<T extends ""> extends BaseController<T> {
  constructor() {
    super("/users" as T, true); // prefix, authRequired

    // Register routes
    this.Route("get", "/", this.getUsers.handler, this.getUsers.schema);
    this.Route("post", "/", this.createUser.handler, this.createUser.schema);
  }

  getUsers: RouteSchema<T> = {
    handler: () => this.json({ users: [] }),
  };

  createUser: RouteSchema<T> = {
    handler: ({ body }) => this.json({ created: true, user: body }),
  };
}
```

### Registering Routes

Add your controllers to `src/Config/Routes.ts`:

```typescript
import { UserController } from "../Controllers/UserController";

export const Routes = [
  {
    name: "User Controller",
    Class: UserController,
    priority: 1,
  },
];
```

### Creating Middleware

Create middleware functions in `src/Middleware/`:

```typescript
import { type Handler } from "elysia";

export const authMiddleware: Handler = (ctx) => {
  const token = ctx.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify token logic here
};
```

Register middleware in `src/Config/Middleware.ts`:

```typescript
export const Middlewares = [
  {
    Class: UserController,
    middleware: authMiddleware,
    priority: 1,
  },
];
```

### Database Usage

The framework supports both MySQL and SQLite:

```typescript
import Database from "../Core/Database/Database";

// Get database driver
const db = Database.getDriver("mysql"); // or "sqlite"

// Execute queries
const result = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
```

### Authentication

Implement custom authentication by extending `BaseAuth`:

```typescript
import { BaseAuth } from "../Core/Auth/BaseAuth";
import { JwtUtils } from "../Utils/JwtUtils";

export class CustomAuth extends BaseAuth<User> {
  authenticate(token?: string): User | false {
    if (!token) return false;

    const decoded = JwtUtils.decrypt<User>(token);
    return decoded || false;
  }

  isAuthenticated(token?: string): boolean {
    return this.authenticate(token) !== false;
  }
}
```

## 🔧 API Documentation

When running in development mode, Swagger documentation is automatically available at:

- `http://localhost:3000/swagger`

The documentation includes:

- All registered routes
- Request/response schemas
- JWT authentication setup

## 🧪 Development

### Project Structure Guidelines

- **Controllers**: Handle HTTP requests and responses
- **Core**: Framework internals (don't modify unless extending framework)
- **Config**: Application configuration and registration
- **Auth**: Authentication implementations
- **Middleware**: Custom middleware functions
- **Utils**: Shared utility functions
- **Types**: TypeScript type definitions

### Best Practices

1. **Controller Organization**: Keep controllers focused on a single resource
2. **Middleware Priority**: Use priority values to control execution order
3. **Type Safety**: Leverage TypeScript for better development experience
4. **Error Handling**: Implement proper error handling in controllers
5. **Security**: Always validate and sanitize user inputs

## 📚 Core Components

### BaseController

The foundation for all controllers, providing:

- Route registration with HTTP method support
- Built-in JSON response helpers
- Authentication integration
- Middleware support

### Database Abstraction

Unified interface for different database types:

- **MysqlDriver**: MySQL/MariaDB support using mysql2
- **SQLiteDriver**: SQLite support using Bun's SQL

### Authentication System

Flexible authentication with:

- JWT token support
- Customizable auth strategies
- Per-controller authentication requirements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The MIT License allows for both open source and commercial use, modification, and distribution.

## 🆘 Support

For questions and support:

- Create an issue in the GitHub repository
- Check the documentation
- Review existing controllers and examples

---

**Happy coding with Astra Framework! 🌟**
