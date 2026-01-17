# Simple Shopify Embed (No Partner Account Required)

This guide shows how to embed your AI Love Story Album Generator into a Shopify store **without** needing a Shopify Partner account. This approach works when:
- You're building for a specific merchant/store
- The merchant's developer will do the integration
- You want a simpler, direct integration

## Option 1: Theme Snippet Embed (Simplest)

### How It Works
The merchant adds a code snippet to their Shopify theme that embeds your app via iframe.

### Implementation Steps

#### 1. Create a Public Widget Page

Your app already has the widget, but let's make it publicly accessible without Shopify proxy:

Create `/src/app/embed/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import MultiStepStoryForm from '@/app/components/MultiStepStoryForm';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { StoryAnalysis, StoryAnswers } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';

export default function EmbedPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; step: string } | undefined>();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get shop domain from URL for tracking
  const shopDomain = searchParams.get('shop');

  useEffect(() => {
    // Send height updates to parent
    const sendHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'resize', height }, '*');
    };

    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, []);

  const formatStoryFromAnswers = (storyAnswers: StoryAnswers): string => {
    const { names, meeting, attraction, memorable, challenges, future, genres } = storyAnswers;
    return `This is the love story of ${names.person1} and ${names.person2}.

How they met: ${meeting}

What made them fall in love: ${attraction}

Their most memorable moment: ${memorable}

Challenges they've overcome: ${challenges}

Their future together: ${future}

Favorite music genres: ${genres.join(', ')}`;
  };

  const handleStorySubmit = async (storyAnswers: StoryAnswers) => {
    setIsLoading(true);
    setProgress({ current: 1, total: 1, step: 'Analyzing your love story...' });

    try {
      const story = formatStoryFromAnswers(storyAnswers);

      const analysisResponse = await fetch('/api/analyze-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          coupleNames: storyAnswers.names,
          genres: storyAnswers.genres,
          locale: 'en',
          shopDomain, // Track which shop this came from
        }),
      });

      const analysisResult = await analysisResponse.json();

      if (!analysisResult.success || !analysisResult.data) {
        throw new Error(analysisResult.error || 'Failed to analyze story');
      }

      const albumData = {
        story,
        storyAnswers,
        analysis: analysisResult.data,
        createdAt: new Date().toISOString(),
        locale: 'en',
        shopDomain,
      };

      sessionStorage.setItem('albumData', JSON.stringify(albumData));
      localStorage.removeItem('storyAnswers');

      router.push('/embed/results');
    } catch (error) {
      console.error('Error analyzing story:', error);
      alert('An error occurred while analyzing your story. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress(undefined);
    }
  };

  if (isLoading) {
    return <LoadingSpinner progress={progress} />;
  }

  return (
    <div className="embed-container p-4">
      <MultiStepStoryForm onSubmit={handleStorySubmit} isLoading={isLoading} />

      <style jsx global>{`
        body {
          background: transparent;
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
```

#### 2. Provide Embed Code to Merchant

Give the merchant this Liquid/HTML code to add to their theme:

**File**: `snippets/love-album-embed.liquid`

```liquid
<!-- AI Love Story Album Embed -->
<div class="love-album-wrapper">
  <iframe
    id="love-album-frame"
    src="https://your-app-domain.com/embed?shop={{ shop.permanent_domain }}"
    frameborder="0"
    scrolling="no"
    style="width: 100%; border: none; min-height: 600px;"
    allow="payment"
  ></iframe>
</div>

<script>
  // Auto-resize iframe based on content
  window.addEventListener('message', function(event) {
    // Verify origin in production
    // if (event.origin !== "https://your-app-domain.com") return;

    if (event.data.type === 'resize' && event.data.height) {
      var iframe = document.getElementById('love-album-frame');
      if (iframe) {
        iframe.style.height = event.data.height + 'px';
      }
    }
  });
</script>

<style>
  .love-album-wrapper {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
</style>
```

#### 3. Merchant Adds to Theme

The merchant (or their developer) adds the snippet to a page:

**Option A: Create a dedicated page**
1. Admin → Online Store → Pages → Add page
2. Click "Show HTML"
3. Add: `{% render 'love-album-embed' %}`

**Option B: Add to existing template**
1. Admin → Online Store → Themes → Edit code
2. Open `templates/page.love-album.liquid`
3. Add the snippet where desired

#### 4. Update Your CORS Settings

In `next.config.js`:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/embed/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' }, // In production, specify the merchant's domain
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        ],
      },
    ];
  },
}
```

---

## Option 2: Metafield App (No App Proxy)

Use Shopify metafields to store configuration, then render your app on product/collection pages.

### How It Works
1. Merchant creates a product for "Love Album"
2. You provide a script tag that loads your widget
3. Widget checks product ID and renders on that product page

### Implementation

Create `/public/shopify-widget.js`:

```javascript
(function() {
  // Configuration
  const APP_URL = 'https://your-app-domain.com';
  const CONTAINER_ID = 'love-album-widget';

  // Get shop domain
  const shopDomain = Shopify.shop;

  // Create container if it doesn't exist
  let container = document.getElementById(CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = CONTAINER_ID;
    document.body.appendChild(container);
  }

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = `${APP_URL}/embed?shop=${shopDomain}`;
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.minHeight = '600px';

  container.appendChild(iframe);

  // Handle resize messages
  window.addEventListener('message', function(event) {
    if (event.origin !== APP_URL) return;
    if (event.data.type === 'resize') {
      iframe.style.height = event.data.height + 'px';
    }
  });
})();
```

Give merchant this script tag:

```html
<script src="https://your-app-domain.com/shopify-widget.js"></script>
<div id="love-album-widget"></div>
```

---

## Option 3: Direct Page Integration

Create a standalone page that the merchant can link to.

### Implementation

Your app is already accessible at: `https://your-app-domain.com`

Merchant simply:
1. Creates a navigation menu item
2. Links to: `https://your-app-domain.com?shop=their-store.myshopify.com`
3. Customers click and go directly to your app

**Pros:**
- Simplest setup
- No theme modifications
- Full control over UX

**Cons:**
- Takes customers off merchant's domain
- Less integrated feel

To make it seamless, update your main page to detect shop parameter:

```typescript
// In your main page component
const searchParams = useSearchParams();
const shopDomain = searchParams.get('shop');

// Optionally customize branding per shop
if (shopDomain) {
  // Load shop-specific settings
  // Track analytics for this shop
}
```

---

## Payment Integration

All three options work with your existing Shopify checkout flow:

1. Customer creates album
2. Your app calls `/api/payment/create-checkout` (existing)
3. Redirects to Shopify checkout
4. Webhook processes payment (existing)
5. Customer gets album

**Important**: Update checkout creation to include shop domain:

```typescript
// In create-checkout API
const { shopDomain } = await request.json();

// Use the merchant's store for checkout
const storefrontEndpoint = `https://${shopDomain}/api/2024-10/graphql.json`;
```

---

## Comparison

| Method | Complexity | Integration | Best For |
|--------|-----------|-------------|----------|
| **Theme Snippet** | Low | Medium | Single merchant, custom integration |
| **Script Tag** | Medium | High | Multiple merchants, easy install |
| **Direct Link** | Very Low | Low | Quick start, minimal setup |

---

## Recommended Approach for Your Case

Since you **don't have a Shopify Partner account**, I recommend:

### **Theme Snippet Embed** (Option 1)

**Why?**
- Works immediately
- No Partner account needed
- Merchant's developer can implement
- Keeps customers on merchant's domain
- Uses your existing checkout integration

**What You Provide:**
1. Your app URL: `https://your-app-domain.com`
2. Embed code snippet (shown above)
3. Installation instructions

**What Merchant Does:**
1. Add snippet to theme
2. Configure product for checkout
3. Add navigation link

---

## Quick Start Guide for Merchant

Create this file: `MERCHANT_INSTALL.md`

```markdown
# Installation Guide for Merchants

## What You'll Get
AI-powered Love Story Album Generator embedded in your Shopify store.

## Prerequisites
- Shopify store
- Product created for "Love Album" with price configured
- Access to theme code editor

## Installation Steps

1. **Add the embed snippet**
   - Admin → Online Store → Themes → Actions → Edit code
   - Snippets → Add a new snippet → Name: `love-album-embed`
   - Paste the provided code
   - Save

2. **Create a page**
   - Admin → Online Store → Pages → Add page
   - Title: "Create Your Love Album"
   - Content → Show HTML → Add: `{% render 'love-album-embed' %}`
   - Save

3. **Add to navigation**
   - Admin → Online Store → Navigation
   - Add menu item linking to the page
   - Label: "Create Your Album"

4. **Configure product**
   - Share your Product Variant ID with us
   - We'll configure it in the app

## That's it!
Your customers can now create love albums at:
`https://your-store.com/pages/create-your-love-album`
```

---

## Next Steps for You

1. Create the `/src/app/embed/page.tsx` file (code provided above)
2. Update CORS in `next.config.js`
3. Deploy your app to production
4. Provide embed code and installation guide to merchant
5. Merchant implements in their theme

**No Shopify Partner account needed!** ✅
