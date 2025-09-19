const { db } = require("../database/init");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

class OrderService {
  constructor() {
    this.conversationSteps = {
      START: "start",
      MAIN_MENU: "main_menu",
      BROWSE_PRODUCTS: "browse_products",
      SELECT_PRODUCT: "select_product",
      SPECIFY_QUANTITY: "specify_quantity",
      ADD_MORE_PRODUCTS: "add_more_products",
      CUSTOMER_INFO: "customer_info",
      PAYMENT_METHOD: "payment_method",
      ORDER_CONFIRMATION: "order_confirmation",
      ORDER_COMPLETE: "order_complete",
    };
  }

  async getCustomerState(phoneNumber) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM conversation_state WHERE phone_number = ?",
        [phoneNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async updateCustomerState(phoneNumber, step, orderData = null) {
    const orderDataJson = orderData ? JSON.stringify(orderData) : null;
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO conversation_state 
                 (phone_number, current_step, order_data, updated_at) 
                 VALUES (?, ?, ?, datetime('now'))`,
        [phoneNumber, step, orderDataJson],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getProducts() {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM products WHERE is_available = 1 ORDER BY category, name",
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getProductById(productId) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM products WHERE id = ? AND is_available = 1",
        [productId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async createOrUpdateCustomer(phoneNumber, name = null) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO customers (phone_number, name, updated_at) 
                 VALUES (?, COALESCE(?, (SELECT name FROM customers WHERE phone_number = ?)), datetime('now'))`,
        [phoneNumber, name, phoneNumber],
        function (err) {
          if (err) reject(err);
          else {
            db.get(
              "SELECT * FROM customers WHERE phone_number = ?",
              [phoneNumber],
              (err, row) => {
                if (err) reject(err);
                else resolve(row);
              }
            );
          }
        }
      );
    });
  }

  async createOrder(
    customerPhone,
    customerName,
    orderItems,
    paymentMethod,
    notes = ""
  ) {
    const orderNumber = `ORD-${moment().format("YYYYMMDD")}-${uuidv4()
      .substr(0, 8)
      .toUpperCase()}`;
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Create customer if not exists
        db.run(
          `INSERT OR IGNORE INTO customers (phone_number, name) VALUES (?, ?)`,
          [customerPhone, customerName]
        );

        // Get customer ID
        db.get(
          "SELECT id FROM customers WHERE phone_number = ?",
          [customerPhone],
          (err, customer) => {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
              return;
            }

            // Create order
            db.run(
              `INSERT INTO orders (order_number, customer_id, customer_phone, customer_name, 
                             total_amount, payment_method, status, notes) 
                             VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
              [
                orderNumber,
                customer.id,
                customerPhone,
                customerName,
                totalAmount,
                paymentMethod,
                notes,
              ],
              function (err) {
                if (err) {
                  db.run("ROLLBACK");
                  reject(err);
                  return;
                }

                const orderId = this.lastID;

                // Insert order items
                const insertItem = db.prepare(
                  `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) 
                                     VALUES (?, ?, ?, ?, ?, ?)`
                );

                let itemsInserted = 0;
                orderItems.forEach((item) => {
                  insertItem.run(
                    [
                      orderId,
                      item.product_id,
                      item.product_name,
                      item.quantity,
                      item.unit_price,
                      item.quantity * item.unit_price,
                    ],
                    (err) => {
                      if (err) {
                        db.run("ROLLBACK");
                        reject(err);
                        return;
                      }

                      itemsInserted++;
                      if (itemsInserted === orderItems.length) {
                        insertItem.finalize();
                        db.run("COMMIT");
                        resolve({
                          id: orderId,
                          order_number: orderNumber,
                          total_amount: totalAmount,
                          payment_method: paymentMethod,
                          status: 'pending',
                          items: orderItems,
                        });
                      }
                    }
                  );
                });
              }
            );
          }
        );
      });
    });
  }

  async confirmOrder(orderNumber) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE orders SET status = 'confirmed', updated_at = datetime('now') WHERE order_number = ?`,
        [orderNumber],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  async getOrderByNumber(orderNumber) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT o.*, c.name as customer_name FROM orders o 
                 LEFT JOIN customers c ON o.customer_id = c.id 
                 WHERE o.order_number = ?`,
        [orderNumber],
        (err, order) => {
          if (err) {
            reject(err);
            return;
          }

          if (!order) {
            resolve(null);
            return;
          }

          // Get order items
          db.all(
            "SELECT * FROM order_items WHERE order_id = ?",
            [order.id],
            (err, items) => {
              if (err) reject(err);
              else resolve({ ...order, items });
            }
          );
        }
      );
    });
  }

  async getAllOrders(status = null) {
    const whereClause = status ? "WHERE status = ?" : "";
    const params = status ? [status] : [];

    return new Promise((resolve, reject) => {
      db.all(
        `SELECT o.*, c.name as customer_name FROM orders o 
                 LEFT JOIN customers c ON o.customer_id = c.id 
                 ${whereClause}
                 ORDER BY o.created_at DESC`,
        params,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  formatOrderSummary(order) {
    let summary = `📋 *Order Summary*\n\n`;
    summary += `🔢 Order Number: *${order.order_number}*\n`;
    summary += `👤 Customer: ${order.customer_name}\n`;
    summary += `📱 Phone: ${order.customer_phone}\n\n`;
    summary += `🛍️ *Items:*\n`;

    order.items.forEach((item) => {
      summary += `• ${item.product_name} × ${
        item.quantity
      } = $${item.total_price.toFixed(2)}\n`;
    });

    summary += `\n💰 *Total: $${order.total_amount.toFixed(2)}*\n`;
    summary += `💳 Payment: ${
      order.payment_method === "instant"
        ? "Immediate Payment"
        : "Payment in 30 days"
    }\n`;
    summary += `📅 Date: ${moment(order.created_at).format(
      "YYYY-MM-DD HH:mm"
    )}\n`;

    return summary;
  }

  async clearCustomerState(phoneNumber) {
    return new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM conversation_state WHERE phone_number = ?",
        [phoneNumber],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }
}

module.exports = OrderService;
