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

    const { albumSessionId, userId, cartToken, email } = await request.json();
    console.log('📋 [API] Request body:', { albumSessionId, userId, cartToken: cartToken ? 'present' : 'none', email });

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

    let checkoutUrl: string;
    let checkoutId: string;

    // NEW: Check if cart token exists (Shopify redirect flow)
    if (cartToken) {
      console.log('🛒 [API] Cart token detected - using CART UPDATE flow');
      console.log('  - Cart Token:', cartToken);
      console.log('  - Album Session ID:', albumSessionId);

      // Extract song details from album session
      const albumData = albumSession.albumData as any;
      const songTitle = albumData?.analysis?.songs?.[0]?.title || albumData?.songs?.[0]?.title;
      const coupleNames = albumData?.storyAnswers?.names
        ? `${albumData.storyAnswers.names.person1} & ${albumData.storyAnswers.names.person2}`
        : '';

      console.log('  - Song Title:', songTitle);
      console.log('  - Couple Names:', coupleNames);

      // Update existing cart with song metadata
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/shopify/update-cart`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartToken,
            songDetails: {
              albumSessionId,
              title: songTitle,
              coupleNames,
              email: email || 'anonymous@lovestories.ai',
            }
          })
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('❌ [API] Failed to update cart:', errorData);
        throw new Error(errorData.error || 'Failed to update cart');
      }

      const updateData = await updateResponse.json();
      console.log('✅ [API] Cart updated successfully!');
      console.log('  - Checkout URL:', updateData.checkoutUrl);
      console.log('  - Checkout ID:', updateData.checkoutId);

      checkoutUrl = updateData.checkoutUrl;
      checkoutId = updateData.checkoutId;

    } else {
      console.log('🏪 [API] No cart token - using NEW CHECKOUT flow');
      console.log('  - Album Session ID:', albumSessionId);
      console.log('  - Product Variant ID:', variantId);
      console.log('  - Merchandise GID:', `gid://shopify/ProductVariant/${variantId}`);

      // Create new checkout using Storefront API (existing flow)
      const checkout = await createCheckout(
        [
          {
            merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
            quantity: 1,
            attributes: [
              { key: 'album_session_id', value: albumSessionId },
              { key: 'user_email', value: email || 'anonymous@iframe-purchase.com' },
            ],
          },
        ],
        `Album Session: ${albumSessionId}` // Order note for backup tracking
      );

      console.log('✅ [API] Checkout created successfully!');
      console.log('  - Checkout ID:', checkout.id);
      console.log('  - Checkout URL:', checkout.checkoutUrl);

      checkoutUrl = checkout.checkoutUrl;
      checkoutId = checkout.id;
    }

    console.log('💾 [API] Storing checkout ID in database...');
    // Store Shopify checkout ID in AlbumSession for bidirectional tracking
    await prisma.albumSession.update({
      where: { id: albumSessionId },
      data: { shopifyCheckoutId: checkoutId },
    });

    console.log('✅ [API] Payment flow completed successfully!');
    console.log('  - Flow type:', cartToken ? 'CART_UPDATE' : 'NEW_CHECKOUT');
    console.log('  - Checkout ID:', checkoutId);
    console.log('  - Checkout URL:', checkoutUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl,
        checkoutId,
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
