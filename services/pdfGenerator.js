const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

class PDFGenerator {
  constructor() {
    this.ensureDirectories();
  }

  ensureDirectories() {
    const receiptsDir = path.join(__dirname, "../receipts");
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
  }

  async generateReceipt(order) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = `receipt_${order.order_number}.pdf`;
        const filePath = path.join(__dirname, "../receipts", filename);

        // Pipe the PDF into a file
        doc.pipe(fs.createWriteStream(filePath));

        // Add header
        this.addHeader(doc);

        // Add order details
        this.addOrderDetails(doc, order);

        // Add items table
        this.addItemsTable(doc, order);

        // Add payment info
        this.addPaymentInfo(doc, order);

        // Add footer
        this.addFooter(doc);

        // Finalize the PDF
        doc.end();

        doc.on("end", () => {
          resolve({
            filename: filename,
            path: filePath,
            url: `/receipts/${filename}`,
          });
        });

        doc.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(doc) {
    const businessName = process.env.BUSINESS_NAME || "Your Shop Name";
    const businessAddress =
      process.env.BUSINESS_ADDRESS || "Your Business Address";
    const businessPhone = process.env.BUSINESS_PHONE || "+1234567890";
    const businessEmail = process.env.BUSINESS_EMAIL || "contact@yourshop.com";

    // Business name
    doc
      .fontSize(20)
      .fillColor("#2c3e50")
      .text(businessName, 50, 50, { align: "center" });

    // Business details
    doc
      .fontSize(10)
      .fillColor("#7f8c8d")
      .text(businessAddress, 50, 80, { align: "center" })
      .text(`Phone: ${businessPhone} | Email: ${businessEmail}`, 50, 95, {
        align: "center",
      });

    // Title
    doc
      .fontSize(16)
      .fillColor("#2c3e50")
      .text("ORDER RECEIPT", 50, 130, { align: "center" });

    // Line separator
    doc.moveTo(50, 150).lineTo(550, 150).strokeColor("#bdc3c7").stroke();
  }

  addOrderDetails(doc, order) {
    const startY = 170;

    doc.fontSize(12).fillColor("#2c3e50");

    // Left column
    doc
      .text("Order Number:", 50, startY)
      .text("Customer:", 50, startY + 20)
      .text("Phone:", 50, startY + 40)
      .text("Order Date:", 50, startY + 60);

    // Right column - values
    doc
      .fontSize(12)
      .fillColor("#34495e")
      .text(order.order_number, 150, startY)
      .text(order.customer_name, 150, startY + 20)
      .text(order.customer_phone, 150, startY + 40)
      .text(
        moment(order.created_at).format("YYYY-MM-DD HH:mm"),
        150,
        startY + 60
      );

    // Status
    const statusColor = order.status === "confirmed" ? "#27ae60" : "#f39c12";
    doc
      .fontSize(10)
      .fillColor(statusColor)
      .text(`Status: ${order.status.toUpperCase()}`, 400, startY)
      .fillColor("#2c3e50");
  }

  addItemsTable(doc, order) {
    const tableTop = 280;
    const itemHeight = 25;

    // Table headers
    doc
      .fontSize(10)
      .fillColor("#fff")
      .rect(50, tableTop, 500, 25)
      .fill("#3498db");

    doc
      .fillColor("#fff")
      .text("Item", 60, tableTop + 8)
      .text("Qty", 300, tableTop + 8)
      .text("Unit Price", 350, tableTop + 8)
      .text("Total", 450, tableTop + 8);

    // Table rows
    let currentY = tableTop + 25;

    order.items.forEach((item, index) => {
      const rowColor = index % 2 === 0 ? "#ecf0f1" : "#fff";

      doc.rect(50, currentY, 500, itemHeight).fill(rowColor);

      doc
        .fillColor("#2c3e50")
        .text(item.product_name, 60, currentY + 8)
        .text(item.quantity.toString(), 300, currentY + 8)
        .text(`$${item.unit_price.toFixed(2)}`, 350, currentY + 8)
        .text(`$${item.total_price.toFixed(2)}`, 450, currentY + 8);

      currentY += itemHeight;
    });

    // Total row
    doc.rect(50, currentY, 500, 30).fill("#2c3e50");

    doc
      .fontSize(12)
      .fillColor("#fff")
      .text("TOTAL AMOUNT:", 350, currentY + 10)
      .text(`$${order.total_amount.toFixed(2)}`, 450, currentY + 10);

    return currentY + 30;
  }

  addPaymentInfo(doc, order) {
    const startY = 450;

    doc
      .fontSize(12)
      .fillColor("#2c3e50")
      .text("Payment Information:", 50, startY);

    const paymentMethod =
      order.payment_method === "instant"
        ? "Immediate Payment"
        : "Payment due within 30 days";
    const paymentTerms =
      order.payment_method === "instant"
        ? process.env.PAYMENT_TERMS_INSTANT ||
          "Pay immediately upon order confirmation"
        : process.env.PAYMENT_TERMS_30_DAYS ||
          "Payment due within 30 days of delivery";

    doc
      .fontSize(10)
      .fillColor("#7f8c8d")
      .text(`Method: ${paymentMethod}`, 50, startY + 20)
      .text(`Terms: ${paymentTerms}`, 50, startY + 35);

    if (order.payment_method === "30_days") {
      const dueDate = moment(order.created_at)
        .add(30, "days")
        .format("YYYY-MM-DD");
      doc
        .fillColor("#e74c3c")
        .text(`Payment Due Date: ${dueDate}`, 50, startY + 50);
    }
  }

  addFooter(doc) {
    const footerY = 650;

    // Line separator
    doc
      .moveTo(50, footerY - 20)
      .lineTo(550, footerY - 20)
      .strokeColor("#bdc3c7")
      .stroke();

    doc
      .fontSize(8)
      .fillColor("#95a5a6")
      .text("Thank you for your business!", 50, footerY, { align: "center" })
      .text(
        "For any questions regarding this order, please contact our support team.",
        50,
        footerY + 15,
        { align: "center" }
      )
      .text(
        `Generated on ${moment().format("YYYY-MM-DD HH:mm:ss")}`,
        50,
        footerY + 30,
        { align: "center" }
      );
  }
}

module.exports = PDFGenerator;
