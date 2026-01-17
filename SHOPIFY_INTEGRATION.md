# Shopify Storefront Integration Guide

This guide explains how to integrate the AI Love Story Album Generator into a Shopify storefront using **App Proxy**.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Merchant Installation](#merchant-installation)
- [Troubleshooting](#troubleshooting)

---

## Overview

The AI Love Story Album Generator can be embedded into any Shopify store using Shopify's **App Proxy** feature. This allows customers to:

1. Visit the merchant's storefront at `https://store.com/apps/love-album`
2. Create their personalized love story album
3. Complete payment through Shopify checkout
4. Receive their AI-generated music album

### Why App Proxy?

- **Customer-Facing**: The app runs on the storefront, not in the admin
- **Seamless Integration**: Customers stay on the merchant's domain
- **Maintains Flow**: Your existing authentication and payment flows work as-is
- **No Theme Modifications**: Merchants don't need to edit theme code

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Shopify Storefront                        │
│                                                              │
│   Customer visits:                                           │
│   https://merchant-store.com/apps/love-album                │
│                                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Shopify proxies request
                      │ (adds shop, signature, customer_id)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Your Next.js Application                    │
│                                                              │
│   Endpoint:                                                  │
│   /api/shopify-proxy/widget                                 │
│   │                                                          │
│   ├─ Verifies Shopify signature (HMAC)                      │
│   ├─ Extracts shop & customer context                       │
│   └─ Returns iframe with widget                             │
│                                                              │
│   Widget Page:                                               │
│   /shopify/widget                                            │
│   │                                                          │
│   ├─ Renders MultiStepStoryForm                             │
│   ├─ Handles story analysis                                 │
│   ├─ Manages authentication                                 │
│   └─ Processes payment                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                      │
                      │ Checkout redirect
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Shopify Checkout (existing)                     │
│                                                              │
│   Uses your existing:                                        │
│   - /api/payment/create-checkout                            │
│   - Shopify webhook handler                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup Instructions

### 1. Prerequisites

- Shopify Partner account
- Shopify app created in Partner Dashboard
- Your Next.js app deployed (or running locally with ngrok)
- All existing environment variables configured

### 2. Create Shopify App (Partner Dashboard)

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Click **Apps** → **Create app**
3. Choose **Public app** (not custom app)
4. Fill in app details:
   - **App name**: AI Love Story Album Generator
   - **App URL**: `https://your-domain.com` (or ngrok URL for dev)

### 3. Configure App Proxy

In your app settings in Partner Dashboard:

1. Navigate to **App setup** → **App proxy**
2. Configure:
   - **Subpath**: `love-album`
   - **Proxy URL**: `https://your-domain.com/api/shopify-proxy/widget`
   - **Prefix**: `apps` (recommended)

This makes your app accessible at:
```
https://merchant-store.com/apps/love-album
```

### 4. Set Up Webhooks

In Partner Dashboard under **Webhooks**:

1. **Orders/Paid** webhook:
   - **URL**: `https://your-domain.com/api/shopify/webhook`
   - **Format**: JSON

2. **GDPR Webhooks** (required):
   - Customer data request: `https://your-domain.com/api/shopify/gdpr/data-request`
   - Customer redact: `https://your-domain.com/api/shopify/gdpr/redact`
   - Shop redact: `https://your-domain.com/api/shopify/gdpr/shop-redact`

### 5. Configure Environment Variables

Add to your `.env.local`:

```bash
# Shopify App Credentials (from Partner Dashboard)
SHOPIFY_CLIENT_ID="your_client_id"
SHOPIFY_CLIENT_SECRET="your_client_secret"

# Your existing variables remain the same
SHOPIFY_STORE_URL="your-store.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_..."
SHOPIFY_PRODUCT_VARIANT_ID="..."
SHOPIFY_WEBHOOK_SECRET="..."
```

### 6. Update `shopify.app.toml`

Edit the file with your actual values:

```toml
name = "AI Love Story Album Generator"
client_id = "YOUR_ACTUAL_CLIENT_ID"
application_url = "https://your-production-domain.com"
embedded = false

[app_proxy]
url = "https://your-production-domain.com/api/shopify-proxy/widget"
subpath = "love-album"
prefix = "apps"
```

---

## Development Workflow

### Local Development with ngrok

1. **Install ngrok** (if not already):
   ```bash
   brew install ngrok
   # or
   npm install -g ngrok
   ```

2. **Start your Next.js app**:
   ```bash
   npm run dev
   ```

3. **Start ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

4. **Update environment variables**:
   ```bash
   NEXTAUTH_URL="https://your-ngrok-url.ngrok.io"
   ```

5. **Update Shopify Partner Dashboard**:
   - App URL: `https://your-ngrok-url.ngrok.io`
   - App Proxy URL: `https://your-ngrok-url.ngrok.io/api/shopify-proxy/widget`

6. **Test on development store**:
   - Install your app on a development store
   - Visit: `https://dev-store.myshopify.com/apps/love-album`

### Testing the Integration

1. **Verify signature validation**:
   - Requests from Shopify should pass HMAC verification
   - Check server logs for verification messages

2. **Test customer flow**:
   - Fill out the love story form
   - Check story analysis works
   - Verify authentication flow
   - Complete a test payment
   - Confirm webhook processing

3. **Test responsive design**:
   - Widget should look good within Shopify theme
   - Mobile responsiveness is critical

---

## Production Deployment

### 1. Deploy to Vercel (or your platform)

```bash
# Build and deploy
npm run build
vercel --prod
```

### 2. Update Environment Variables

In your hosting platform (e.g., Vercel):

1. Add all Shopify environment variables
2. Set `NEXTAUTH_URL` to production domain
3. Ensure all secrets are properly configured

### 3. Update Shopify Partner Dashboard

1. **App URL**: `https://your-production-domain.com`
2. **App Proxy URL**: `https://your-production-domain.com/api/shopify-proxy/widget`
3. **Webhook URLs**: All pointing to production domain

### 4. Update `shopify.app.toml`

Replace development URLs with production URLs.

### 5. Test on Production Store

1. Install app on a live (or staging) store
2. Complete full customer journey
3. Verify webhooks are received
4. Test payment processing

---

## Merchant Installation

### For Merchants Installing Your App

1. **Find the App**:
   - If listed on Shopify App Store: Search and install
   - If unlisted: Use installation link provided by you

2. **Grant Permissions**:
   - Review and approve requested permissions
   - These are defined in your `access_scopes`

3. **Configure Product** (if needed):
   - Some merchants may need to link your app to a specific product
   - Provide clear instructions

4. **Add to Storefront**:
   The app is automatically accessible at:
   ```
   https://their-store.com/apps/love-album
   ```

5. **Optional - Add Navigation Link**:
   Merchants can add a link in their navigation:
   - Shopify Admin → Online Store → Navigation
   - Add menu item pointing to `/apps/love-album`
   - Label: "Create Your Love Album" (or similar)

### Installation Documentation for Merchants

Create a simple guide for merchants:

```markdown
# How to Install AI Love Story Album Generator

1. Install the app from your Shopify admin
2. Approve the requested permissions
3. The app will be automatically available at:
   https://your-store.com/apps/love-album
4. (Optional) Add a link to your store navigation:
   - Go to: Online Store → Navigation
   - Add link to: /apps/love-album
   - Link text: "Create Your Love Album"
```

---

## Troubleshooting

### Common Issues

#### 1. **Signature Verification Fails**

**Symptoms**: 401 Unauthorized errors

**Solutions**:
- Verify `SHOPIFY_CLIENT_SECRET` is correct
- Check that you're using the Client Secret, not Access Token
- Ensure parameter sorting in signature validation is correct
- Check Shopify logs in Partner Dashboard

#### 2. **Iframe Not Loading**

**Symptoms**: Blank page or iframe errors

**Solutions**:
- Check CORS headers in your responses
- Verify `NEXTAUTH_URL` is set correctly
- Ensure SSL certificate is valid (production)
- Check browser console for CSP errors

#### 3. **Authentication Issues**

**Symptoms**: Users can't log in via Google

**Solutions**:
- Verify Google OAuth redirect URIs include your domain
- Check `NEXTAUTH_URL` matches your actual domain
- Ensure cookies work in iframe context (SameSite settings)
- Consider alternative auth flow for iframe constraints

#### 4. **Payment Not Working**

**Symptoms**: Checkout fails or payment not processed

**Solutions**:
- Verify all Shopify checkout environment variables
- Check webhook is being received (Shopify admin → Settings → Notifications → Webhooks)
- Review webhook processing logs
- Ensure `SHOPIFY_PRODUCT_VARIANT_ID` is valid

#### 5. **Webhook Not Received**

**Symptoms**: Payment completes but album not unlocked

**Solutions**:
- Check webhook URL in Partner Dashboard is correct
- Verify webhook signature validation
- Check server logs for webhook processing errors
- Test webhook using Shopify's webhook tester

### Debug Mode

Enable detailed logging:

```typescript
// In your proxy route
console.log('Shopify Proxy Request:', {
  shop: shopifyParams.shop,
  customerId: shopifyParams.logged_in_customer_id,
  timestamp: shopifyParams.timestamp,
  // Don't log signature or secrets!
});
```

### Testing Tools

1. **Shopify CLI** - Test app proxy locally:
   ```bash
   shopify app dev
   ```

2. **Postman/Thunder Client** - Test API endpoints:
   - Mock Shopify signature
   - Test proxy endpoint directly

3. **Shopify Webhook Tester**:
   - In Partner Dashboard
   - Send test webhooks to your endpoint

---

## Advanced Configuration

### Custom Theme Integration (Optional)

For merchants who want deeper integration, you can create a theme app extension:

1. Create app block in `theme-app-extension/blocks/`
2. Merchants can add block to any page via theme editor
3. Block can link to `/apps/love-album` or embed widget directly

See: [Shopify Theme App Extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions)

### Multiple Languages

The widget respects the store's locale:

```typescript
// In widget page
const storeLocale = searchParams.get('locale') || 'en';
```

Configure next-intl to use store locale when available.

### Analytics

Track usage with Shopify Analytics or your preferred tool:

```typescript
// Track widget load
analytics.track('Widget Loaded', {
  shop: shopifyContext.shop,
  timestamp: Date.now()
});
```

---

## Support

For issues or questions:
- Check Shopify App Development docs
- Review this guide
- Check server logs
- Contact support with:
  - Shop domain
  - Error messages
  - Steps to reproduce

---

## Next Steps

1. ✅ Complete setup following this guide
2. ✅ Test thoroughly on development store
3. ✅ Deploy to production
4. ✅ Submit app for review (if publishing to App Store)
5. ✅ Provide merchant installation guide

**Your AI Love Story Album Generator is now ready for Shopify merchants!** 🎵💕
