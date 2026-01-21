/**
 * Shopify Storefront API Client
 *
 * Direct integration for custom store using Storefront API
 * No Partner account or App Proxy required
 */

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!;
const API_VERSION = '2024-10';

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
}

export interface CartUpdateResponse {
  checkoutUrl: string;
  checkoutId: string;
  attributes: Array<{ key: string; value: string }>;
}

export interface CartAttributeInput {
  key: string;
  value: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  id: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  product: {
    title: string;
    handle: string;
  };
}

/**
 * Create a cart and get checkout URL using Storefront API
 *
 * @param items - Array of cart line items
 * @param note - Optional note for the order
 * @param attributes - Optional cart attributes
 */
export async function createCheckout(
  items: CartLineInput[],
  note?: string,
  attributes?: CartAttributeInput[]
): Promise<CheckoutResponse> {
  const mutation = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lines: items.map(item => ({
        merchandiseId: item.merchandiseId,
        quantity: item.quantity,
        attributes: item.attributes,
      })),
      ...(note && { note }),
      ...(attributes && { attributes }),
    },
  };

  try {
    const endpoint = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

    console.log('🌐 [Shopify] Sending GraphQL request to Storefront API');
    console.log('  - Endpoint:', endpoint);
    console.log('  - Domain:', SHOPIFY_DOMAIN);
    console.log('  - API Version:', API_VERSION);
    console.log('  - Has Token:', !!STOREFRONT_TOKEN);
    console.log('  - Variables:', JSON.stringify(variables, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    console.log('📡 [Shopify] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Shopify] HTTP error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 [Shopify] Response data:', JSON.stringify(data, null, 2));

    // Check for GraphQL errors
    if (data.errors) {
      console.error('❌ [Shopify] GraphQL errors:', JSON.stringify(data.errors, null, 2));
      throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
    }

    // Check for user errors
    if (data.data?.cartCreate?.userErrors?.length > 0) {
      const userErrors = data.data.cartCreate.userErrors;
      console.error('❌ [Shopify] Cart creation user errors:');
      userErrors.forEach((err: any, index: number) => {
        console.error(`   Error ${index + 1}:`, {
          field: err.field,
          message: err.message,
          code: err.code
        });
      });
      const firstError = userErrors[0];
      throw new Error(`Cart Error: ${firstError.message} (field: ${firstError.field?.join(' > ') || 'unknown'})`);
    }

    const cart = data.data?.cartCreate?.cart;
    if (!cart || !cart.checkoutUrl) {
      console.error('❌ [Shopify] No cart or checkout URL in response:', data);
      throw new Error('No checkout URL returned from Shopify');
    }

    console.log('✅ [Shopify] Checkout created successfully');
    console.log('  - Cart ID:', cart.id);
    console.log('  - Checkout URL:', cart.checkoutUrl);

    return {
      checkoutUrl: cart.checkoutUrl,
      id: cart.id,
    };
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [Shopify] CHECKOUT CREATION FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw error;
  }
}

/**
 * Update cart attributes using Storefront API
 *
 * @param cartToken - The cart token (without gid:// prefix)
 * @param attributes - Array of attributes to set on the cart
 */
export async function updateCartAttributes(
  cartToken: string,
  attributes: CartAttributeInput[]
): Promise<CartUpdateResponse> {
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

  // Convert cart token to GID format
  const cartGid = `gid://shopify/Cart/${cartToken}`;

  const variables = {
    cartId: cartGid,
    attributes,
  };

  try {
    const endpoint = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

    console.log('🌐 [Shopify] Updating cart attributes');
    console.log('  - Endpoint:', endpoint);
    console.log('  - Cart GID:', cartGid);
    console.log('  - Attributes:', JSON.stringify(attributes, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    console.log('📡 [Shopify] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Shopify] HTTP error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 [Shopify] Response data:', JSON.stringify(data, null, 2));

    // Check for GraphQL errors
    if (data.errors) {
      console.error('❌ [Shopify] GraphQL errors:', JSON.stringify(data.errors, null, 2));
      throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
    }

    // Check for user errors
    const cartUpdate = data.data?.cartAttributesUpdate;
    if (cartUpdate?.userErrors?.length > 0) {
      const userErrors = cartUpdate.userErrors;
      console.error('❌ [Shopify] Cart update user errors:', userErrors);
      const firstError = userErrors[0];
      throw new Error(`Cart Error: ${firstError.message} (field: ${firstError.field?.join(' > ') || 'unknown'})`);
    }

    const cart = cartUpdate?.cart;
    if (!cart || !cart.checkoutUrl) {
      console.error('❌ [Shopify] No cart or checkout URL in response:', data);
      throw new Error('No checkout URL returned from Shopify');
    }

    console.log('✅ [Shopify] Cart attributes updated successfully');
    console.log('  - Cart ID:', cart.id);
    console.log('  - Checkout URL:', cart.checkoutUrl);

    return {
      checkoutUrl: cart.checkoutUrl,
      checkoutId: cart.id,
      attributes: cart.attributes,
    };
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [Shopify] CART UPDATE FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw error;
  }
}

/**
 * Get cart total amount
 *
 * @param cartToken - The cart token (without gid:// prefix)
 */
export async function getCartTotal(
  cartToken: string
): Promise<{ amount: string; currencyCode: string } | null> {
  const query = `
    query getCart($id: ID!) {
      cart(id: $id) {
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  `;

  const cartGid = `gid://shopify/Cart/${cartToken}`;

  try {
    const response = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query, variables: { id: cartGid } }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data?.cart?.cost?.totalAmount || null;
  } catch (error) {
    console.error('Error fetching cart total:', error);
    return null;
  }
}

/**
 * Get product variant details by ID
 *
 * @param variantId - Numeric variant ID (not GID)
 */
export async function getProductVariant(
  variantId: string
): Promise<ProductVariant | null> {
  const query = `
    query getVariant($id: ID!) {
      node(id: $id) {
        ... on ProductVariant {
          id
          title
          price {
            amount
            currencyCode
          }
          product {
            title
            handle
          }
        }
      }
    }
  `;

  const variables = {
    id: `gid://shopify/ProductVariant/${variantId}`,
  };

  try {
    const response = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return null;
    }

    return data.data?.node || null;
  } catch (error) {
    console.error('Error fetching product variant:', error);
    return null;
  }
}

/**
 * Get multiple products by handles
 * Useful for displaying product information
 *
 * @param handles - Array of product handles
 */
export async function getProductsByHandles(
  handles: string[]
): Promise<any[]> {
  const query = `
    query getProducts($handles: [String!]!) {
      products(first: 10, query: $handles) {
        edges {
          node {
            id
            title
            handle
            description
            variants(first: 5) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    handles: handles.map(h => `handle:${h}`).join(' OR '),
  };

  try {
    const response = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
      }
    );

    const data = await response.json();
    return data.data?.products?.edges?.map((e: any) => e.node) || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Validate Storefront API configuration
 * Call this on app startup to ensure everything is configured correctly
 */
export function validateStorefrontConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!SHOPIFY_DOMAIN) {
    errors.push('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is not set');
  }

  if (!STOREFRONT_TOKEN) {
    errors.push('NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN is not set');
  }

  if (SHOPIFY_DOMAIN && !SHOPIFY_DOMAIN.includes('myshopify.com')) {
    errors.push(
      'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN should be in format: store.myshopify.com'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
