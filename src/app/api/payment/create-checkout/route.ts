import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
// import { authOptions } from '@/lib/auth';
import { createCheckout } from '@/lib/shopify-storefront';

export async function POST(request: NextRequest) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🛒 [API] CREATE CHECKOUT REQUEST RECEIVED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // COMMENTED OUT: Authentication check bypassed for iframe compatibility
    // const session = await getServerSession(authOptions);
    //
    // if (!session?.user?.email) {
    //   return NextResponse.json(
    //     { success: false, error: 'User not authenticated' },
    //     { status: 401 }
    //   );
    // }

    const { albumSessionId, userId } = await request.json();
    console.log('📋 [API] Request body:', { albumSessionId, userId });

    if (!albumSessionId) {
      console.error('❌ [API] Missing albumSessionId in request');
      return NextResponse.json(
        { success: false, error: 'Missing albumSessionId' },
        { status: 400 }
      );
    }

    // Log environment variables (without exposing secrets)
    console.log('🔧 [API] Environment check:');
    console.log('  - SHOPIFY_PRODUCT_VARIANT_ID:', process.env.SHOPIFY_PRODUCT_VARIANT_ID || '❌ NOT SET');
    console.log('  - NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN:', process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '❌ NOT SET');
    console.log('  - NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN:', process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN ? '✅ SET' : '❌ NOT SET');

    // MODIFIED: Skip user verification for iframe compatibility
    // Just verify the album session exists and isn't paid
    console.log('🔍 [API] Looking up album session in database...');
    const albumSession = await prisma.albumSession.findFirst({
      where: {
        id: albumSessionId,
        hasPaid: false
      }
    });

    if (!albumSession) {
      console.error('❌ [API] Album session not found or already paid:', albumSessionId);
      console.error('   This could mean:');
      console.error('   1. Invalid albumSessionId');
      console.error('   2. Session already paid');
      console.error('   3. Session expired and deleted');
      return NextResponse.json(
        { success: false, error: 'Album session not found or already paid' },
        { status: 404 }
      );
    }

    console.log('✅ [API] Album session found:', {
      id: albumSession.id,
      userId: albumSession.userId,
      hasPaid: albumSession.hasPaid,
      createdAt: albumSession.createdAt
    });

    // Validate environment variables
    const variantId = process.env.SHOPIFY_PRODUCT_VARIANT_ID;
    if (!variantId) {
      console.error('❌ [API] SHOPIFY_PRODUCT_VARIANT_ID not configured');
      console.error('   Please set this environment variable in Vercel:');
      console.error('   1. Go to Vercel project settings');
      console.error('   2. Environment Variables');
      console.error('   3. Add: SHOPIFY_PRODUCT_VARIANT_ID = <your-variant-id>');
      console.error('   4. Redeploy the application');
      return NextResponse.json(
        { success: false, error: 'Product not configured. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('🏪 [API] Creating Shopify checkout...');
    console.log('  - Album Session ID:', albumSessionId);
    console.log('  - Product Variant ID:', variantId);
    console.log('  - Merchandise GID:', `gid://shopify/ProductVariant/${variantId}`);

    // Create checkout using Storefront API
    const checkout = await createCheckout(
      [
        {
          merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
          quantity: 1,
          attributes: [
            { key: 'album_session_id', value: albumSessionId },
            { key: 'user_email', value: 'anonymous@iframe-purchase.com' }, // Anonymous for iframe
          ],
        },
      ],
      `Album Session: ${albumSessionId}` // Order note for backup tracking
    );

    console.log('💾 [API] Storing checkout ID in database...');
    // Store Shopify checkout ID in AlbumSession for bidirectional tracking
    await prisma.albumSession.update({
      where: { id: albumSessionId },
      data: { shopifyCheckoutId: checkout.id },
    });

    console.log('✅ [API] Checkout created successfully!');
    console.log('  - Checkout ID:', checkout.id);
    console.log('  - Checkout URL:', checkout.checkoutUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkout.checkoutUrl,
      },
    });

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [API] CHECKOUT CREATION FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
