# Quick Start: Shopify Integration (No Partner Account)

## For You (The Developer) - Since You Don't Have a Partner Account

This guide shows you how to deploy your AI Love Story Album Generator for Shopify stores **without needing a Shopify Partner account**.

---

## ✅ What You Need to Do

### 1. Deploy Your App

Deploy to Vercel (or your preferred hosting):

```bash
# Install dependencies
npm install

# Build
npm run build

# Deploy to Vercel
vercel --prod
```

**Your app URL**: `https://your-app.vercel.app`

### 2. Update Configuration

Edit `shopify-embed-snippet.liquid` (line 16):

```liquid
{% assign app_url = "https://your-actual-domain.vercel.app" %}
```

### 3. Test the Embed

Visit: `https://your-app.vercel.app/embed`

You should see the widget working.

### 4. Provide Files to Merchant

Send these files to your merchant/client:

1. **shopify-embed-snippet.liquid** (the Liquid snippet)
2. **MERCHANT_INSTALL_GUIDE.md** (installation instructions)

### 5. Configure Product for Merchant

Once the merchant creates their product, they'll give you:
- Store domain: `their-store.myshopify.com`
- Product Variant ID: `12345678901234`

Update your `.env`:

```bash
SHOPIFY_STORE_URL="their-store.myshopify.com"
SHOPIFY_PRODUCT_VARIANT_ID="12345678901234"
```

Redeploy:
```bash
vercel --prod
```

---

## 🎯 That's It!

**No Partner Account Needed!**

The merchant can now:
1. Add the snippet to their theme
2. Create a page with the widget
3. Their customers create albums
4. Checkout uses their Shopify store
5. Your webhook handles fulfillment

---

## How It Works

```
Customer visits merchant's page
          ↓
Iframe loads: your-app.vercel.app/embed
          ↓
Customer creates album
          ↓
Redirects to merchant's Shopify checkout
          ↓
Webhook to your app processes payment
          ↓
Customer gets album
```

---

## Testing Locally

For development with a real merchant:

1. **Use ngrok**:
   ```bash
   npm run dev
   ngrok http 3000
   ```

2. **Update snippet** with ngrok URL temporarily:
   ```liquid
   {% assign app_url = "https://abc123.ngrok.io" %}
   ```

3. **Test on merchant's store**

4. **When ready, switch back to production URL**

---

## What the Merchant Does

The merchant follows [MERCHANT_INSTALL_GUIDE.md](./MERCHANT_INSTALL_GUIDE.md):

1. ✅ Adds snippet to theme (5 min)
2. ✅ Creates a page (2 min)
3. ✅ Adds to navigation (2 min)
4. ✅ Shares product ID with you (1 min)

**Total: ~10 minutes**

---

## Advantages of This Approach

✅ **No Partner Account** - You don't need one
✅ **Simple Setup** - Merchant can do it themselves
✅ **Full Control** - You host and control everything
✅ **Works Immediately** - No app review process
✅ **Same Features** - Payment, webhooks all work
✅ **Multiple Stores** - Each store just adds the snippet

---

## Supporting Multiple Stores

If you work with multiple merchants:

### Track by Shop Domain

The embed URL includes shop parameter:
```
https://your-app.com/embed?shop=store1.myshopify.com
```

### Store-Specific Configuration

Create a simple config file or database:

```typescript
// lib/store-config.ts
const storeConfigs = {
  'store1.myshopify.com': {
    productVariantId: '12345',
    storeName: 'Romantic Gifts Co',
  },
  'store2.myshopify.com': {
    productVariantId: '67890',
    storeName: 'Love Stories Inc',
  },
};

export function getStoreConfig(shopDomain: string) {
  return storeConfigs[shopDomain];
}
```

Use in your checkout API:

```typescript
// In /api/payment/create-checkout/route.ts
const shopDomain = await request.json().shopDomain;
const config = getStoreConfig(shopDomain);

// Use config.productVariantId for this store's checkout
```

---

## Pricing Models

### Option 1: Per-Transaction Fee
- Free for merchant to install
- You charge customer directly
- Merchant gets product sale
- You get the album generation fee

### Option 2: Monthly Fee to Merchant
- Charge merchant monthly
- They set their own product price
- You provide the service

### Option 3: Revenue Share
- Split revenue with merchant
- Automated via Shopify checkout

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Update `shopify-embed-snippet.liquid` with your URL
3. ✅ Send snippet + guide to merchant
4. ✅ Configure product ID when merchant provides it
5. ✅ Test complete flow
6. ✅ Go live!

---

## Files Created for This Approach

- ✅ [/src/app/embed/page.tsx](src/app/embed/page.tsx) - Main embed page
- ✅ [/src/app/embed/results/page.tsx](src/app/embed/results/page.tsx) - Results page
- ✅ [shopify-embed-snippet.liquid](shopify-embed-snippet.liquid) - Merchant snippet
- ✅ [MERCHANT_INSTALL_GUIDE.md](MERCHANT_INSTALL_GUIDE.md) - Merchant instructions
- ✅ [SHOPIFY_EMBED_GUIDE.md](SHOPIFY_EMBED_GUIDE.md) - Technical details
- ✅ Updated [next.config.js](next.config.js) - CORS headers
- ✅ Updated [middleware.ts](src/middleware.ts) - Embed routes

---

## Support Resources

- [SHOPIFY_EMBED_GUIDE.md](./SHOPIFY_EMBED_GUIDE.md) - Full technical guide
- [MERCHANT_INSTALL_GUIDE.md](./MERCHANT_INSTALL_GUIDE.md) - For merchants
- Your existing Shopify webhook handler - Already works!
- Your existing checkout integration - Already works!

---

## Questions?

**Common Questions:**

**Q: Do I need Shopify Partner Dashboard access?**
A: No! That's the point of this approach.

**Q: Will webhooks work?**
A: Yes! Use your existing webhook endpoint.

**Q: Can I work with multiple stores?**
A: Yes! Each store adds the snippet independently.

**Q: Do I need to modify my existing code?**
A: No! The embed pages use all your existing components and APIs.

**Q: What if I want to upgrade to full App Proxy later?**
A: You can! Everything you built works with both approaches.

---

**You're ready to go! No Partner account needed.** 🎵💕

Deploy your app, send the files to your merchant, and start generating love albums!
