# Custom Shopify Store Setup Guide

Complete step-by-step guide to integrate the AI Love Album Generator into your custom Shopify store.

**Time Required:** 30 minutes
**Partner Account Required:** ❌ No
**Technical Level:** Beginner-friendly

---

## 📋 Prerequisites

- ✅ Your own Shopify store
- ✅ Access to Shopify Admin
- ✅ This application deployed (Vercel/Railway/etc.)
- ✅ Basic understanding of environment variables

---

## 🚀 Step-by-Step Setup

### Step 1: Create Custom App in Shopify (5 minutes)

1. **Go to Shopify Admin**
   - Navigate to: **Settings > Apps and sales channels**

2. **Develop apps for your store**
   - Click: **Develop apps** (at the bottom)
   - Click: **Create an app**

3. **Name your app**
   - App name: `AI Love Album Generator`
   - App developer: Your name/company
   - Click: **Create app**

4. **Configure Storefront API access**
   - Click: **Configure Storefront API scopes**
   - Enable these permissions:
     - ✅ `unauthenticated_read_product_listings`
     - ✅ `unauthenticated_write_checkouts`
     - ✅ `unauthenticated_read_checkouts`
   - Click: **Save**

5. **Install the app**
   - Click: **Install app**
   - Confirm installation

6. **Get your Storefront Access Token**
   - Go to: **API credentials** tab
   - Under **Storefront API access token**
   - Copy the token (starts with a long alphanumeric string)
   - ⚠️ **Save this securely** - you'll need it in Step 3

---

### Step 2: Create Product & Get Variant ID (5 minutes)

1. **Create a new product**
   - Go to: **Products > Add product**
   - Fill in:
     - **Title:** `Love Story Album - AI Generated`
     - **Description:** Your product description
     - **Price:** Set your price (e.g., $49.99)
     - **Inventory:** Manage as you prefer
   - Click: **Save**

2. **Get the Product Variant ID**
   - On the product page, click: **More actions > View**
   - Look at the URL: `https://admin.shopify.com/store/YOUR-STORE/products/PRODUCT_ID`
   - Copy the `PRODUCT_ID` number
   - Or use Shopify Admin API to get variant ID

   **Alternative method (easier):**
   - Install the **Shopify GraphiQL App** from Shopify App Store
   - Run this query:
     ```graphql
     {
       products(first: 1, query: "title:Love Story Album") {
         edges {
           node {
             id
             title
             variants(first: 1) {
               edges {
                 node {
                   id
                   price
                 }
               }
             }
           }
         }
       }
     }
     ```
   - Extract the numeric ID from the variant GID (e.g., `gid://shopify/ProductVariant/12345678` → use `12345678`)

---

### Step 3: Configure Environment Variables (5 minutes)

Update your `.env.local` (or deployment environment variables):

```bash
# Shopify Storefront API Configuration
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_token_from_step_1
SHOPIFY_WEBHOOK_SECRET=any_random_secure_string_here
SHOPIFY_PRODUCT_VARIANT_ID=your_variant_id_from_step_2
```

**Example:**
```bash
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=love-albums.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=abc123def456ghi789jkl012mno345pqr678
SHOPIFY_WEBHOOK_SECRET=my_super_secure_webhook_secret_key_123
SHOPIFY_PRODUCT_VARIANT_ID=45678901234
```

**Security Note:**
- Generate a strong random string for `SHOPIFY_WEBHOOK_SECRET`:
  ```bash
  openssl rand -base64 32
  ```

---

### Step 4: Add Liquid Template to Theme (10 minutes)

Choose one of two options:

#### Option A: Page Template (Recommended)

**Best for:** Dedicated page like `/pages/create-album`

1. Go to: **Online Store > Themes > Edit code**
2. Under **Templates**, click **Add a new template**
3. Select: **page**
4. Name it: `love-album`
5. Paste the code from `shopify-templates/page.love-album.liquid`
6. **IMPORTANT:** Replace `YOUR_APP_DOMAIN` with your actual domain
   ```liquid
   src="https://YOUR_APP_DOMAIN/embed?shop={{ shop.domain }}"
   ```
   becomes
   ```liquid
   src="https://love-album.vercel.app/embed?shop={{ shop.domain }}"
   ```
7. Click **Save**

8. Create a new page:
   - Go to: **Online Store > Pages > Add page**
   - Title: `Create Your Love Album`
   - Content: Add any introductory text
   - **Template:** Select `page.love-album`
   - Click **Save**

#### Option B: Section (More Flexible)

**Best for:** Adding to any page including homepage

1. Go to: **Online Store > Themes > Edit code**
2. Under **Sections**, click **Add a new section**
3. Name it: `love-album-embed`
4. Paste the code from `shopify-templates/section-love-album-embed.liquid`
5. Replace `YOUR_APP_DOMAIN` with your actual domain
6. Click **Save**

7. Add section to a page:
   - Go to: **Online Store > Themes > Customize**
   - Navigate to any page
   - Click **Add section**
   - Select: **Love Album Embed**
   - Customize settings
   - Click **Save**

**See:** [shopify-templates/README.md](./shopify-templates/README.md) for detailed template documentation

---

### Step 5: Configure Webhooks (5 minutes)

Webhooks notify your app when orders are paid.

1. **In Shopify Admin**
   - Go to: **Settings > Notifications**
   - Scroll to: **Webhooks**
   - Click: **Create webhook**

2. **Configure Order Payment Webhook**
   - **Event:** `Order payment`
   - **Format:** `JSON`
   - **URL:** `https://your-domain.com/api/shopify/webhook`
   - **API Version:** Latest (2024-10 or newer)
   - Click: **Save**

3. **Get Webhook Signing Secret** (if not already set)
   - The webhook secret is used to verify webhook authenticity
   - If you haven't already, you can view/copy it from webhook settings

**Webhook Handler Location:**
- Your app handles webhooks at: `/api/shopify/webhook`
- The handler verifies HMAC signatures and processes orders
- Located at: `src/app/api/shopify/webhook/route.ts`

---

### Step 6: Deploy & Test (5 minutes)

1. **Deploy your application**
   ```bash
   # If using Vercel
   vercel --prod

   # Or push to your deployment platform
   git push origin main
   ```

2. **Verify environment variables** are set in production

3. **Test the integration:**
   - Visit your Shopify page with the embed
   - Fill out the love story form
   - Submit and verify:
     - ✅ Story analysis completes
     - ✅ Redirects to Shopify checkout
     - ✅ Checkout URL contains your product
     - ✅ Can complete test purchase

4. **Test webhook delivery:**
   - Complete a test order
   - Check your app logs for webhook processing
   - Verify `AlbumSession.hasPaid` is updated in database

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Can access embed page in your Shopify store
- [ ] Form loads correctly in iframe
- [ ] Can submit story and see analysis
- [ ] Redirects to Shopify checkout with correct product
- [ ] Can complete checkout flow
- [ ] Webhook fires after payment
- [ ] Album session marked as paid in database
- [ ] User receives email with album link

---

## 🎨 Customization

### Styling the Embed

The Liquid templates include customizable options:

**Page Template:**
- Edit CSS in `<style>` block
- Adjust iframe dimensions
- Modify container styling

**Section Template:**
- Use theme editor to customize:
  - Colors
  - Padding
  - Maximum width
  - Shadow effects

### Branding

Update the Liquid templates to match your store:
- Add your logo
- Customize heading text
- Adjust color scheme
- Add custom fonts

---

## 🔒 Security Best Practices

1. **Storefront Token**
   - ✅ Use `NEXT_PUBLIC_` prefix (safe for client-side)
   - ✅ Has limited permissions (public API access only)
   - ❌ Never expose Admin API tokens publicly

2. **Webhook Secret**
   - ✅ Keep secret and secure
   - ✅ Use strong random string
   - ✅ Verify HMAC signatures in webhook handler

3. **Origin Verification**
   - ✅ Liquid templates verify postMessage origin
   - ✅ Update `YOUR_APP_DOMAIN` in templates

4. **Database**
   - ✅ Use environment variables for DATABASE_URL
   - ✅ Enable SSL for production database
   - ✅ Regular backups

---

## 🐛 Troubleshooting

### Embed Not Loading

**Problem:** Iframe shows blank or error

**Solutions:**
1. Verify `YOUR_APP_DOMAIN` is correctly set in Liquid template
2. Check CORS configuration
3. Ensure app is deployed and accessible
4. Check browser console for errors

### Checkout Creation Fails

**Problem:** Error creating checkout

**Solutions:**
1. Verify `SHOPIFY_PRODUCT_VARIANT_ID` is correct
2. Check Storefront API token permissions
3. Ensure product is active and available
4. Check app logs for detailed error

### Webhook Not Firing

**Problem:** Orders not marked as paid

**Solutions:**
1. Verify webhook URL is correct
2. Check webhook status in Shopify Admin
3. Test webhook using Shopify's "Send test notification"
4. Verify `SHOPIFY_WEBHOOK_SECRET` matches
5. Check app logs for webhook errors

### iframe Not Resizing

**Problem:** Content cut off or too much white space

**Solutions:**
1. Verify postMessage origin verification
2. Check browser console for postMessage errors
3. Ensure embed page sends resize messages
4. Try adjusting `initial_height` in template

---

## 📞 Support Resources

### Shopify Documentation
- [Storefront API](https://shopify.dev/docs/api/storefront)
- [Custom Apps](https://help.shopify.com/en/manual/apps/custom-apps)
- [Webhooks](https://shopify.dev/docs/apps/webhooks)
- [Liquid Templates](https://shopify.dev/docs/themes/liquid)

### Application Files
- **API Client:** [src/lib/shopify-storefront.ts](src/lib/shopify-storefront.ts)
- **Payment Endpoint:** [src/app/api/payment/create-checkout/route.ts](src/app/api/payment/create-checkout/route.ts)
- **Webhook Handler:** [src/app/api/shopify/webhook/route.ts](src/app/api/shopify/webhook/route.ts)
- **Embed Page:** [src/app/embed/page.tsx](src/app/embed/page.tsx)

### Template Files
- **Page Template:** [shopify-templates/page.love-album.liquid](shopify-templates/page.love-album.liquid)
- **Section Template:** [shopify-templates/section-love-album-embed.liquid](shopify-templates/section-love-album-embed.liquid)
- **Template Guide:** [shopify-templates/README.md](shopify-templates/README.md)

---

## 🎉 You're Done!

Your AI Love Album Generator is now fully integrated with your Shopify store!

Customers can:
1. Visit your custom page
2. Share their love story
3. Get AI-generated song concepts
4. Checkout seamlessly through Shopify
5. Receive their personalized album

**Next Steps:**
- Test the complete flow end-to-end
- Customize the design to match your brand
- Set up production environment variables
- Monitor logs for any issues
- Market your new feature! 🚀

---

**Questions?** Refer to [PERFECT_CUSTOM_STORE_INTEGRATION.md](./PERFECT_CUSTOM_STORE_INTEGRATION.md) for technical details.
