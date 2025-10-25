/**
 * Script to programmatically create Shopify webhook
 *
 * Usage:
 * 1. Set SHOPIFY_ADMIN_ACCESS_TOKEN in .env
 * 2. Run: npx tsx scripts/setup-webhook.ts
 */

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || 'your-store.myshopify.com';
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '';
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL + '/api/shopify/webhook';

async function createWebhook() {
  if (!SHOPIFY_ADMIN_TOKEN) {
    console.error('❌ SHOPIFY_ADMIN_ACCESS_TOKEN not set in .env');
    process.exit(1);
  }

  const response = await fetch(
    `https://${SHOPIFY_STORE_URL}/admin/api/2024-10/webhooks.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        webhook: {
          topic: 'orders/paid',
          address: WEBHOOK_URL,
          format: 'json',
        },
      }),
    }
  );

  const data = await response.json();

  if (response.ok) {
    console.log('✅ Webhook created successfully!');
    console.log('Webhook ID:', data.webhook.id);
    console.log('Topic:', data.webhook.topic);
    console.log('Address:', data.webhook.address);
    console.log('\n⚠️  IMPORTANT: Copy this webhook secret to your .env:');
    console.log('SHOPIFY_WEBHOOK_SECRET=' + data.webhook.api_version);
  } else {
    console.error('❌ Failed to create webhook:', data);
  }
}

createWebhook();
