import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!;

interface SongDetails {
  albumSessionId: string;
  title?: string;
  coupleNames?: string;
  email?: string;
}

interface CartUpdateRequest {
  cartToken: string;
  songDetails: SongDetails;
}

export async function POST(request: NextRequest) {
  try {
    const body: CartUpdateRequest = await request.json();
    const { cartToken, songDetails } = body;

    if (!cartToken) {
      return NextResponse.json(
        { error: 'Cart token is required' },
        { status: 400 }
      );
    }

    if (!songDetails?.albumSessionId) {
      return NextResponse.json(
        { error: 'Album session ID is required' },
        { status: 400 }
      );
    }

    console.log('[Cart Update] Updating cart with token:', cartToken);
    console.log('[Cart Update] Song details:', songDetails);

    // Convert cart token to GID format (keep the full token including ?key=xxx)
    const cartGid = `gid://shopify/Cart/${cartToken}`;
    console.log('[Cart Update] Cart GID:', cartGid);

    // GraphQL mutation to update cart attributes
    const mutation = `
      mutation cartAttributesUpdate($attributes: [AttributeInput!]!, $cartId: ID!) {
        cartAttributesUpdate(attributes: $attributes, cartId: $cartId) {
          cart {
            id
            checkoutUrl
            attributes {
              key
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Prepare cart attributes with song metadata
    const variables = {
      cartId: cartGid,
      attributes: [
        {
          key: 'album_session_id',
          value: songDetails.albumSessionId
        },
        {
          key: 'song_title',
          value: songDetails.title || 'Custom Love Story Song'
        },
        {
          key: 'couple_names',
          value: songDetails.coupleNames || ''
        },
        {
          key: 'user_email',
          value: songDetails.email || 'anonymous@lovestories.ai'
        },
        {
          key: 'created_at',
          value: new Date().toISOString()
        }
      ]
    };

    console.log('[Cart Update] Calling Shopify Storefront API...');
    console.log('[Cart Update] API endpoint: https://' + SHOPIFY_STORE_DOMAIN + '/api/2024-10/graphql.json');

    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/api/2024-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query: mutation, variables }),
      }
    );

    const data = await response.json();
    console.log('[Cart Update] Shopify response:', JSON.stringify(data, null, 2));

    // Check for GraphQL errors
    if (data.errors) {
      console.error('[Cart Update] GraphQL errors:', data.errors);
      return NextResponse.json(
        {
          error: 'Failed to update cart',
          details: data.errors
        },
        { status: 400 }
      );
    }

    // Check for user errors in mutation response
    const cartUpdate = data.data?.cartAttributesUpdate;
    if (!cartUpdate || cartUpdate.userErrors?.length > 0) {
      console.error('[Cart Update] User errors:', cartUpdate?.userErrors);
      return NextResponse.json(
        {
          error: 'Failed to update cart',
          details: cartUpdate?.userErrors || ['Unknown error']
        },
        { status: 400 }
      );
    }

    const cart = cartUpdate.cart;

    if (!cart?.checkoutUrl) {
      console.error('[Cart Update] No checkout URL in response');
      return NextResponse.json(
        { error: 'Failed to get checkout URL from cart' },
        { status: 500 }
      );
    }

    console.log('[Cart Update] Success! Checkout URL:', cart.checkoutUrl);
    console.log('[Cart Update] Cart attributes:', cart.attributes);

    return NextResponse.json({
      success: true,
      checkoutUrl: cart.checkoutUrl,
      checkoutId: cart.id,
      attributes: cart.attributes,
    });

  } catch (error) {
    console.error('[Cart Update] Error updating Shopify cart:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
