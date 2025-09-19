# WhatsApp Business API Setup Guide

This guide will walk you through setting up WhatsApp Business API for your order management webhook.

## Prerequisites

1. **Meta Developer Account**: You already have this ✅
2. **WhatsApp Business Account**: Linked to your Meta Developer account
3. **Phone Number**: A phone number that will be used for WhatsApp Business

## Step 1: Create a WhatsApp Business App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" as the app type
4. Fill in your app details:
   - App Name: "Your Shop Order Bot"
   - App Contact Email: Your email
   - Business Account: Select your business account

## Step 2: Add WhatsApp Product

1. In your app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set up"
3. This will add WhatsApp Business API to your app

## Step 3: Configure WhatsApp

### Get Your Credentials

1. In the WhatsApp section, go to "API Setup"
2. Note down these important values:
   - **App ID**: Found in Settings → Basic
   - **App Secret**: Found in Settings → Basic
   - **Phone Number ID**: Found in WhatsApp → API Setup
   - **Business Account ID**: Found in WhatsApp → API Setup

### Generate Access Token

1. In WhatsApp → API Setup, find "Temporary access token"
2. Copy this token (valid for 24 hours for testing)
3. For production, you'll need to generate a permanent token

## Step 4: Set Up Webhook

### Configure Your Server

1. Copy `config.env.example` to `.env`:

   ```bash
   cp config.env.example .env
   ```

2. Fill in your credentials in `.env`:
   ```env
   WHATSAPP_TOKEN=your_temporary_access_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   VERIFY_TOKEN=your_custom_verify_token_here
   BUSINESS_NAME=Your Shop Name
   BUSINESS_ADDRESS=Your Business Address
   BUSINESS_PHONE=+1234567890
   BUSINESS_EMAIL=contact@yourshop.com
   ```

### Start Your Server

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. Your server will run on `http://localhost:3000`

### Make Your Server Public (For Testing)

Since WhatsApp needs to reach your webhook, you need to make it publicly accessible:

1. Install ngrok: https://ngrok.com/download
2. Run ngrok to expose your local server:
   ```bash
   ngrok http 3000
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

## Step 5: Configure Webhook in Meta Console

1. In your WhatsApp app dashboard, go to "Configuration"
2. Find "Webhook" section
3. Click "Edit" and fill in:

   - **Callback URL**: `https://your-ngrok-url.ngrok.io/webhook`
   - **Verify Token**: The same token you set in your `.env` file
   - **Webhook Fields**: Check "messages"

4. Click "Verify and Save"

## Step 6: Add Your Phone Number

1. In WhatsApp → API Setup, find "To" field
2. Click "Manage phone number list"
3. Add your personal phone number for testing
4. Verify the number via SMS

## Step 7: Test Your Bot

1. Send a WhatsApp message from your personal phone to your business number
2. Send "hi" or "hello" to start the ordering process
3. Follow the conversation flow to place a test order

## Production Setup

### Permanent Access Token

For production, you need to generate a permanent access token:

1. Go to WhatsApp → Configuration
2. Create a "System User" with sufficient permissions
3. Generate a permanent access token for this system user
4. Replace the temporary token in your `.env` file

### Business Verification

1. Complete business verification in Meta Business Manager
2. This is required for production use of WhatsApp Business API

### Rate Limits

- **Testing**: 250 conversations per day
- **Production**: Higher limits based on your business verification status

## Webhook URL for Production

For production deployment, you'll need:

1. **Cloud Hosting**: Deploy to platforms like:

   - Heroku
   - AWS EC2
   - DigitalOcean
   - Vercel
   - Railway

2. **HTTPS Certificate**: WhatsApp requires HTTPS endpoints

3. **Domain Name**: Use a proper domain instead of ngrok

## Troubleshooting

### Common Issues

1. **Webhook verification fails**:

   - Check that VERIFY_TOKEN matches in both `.env` and Meta console
   - Ensure your server is accessible via HTTPS

2. **Messages not received**:

   - Check that webhook URL is correct
   - Verify phone number is added to the approved list
   - Check server logs for errors

3. **Access token expired**:
   - Generate a new permanent access token
   - Update `.env` file and restart server

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

### Webhook Testing

Test your webhook endpoint directly:

```bash
curl -X GET "https://your-domain.com/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your_verify_token"
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` file to version control
2. **HTTPS Only**: Always use HTTPS in production
3. **Token Security**: Keep access tokens secure and rotate them regularly
4. **Input Validation**: The system includes input validation for all user inputs
5. **Rate Limiting**: Implement rate limiting to prevent abuse

## Monitoring and Analytics

### Built-in Dashboard

Access the admin dashboard at: `http://localhost:3000`

Features:

- Order management
- Real-time statistics
- Customer information
- Product catalog

### Key Metrics to Monitor

- Order conversion rate
- Response time
- Error rates
- Customer satisfaction

## Support

If you encounter issues:

1. Check the [WhatsApp Business API documentation](https://developers.facebook.com/docs/whatsapp)
2. Review server logs for error messages
3. Test webhook connectivity
4. Verify all configuration values

## Demo Script for Client

Here's a suggested demo flow:

1. **Show the Admin Dashboard**: Display real-time orders and statistics
2. **Initiate Order**: Send "hi" to start the ordering process
3. **Browse Products**: Show the product catalog functionality
4. **Select Items**: Add multiple items with different quantities
5. **Payment Options**: Demonstrate both instant and 30-day payment options
6. **Order Confirmation**: Show the complete order flow
7. **PDF Receipt**: Display the generated receipt
8. **Admin View**: Show how orders appear in the dashboard
9. **Order Management**: Demonstrate order confirmation process

This creates a complete demonstration of the system's capabilities for your client presentation.
