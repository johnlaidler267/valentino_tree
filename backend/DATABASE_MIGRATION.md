# Database Migration Guide: SQLite to PostgreSQL

This application now supports both SQLite (for development) and PostgreSQL (for production). The database layer automatically detects and uses the appropriate database based on your environment configuration.

## Quick Start

### Using SQLite (Default - Development)

No configuration needed! The application will use SQLite by default if no PostgreSQL configuration is provided.

### Using PostgreSQL (Production)

Set one of these environment variable combinations:

**Option 1: DATABASE_URL (Recommended)**
```bash
DATABASE_URL=postgresql://user:password@host:port/database
DB_TYPE=postgresql
DATABASE_SSL=true  # For managed services like Railway, Render, etc.
```

**Option 2: Individual Parameters**
```bash
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=valentino_tree
DB_USER=postgres
DB_PASSWORD=your-password
DATABASE_SSL=false
```

## Automatic Features

The database layer automatically:

1. **Detects database type** from environment variables
2. **Creates all tables** on first connection
3. **Converts SQL syntax** (SQLite → PostgreSQL):
   - `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
   - `DATETIME` → `TIMESTAMP`
   - `INTEGER` (for booleans) → `BOOLEAN`
   - `?` placeholders → `$1, $2, ...` (PostgreSQL)
4. **Handles API differences**:
   - `this.lastID` → `RETURNING id`
   - `this.changes` → `rowCount`
   - Boolean conversion (PostgreSQL booleans → SQLite integers)

## Setting Up PostgreSQL

### Option 1: Managed Service (Easiest)

**Railway:**
1. Create a new PostgreSQL service in Railway
2. Copy the `DATABASE_URL` from the service settings
3. Set it as an environment variable

**Render:**
1. Create a new PostgreSQL database in Render
2. Copy the `Internal Database URL` or `External Database URL`
3. Set it as `DATABASE_URL` environment variable

**Supabase:**
1. Create a new project
2. Go to Settings → Database
3. Copy the connection string
4. Set as `DATABASE_URL`

### Option 2: Self-Hosted PostgreSQL

**Install PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

**Create Database:**
```bash
sudo -u postgres psql
CREATE DATABASE valentino_tree;
CREATE USER valentino_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE valentino_tree TO valentino_user;
\q
```

**Configure Connection:**
```bash
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=valentino_tree
DB_USER=valentino_user
DB_PASSWORD=your-password
DATABASE_SSL=false
```

## Migration from Existing SQLite Database

If you have an existing SQLite database and want to migrate to PostgreSQL:

1. **Export data from SQLite:**
   ```bash
   sqlite3 appointments.db .dump > dump.sql
   ```

2. **Convert SQL syntax** (manual or using a tool):
   - Replace `INTEGER PRIMARY KEY AUTOINCREMENT` with `SERIAL PRIMARY KEY`
   - Replace `DATETIME` with `TIMESTAMP`
   - Replace `INTEGER` (for booleans) with `BOOLEAN`
   - Adjust any SQLite-specific syntax

3. **Import to PostgreSQL:**
   ```bash
   psql -d valentino_tree -f converted_dump.sql
   ```

**Note:** The application will automatically create tables on first run, so you may want to drop existing tables if you're doing a fresh migration.

## Testing the Connection

After setting up PostgreSQL, start your server:

```bash
cd backend
npm install
npm start
```

You should see:
- `Connected to PostgreSQL database` (instead of SQLite)
- `All PostgreSQL tables created or already exist`

## Troubleshooting

### Connection Errors

**Error: "password authentication failed"**
- Check your `DB_PASSWORD` or `DATABASE_URL` credentials
- Ensure the user has proper permissions

**Error: "database does not exist"**
- Create the database first: `CREATE DATABASE valentino_tree;`

**Error: "connection refused"**
- Check if PostgreSQL is running: `sudo systemctl status postgresql`
- Verify `DB_HOST` and `DB_PORT` are correct
- Check firewall settings

### SSL Connection Issues

For managed services, you may need:
```bash
DATABASE_SSL=true
```

For self-hosted, usually:
```bash
DATABASE_SSL=false
```

### Table Creation Errors

If you see table creation errors:
- Check PostgreSQL logs
- Ensure the database user has CREATE TABLE permissions
- Try dropping existing tables and letting the app recreate them

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_TYPE` | Database type: `sqlite` or `postgresql` | `sqlite` | No |
| `DATABASE_URL` | Full PostgreSQL connection string | - | Yes (if using PostgreSQL) |
| `DB_HOST` | PostgreSQL host | `localhost` | No (if using DATABASE_URL) |
| `DB_PORT` | PostgreSQL port | `5432` | No (if using DATABASE_URL) |
| `DB_NAME` | Database name | `valentino_tree` | No (if using DATABASE_URL) |
| `DB_USER` | Database user | `postgres` | No (if using DATABASE_URL) |
| `DB_PASSWORD` | Database password | - | No (if using DATABASE_URL) |
| `DATABASE_SSL` | Enable SSL connection | `false` | No |
| `DB_PATH` | SQLite database file path | `./appointments.db` | No (SQLite only) |

## Best Practices

1. **Development**: Use SQLite for local development (no setup needed)
2. **Production**: Use PostgreSQL for better performance and reliability
3. **Environment Variables**: Never commit `.env` files to version control
4. **Connection Pooling**: PostgreSQL connection pooling is handled automatically by the `pg` library
5. **Backups**: Set up regular backups for production PostgreSQL databases

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test database connection separately using `psql` or a database client
4. Ensure PostgreSQL version is 12+ (recommended)

