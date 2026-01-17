# Shopify Payment Flow Implementation

This document describes the robust Shopify payment integration implemented for the AI Love Album Generator.

## Overview

The implementation includes:
- ✅ **Session Tracking**: Bidirectional tracking between AlbumSession and Shopify checkout/order
- ✅ **Webhook Reliability**: Idempotency, comprehensive logging, and multiple matching strategies
- ✅ **Transactional Emails**: Automated payment confirmation and access granted emails
- ✅ **Real-time Updates**: Server-Sent Events (SSE) for instant payment confirmation in UI

---

## Phase 1: Session Tracking Through Checkout

### Database Schema

**AlbumSession** model enhancements:
- `shopifyCheckoutId`: Stores Shopify cart/checkout ID for bidirectional tracking
- `webhookProcessedAt`: Timestamp when webhook processed the payment
- Indexes added for fast lookups on `shopifyCheckoutId` and `userId + hasPaid`

**Purchase** model enhancements:
- `emailSent`: Boolean flag to track if confirmation email was sent
- `emailSentAt`: Timestamp when email was sent

**WebhookLog** model (NEW):
- Complete webhook logging for debugging and audit trail
- Tracks: topic, orderId, payload, signature verification, processing status, errors
- Enables webhook replay and troubleshooting

### Checkout Creation Flow

When creating a Shopify checkout ([create-checkout/route.ts](src/app/api/payment/create-checkout/route.ts)):

1. Cart attributes include `album_session_id` and `user_email`
2. Order note includes "Album Session: {id}" as backup tracking
3. Shopify cart ID is stored in `AlbumSession.shopifyCheckoutId` immediately after creation

---

## Phase 2: Robust Webhook Handling

### Webhook Security & Verification

- ✅ HMAC signature verification (Shopify best practice)
- ✅ Immediate webhook logging before processing
- ✅ Non-blocking email sending (won't fail webhook if emails fail)

### Idempotency

The webhook handler implements multiple idempotency checks:

1. **Duplicate webhook detection**: If `AlbumSession.shopifyOrderId` matches and `hasPaid = true`, skip processing
2. **Purchase record uniqueness**: Unique constraint on `orderId` prevents duplicate purchase records
3. **Transaction safety**: All DB updates wrapped in Prisma transaction

### Enhanced Session Matching

The webhook uses **4 strategies** to find the correct AlbumSession:

1. **Primary**: Match by `shopifyCheckoutId` (most reliable)
2. **Secondary**: Extract `album_session_id` from order note_attributes or note
3. **Tertiary**: Match by existing `shopifyOrderId` (handles duplicate webhooks)
4. **Fallback**: Match by user email + most recent unpaid session

### Comprehensive Logging

Every webhook is logged to `WebhookLog` table with:
- Full payload (for debugging)
- Signature verification result
- Processing status and errors
- Matched album session ID
- Processing timestamps

Access webhook logs via database:
```sql
SELECT * FROM "WebhookLog" ORDER BY "createdAt" DESC LIMIT 10;
```

---

## Phase 3: Transactional Email System

### Email Service: Resend + React Email

- **Provider**: [Resend](https://resend.com) - Modern email API for developers
- **Templates**: React Email components for maintainable, tested email templates
- **Styling**: Inline CSS with responsive design

### Email Templates

1. **Payment Confirmation** ([emails/PaymentConfirmation.tsx](emails/PaymentConfirmation.tsx))
   - Sent immediately after payment confirmation
   - Includes order details, amount, benefits
   - CTA: "Ouvir Minhas Músicas"

2. **Access Granted** ([emails/AccessGranted.tsx](emails/AccessGranted.tsx))
   - Sent after payment confirmation
   - Celebrates unlocking 4 additional songs
   - Instructions for generating songs

### Email Sending Flow

1. Webhook confirms payment
2. Transaction updates database
3. Two emails sent in parallel (non-blocking):
   - Payment Confirmation
   - Access Granted
4. If emails fail, webhook still succeeds (logged as warning)

### Email API Endpoint

`POST /api/email/send` - Generic email sending endpoint

**Supported types**:
- `payment_confirmation`
- `access_granted`

Example:
```json
{
  "type": "payment_confirmation",
  "data": {
    "userName": "João",
    "userEmail": "joao@example.com",
    "orderId": "12345",
    "amount": 100,
    "albumTitle": "Nossa História de Amor"
  }
}
```

---

## Phase 4: Real-time Payment Confirmation

### Server-Sent Events (SSE)

Replaced 10-second polling with real-time SSE connection.

**Endpoint**: `GET /api/payment/stream`

**Features**:
- Authenticated connection (requires NextAuth session)
- Checks payment status every 5 seconds
- Auto-closes when payment detected
- 5-minute timeout for safety
- Graceful cleanup on disconnect

### Client Implementation

Results page ([src/app/results/page.tsx](src/app/results/page.tsx)):

```typescript
const eventSource = new EventSource('/api/payment/stream');

eventSource.addEventListener('payment_status', (e) => {
  const data = JSON.parse(e.data);
  if (data.data.hasPaid) {
    // Update UI instantly
    setPaymentStatus({ hasPaid: true, ... });
  }
});
```

**Events emitted**:
- `connected`: Initial connection confirmation
- `payment_status`: Status update (every 5s)
- `payment_complete`: Payment confirmed, stream closes
- `error`: Error occurred
- `timeout`: 5-minute timeout reached

---

## Testing the Flow

### 1. Local Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add:
# - RESEND_API_KEY
# - EMAIL_FROM
# - NEXT_PUBLIC_APP_URL (e.g., http://localhost:3000)

# Run database migration
# Note: Run this command manually in interactive terminal
# npx prisma migrate dev --name add_session_tracking_and_webhook_logging

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

### 2. Test Webhook Locally (ngrok)

```bash
# Install ngrok
brew install ngrok  # or download from ngrok.com

# Expose local server
ngrok http 3000

# Configure Shopify webhook with ngrok URL:
# https://YOUR-NGROK-URL.ngrok.io/api/shopify/webhook
```

### 3. Test Email Sending

Create test endpoint or use webhook simulator:

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_confirmation",
    "data": {
      "userName": "Test User",
      "userEmail": "test@example.com",
      "orderId": "test-123",
      "amount": 100,
      "albumTitle": "Test Album"
    }
  }'
```

### 4. Monitor Webhook Logs

Query webhook logs in PostgreSQL:

```sql
-- Recent webhooks
SELECT
  "id",
  "topic",
  "shopifyOrderId",
  "verified",
  "processed",
  "error",
  "createdAt"
FROM "WebhookLog"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Failed webhooks
SELECT * FROM "WebhookLog"
WHERE "processed" = false OR "error" IS NOT NULL
ORDER BY "createdAt" DESC;
```

---

## Production Deployment Checklist

- [ ] Database migration applied: `npx prisma migrate deploy`
- [ ] Environment variables set in production:
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `NEXT_PUBLIC_APP_URL`
  - `SHOPIFY_WEBHOOK_SECRET`
  - `SHOPIFY_STORE_URL`
  - `SHOPIFY_ACCESS_TOKEN`
  - `SHOPIFY_PRODUCT_VARIANT_ID`
- [ ] Shopify webhook configured: `https://yourdomain.com/api/shopify/webhook`
  - Topic: `orders/paid`
  - Format: JSON
- [ ] Verify webhook signature in Shopify settings
- [ ] Test payment flow end-to-end in production
- [ ] Monitor webhook logs for first 24 hours
- [ ] Set up email domain in Resend (for professional sender address)

---

## Troubleshooting

### Webhook not processing

1. Check `WebhookLog` table for errors
2. Verify signature is correct in Shopify settings
3. Ensure webhook topic is `orders/paid`
4. Check that order has `financial_status = 'paid'`

### Session not found

1. Check if `shopifyCheckoutId` was stored during checkout creation
2. Verify order includes `album_session_id` in note_attributes
3. Check user email matches between Shopify and database
4. Look for unpaid sessions for user: `SELECT * FROM "AlbumSession" WHERE "userId" = '...' AND "hasPaid" = false`

### Emails not sending

1. Verify `RESEND_API_KEY` is valid
2. Check Resend dashboard for failed sends
3. Review webhook logs - emails are non-critical and won't fail webhook
4. Test email endpoint directly: `POST /api/email/send`

### SSE not working

1. Check browser console for EventSource errors
2. Verify user is authenticated (NextAuth session)
3. Check server logs for SSE connection
4. Ensure `/api/payment/stream` returns `Content-Type: text/event-stream`

---

## Architecture Diagram

```
User                Shopify              Next.js App              Database
  |                    |                      |                      |
  |-- Create Album ----|                      |                      |
  |                    |                      |                      |
  |                    |<-- Create Session ---|--> AlbumSession      |
  |                    |                      |                      |
  |-- Click Pay -------|--> Create Checkout --|                      |
  |                    |                      |                      |
  |                    |<-- Cart w/ Metadata -|--> Store checkoutId  |
  |                    |                      |                      |
  |                    |                      |<-- Connect SSE ------|
  |                    |                      |                      |
  |-- Complete Payment-|                      |                      |
  |                    |                      |                      |
  |                    |-- Webhook (paid) --->|                      |
  |                    |                      |                      |
  |                    |                      |-- Log Webhook ------→|
  |                    |                      |                      |
  |                    |                      |-- Match Session ----→|
  |                    |                      |                      |
  |                    |                      |-- Update hasPaid ---→|
  |                    |                      |                      |
  |                    |                      |-- Create Purchase --→|
  |                    |                      |                      |
  |                    |                      |-- Send Emails ------>|
  |                    |                      |   (non-blocking)     |
  |                    |                      |                      |
  |                    |<-- 200 OK -----------|                      |
  |                    |                      |                      |
  |<-- SSE: payment_complete ----------------|                      |
  |                    |                      |                      |
  |-- UI Updates ------|                      |                      |
  |    (Songs Unlocked)|                      |                      |
```

---

## Future Enhancements

- [ ] Admin dashboard for webhook monitoring
- [ ] Retry mechanism for failed webhooks
- [ ] Additional email templates (Album Complete, Download Ready)
- [ ] SMS notifications via Twilio
- [ ] Webhook replay functionality for failed webhooks
- [ ] Analytics on payment conversion rates

---

## References

- [Shopify Webhook Best Practices](https://shopify.dev/docs/apps/build/webhooks)
- [Resend Documentation](https://resend.com/docs)
- [React Email Components](https://react.email/docs/components/html)
- [Server-Sent Events Spec](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
