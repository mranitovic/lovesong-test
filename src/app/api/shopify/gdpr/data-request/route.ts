import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * GDPR: Customer Data Request Webhook
 *
 * Shopify sends this webhook when a customer requests their data.
 * You must provide the customer's data within 30 days.
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
    const { shop_id, shop_domain, customer, orders_requested } = payload;

    console.log(`📋 GDPR Data Request received for customer from ${shop_domain}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: customer.email },
      include: {
        albumSessions: true,
        purchases: true,
      },
    });

    if (user) {
      // Log the data request for compliance tracking
      await prisma.webhookLog.create({
        data: {
          topic: 'customers/data_request',
          shopifyOrderId: null,
          payload: payload,
          signature: signature,
          verified: true,
          processed: true,
          processedAt: new Date(),
        },
      });

      console.log(`✅ GDPR data request logged for user: ${user.email}`);

      // In production, you would:
      // 1. Compile all customer data
      // 2. Send it to the customer or Shopify
      // 3. Store proof of compliance
    } else {
      console.log(`ℹ️  No user found for email: ${customer.email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling GDPR data request:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
