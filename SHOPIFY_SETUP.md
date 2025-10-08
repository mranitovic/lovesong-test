# Shopify Setup for Digital Product Sales

This guide helps you set up Shopify for selling a single digital product with automatic delivery after payment.

## Prerequisites
- Shopify account (free trial available)
- A product created in Shopify

## Step 1: Create a Shopify Store
1. Go to [shopify.com](https://www.shopify.com) and sign up for a free trial
2. Choose a store name (e.g., love-stories.myshopify.com)
3. Complete the setup wizard

## Step 2: Create Your Digital Product
1. In Shopify admin, go to **Products** > **Add product**
2. Fill in product details:
   - Title: Your product name
   - Description: Product description
   - Media: Add images if needed
3. Set pricing (e.g., R$ 100.00)
4. **Important**: Check "This is a digital product" under **Shipping**
5. **Important**: Uncheck "Track quantity" if unlimited sales
6. Save the product

## Step 3: Get Product Variant ID
1. Go to **Products** > Select your product
2. In the URL, find the product ID (e.g., `/products/123456789`)
3. Go to **Variants** section
4. Click on the variant (usually "Default Title")
5. In the URL, find the variant ID (e.g., `/variants/55701612626245`)
6. Copy this ID to your `.env.local` as `SHOPIFY_PRODUCT_VARIANT_ID`

## Step 4: Enable Storefront API
1. In Shopify admin, go to **Settings** > **Apps and sales channels**
2. Click **Develop apps** (near bottom)
3. Click **Create an app**
4. Name it "Storefront API App" and create
5. Go to **API credentials** tab
6. Click **Configure Storefront API scopes**
7. Enable these scopes:
   - `read_products`
   - `write_checkouts`
   - `read_checkouts`
8. Click **Save**
9. Click **Install app**
10. Copy the **Storefront access token** to your `.env.local` as `SHOPIFY_ACCESS_TOKEN` (include the `shpat_` prefix)

## Step 5: Set Up Webhook for Payment Confirmation
1. In the same app, go to **Webhooks** tab
2. Click **Create webhook**
3. Select:
   - Event: `Order payment` (orders/paid)
   - Format: JSON
   - URL: `https://yourdomain.com/api/shopify/webhook` (replace with your actual domain)
4. Click **Save**
5. Copy the **Webhook secret** to your `.env.local` as `SHOPIFY_WEBHOOK_SECRET`

## Step 6: Configure Store Settings
1. Go to **Settings** > **Checkout**
2. Under **Customer information**, ensure email collection is enabled
3. Under **Order processing**, you can customize as needed
4. For digital products, ensure no shipping is required

## Step 7: Update Environment Variables
In your `.env.local` file:
```
SHOPIFY_STORE_URL=yourstore.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_token_here
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here
SHOPIFY_PRODUCT_VARIANT_ID=your_variant_id_here
```

## Step 8: Test the Integration
1. Start your application
2. Create an album session
3. Attempt to create a checkout
4. Complete the payment in Shopify checkout
5. Verify the webhook processes the payment and marks the session as paid

## Troubleshooting
- **404 Not Found**: Check store URL and access token
- **Webhook not firing**: Ensure the webhook URL is publicly accessible (use ngrok for local testing)
- **Product not found**: Verify variant ID is correct
- **Payment not processed**: Check webhook secret and ensure order is marked as paid

## Notes
- For testing, use Shopify's test mode or a development store
- Digital products are delivered automatically after payment
- The integration handles one product per checkout
- Webhooks ensure payment confirmation even if user closes browser