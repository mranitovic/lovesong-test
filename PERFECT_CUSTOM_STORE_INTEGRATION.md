# Perfect Shopify Integration for Your Custom Store

## 🎯 Overview

Since this is **your own store only**, you can create the **perfect integration** without Partner account limitations. This approach gives you seamless Shopify integration with complete control.

---

## 🏆 The Perfect Approach: Next.js + Storefront API

### Why This is Perfect

1. ✅ **No Partner Account Needed** - Direct Storefront API access
2. ✅ **Seamless UX** - Customers never leave your domain
3. ✅ **Full Control** - Complete customization
4. ✅ **Native Checkout** - Use Shopify's secure checkout
5. ✅ **Fast** - Optimized for performance
6. ✅ **Simple** - No complex app infrastructure

---

## 📐 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    YOUR NEXT.JS APP                          │
│                  (your-domain.com)                            │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Your Existing App                                      │ │
│  │  - Story form                                           │ │
│  │  - AI analysis                                          │ │
│  │  - Music generation                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                   │
│                           │ When ready to checkout            │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Storefront API Integration (NEW)                      │ │
│  │  - Create cart directly                                │ │
│  │  - Add album session as attributes                     │ │
│  │  - Get checkout URL                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
                            │ Redirect to
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              SHOPIFY CHECKOUT                                 │
│           (your-store.myshopify.com/checkouts/...)          │
│                                                               │
│  - Native Shopify checkout experience                        │
│  - Secure payment processing                                 │
│  - Returns to your store after purchase                      │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ Webhook
                            ▼
┌──────────────────────────────────────────────────────────────┐
│         YOUR WEBHOOK HANDLER (EXISTING)                       │
│           /api/shopify/webhook                                │
│                                                               │
│  - Receives order confirmation                                │
│  - Unlocks album                                              │
│  - Sends emails                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠 Implementation

### Step 1: Get Storefront API Access Token

**In Shopify Admin:**

1. Go to **Settings** → **Apps and sales channels**
2. Click **Develop apps** (at top right)
3. Click **Create an app**
4. Name it: "Love Album Storefront"
5. Click **Configure Storefront API scopes**
6. Enable these scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_checkouts`
7. **Save** → **Install app**
8. Copy your **Storefront API access token**

### Step 2: Update Environment Variables

Add to `.env.local`:

```bash
# Shopify Storefront API (for custom store)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN="your_storefront_access_token"
SHOPIFY_PRODUCT_VARIANT_ID="your_product_variant_id"

# Existing vars remain the same
SHOPIFY_WEBHOOK_SECRET="your_webhook_secret"
```

### Step 3: Create Storefront API Client

Create `/src/lib/shopify-storefront.ts`:

```typescript
/**
 * Shopify Storefront API Client
 * Direct integration for custom store
 */

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!;
const API_VERSION = '2024-10';

export interface CartInput {
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  id: string;
}

/**
 * Create a cart and get checkout URL
 */
export async function createCheckout(
  items: CartInput[],
  note?: string
): Promise<CheckoutResponse> {
  const mutation = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lines: items,
      note: note,
    },
  };

  const response = await fetch(
    `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: mutation, variables }),
    }
  );

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
  }

  if (data.data?.cartCreate?.userErrors?.length > 0) {
    throw new Error(
      `Cart Error: ${data.data.cartCreate.userErrors[0].message}`
    );
  }

  return {
    checkoutUrl: data.data.cartCreate.cart.checkoutUrl,
    id: data.data.cartCreate.cart.id,
  };
}

/**
 * Get product by variant ID
 */
export async function getProductVariant(variantId: string) {
  const query = `
    query getVariant($id: ID!) {
      node(id: $id) {
        ... on ProductVariant {
          id
          title
          price {
            amount
            currencyCode
          }
          product {
            title
            handle
          }
        }
      }
    }
  `;

  const variables = {
    id: `gid://shopify/ProductVariant/${variantId}`,
  };

  const response = await fetch(
    `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const data = await response.json();
  return data.data?.node;
}
```

### Step 4: Update Payment API to Use Storefront API

Update `/src/app/api/payment/create-checkout/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { createCheckout } from '@/lib/shopify-storefront';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { albumSessionId, userId } = await request.json();

    if (!albumSessionId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify the album session
    const albumSession = await prisma.albumSession.findFirst({
      where: {
        id: albumSessionId,
        userId: userId,
        hasPaid: false,
      },
    });

    if (!albumSession) {
      return NextResponse.json(
        { success: false, error: 'Album session not found or already paid' },
        { status: 404 }
      );
    }

    const variantId = process.env.SHOPIFY_PRODUCT_VARIANT_ID;
    if (!variantId) {
      return NextResponse.json(
        { success: false, error: 'Product not configured' },
        { status: 500 }
      );
    }

    console.log('Creating checkout for album session:', albumSessionId);

    // Create checkout using Storefront API
    const checkout = await createCheckout(
      [
        {
          merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
          quantity: 1,
          attributes: [
            { key: 'album_session_id', value: albumSessionId },
            { key: 'user_email', value: session.user.email },
          ],
        },
      ],
      `Album Session: ${albumSessionId}`
    );

    // Store checkout ID for tracking
    await prisma.albumSession.update({
      where: { id: albumSessionId },
      data: { shopifyCheckoutId: checkout.id },
    });

    console.log('✅ Checkout created successfully');

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkout.checkoutUrl,
      },
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 5: Add to Your Store

**Option A: As a Page** (Recommended)

In your Shopify theme, create a new page template or add to an existing one:

```liquid
<!-- templates/page.love-album.liquid -->
<div class="page-width">
  <div class="love-album-page">
    <iframe
      src="https://your-next-app.vercel.app/embed?shop={{ shop.permanent_domain }}"
      style="width: 100%; min-height: 800px; border: none;"
      title="Create Your Love Album"
    ></iframe>
  </div>
</div>

<script>
  // Auto-resize iframe
  window.addEventListener('message', function(e) {
    if (e.data.type === 'resize') {
      document.querySelector('iframe').style.height = e.data.height + 'px';
    }
  });
</script>
```

**Option B: Custom Section**

Create a custom section in your theme:

```liquid
<!-- sections/love-album.liquid -->
{% schema %}
{
  "name": "Love Album Generator",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Create Your AI Love Story Album"
    }
  ],
  "presets": [
    {
      "name": "Love Album Generator"
    }
  ]
}
{% endschema %}

<div class="love-album-section">
  {% if section.settings.heading != blank %}
    <h2>{{ section.settings.heading }}</h2>
  {% endif %}

  <iframe
    src="https://your-next-app.vercel.app/embed?shop={{ shop.permanent_domain }}"
    style="width: 100%; min-height: 800px; border: none;"
    title="Create Your Love Album"
  ></iframe>
</div>
```

---

## ✨ Enhanced Features for Your Custom Store

### 1. Pre-fill Customer Data

If customer is logged in, pre-fill their information:

```typescript
// In your embed page
useEffect(() => {
  // Check if Shopify customer data is available
  if (window.ShopifyAnalytics?.meta?.page?.customerId) {
    const customerId = window.ShopifyAnalytics.meta.page.customerId;
    // Fetch customer data from your API
    fetchCustomerData(customerId);
  }
}, []);
```

### 2. Return Customer Experience

After checkout, return to your store:

```typescript
// In checkout creation
const checkout = await createCheckout(items, note);

// Add return URL
const returnUrl = `https://your-domain.com/album-created?session=${albumSessionId}`;
const checkoutUrlWithReturn = `${checkout.checkoutUrl}&return_to=${encodeURIComponent(returnUrl)}`;

return { checkoutUrl: checkoutUrlWithReturn };
```

### 3. Shop-Specific Branding

Customize based on your shop's theme:

```typescript
// Get theme colors from Shopify
const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary') || '#ec4899';

// Apply to your widget
```

### 4. Shopify Customer Account Integration

Link with Shopify customer accounts:

```typescript
// After successful purchase
if (shopifyCustomerId) {
  await associateShopifyCustomer(
    userId,
    'your-store.myshopify.com',
    shopifyCustomerId
  );
}
```

### 5. Multi-Currency Support

Detect customer's currency:

```typescript
const currency = window.Shopify?.currency?.active || 'USD';
const price = convertPrice(basePrice, currency);
```

---

## 🎨 Perfect UX Flow

### 1. Customer Journey

```
Customer visits your store
        ↓
Clicks "Create Love Album" in navigation
        ↓
Lands on embedded page (your Next.js app)
        ↓
Fills out love story (your existing flow)
        ↓
Sees AI analysis and song concepts
        ↓
Clicks "Purchase" (your existing flow)
        ↓
Redirects to Shopify checkout (native, secure)
        ↓
Completes payment on Shopify
        ↓
Returns to your store with success message
        ↓
Receives webhook → Album unlocked
        ↓
Gets emails with album access
        ↓
Music generation begins
        ↓
Customer enjoys their album! 🎵
```

### 2. Navigation Integration

Add to your Shopify store navigation:

```
Main Menu
├── Home
├── Shop
├── Create Your Album ← NEW (links to /pages/love-album)
├── About
└── Contact
```

### 3. Homepage Integration

Add a hero section or featured content:

```liquid
<!-- In sections/hero.liquid -->
<div class="hero">
  <h1>Create Your AI-Powered Love Story Album</h1>
  <p>Turn your love story into a personalized 5-song album</p>
  <a href="/pages/love-album" class="btn btn-primary">
    Get Started
  </a>
</div>
```

---

## 📊 Comparison: Why This is Perfect for You

| Aspect | This Approach | App Proxy | Simple Embed |
|--------|--------------|-----------|--------------|
| **Partner Account** | ❌ Not needed | ✅ Required | ❌ Not needed |
| **Setup Time** | 1 hour | 4+ hours | 30 min |
| **Customization** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐���⭐ | ⭐⭐⭐⭐ |
| **Checkout** | Native Shopify | Native Shopify | Native Shopify |
| **Updates** | Instant | Instant | Requires redeploy |
| **API Access** | Direct | Via proxy | Direct |
| **Professional** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🚀 Implementation Checklist

### Phase 1: Setup (30 min)
- [ ] Create Storefront API app in Shopify admin
- [ ] Get Storefront API access token
- [ ] Add environment variables
- [ ] Create `shopify-storefront.ts` utility
- [ ] Update payment API

### Phase 2: Integration (30 min)
- [ ] Add embed page to Shopify theme
- [ ] Add navigation link
- [ ] Test embed loads correctly
- [ ] Verify iframe resizing works

### Phase 3: Testing (1 hour)
- [ ] Test complete customer flow
- [ ] Test payment with test orders
- [ ] Verify webhook receives data
- [ ] Test album unlock
- [ ] Verify emails sent

### Phase 4: Polish (30 min)
- [ ] Add loading states
- [ ] Optimize iframe performance
- [ ] Add error handling
- [ ] Mobile optimization
- [ ] Cross-browser testing

### Phase 5: Go Live!
- [ ] Deploy Next.js app to production
- [ ] Update Shopify theme with production URL
- [ ] Enable live product
- [ ] Monitor first orders
- [ ] Celebrate! 🎉

---

## 💡 Pro Tips

### 1. Use Shopify's Test Mode

Enable test payments in Shopify:
- Settings → Payments → Test mode
- Use Shopify's test credit cards
- Verify full flow before going live

### 2. Custom Domain

Use your own domain:
- Buy domain
- Connect to Vercel
- Update all URLs
- Seamless branding!

### 3. Analytics Integration

Track everything:
```typescript
// Shopify Analytics
window.ShopifyAnalytics?.lib?.track('Album Started');

// Google Analytics
gtag('event', 'album_created', { genre: 'pop' });
```

### 4. SEO Optimization

Make the page discoverable:
```html
<meta name="description" content="Create your personalized AI love story album">
<meta property="og:title" content="AI Love Album Generator">
<meta property="og:image" content="preview.jpg">
```

### 5. Performance

- Use CDN for static assets
- Enable Vercel Edge Functions
- Optimize images
- Lazy load components

---

## 🎯 Why This is THE Perfect Approach

### For Your Use Case:

1. **✅ No Partner Account** - Works immediately
2. **✅ Full Control** - Your store, your rules
3. **✅ Professional** - Enterprise-grade integration
4. **✅ Seamless** - Customers never leave your brand
5. **✅ Fast** - Direct API, optimized
6. **✅ Secure** - Shopify handles payment
7. **✅ Scalable** - Handles unlimited traffic
8. **✅ Maintainable** - Simple architecture
9. **✅ Flexible** - Easy to update
10. **✅ Perfect UX** - Best customer experience

### What You Get:

- ✨ Native Shopify checkout
- ✨ Your existing app works as-is
- ✨ Direct Storefront API access
- ✨ Complete customization
- ✨ Professional appearance
- ✨ Fast performance
- ✨ Easy maintenance

---

## 🎵 Ready to Implement?

This is the **perfect balance** of:
- Professional integration
- Simple implementation
- No Partner account needed
- Complete control
- Best user experience

**Your Next.js app + Shopify Storefront API = Perfect custom store integration**

Would you like me to implement this perfect integration now?
