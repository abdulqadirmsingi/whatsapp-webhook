const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create database connection
const dbPath = path.join(__dirname, "orders.db");
const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create customers table
      db.run(`
                CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    phone_number TEXT UNIQUE NOT NULL,
                    name TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

      // Create products table (sample products)
      db.run(`
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    category TEXT,
                    is_available BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

      // Create orders table
      db.run(`
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_number TEXT UNIQUE NOT NULL,
                    customer_id INTEGER,
                    customer_phone TEXT NOT NULL,
                    customer_name TEXT,
                    total_amount DECIMAL(10,2) DEFAULT 0,
                    payment_method TEXT CHECK(payment_method IN ('instant', '30_days')) NOT NULL,
                    status TEXT CHECK(status IN ('pending', 'confirmed', 'processing', 'delivered', 'cancelled')) DEFAULT 'pending',
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers(id)
                )
            `);

      // Create order_items table
      db.run(`
                CREATE TABLE IF NOT EXISTS order_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id INTEGER,
                    product_id INTEGER,
                    product_name TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    unit_price DECIMAL(10,2) NOT NULL,
                    total_price DECIMAL(10,2) NOT NULL,
                    FOREIGN KEY (order_id) REFERENCES orders(id),
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            `);

      // Create conversation_state table (to track customer conversation flow)
      db.run(`
                CREATE TABLE IF NOT EXISTS conversation_state (
                    phone_number TEXT PRIMARY KEY,
                    current_step TEXT NOT NULL,
                    order_data TEXT, -- JSON string to store order in progress
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

      // Insert sample products 
      db.run(
        `
                INSERT OR IGNORE INTO products (name, description, price, category) VALUES
                ('T-Shirt', 'Cotton T-Shirt - Various Colors', 25.00, 'Clothing'),
                ('Jeans', 'Denim Jeans - Blue', 65.00, 'Clothing'),
                ('Sneakers', 'Sports Sneakers - White/Black', 85.00, 'Footwear'),
                ('Backpack', 'Travel Backpack - 30L Capacity', 45.00, 'Accessories'),
                ('Smartphone Case', 'Protective Phone Case', 15.00, 'Electronics')
            `,
        function (err) {
          if (err) {
            console.error("Error inserting sample products:", err);
            reject(err);
          } else {
            console.log("Database initialized successfully");
            resolve();
          }
        }
      );
    });
  });
}

module.exports = { db, initializeDatabase };
