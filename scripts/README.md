# Scripts Directory

This directory contains utility scripts for testing and managing the AI Love Album application.

## Available Scripts

### 1. `test-webhook.sh` - Shopify Webhook Tester

Tests the Shopify webhook endpoint with a mock order payload, including proper HMAC signature generation.

#### Usage

**Basic usage (interactive):**
```bash
./scripts/test-webhook.sh
```

**With parameters:**
```bash
./scripts/test-webhook.sh [WEBHOOK_URL] [USER_EMAIL] [ALBUM_SESSION_ID]
```

**Examples:**

```bash
# Interactive mode - prompts for email and session ID
./scripts/test-webhook.sh

# With ngrok URL only (will prompt for email and session ID)
./scripts/test-webhook.sh https://a2e5483e713b.ngrok-free.app/api/shopify/webhook

# With all parameters
./scripts/test-webhook.sh \
  https://a2e5483e713b.ngrok-free.app/api/shopify/webhook \
  user@example.com \
  clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Production URL
./scripts/test-webhook.sh \
  https://yourdomain.com/api/shopify/webhook \
  user@example.com
```

#### Requirements

- `.env.local` file with `SHOPIFY_WEBHOOK_SECRET` configured
- `jq` installed (optional, for pretty JSON output): `brew install jq`
- User email must exist in the database
- Album session ID (optional) must exist if provided

#### What it does

1. Loads environment variables from `.env.local`
2. Generates a test order payload with realistic data
3. Creates a valid HMAC-SHA256 signature using your webhook secret
4. Sends POST request to your webhook endpoint
5. Displays the response and provides troubleshooting tips

#### Verification

After running the script, verify in your database:

```sql
-- Check webhook log
SELECT * FROM "WebhookLog" ORDER BY "createdAt" DESC LIMIT 1;

-- Check if payment was processed
SELECT * FROM "AlbumSession" WHERE "shopifyOrderId" = 'ORDER_ID_FROM_SCRIPT';

-- Check purchase record
SELECT * FROM "Purchase" WHERE "orderId" = 'ORDER_ID_FROM_SCRIPT';
```

#### Troubleshooting

**"User not found" error:**
- Make sure the email you provide exists in the `User` table
- Create a user first by signing in to the app

**"Invalid webhook signature" error:**
- Verify `SHOPIFY_WEBHOOK_SECRET` in `.env.local` matches Shopify
- Check that the script can read `.env.local`

**"No album session found" error:**
- Provide a valid `ALBUM_SESSION_ID` as the third parameter
- Or ensure the user has an unpaid session that's not expired

**Connection refused:**
- Check that your dev server is running: `npm run dev`
- Verify ngrok tunnel is active: `ngrok http 3000`
- Confirm the webhook URL is correct

## Notes

- The script generates a unique order ID each time it runs
- Emails will be sent if the webhook processes successfully
- Check your Resend dashboard for email delivery status
- Webhook logs are stored in the `WebhookLog` table for debugging
