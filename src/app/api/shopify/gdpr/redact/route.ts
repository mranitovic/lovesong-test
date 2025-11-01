import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * GDPR: Customer Redact Webhook
 *
 * Shopify sends this webhook 48 hours after a store owner requests customer data deletion.
 * You must delete the customer's personal data.
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
    const { shop_id, shop_domain, customer, orders_to_redact } = payload;

    console.log(`🗑️  GDPR Customer Redact request for customer from ${shop_domain}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: customer.email },
    });

    if (user) {
      // Redact customer data in a transaction
      await prisma.$transaction(async (tx) => {
        // Option 1: Delete user and all related data (cascading delete via schema)
        // This removes: accounts, sessions, album sessions, purchases
        await tx.user.delete({
          where: { id: user.id },
        });

        // Log the redaction for compliance
        await tx.webhookLog.create({
          data: {
            topic: 'customers/redact',
            shopifyOrderId: null,
            payload: payload,
            signature: signature,
            verified: true,
            processed: true,
            processedAt: new Date(),
          },
        });
      });

      console.log(`✅ Customer data redacted for: ${customer.email}`);
    } else {
      console.log(`ℹ️  No user found for email: ${customer.email}`);

      // Still log the webhook for compliance
      await prisma.webhookLog.create({
        data: {
          topic: 'customers/redact',
          shopifyOrderId: null,
          payload: payload,
          signature: signature,
          verified: true,
          processed: true,
          processedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling GDPR customer redact:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
