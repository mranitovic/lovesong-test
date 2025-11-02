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

// Extract album session ID from order (multiple methods)
function extractAlbumSessionId(order: any): string | null {
  // Method 1: From line item properties (most reliable for custom attributes)
  if (order.line_items && Array.isArray(order.line_items)) {
    for (const lineItem of order.line_items) {
      if (lineItem.properties && Array.isArray(lineItem.properties)) {
        const albumSessionProp = lineItem.properties.find(
          (prop: any) => prop.name === 'album_session_id'
        );
        if (albumSessionProp?.value) {
          console.log(`✅ Found album_session_id in line item properties: ${albumSessionProp.value}`);
          return albumSessionProp.value;
        }
      }
    }
  }

  // Method 2: From cart/note attributes
  const cartAttribute = order.note_attributes?.find(
    (attr: any) => attr.name === 'album_session_id'
  );
  if (cartAttribute?.value) {
    console.log(`✅ Found album_session_id in note_attributes: ${cartAttribute.value}`);
    return cartAttribute.value;
  }

  // Method 3: From order note (backup)
  if (order.note) {
    const match = order.note.match(/Album Session: ([a-f0-9-]+)/i);
    if (match?.[1]) {
      console.log(`✅ Found album_session_id in order note: ${match[1]}`);
      return match[1];
    }
  }

  console.warn('⚠️ No album_session_id found in order');
  return null;
}

// Find album session using multiple matching strategies (supports anonymous purchases)
async function findAlbumSession(order: any, userEmail: string | null): Promise<any | null> {
  const orderId = order.id.toString();

  // Strategy 1: Match by extracted album session ID from order (MOST RELIABLE - works for anonymous)
  const albumSessionId = extractAlbumSessionId(order);
  if (albumSessionId) {
    const sessionById = await prisma.albumSession.findUnique({
      where: { id: albumSessionId }
    });

    if (sessionById) {
      console.log(`✅ Matched album session by extracted ID: ${sessionById.id}`);
      return sessionById;
    }
  }

  // Strategy 2: Match by shopifyCheckoutId if available
  if (order.checkout_id) {
    const checkoutIdGid = `gid://shopify/Checkout/${order.checkout_id}`;
    const sessionByCheckout = await prisma.albumSession.findUnique({
      where: { shopifyCheckoutId: checkoutIdGid }
    });

    if (sessionByCheckout) {
      console.log(`✅ Matched album session by checkout ID: ${sessionByCheckout.id}`);
      return sessionByCheckout;
    }
  }

  // Strategy 3: Match by shopifyOrderId (already paid - duplicate webhook)
  const sessionByOrderId = await prisma.albumSession.findUnique({
    where: { shopifyOrderId: orderId }
  });

  if (sessionByOrderId) {
    console.log(`✅ Matched album session by order ID (duplicate webhook): ${sessionByOrderId.id}`);
    return sessionByOrderId;
  }

  // Strategy 4: Match by user email + most recent unpaid session (only if userEmail provided)
  if (userEmail) {
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (user) {
      const sessionByUser = await prisma.albumSession.findFirst({
        where: {
          userId: user.id,
          hasPaid: false,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (sessionByUser) {
        console.log(`✅ Matched album session by user email (fallback): ${sessionByUser.id}`);
        return sessionByUser;
      }
    }
  }

  console.error('❌ No album session found using any strategy');
  console.error('  - Order ID:', orderId);
  console.error('  - Extracted album_session_id:', albumSessionId || 'none');
  console.error('  - Checkout ID:', order.checkout_id || 'none');
  console.error('  - User email:', userEmail || 'none (anonymous)');
  return null;
}

export async function POST(request: NextRequest) {
  const webhookTopic = request.headers.get('x-shopify-topic') || 'unknown';
  let webhookLogId: string | null = null;

  try {
    // Get raw body for webhook verification
    const body = await request.text();
    const signature = request.headers.get('x-shopify-hmac-sha256');

    if (!signature) {
      console.error('❌ Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    // Verify webhook authenticity
    const isVerified = verifyShopifyWebhook(body, signature);

    // Parse the webhook payload
    const order = JSON.parse(body);
    const orderId = order.id?.toString();

    // Create webhook log entry immediately
    const webhookLog = await prisma.webhookLog.create({
      data: {
        topic: webhookTopic,
        shopifyOrderId: orderId,
        payload: order,
        signature: signature,
        verified: isVerified
      }
    });
    webhookLogId = webhookLog.id;

    if (!isVerified) {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          error: 'Invalid webhook signature',
          processedAt: new Date()
        }
      });

      console.error('❌ Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    console.log(`📥 Webhook received: ${webhookTopic}, Order: ${orderId}`);

    // Only process paid orders
    if (order.financial_status !== 'paid') {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          processed: true,
          processedAt: new Date(),
          error: `Order not paid yet (status: ${order.financial_status})`
        }
      });

      console.log(`⏸️  Order ${orderId} not paid yet, skipping`);
      return NextResponse.json({ message: 'Order not paid yet' });
    }

    // Extract user information from order
    const userEmail = order.email || null; // Allow null for anonymous purchases
    const amount = parseFloat(order.total_price);
    const paymentMethod = order.payment_gateway_names?.[0] || 'unknown';

    console.log('📧 Order email:', userEmail || '(anonymous)');

    // Find or create user by email (only if email provided)
    let user = null;
    if (userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      // Create user if doesn't exist (for authenticated purchases)
      if (!user) {
        console.log(`📝 Creating new user for email: ${userEmail}`);
        user = await prisma.user.create({
          data: {
            email: userEmail,
            name: order.customer?.first_name ?
              `${order.customer.first_name} ${order.customer.last_name || ''}`.trim() :
              userEmail.split('@')[0]
          }
        });
      }
    } else {
      console.log('ℹ️ Anonymous purchase (no email) - will match by album_session_id');
    }

    // Find album session using enhanced matching strategies
    const albumSession = await findAlbumSession(order, userEmail);

    if (!albumSession) {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          error: `No album session found for user: ${userEmail}`,
          processedAt: new Date()
        }
      });

      console.error(`❌ No album session found for user: ${userEmail}`);
      return NextResponse.json(
        { error: 'No album session found' },
        { status: 404 }
      );
    }

    // IDEMPOTENCY CHECK: If this session is already paid with this order ID, skip processing
    if (albumSession.hasPaid && albumSession.shopifyOrderId === orderId) {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          processed: true,
          albumSessionId: albumSession.id,
          processedAt: new Date(),
          error: 'Duplicate webhook - already processed'
        }
      });

      console.log(`⏭️  Webhook already processed for order ${orderId}, skipping`);
      return NextResponse.json({
        success: true,
        message: 'Webhook already processed (idempotent)'
      });
    }

    // Process payment in a transaction
    await prisma.$transaction(async (tx) => {
      // Update album session as paid
      await tx.albumSession.update({
        where: { id: albumSession.id },
        data: {
          hasPaid: true,
          shopifyOrderId: orderId,
          paidAt: new Date(),
          webhookProcessedAt: new Date()
        }
      });

      // Create purchase record (idempotent - will fail if orderId already exists)
      try {
        await tx.purchase.create({
          data: {
            userId: user?.id || null, // Null for anonymous purchases
            albumSessionId: albumSession.id,
            orderId: orderId,
            amount: amount,
            currency: 'BRL',
            status: 'paid',
            paymentMethod: paymentMethod.toLowerCase().includes('pix') ? 'pix' :
                          paymentMethod.toLowerCase().includes('credit') ? 'credit_card' :
                          paymentMethod.toLowerCase().includes('boleto') ? 'boleto' :
                          'other',
            paidAt: new Date()
          }
        });
        console.log(`✅ Purchase record created for order ${orderId} (userId: ${user?.id || 'anonymous'})`);
      } catch (purchaseError: any) {
        // If purchase already exists (unique constraint on orderId), that's okay
        if (purchaseError.code === 'P2002') {
          console.log(`ℹ️  Purchase record already exists for order ${orderId}`);
        } else {
          throw purchaseError;
        }
      }

      // Mark webhook as processed
      await tx.webhookLog.update({
        where: { id: webhookLogId! },
        data: {
          processed: true,
          albumSessionId: albumSession.id,
          processedAt: new Date()
        }
      });
    });

    console.log(`✅ Payment processed successfully for ${userEmail || 'anonymous user'}, order ${orderId}`);

    // Send payment confirmation and access granted emails (only if user has email)
    if (user && userEmail) {
      try {
        const albumData = albumSession.albumData as any;
        const albumTitle = albumData?.analysis?.summary || 'Seu Álbum de Amor Personalizado';

        // Send both emails in parallel
        await Promise.allSettled([
          // Payment confirmation email
          fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'payment_confirmation',
              data: {
                userName: user.name,
                userEmail: user.email,
                orderId: orderId,
                amount: amount,
                albumTitle: albumTitle
              }
            })
          }),
          // Access granted email
          fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'access_granted',
              data: {
                userName: user.name,
                userEmail: user.email,
                albumTitle: albumTitle
              }
            })
          })
        ]);

        console.log(`📧 Confirmation emails sent to ${userEmail}`);
      } catch (emailError) {
        console.error('⚠️  Failed to send emails (non-critical):', emailError);
        // Don't fail the webhook if emails fail
      }
    } else {
      console.log('ℹ️ Skipping email notification (anonymous purchase)');
    }

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully'
    });

  } catch (error: any) {
    console.error('❌ Error processing Shopify webhook:', error);

    // Log error to webhook log if available
    if (webhookLogId) {
      try {
        await prisma.webhookLog.update({
          where: { id: webhookLogId },
          data: {
            error: error.message || 'Unknown error',
            processedAt: new Date()
          }
        });
      } catch (logError) {
        console.error('Failed to update webhook log:', logError);
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
