const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'appointments.db');

let db;

function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      
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
            
            // Create newsletter_sends table (send history)
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
  });
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
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

