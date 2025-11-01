import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * GDPR: Shop Redact Webhook
 *
 * Shopify sends this webhook 48 hours after a store owner uninstalls your app.
 * You must delete all data related to that shop.
 *
 * Required for all Shopify apps.
 */

function verifyShopifyWebhook(body: string, signature: string): boolean {
  const hmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET!)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'base64'),
    Buffer.from(hmac, 'base64')
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-shopify-hmac-sha256');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    if (!verifyShopifyWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const { shop_id, shop_domain } = payload;

    console.log(`🗑️  GDPR Shop Redact request for shop: ${shop_domain}`);

    // Find all users associated with this shop
    // This requires tracking which users came from which shop
    // For now, we'll log the request for compliance

    await prisma.webhookLog.create({
      data: {
        topic: 'shop/redact',
        shopifyOrderId: null,
        payload: payload,
        signature: signature,
        verified: true,
        processed: true,
        processedAt: new Date(),
      },
    });

    // In a full implementation, you would:
    // 1. Find all Shopify accounts associated with this shop domain
    // 2. Delete or anonymize data from this shop
    // 3. Keep financial/legal records as required by law
    // 4. Remove shop-specific configurations

    // Example implementation:
    // const shopifyAccounts = await prisma.account.findMany({
    //   where: {
    //     provider: 'shopify',
    //     providerAccountId: {
    //       startsWith: shop_domain
    //     }
    //   }
    // });
    //
    // for (const account of shopifyAccounts) {
    //   await prisma.account.delete({ where: { id: account.id } });
    // }

    console.log(`✅ Shop redact request logged for: ${shop_domain}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling GDPR shop redact:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
