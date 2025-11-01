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
    const response = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query: mutation, variables }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check for GraphQL errors
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
    }

    // Check for user errors
    if (data.data?.cartCreate?.userErrors?.length > 0) {
      const error = data.data.cartCreate.userErrors[0];
      console.error('Cart creation error:', error);
      throw new Error(`Cart Error: ${error.message}`);
    }

    const cart = data.data?.cartCreate?.cart;
    if (!cart || !cart.checkoutUrl) {
      throw new Error('No checkout URL returned from Shopify');
    }

    return {
      checkoutUrl: cart.checkoutUrl,
      id: cart.id,
    };
  } catch (error) {
    console.error('Error creating Shopify checkout:', error);
    throw error;
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
