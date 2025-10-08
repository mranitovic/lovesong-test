import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// Shopify webhook verification
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
    // Get raw body for webhook verification
    const body = await request.text();
    const signature = request.headers.get('x-shopify-hmac-sha256');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    // Verify webhook authenticity
    if (!verifyShopifyWebhook(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const order = JSON.parse(body);

    // Only process paid orders
    if (order.financial_status !== 'paid') {
      return NextResponse.json({ message: 'Order not paid yet' });
    }

    // Check if order contains our product
    const hasOurProduct = order.line_items?.some((item: any) =>
      item.variant_id?.toString() === process.env.SHOPIFY_PRODUCT_VARIANT_ID
    );

    if (!hasOurProduct) {
      return NextResponse.json({ message: 'Order does not contain our product' });
    }

    // Extract user information from order
    const userEmail = order.email;
    const orderId = order.id.toString();
    const amount = parseFloat(order.total_price);
    const paymentMethod = order.payment_gateway_names?.[0] || 'unknown';

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { albumSessions: true }
    });

    if (!user) {
      console.error(`User not found for email: ${userEmail}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the most recent unpaid album session for this user
    const albumSession = await prisma.albumSession.findFirst({
      where: {
        userId: user.id,
        hasPaid: false,
        expiresAt: { gt: new Date() } // Not expired
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!albumSession) {
      console.error(`No unpaid album session found for user: ${userEmail}`);
      return NextResponse.json(
        { error: 'No unpaid album session found' },
        { status: 404 }
      );
    }

    // Update album session as paid
    await prisma.albumSession.update({
      where: { id: albumSession.id },
      data: {
        hasPaid: true,
        shopifyOrderId: orderId,
        paidAt: new Date()
      }
    });

    // Create purchase record
    await prisma.purchase.create({
      data: {
        userId: user.id,
        albumSessionId: albumSession.id,
        orderId: orderId,
        amount: amount,
        currency: 'BRL',
        status: 'paid',
        paymentMethod: paymentMethod.toLowerCase().includes('pix') ? 'pix' :
                      paymentMethod.toLowerCase().includes('credit') ? 'credit_card' :
                      'other',
        paidAt: new Date()
      }
    });

    console.log(`Payment processed successfully for user ${userEmail}, order ${orderId}`);

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    console.error('Error processing Shopify webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}