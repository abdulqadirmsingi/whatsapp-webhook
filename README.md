# WhatsApp Order Management System

A comprehensive WhatsApp webhook system that allows customers to place orders through WhatsApp Business API with automated order processing, payment tracking, and receipt generation.

## 🚀 Features

### Customer Experience

- **Conversational Ordering**: Intuitive WhatsApp chat interface for placing orders
- **Product Catalog**: Browse products by category with descriptions and pricing
- **Flexible Payment Options**: Choose between immediate payment or 30-day terms
- **Order Confirmation**: Real-time order confirmation with receipt generation
- **PDF Receipts**: Automatically generated professional receipts

### Business Management

- **Admin Dashboard**: Web-based interface for order management
- **Real-time Statistics**: Track orders, revenue, and customer metrics
- **Order Processing**: Easy order confirmation and status updates
- **Customer Database**: Automatic customer information storage
- **Payment Tracking**: Monitor payment methods and due dates

### Technical Features

- **WhatsApp Business API Integration**: Full webhook implementation
- **SQLite Database**: Efficient local data storage
- **PDF Generation**: Professional receipt creation
- **Responsive Design**: Mobile-friendly admin interface
- **RESTful API**: Complete backend API for order management

## 📋 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Customer      │    │   WhatsApp       │    │   Your Server   │
│   (WhatsApp)    │◄──►│   Business API   │◄──►│   (Webhook)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │   SQLite DB     │
                                               │   - Orders      │
                                               │   - Customers   │
                                               │   - Products    │
                                               └─────────────────┘
```

## 🛍️ Order Flow

1. **Customer Initiation**: Customer sends "hi" to WhatsApp Business number
2. **Product Selection**: Browse catalog and select products
3. **Quantity Specification**: Specify quantities for each product
4. **Customer Information**: Provide name and contact details
5. **Payment Method**: Choose between instant or 30-day payment terms
6. **Order Confirmation**: Review and confirm order details
7. **Receipt Generation**: Automatic PDF receipt creation and delivery
8. **Admin Notification**: Order appears in admin dashboard for processing

## 📊 Smart Order Storage System

### Database Schema

The system uses a normalized SQLite database with the following structure:

#### Orders Table

- Comprehensive order tracking with status management
- Links to customer and payment information
- Timestamps for audit trail

#### Order Items Table

- Detailed line items for each order
- Product information and pricing snapshot
- Quantity and total calculations

#### Customers Table

- Customer profile management
- Phone number as primary identifier
- Order history tracking

#### Products Table

- Product catalog with categories
- Pricing and availability management
- Easy inventory control

### Smart Features for Business Owners

1. **Order Status Tracking**:

   - Pending → Confirmed → Processing → Delivered
   - Visual status indicators in dashboard

2. **Payment Management**:

   - Instant payment tracking
   - 30-day payment term monitoring
   - Overdue payment alerts

3. **Customer Insights**:

   - Order history per customer
   - Purchase patterns
   - Customer value analysis

4. **Inventory Management**:

   - Product availability tracking
   - Sales performance by product
   - Category-based organization

5. **Financial Reporting**:
   - Revenue tracking
   - Payment method analysis
   - Daily/monthly sales reports

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Meta Developer Account
- WhatsApp Business API access

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd webhook-wp
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment**:

   ```bash
   cp config.env.example .env
   # Edit .env with your WhatsApp credentials
   ```

4. **Start the server**:

   ```bash
   npm start
   ```

5. **Access admin dashboard**:
   Open http://localhost:3000 in your browser

### WhatsApp Configuration

Follow the detailed setup guide in `WHATSAPP_SETUP_GUIDE.md` for complete WhatsApp Business API configuration.

## 📱 Usage Examples

### Customer Interaction Flow

```
Customer: hi
Bot: 🛍️ Welcome to Your Shop Name!
     What would you like to do today?
     [🛍️ Browse Products] [📋 Check Order] [📞 Support]

Customer: [Clicks Browse Products]
Bot: 🛍️ Our Product Catalog

     📂 Clothing
     1. T-Shirt - $25.00
        Cotton T-Shirt - Various Colors

     2. Jeans - $65.00
        Denim Jeans - Blue

     To select a product, reply with the number...

Customer: 1
Bot: ✅ You selected: T-Shirt
     💰 Price: $25.00
     📝 Cotton T-Shirt - Various Colors

     How many would you like to order?

Customer: 2
Bot: ✅ Added to your order:
     T-Shirt × 2 = $50.00

     Would you like to add more products?
     [➕ Add More] [🛒 Checkout]
```

### Admin Dashboard Features

- **Real-time Order Monitoring**: See orders as they come in
- **One-click Order Confirmation**: Approve orders instantly
- **Customer Management**: View customer history and details
- **Sales Analytics**: Track performance metrics
- **Product Management**: Update catalog and pricing

## 🔧 Configuration

### Environment Variables

```env
# WhatsApp Business API
WHATSAPP_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=your_webhook_verify_token

# Business Information
BUSINESS_NAME=Your Shop Name
BUSINESS_ADDRESS=Your Business Address
BUSINESS_PHONE=+1234567890
BUSINESS_EMAIL=contact@yourshop.com

# Payment Terms
PAYMENT_TERMS_INSTANT=Pay immediately upon order confirmation
PAYMENT_TERMS_30_DAYS=Payment due within 30 days of delivery
```

### Customization

1. **Product Catalog**: Edit the sample products in `database/init.js`
2. **Business Branding**: Update business information in environment variables
3. **Order Flow**: Modify conversation steps in `services/conversationHandler.js`
4. **PDF Templates**: Customize receipt design in `services/pdfGenerator.js`

## 📊 API Endpoints

### Webhook Endpoints

- `GET /webhook` - Webhook verification
- `POST /webhook` - Message handling

### Admin API

- `GET /api/orders` - List all orders
- `GET /api/orders/:orderNumber` - Get order details
- `PUT /api/orders/:orderNumber/confirm` - Confirm order
- `GET /api/products` - List products

### Static Assets

- `GET /` - Admin dashboard
- `GET /receipts/:filename` - Download receipts

## 🔒 Security Features

- Input validation on all user inputs
- SQL injection prevention
- Environment variable protection
- HTTPS enforcement for webhooks
- Rate limiting capabilities

## 🚀 Deployment

### Development

```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production

```bash
npm start    # Production server
```

### Cloud Deployment

The system is ready for deployment on:

- **Heroku**: Include `Procfile`
- **DigitalOcean**: Docker support
- **AWS EC2**: Node.js application
- **Vercel**: Serverless functions

## 📈 Business Benefits

### For Customers

- **Convenience**: Order through familiar WhatsApp interface
- **Speed**: Quick product selection and checkout
- **Transparency**: Clear pricing and order confirmation
- **Flexibility**: Multiple payment options

### For Business Owners

- **Automation**: Reduced manual order processing
- **Efficiency**: Streamlined order management
- **Insights**: Comprehensive sales analytics
- **Professional**: Automated receipt generation
- **Scalability**: Handle multiple orders simultaneously

## 📞 Support

For technical support or questions:

- Review the setup guide: `WHATSAPP_SETUP_GUIDE.md`
- Check server logs for debugging
- Verify webhook connectivity
- Test with WhatsApp Business API documentation


This system provides a complete e-commerce solution through WhatsApp, perfect for small to medium businesses looking to streamline their order process and improve customer experience.
