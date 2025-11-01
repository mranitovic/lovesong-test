import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { createCheckout } from '@/lib/shopify-storefront';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { albumSessionId, userId } = await request.json();

    if (!albumSessionId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify the album session belongs to the authenticated user
    const albumSession = await prisma.albumSession.findFirst({
      where: {
        id: albumSessionId,
        userId: userId,
        hasPaid: false
      }
    });

    if (!albumSession) {
      return NextResponse.json(
        { success: false, error: 'Album session not found or already paid' },
        { status: 404 }
      );
    }

    // Validate environment variables
    const variantId = process.env.SHOPIFY_PRODUCT_VARIANT_ID;
    if (!variantId) {
      console.error('SHOPIFY_PRODUCT_VARIANT_ID not configured');
      return NextResponse.json(
        { success: false, error: 'Product not configured' },
        { status: 500 }
      );
    }

    console.log('Creating Shopify checkout for album session:', albumSessionId);

    // Create checkout using Storefront API
    const checkout = await createCheckout(
      [
        {
          merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
          quantity: 1,
          attributes: [
            { key: 'album_session_id', value: albumSessionId },
            { key: 'user_email', value: session.user.email },
          ],
        },
      ],
      `Album Session: ${albumSessionId}` // Order note for backup tracking
    );

    // Store Shopify checkout ID in AlbumSession for bidirectional tracking
    await prisma.albumSession.update({
      where: { id: albumSessionId },
      data: { shopifyCheckoutId: checkout.id },
    });

    console.log('✅ Checkout created successfully:', checkout.id);

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkout.checkoutUrl,
      },
    });

  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
