# Database Configuration Guide

Astra Framework supports both MySQL and SQLite databases. The active database is determined by the `DATABASE_TYPE` environment variable.

## Environment Configuration

Copy `.env.example` to `.env` and configure your database:

```bash
cp .env.example .env
```

## Database Selection

Set the `DATABASE_TYPE` in your `.env` file:

```env
# Use SQLite (default)
DATABASE_TYPE=sqlite

# Use MySQL  
DATABASE_TYPE=mysql
```

## SQLite Configuration (Default)

SQLite is the default database and requires minimal configuration:

```env
DATABASE_TYPE=sqlite
SQLITE_DATABASE=./database.sqlite
```

**Features:**
- File-based database
- Zero configuration
- WAL mode enabled for performance
- Foreign key constraints enabled
- Automatic database creation

## MySQL Configuration

To use MySQL, configure the connection parameters:

```env
DATABASE_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=astra_db
DB_CONNECTION_LIMIT=10
DB_ACQUIRE_TIMEOUT=60000
DB_TIMEOUT=60000
```

**Alternative connection string format:**
```env
DATABASE_TYPE=mysql
MYSQL_CONNECTION_STRING=mysql://user:password@host:port/database
```

**Features:**
- Connection pooling
- Automatic reconnection
- Transaction support
- Health monitoring
- Connection statistics

## Database Behavior

- **Single Database**: Only the selected database type is initialized
- **Automatic Fallback**: If MySQL is selected but configuration is incomplete, falls back to SQLite
- **Health Checks**: Only the active database is monitored
- **Statistics**: Only active database stats are collected
- **Connection Management**: Only active database connections are managed

## Database Operations

All database operations automatically use the selected database:

```typescript
import { db } from './src/Core/Database/Database';

// These operations use the active database (MySQL or SQLite)
const users = await db.query('SELECT * FROM users');
const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [1]);
await db.execute('INSERT INTO users (name) VALUES (?)', ['John']);

// Transaction example
await db.transaction(async (connection) => {
  await connection.execute('INSERT INTO users (name) VALUES (?)', ['Jane']);
  await connection.execute('UPDATE users SET active = 1 WHERE name = ?', ['Jane']);
});
```

## Migration Support

The framework includes basic migration support:

```typescript
await db.runMigrations();
```

This creates a `migrations` table compatible with both MySQL and SQLite.

## Health Monitoring

Check database health:

```typescript
const health = await db.healthCheck();
console.log(health); // { sqlite: true } or { mysql: true }
```

Get database statistics:

```typescript
const stats = db.getStats();
console.log(stats);
```

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_TYPE` | Database type: "mysql" or "sqlite" | "sqlite" |
| `DB_HOST` | MySQL host | "localhost" |
| `DB_PORT` | MySQL port | "3306" |
| `DB_USER` | MySQL username | "root" |
| `DB_PASSWORD` | MySQL password | "password" |
| `DB_NAME` | MySQL database name | "astra_db" |
| `DB_CONNECTION_LIMIT` | MySQL connection pool limit | "10" |
| `SQLITE_DATABASE` | SQLite file path | "./database.sqlite" |

## Troubleshooting

### MySQL Connection Issues

1. Check MySQL service is running
2. Verify connection parameters in `.env`
3. Ensure database exists
4. Check user permissions

### SQLite Issues

1. Check file permissions
2. Ensure directory exists for database file
3. Verify disk space

### Switching Databases

To switch from SQLite to MySQL:

1. Update `DATABASE_TYPE=mysql` in `.env`
2. Configure MySQL connection parameters
3. Restart the application

To switch from MySQL to SQLite:

1. Update `DATABASE_TYPE=sqlite` in `.env`  
2. Configure SQLite path (optional)
3. Restart the application

The application will automatically use the selected database type on next startup.
