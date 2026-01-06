const path = require('path');

// Determine which database to use based on environment
const DB_TYPE = process.env.DB_TYPE || (process.env.DATABASE_URL ? 'postgresql' : 'sqlite');

let db;
let dbType;

// SQLite setup
if (DB_TYPE === 'sqlite' || (!process.env.DATABASE_URL && DB_TYPE !== 'postgresql')) {
  const sqlite3 = require('sqlite3').verbose();
  const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'appointments.db');
  dbType = 'sqlite';

  function initDatabase() {
    return new Promise((resolve, reject) => {
      db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening SQLite database:', err.message);
          reject(err);
          return;
        }
        console.log('Connected to SQLite database');
        createTables().then(resolve).catch(reject);
      });
    });
  }

  function createTables() {
    return new Promise((resolve, reject) => {
      // Create appointments table
      db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          service_type TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          address TEXT NOT NULL,
          message TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating appointments table:', err.message);
          reject(err);
          return;
        }
        console.log('Appointments table created or already exists');
        
        // Create newsletter_subscribers table
        db.run(`
          CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            name TEXT,
            subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            active INTEGER DEFAULT 1
          )
        `, (err) => {
          if (err) {
            console.error('Error creating newsletter_subscribers table:', err.message);
            reject(err);
            return;
          }
          console.log('Newsletter subscribers table created or already exists');
          
          // Create newsletter_drafts table
          db.run(`
            CREATE TABLE IF NOT EXISTS newsletter_drafts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              subject TEXT NOT NULL,
              content TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('Error creating newsletter_drafts table:', err.message);
              reject(err);
              return;
            }
            console.log('Newsletter drafts table created or already exists');
            
            // Create newsletter_sends table
            db.run(`
              CREATE TABLE IF NOT EXISTS newsletter_sends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                draft_id INTEGER,
                subject TEXT NOT NULL,
                recipient_count INTEGER NOT NULL,
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (draft_id) REFERENCES newsletter_drafts(id)
              )
            `, (err) => {
              if (err) {
                console.error('Error creating newsletter_sends table:', err.message);
                reject(err);
                return;
              }
              console.log('Newsletter sends table created or already exists');
              
              // Create products table
              db.run(`
                CREATE TABLE IF NOT EXISTS products (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  description TEXT,
                  price INTEGER NOT NULL,
                  image_url TEXT,
                  active INTEGER DEFAULT 1,
                  in_stock INTEGER DEFAULT 1,
                  stripe_price_id TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `, (err) => {
                if (err) {
                  console.error('Error creating products table:', err.message);
                  reject(err);
                  return;
                }
                console.log('Products table created or already exists');
                
                // Create orders table
                db.run(`
                  CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    stripe_session_id TEXT UNIQUE,
                    stripe_payment_intent_id TEXT,
                    customer_email TEXT NOT NULL,
                    customer_name TEXT,
                    amount INTEGER NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id)
                  )
                `, (err) => {
                  if (err) {
                    console.error('Error creating orders table:', err.message);
                    reject(err);
                    return;
                  }
                  console.log('Orders table created or already exists');
                  resolve();
                });
              });
            });
          });
        });
      });
    });
  }

  function getDatabase() {
    if (!db) {
      throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return {
      run: (sql, params, callback) => {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        db.run(sql, params || [], callback);
      },
      get: (sql, params, callback) => {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        db.get(sql, params || [], callback);
      },
      all: (sql, params, callback) => {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        db.all(sql, params || [], callback);
      }
    };
  }

  function closeDatabase() {
    return new Promise((resolve, reject) => {
      if (db) {
        db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('SQLite database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  module.exports = {
    initDatabase,
    getDatabase,
    closeDatabase
  };
}

// PostgreSQL setup
else {
  const { Pool } = require('pg');
  dbType = 'postgresql';

  function initDatabase() {
    return new Promise((resolve, reject) => {
      // Parse DATABASE_URL or use individual connection parameters
      let poolConfig;
      
      if (process.env.DATABASE_URL) {
        poolConfig = {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
        };
      } else {
        poolConfig = {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_NAME || 'valentino_tree',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
          ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
        };
      }

      db = new Pool(poolConfig);

      // Test connection
      db.query('SELECT NOW()', (err, result) => {
        if (err) {
          console.error('Error connecting to PostgreSQL database:', err.message);
          reject(err);
          return;
        }
        console.log('Connected to PostgreSQL database');
        createTables().then(resolve).catch(reject);
      });
    });
  }

  function createTables() {
    return new Promise((resolve, reject) => {
      const queries = [
        // Create appointments table
        `CREATE TABLE IF NOT EXISTS appointments (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          service_type TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          address TEXT NOT NULL,
          message TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Create newsletter_subscribers table
        `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT,
          subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          active BOOLEAN DEFAULT true
        )`,
        
        // Create newsletter_drafts table
        `CREATE TABLE IF NOT EXISTS newsletter_drafts (
          id SERIAL PRIMARY KEY,
          subject TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Create newsletter_sends table
        `CREATE TABLE IF NOT EXISTS newsletter_sends (
          id SERIAL PRIMARY KEY,
          draft_id INTEGER,
          subject TEXT NOT NULL,
          recipient_count INTEGER NOT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (draft_id) REFERENCES newsletter_drafts(id)
        )`,
        
        // Create products table
        `CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          price INTEGER NOT NULL,
          image_url TEXT,
          active BOOLEAN DEFAULT true,
          in_stock BOOLEAN DEFAULT true,
          stripe_price_id TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Create orders table
        `CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL,
          stripe_session_id TEXT UNIQUE,
          stripe_payment_intent_id TEXT,
          customer_email TEXT NOT NULL,
          customer_name TEXT,
          amount INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id)
        )`
      ];

      // Execute queries sequentially
      let currentIndex = 0;
      
      function executeNext() {
        if (currentIndex >= queries.length) {
          console.log('All PostgreSQL tables created or already exist');
          resolve();
          return;
        }

        db.query(queries[currentIndex], (err, result) => {
          if (err) {
            // Table might already exist, check error code
            if (err.code === '42P07') { // duplicate_table
              console.log(`Table already exists (query ${currentIndex + 1})`);
              currentIndex++;
              executeNext();
            } else {
              console.error(`Error creating table (query ${currentIndex + 1}):`, err.message);
              reject(err);
            }
          } else {
            console.log(`Table created successfully (query ${currentIndex + 1})`);
            currentIndex++;
            executeNext();
          }
        });
      }

      executeNext();
    });
  }

  function getDatabase() {
    if (!db) {
      throw new Error('Database not initialized. Call initDatabase() first.');
    }
    
    // Return a SQLite-compatible interface for PostgreSQL
    return {
      run: (sql, params, callback) => {
        // Convert SQLite placeholders (?) to PostgreSQL ($1, $2, etc.)
        let pgSql = sql;
        const pgParams = [];
        
        if (params && params.length > 0) {
          let paramIndex = 1;
          pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
          pgParams.push(...params);
        }

        // Handle INSERT with RETURNING for lastID
        if (sql.trim().toUpperCase().startsWith('INSERT')) {
          if (!pgSql.includes('RETURNING')) {
            // Extract table name and add RETURNING id
            const match = pgSql.match(/INSERT INTO\s+(\w+)/i);
            if (match) {
              pgSql += ' RETURNING id';
            }
          }
          
          db.query(pgSql, pgParams, (err, result) => {
            if (callback) {
              if (err) {
                callback(err);
              } else {
                // Create a callback-compatible object with lastID
                const mockThis = {
                  lastID: result.rows[0]?.id || null,
                  changes: result.rowCount || 0
                };
                // Call callback with 'this' context bound
                callback.call(mockThis, null);
              }
            }
          });
        } else {
          // For UPDATE/DELETE, return changes
          db.query(pgSql, pgParams, (err, result) => {
            if (callback) {
              if (err) {
                callback(err);
              } else {
                const mockThis = {
                  changes: result.rowCount || 0
                };
                callback.call(mockThis, null);
              }
            }
          });
        }
      },
      
      get: (sql, params, callback) => {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        
        // Convert SQLite placeholders to PostgreSQL
        let pgSql = sql;
        const pgParams = [];
        
        if (params && params.length > 0) {
          let paramIndex = 1;
          pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
          pgParams.push(...params);
        }
        
        db.query(pgSql, pgParams, (err, result) => {
          if (callback) {
            if (err) {
              callback(err);
            } else {
              // Convert boolean fields for compatibility
              const row = result.rows[0];
              if (row) {
                // Convert PostgreSQL booleans to integers for compatibility
                if (row.active !== undefined) {
                  row.active = row.active ? 1 : 0;
                }
                if (row.in_stock !== undefined) {
                  row.in_stock = row.in_stock ? 1 : 0;
                }
              }
              callback(null, row);
            }
          }
        });
      },
      
      all: (sql, params, callback) => {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        
        // Convert SQLite placeholders to PostgreSQL
        let pgSql = sql;
        const pgParams = [];
        
        if (params && params.length > 0) {
          let paramIndex = 1;
          pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
          pgParams.push(...params);
        }
        
        db.query(pgSql, pgParams, (err, result) => {
          if (callback) {
            if (err) {
              callback(err);
            } else {
              // Convert boolean fields for compatibility
              const rows = result.rows.map(row => {
                if (row.active !== undefined) {
                  row.active = row.active ? 1 : 0;
                }
                if (row.in_stock !== undefined) {
                  row.in_stock = row.in_stock ? 1 : 0;
                }
                return row;
              });
              callback(null, rows);
            }
          }
        });
      }
    };
  }

  function closeDatabase() {
    return new Promise((resolve, reject) => {
      if (db) {
        db.end((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('PostgreSQL database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  module.exports = {
    initDatabase,
    getDatabase,
    closeDatabase
  };
}
