# Shopify Embed Flow - Visual Guide

## Complete Customer Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER JOURNEY                             │
└─────────────────────────────────────────────────────────────────────┘

1️⃣  CUSTOMER VISITS MERCHANT STORE
    │
    ├─> https://merchant-store.com
    │
    └─> Clicks "Create Your Album" in navigation


2️⃣  LOADS YOUR WIDGET PAGE
    │
    ├─> URL: https://merchant-store.com/pages/create-your-love-album
    │
    ├─> Page contains: {% render 'love-album-embed' %}
    │
    └─> Snippet loads iframe:
        └─> https://your-app.vercel.app/embed?shop=merchant-store.myshopify.com


3️⃣  CUSTOMER FILLS OUT STORY
    │
    ├─> Inside iframe, your app shows MultiStepStoryForm
    │
    ├─> Customer enters:
    │   - Names
    │   - How they met
    │   - Favorite moments
    │   - Music genres
    │
    └─> Clicks "Generate My Album"


4️⃣  AI ANALYZES STORY
    │
    ├─> POST /api/analyze-story
    │
    ├─> OpenAI GPT-4 analyzes:
    │   - Story themes
    │   - Emotional moments
    │   - Creates 5 song concepts
    │
    └─> Returns analysis


5️⃣  SHOWS PAYMENT GATE
    │
    ├─> Redirects to /embed/results
    │
    ├─> Shows:
    │   - Album summary
    │   - 5 song concepts
    │   - Payment button
    │
    └─> If not logged in: Shows Google sign-in


6️⃣  CUSTOMER AUTHENTICATES (if needed)
    │
    ├─> Google OAuth flow
    │
    ├─> Creates/links user account
    │
    └─> Returns to payment gate


7️⃣  CUSTOMER CLICKS "PURCHASE"
    │
    ├─> POST /api/payment/create-checkout
    │
    ├─> Creates Shopify cart with:
    │   - Product: Love Album
    │   - Price: $XX.XX
    │   - Metadata: album_session_id
    │
    └─> Gets checkout URL


8️⃣  REDIRECTS TO SHOPIFY CHECKOUT
    │
    ├─> Customer leaves iframe
    │
    ├─> Goes to: merchant-store.com/checkouts/xxxxx
    │
    ├─> Native Shopify checkout experience
    │
    └─> Customer completes payment


9️⃣  SHOPIFY PROCESSES PAYMENT
    │
    ├─> Payment captured
    │
    ├─> Order created
    │
    └─> Shopify sends webhook:
        └─> POST https://your-app.vercel.app/api/shopify/webhook


🔟  YOUR WEBHOOK HANDLES ORDER
    │
    ├─> Verifies HMAC signature
    │
    ├─> Finds album session by:
    │   - Checkout ID
    │   - Album session ID
    │   - User email
    │
    ├─> Updates database:
    │   - AlbumSession.hasPaid = true
    │   - Creates Purchase record
    │
    └─> Sends emails:
        - Payment confirmation
        - Access granted


1️⃣1️⃣  CUSTOMER RECEIVES EMAILS
    │
    ├─> Email 1: Payment confirmation
    │   - Thank you for purchase
    │   - Order details
    │
    └─> Email 2: Album access
        - Link to view/download album
        - Instructions


1️⃣2️⃣  CUSTOMER ACCESSES ALBUM
    │
    ├─> Clicks link in email
    │
    ├─> Goes to: your-app.vercel.app/[locale]/results
    │
    ├─> Shows:
    │   - 5 generated songs
    │   - Album cover
    │   - Download buttons
    │
    └─> Music generation begins:
        └─> Suno API creates actual songs


1️⃣3️⃣  CUSTOMER ENJOYS ALBUM
    │
    ├─> Listens to songs
    │
    ├─> Downloads audio files
    │
    └─> Shares with loved one ❤️
```

---

## Technical Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                  TECHNICAL ARCHITECTURE                           │
└──────────────────────────────────────────────────────────────────┘

MERCHANT'S SHOPIFY STORE
├─ Page Template
│  └─ {% render 'love-album-embed' %}
│     └─ <iframe src="YOUR_APP/embed?shop=STORE">
│
└─ Shopify Checkout
   └─ Native payment processing


YOUR NEXT.JS APP (Vercel)
├─ /embed
│  ├─ MultiStepStoryForm component
│  ├─ Collects love story
│  └─ Sends to /api/analyze-story
│
├─ /embed/results
│  ├─ PaymentGate component
│  ├─ GoogleLoginGate (if needed)
│  └─ Creates Shopify checkout
│
├─ /api/analyze-story
│  ├─ OpenAI GPT-4 integration
│  └─ Returns song concepts
│
├─ /api/payment/create-checkout
│  ├─ Shopify Storefront API
│  ├─ Creates cart + checkout
│  └─ Returns checkout URL
│
├─ /api/shopify/webhook
│  ├─ Verifies HMAC signature
│  ├─ Updates database
│  └─ Sends emails
│
└─ /[locale]/results
   ├─ Shows purchased album
   ├─ Triggers Suno music generation
   └─ Provides downloads


EXTERNAL SERVICES
├─ OpenAI GPT-4
│  └─ Story analysis
│
├─ Suno API v4
│  └─ Music generation
│
├─ Shopify Storefront API
│  └─ Checkout creation
│
├─ Shopify Webhooks
│  └─ Order notifications
│
└─ Resend
   └─ Email delivery
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                  │
└──────────────────────────────────────────────────────────────────┘

STEP 1: Story Submission
─────────────────────────
StoryAnswers (Frontend)
  ↓
{
  names: { person1, person2 },
  meeting: "...",
  attraction: "...",
  memorable: "...",
  challenges: "...",
  future: "...",
  genres: ["Pop", "R&B"]
}
  ↓
POST /api/analyze-story
  ↓
OpenAI GPT-4
  ↓
StoryAnalysis
{
  summary: "...",
  albumTitle: "...",
  songs: [
    { title, theme, lyrics, style, mood }
  ]
}


STEP 2: Payment Creation
─────────────────────────
AlbumData (SessionStorage)
  ↓
POST /api/payment/create-checkout
  ↓
Database: Create AlbumSession
{
  userId,
  albumData: JSON,
  hasPaid: false,
  expiresAt: +24h
}
  ↓
Shopify Storefront API: Create Cart
{
  lines: [{ merchandiseId, quantity: 1 }],
  attributes: [{ key: "album_session_id", value }]
}
  ↓
Return: checkoutUrl


STEP 3: Webhook Processing
──────────────────────────
Shopify Order Created
  ↓
POST /api/shopify/webhook
{
  id: order_id,
  email: customer_email,
  financial_status: "paid",
  note_attributes: [
    { name: "album_session_id", value: "..." }
  ]
}
  ↓
Verify HMAC signature
  ↓
Find AlbumSession by:
  - shopifyCheckoutId
  - album_session_id from attributes
  - user email + recent session
  ↓
Update Database:
  - AlbumSession.hasPaid = true
  - AlbumSession.shopifyOrderId = order_id
  - Create Purchase record
  ↓
Send Emails:
  - Payment confirmation
  - Access granted
```

---

## Security Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      SECURITY MEASURES                            │
└──────────────────────────────────────────────────────────────────┘

IFRAME SECURITY
├─ CORS headers configured
│  └─ Allows embedding from Shopify domains
│
├─ X-Frame-Options: ALLOWALL
│  └─ Permits iframe embedding
│
└─ postMessage for height updates
   └─ Validates origin in production


WEBHOOK SECURITY
├─ HMAC signature verification
│  └─ crypto.createHmac('sha256', SECRET)
│
├─ Timing-safe comparison
│  └─ Prevents timing attacks
│
└─ Idempotency checks
   └─ Prevents duplicate processing


AUTHENTICATION
├─ NextAuth.js with Google OAuth
│  └─ Secure token management
│
├─ Database sessions
│  └─ Persistent authentication
│
└─ CSRF protection
   └─ Built into NextAuth


PAYMENT SECURITY
├─ Server-side checkout creation
│  └─ No client-side API keys
│
├─ Shopify handles payment
│  └─ PCI compliant
│
└─ Webhook verification
   └─ Confirms legitimate orders
```

---

## Database Schema Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    DATABASE RELATIONSHIPS                         │
└──────────────────────────────────────────────────────────────────┘

User
├─ id (primary key)
├─ email (unique)
├─ name
└─ Relations:
   ├─> AlbumSession[] (one-to-many)
   ├─> Purchase[] (one-to-many)
   └─> Account[] (one-to-many)


AlbumSession
├─ id (primary key)
├─ userId (foreign key → User)
├─ albumData (JSON)
│  └─ Contains: story, analysis, songs
├─ hasPaid (boolean)
├─ shopifyOrderId (unique)
├─ shopifyCheckoutId (unique)
└─ Relations:
   ├─> User (many-to-one)
   └─> Purchase[] (one-to-many)


Purchase
├─ id (primary key)
├─ userId (foreign key → User)
├─ albumSessionId (foreign key → AlbumSession)
├─ orderId (unique, from Shopify)
├─ amount
├─ status
└─ Relations:
   ├─> User (many-to-one)
   └─> AlbumSession (many-to-one)


Account (NextAuth)
├─ id (primary key)
├─ userId (foreign key → User)
├─ provider ("google" or "shopify")
├─ providerAccountId
│  └─ Format for Shopify: "store.myshopify.com:customer_id"
└─ Relations:
   └─> User (many-to-one)
```

---

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     ERROR HANDLING                                │
└──────────────────────────────────────────────────────────────────┘

Story Analysis Fails
├─ Try block catches error
├─ Shows user-friendly message
├─ Logs to console
└─ User can retry


Payment Creation Fails
├─ Check environment variables
├─ Validate product variant ID
├─ Return error to frontend
└─ User sees error message


Webhook Processing Fails
├─ Log error to WebhookLog table
├─ Return 500 to Shopify
├─ Shopify retries webhook
└─ Admin can review WebhookLog


Suno API Fails
├─ Retry with exponential backoff
├─ Show progress to user
├─ Log failure
└─ Provide customer support contact


Authentication Fails
├─ NextAuth handles redirect
├─ User sees Google sign-in
├─ Can retry authentication
└─ Session persists after success
```

---

## Timeline

```
TYPICAL CUSTOMER JOURNEY TIMELINE
─────────────────────────────────

00:00  Customer lands on page
00:30  Starts filling out form
02:00  Submits story
02:05  AI analysis complete (5 sec)
02:06  Reviews album preview
02:07  Clicks "Purchase"
02:08  Redirects to Shopify checkout
02:10  Enters payment info (2 min)
02:12  Completes payment
02:12  Shopify webhook sent (immediate)
02:13  Database updated, emails sent
02:14  Customer receives email
02:15  Clicks link in email
02:16  Music generation starts
05:16  First song ready (3 min)
15:16  All songs ready (10 min)
       ────────────────────────
       TOTAL: ~15 minutes

THEN:
∞      Customer enjoys album forever ❤️
```

---

This visual guide shows the complete flow from customer visit to album delivery!
