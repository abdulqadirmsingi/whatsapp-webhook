const OrderService = require("./orderService");
const WhatsAppService = require("./whatsapp");
const PDFGenerator = require("./pdfGenerator");

class ConversationHandler {
  constructor() {
    this.orderService = new OrderService();
    this.whatsappService = new WhatsAppService();
    this.pdfGenerator = new PDFGenerator();
  }

  async handleMessage(
    phoneNumber,
    messageText,
    messageType = "text",
    interactiveData = null
  ) {
    try {
      const customerState = await this.orderService.getCustomerState(
        phoneNumber
      );
      const currentStep = customerState
        ? customerState.current_step
        : this.orderService.conversationSteps.START;
      const orderData =
        customerState && customerState.order_data
          ? JSON.parse(customerState.order_data)
          : {};

      console.log(
        `Processing message from ${phoneNumber}, Step: ${currentStep}, Message: ${messageText}`
      );

      switch (currentStep) {
        case this.orderService.conversationSteps.START:
          return await this.handleStart(phoneNumber);

        case this.orderService.conversationSteps.MAIN_MENU:
          return await this.handleMainMenu(
            phoneNumber,
            messageText,
            interactiveData
          );

        case this.orderService.conversationSteps.BROWSE_PRODUCTS:
          return await this.handleBrowseProducts(
            phoneNumber,
            messageText,
            interactiveData
          );

        case this.orderService.conversationSteps.SELECT_PRODUCT:
          return await this.handleSelectProduct(
            phoneNumber,
            messageText,
            interactiveData,
            orderData
          );

        case this.orderService.conversationSteps.SPECIFY_QUANTITY:
          return await this.handleSpecifyQuantity(
            phoneNumber,
            messageText,
            orderData
          );

        case this.orderService.conversationSteps.ADD_MORE_PRODUCTS:
          return await this.handleAddMoreProducts(
            phoneNumber,
            messageText,
            interactiveData,
            orderData
          );

        case this.orderService.conversationSteps.CUSTOMER_INFO:
          return await this.handleCustomerInfo(
            phoneNumber,
            messageText,
            orderData
          );

        case this.orderService.conversationSteps.PAYMENT_METHOD:
          return await this.handlePaymentMethod(
            phoneNumber,
            messageText,
            interactiveData,
            orderData
          );

        case this.orderService.conversationSteps.ORDER_CONFIRMATION:
          return await this.handleOrderConfirmation(
            phoneNumber,
            messageText,
            interactiveData,
            orderData
          );

        default:
          return await this.handleStart(phoneNumber);
      }
    } catch (error) {
      console.error("Error handling message:", error);
      await this.whatsappService.sendMessage(
        phoneNumber,
        "I'm sorry, something went wrong. Let me start over. Type 'hi' to begin."
      );
      await this.orderService.clearCustomerState(phoneNumber);
    }
  }

  async handleStart(phoneNumber) {
    const welcomeMessage = `🛍️ Welcome to *${
      process.env.BUSINESS_NAME || "Our Shop"
    }*!\n\nI'm here to help you place your order easily through WhatsApp.\n\nWhat would you like to do today?`;

    const buttons = [
      { id: "browse_products", title: "🛍️ Browse Products" },
      { id: "check_order", title: "📋 Check Order Status" },
      { id: "contact_support", title: "📞 Contact Support" },
    ];

    await this.whatsappService.sendButtons(
      phoneNumber,
      welcomeMessage,
      buttons
    );
    await this.orderService.updateCustomerState(
      phoneNumber,
      this.orderService.conversationSteps.MAIN_MENU
    );
  }

  async handleMainMenu(phoneNumber, messageText, interactiveData) {
    const selection =
      interactiveData?.button_reply?.id || messageText.toLowerCase();

    switch (selection) {
      case "browse_products":
        return await this.showProductCatalog(phoneNumber);

      case "check_order":
        await this.whatsappService.sendMessage(
          phoneNumber,
          "Please provide your order number (format: ORD-YYYYMMDD-XXXXXXXX):"
        );
        // You can implement order checking logic here
        return await this.handleStart(phoneNumber);

      case "contact_support":
        await this.whatsappService.sendMessage(
          phoneNumber,
          `📞 *Contact Support*\n\n📧 Email: ${
            process.env.BUSINESS_EMAIL || "support@shop.com"
          }\n📱 Phone: ${
            process.env.BUSINESS_PHONE || "+1234567890"
          }\n\nOur support team is available Monday-Friday, 9 AM - 6 PM.`
        );
        return await this.handleStart(phoneNumber);

      default:
        await this.whatsappService.sendMessage(
          phoneNumber,
          "I didn't understand that. Please use the buttons to select an option."
        );
        return await this.handleStart(phoneNumber);
    }
  }

  async showProductCatalog(phoneNumber) {
    const products = await this.orderService.getProducts();

    if (products.length === 0) {
      await this.whatsappService.sendMessage(
        phoneNumber,
        "Sorry, no products are currently available. Please check back later."
      );
      return await this.handleStart(phoneNumber);
    }

    // Group products by category
    const productsByCategory = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {});

    let catalogMessage = "🛍️ *Our Product Catalog*\n\n";

    for (const [category, categoryProducts] of Object.entries(
      productsByCategory
    )) {
      catalogMessage += `📂 *${category}*\n`;
      categoryProducts.forEach((product) => {
        catalogMessage += `${product.id}. ${
          product.name
        } - $${product.price.toFixed(2)}\n   ${product.description}\n\n`;
      });
    }

    catalogMessage +=
      "To select a product, reply with the product number (e.g., '1' for the first product).";

    await this.whatsappService.sendMessage(phoneNumber, catalogMessage);
    await this.orderService.updateCustomerState(
      phoneNumber,
      this.orderService.conversationSteps.SELECT_PRODUCT,
      { items: [] }
    );
  }

  async handleSelectProduct(
    phoneNumber,
    messageText,
    interactiveData,
    orderData
  ) {
    const productId = parseInt(messageText.trim());

    if (isNaN(productId)) {
      await this.whatsappService.sendMessage(
        phoneNumber,
        "Please enter a valid product number."
      );
      return;
    }

    const product = await this.orderService.getProductById(productId);

    if (!product) {
      await this.whatsappService.sendMessage(
        phoneNumber,
        "Product not found. Please enter a valid product number."
      );
      return;
    }

    await this.whatsappService.sendMessage(
      phoneNumber,
      `✅ You selected: *${product.name}*\n💰 Price: $${product.price.toFixed(
        2
      )}\n📝 ${product.description}\n\nHow many would you like to order?`
    );

    orderData.selectedProduct = product;
    await this.orderService.updateCustomerState(
      phoneNumber,
      this.orderService.conversationSteps.SPECIFY_QUANTITY,
      orderData
    );
  }

  async handleSpecifyQuantity(phoneNumber, messageText, orderData) {
    const quantity = parseInt(messageText.trim());

    if (isNaN(quantity) || quantity <= 0) {
      await this.whatsappService.sendMessage(
        phoneNumber,
        "Please enter a valid quantity (positive number)."
      );
      return;
    }

    const product = orderData.selectedProduct;
    const totalPrice = product.price * quantity;

    // Add item to order
    if (!orderData.items) orderData.items = [];

    orderData.items.push({
      product_id: product.id,
      product_name: product.name,
      quantity: quantity,
      unit_price: product.price,
      total_price: totalPrice,
    });

    const confirmMessage = `✅ Added to your order:\n*${
      product.name
    }* × ${quantity} = $${totalPrice.toFixed(
      2
    )}\n\nWould you like to add more products?`;

    const buttons = [
      { id: "add_more", title: "➕ Add More Products" },
      { id: "proceed_checkout", title: "🛒 Proceed to Checkout" },
    ];

    await this.whatsappService.sendButtons(
      phoneNumber,
      confirmMessage,
      buttons
    );
    await this.orderService.updateCustomerState(
      phoneNumber,
      this.orderService.conversationSteps.ADD_MORE_PRODUCTS,
      orderData
    );
  }

  async handleAddMoreProducts(
    phoneNumber,
    messageText,
    interactiveData,
    orderData
  ) {
    const selection =
      interactiveData?.button_reply?.id || messageText.toLowerCase();

    if (selection === "add_more") {
      return await this.showProductCatalog(phoneNumber);
    } else if (selection === "proceed_checkout") {
      // Show order summary and ask for customer info
      let summary = "📋 *Order Summary*\n\n";
      let total = 0;

      orderData.items.forEach((item) => {
        summary += `• ${item.product_name} × ${
          item.quantity
        } = $${item.total_price.toFixed(2)}\n`;
        total += item.total_price;
      });

      summary += `\n💰 *Total: $${total.toFixed(2)}*\n\n`;
      summary += "To complete your order, please provide your full name:";

      await this.whatsappService.sendMessage(phoneNumber, summary);
      await this.orderService.updateCustomerState(
        phoneNumber,
        this.orderService.conversationSteps.CUSTOMER_INFO,
        orderData
      );
    } else {
      await this.whatsappService.sendMessage(
        phoneNumber,
        "Please use the buttons to continue."
      );
    }
  }

  async handleCustomerInfo(phoneNumber, messageText, orderData) {
    const customerName = messageText.trim();

    if (customerName.length < 2) {
      await this.whatsappService.sendMessage(
        phoneNumber,
        "Please provide a valid full name (at least 2 characters)."
      );
      return;
    }

    orderData.customerName = customerName;

    const paymentMessage =
      "💳 *Payment Options*\n\nPlease choose your preferred payment method:";

    const buttons = [
      { id: "instant", title: "💳 Pay Immediately" },
      { id: "30_days", title: "📅 Pay in 30 Days" },
    ];

    await this.whatsappService.sendButtons(
      phoneNumber,
      paymentMessage,
      buttons
    );
    await this.orderService.updateCustomerState(
      phoneNumber,
      this.orderService.conversationSteps.PAYMENT_METHOD,
      orderData
    );
  }

  async handlePaymentMethod(
    phoneNumber,
    messageText,
    interactiveData,
    orderData
  ) {
    const paymentMethod =
      interactiveData?.button_reply?.id || messageText.toLowerCase();

    if (!["instant", "30_days"].includes(paymentMethod)) {
      await this.whatsappService.sendMessage(
        phoneNumber,
        "Please select a valid payment option using the buttons."
      );
      return;
    }

    orderData.paymentMethod = paymentMethod;

    // Show final confirmation
    let confirmationMessage = "🔍 *Please confirm your order:*\n\n";
    confirmationMessage += `👤 Name: ${orderData.customerName}\n`;
    confirmationMessage += `📱 Phone: ${phoneNumber}\n\n`;
    confirmationMessage += "🛍️ *Items:*\n";

    let total = 0;
    orderData.items.forEach((item) => {
      confirmationMessage += `• ${item.product_name} × ${
        item.quantity
      } = $${item.total_price.toFixed(2)}\n`;
      total += item.total_price;
    });

    confirmationMessage += `\n💰 *Total: $${total.toFixed(2)}*\n`;
    confirmationMessage += `💳 Payment: ${
      paymentMethod === "instant" ? "Immediate Payment" : "Payment in 30 days"
    }\n\n`;
    confirmationMessage += "Is this correct?";

    const buttons = [
      { id: "confirm_order", title: "✅ Confirm Order" },
      { id: "cancel_order", title: "❌ Cancel Order" },
    ];

    await this.whatsappService.sendButtons(
      phoneNumber,
      confirmationMessage,
      buttons
    );
    await this.orderService.updateCustomerState(
      phoneNumber,
      this.orderService.conversationSteps.ORDER_CONFIRMATION,
      orderData
    );
  }

  async handleOrderConfirmation(
    phoneNumber,
    messageText,
    interactiveData,
    orderData
  ) {
    const confirmation =
      interactiveData?.button_reply?.id || messageText.toLowerCase();

    if (confirmation === "confirm_order") {
      try {
        // Create the order in database
        const order = await this.orderService.createOrder(
          phoneNumber,
          orderData.customerName,
          orderData.items,
          orderData.paymentMethod
        );

        const successMessage = `🎉 *Order Confirmed!*\n\n📋 Order Number: *${
          order.order_number
        }*\n\nThank you for your order! We'll process it shortly and keep you updated.\n\n${
          orderData.paymentMethod === "instant"
            ? "💳 Please proceed with immediate payment."
            : "📅 Payment is due within 30 days of delivery."
        }\n\nYou will receive a receipt shortly.`;

        await this.whatsappService.sendMessage(phoneNumber, successMessage);

        // Clear conversation state
        await this.orderService.clearCustomerState(phoneNumber);

        // Generate and send PDF receipt
        try {
          const receipt = await this.pdfGenerator.generateReceipt(order);
          await this.whatsappService.sendMessage(
            phoneNumber,
            `📄 Your receipt has been generated! You can download it from: ${receipt.filename}`
          );
          console.log(`Receipt generated: ${receipt.path}`);
        } catch (pdfError) {
          console.error("Error generating PDF receipt:", pdfError);
          await this.whatsappService.sendMessage(
            phoneNumber,
            "Your order is confirmed but there was an issue generating the receipt. Please contact support if needed."
          );
        }

        return order;
      } catch (error) {
        console.error("Error creating order:", error);
        await this.whatsappService.sendMessage(
          phoneNumber,
          "Sorry, there was an error processing your order. Please try again or contact support."
        );
        await this.orderService.clearCustomerState(phoneNumber);
      }
    } else if (confirmation === "cancel_order") {
      await this.whatsappService.sendMessage(
        phoneNumber,
        "❌ Order cancelled. Thank you for visiting! Type 'hi' anytime to start a new order."
      );
      await this.orderService.clearCustomerState(phoneNumber);
    } else {
      await this.whatsappService.sendMessage(
        phoneNumber,
        "Please use the buttons to confirm or cancel your order."
      );
    }
  }
}

module.exports = ConversationHandler;
