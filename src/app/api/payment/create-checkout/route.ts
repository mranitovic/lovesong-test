import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

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
    if (!process.env.SHOPIFY_STORE_URL || !process.env.SHOPIFY_ACCESS_TOKEN || !process.env.SHOPIFY_PRODUCT_VARIANT_ID) {
      console.error('Missing Shopify environment variables');
      return NextResponse.json(
        { success: false, error: 'Shopify integration not configured' },
        { status: 500 }
      );
    }

    // Create checkout using Shopify Cart API
    const storefrontEndpoint = `https://${process.env.SHOPIFY_STORE_URL}/api/2024-10/graphql.json`;

    const cartMutation = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            code
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        lines: [
          {
            merchandiseId: `gid://shopify/ProductVariant/${process.env.SHOPIFY_PRODUCT_VARIANT_ID}`,
            quantity: 1
          }
        ],
        attributes: [
          {
            key: 'album_session_id',
            value: albumSessionId
          },
          {
            key: 'user_email',
            value: session.user.email
          }
        ],
        note: `Album Session: ${albumSessionId}` // Add to order notes as backup tracking
      }
    };

    console.log('Creating Shopify cart for album session:', albumSessionId);

    const response = await fetch(storefrontEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN!
      },
      body: JSON.stringify({
        query: cartMutation,
        variables
      })
    });

    const data = await response.json();

    console.log('Shopify response status:', response.status);

    // Check for GraphQL errors
    if (data.errors) {
      console.error('Shopify GraphQL errors:', data.errors);
      return NextResponse.json(
        { success: false, error: `Shopify API error: ${data.errors[0]?.message}` },
        { status: 500 }
      );
    }

    // Check for cart creation errors
    if (!data.data?.cartCreate) {
      console.error('No cartCreate in response:', data);
      return NextResponse.json(
        { success: false, error: 'Invalid Shopify API response' },
        { status: 500 }
      );
    }

    const userErrors = data.data.cartCreate.userErrors || [];
    if (userErrors.length > 0) {
      console.error('Shopify cart errors:', userErrors);
      return NextResponse.json(
        { success: false, error: `Cart error: ${userErrors[0]?.message}` },
        { status: 400 }
      );
    }

    const checkoutUrl = data.data.cartCreate.cart?.checkoutUrl;
    const shopifyCartId = data.data.cartCreate.cart?.id;

    if (!checkoutUrl) {
      console.error('No checkout URL in response');
      return NextResponse.json(
        { success: false, error: 'Failed to get checkout URL' },
        { status: 500 }
      );
    }

    // Store Shopify checkout ID in AlbumSession for bidirectional tracking
    if (shopifyCartId) {
      await prisma.albumSession.update({
        where: { id: albumSessionId },
        data: { shopifyCheckoutId: shopifyCartId }
      });
      console.log('✅ Stored Shopify checkout ID:', shopifyCartId);
    }

    console.log('✅ Checkout created successfully');

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkoutUrl
      }
    });

  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
