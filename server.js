const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { initializeDatabase } = require("./database/init");
const ConversationHandler = require("./services/conversationHandler");
const OrderService = require("./services/orderService");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/receipts", express.static("receipts"));

// Initialize services
const conversationHandler = new ConversationHandler();
const orderService = new OrderService();

// Webhook verification endpoint
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("Webhook verified successfully!");
    res.status(200).send(challenge);
  } else {
    console.log("Webhook verification failed");
    res.status(403).send("Forbidden");
  }
});

// Webhook message handling endpoint
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.object === "whatsapp_business_account") {
      body.entry?.forEach(async (entry) => {
        const changes = entry.changes?.[0];

        if (changes?.field === "messages") {
          const messages = changes.value?.messages;

          if (messages) {
            for (const message of messages) {
              const phoneNumber = message.from;
              const messageId = message.id;

              console.log(`Received message from ${phoneNumber}:`, message);

              // Handle different message types
              if (message.type === "text") {
                await conversationHandler.handleMessage(
                  phoneNumber,
                  message.text?.body,
                  "text"
                );
              } else if (message.type === "interactive") {
                const interactiveData = message.interactive;
                await conversationHandler.handleMessage(
                  phoneNumber,
                  interactiveData.button_reply?.title ||
                    interactiveData.list_reply?.title,
                  "interactive",
                  interactiveData
                );
              } else if (message.type === "button") {
                await conversationHandler.handleMessage(
                  phoneNumber,
                  message.button?.text,
                  "button",
                  message.button
                );
              } else {
                console.log(`Unsupported message type: ${message.type}`);
              }
            }
          }
        }
      });
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Admin dashboard routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API endpoints for admin dashboard
app.get("/api/orders", async (req, res) => {
  try {
    const status = req.query.status;
    const orders = await orderService.getAllOrders(status);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get("/api/orders/:orderNumber", async (req, res) => {
  try {
    const order = await orderService.getOrderByNumber(req.params.orderNumber);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

app.put("/api/orders/:orderNumber/confirm", async (req, res) => {
  try {
    const success = await orderService.confirmOrder(req.params.orderNumber);
    if (success) {
      res.json({ message: "Order confirmed successfully" });
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error) {
    console.error("Error confirming order:", error);
    res.status(500).json({ error: "Failed to confirm order" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await orderService.getProducts();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log("Database initialized successfully");

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 WhatsApp Order Webhook Server running on port ${PORT}`);
      console.log(`📊 Admin Dashboard: http://localhost:${PORT}`);
      console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);

      if (process.env.NODE_ENV === "development") {
        console.log("\n📋 Setup Instructions:");
        console.log(
          "1. Copy config.env.example to .env and fill in your WhatsApp credentials"
        );
        console.log("2. Use ngrok to expose this server: ngrok http 3000");
        console.log(
          "3. Set the ngrok URL as your webhook in Meta Developer Console"
        );
        console.log('4. Send "hi" to your WhatsApp Business number to test\n');
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
