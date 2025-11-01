import crypto from 'crypto';

/**
 * Shopify App Proxy Authentication Utilities
 *
 * When Shopify proxies requests to your app, it adds several query parameters
 * and signs the request with HMAC for security verification.
 */

export interface ShopifyProxyParams {
  shop: string;
  path_prefix: string;
  timestamp: string;
  signature: string;
  logged_in_customer_id?: string;
  [key: string]: string | undefined;
}

/**
 * Verify that a request came from Shopify by validating the HMAC signature
 *
 * @param params - Query parameters from the request
 * @param secret - Your Shopify app's client secret
 * @returns boolean indicating if the signature is valid
 */
export function verifyShopifyProxyRequest(
  params: Record<string, string | string[]>,
  secret: string
): boolean {
  const { signature, ...queryParams } = params;

  if (!signature || typeof signature !== 'string') {
    console.error('Missing signature in Shopify proxy request');
    return false;
  }

  // Remove signature and build query string for HMAC validation
  // Shopify expects parameters to be sorted alphabetically
  const sortedParams = Object.keys(queryParams)
    .filter(key => key !== 'signature')
    .sort()
    .map(key => {
      const value = queryParams[key];
      const val = Array.isArray(value) ? value[0] : value;
      return `${key}=${val}`;
    })
    .join('');

  // Calculate HMAC
  const calculatedSignature = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');

  // Compare signatures using timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(calculatedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error comparing signatures:', error);
    return false;
  }
}

/**
 * Extract Shopify-specific parameters from the request
 *
 * @param searchParams - URLSearchParams from the request
 * @returns Parsed Shopify proxy parameters
 */
export function parseShopifyProxyParams(
  searchParams: URLSearchParams
): ShopifyProxyParams | null {
  const shop = searchParams.get('shop');
  const pathPrefix = searchParams.get('path_prefix');
  const timestamp = searchParams.get('timestamp');
  const signature = searchParams.get('signature');

  if (!shop || !pathPrefix || !timestamp || !signature) {
    console.error('Missing required Shopify proxy parameters');
    return null;
  }

  return {
    shop,
    path_prefix: pathPrefix,
    timestamp,
    signature,
    logged_in_customer_id: searchParams.get('logged_in_customer_id') || undefined,
  };
}

/**
 * Check if a request is coming from Shopify app proxy
 *
 * @param searchParams - URLSearchParams from the request
 * @returns boolean indicating if this is a Shopify proxy request
 */
export function isShopifyProxyRequest(searchParams: URLSearchParams): boolean {
  return Boolean(
    searchParams.get('shop') &&
    searchParams.get('signature') &&
    searchParams.get('path_prefix')
  );
}

/**
 * Get the shop domain from Shopify proxy parameters
 *
 * @param searchParams - URLSearchParams from the request
 * @returns Shop domain (e.g., "my-store.myshopify.com") or null
 */
export function getShopDomain(searchParams: URLSearchParams): string | null {
  return searchParams.get('shop');
}

/**
 * Get logged-in customer ID from Shopify proxy parameters
 * Shopify provides this when a customer is logged into the store
 *
 * @param searchParams - URLSearchParams from the request
 * @returns Customer ID or null if not logged in
 */
export function getLoggedInCustomerId(searchParams: URLSearchParams): string | null {
  return searchParams.get('logged_in_customer_id');
}

/**
 * Generate a liquid response that can be rendered within a Shopify theme
 * This is useful for returning HTML that integrates with the store's theme
 *
 * @param html - HTML content to render
 * @param options - Optional configuration
 * @returns Response object with appropriate headers
 */
export function createLiquidResponse(
  html: string,
  options: {
    status?: number;
    contentType?: string;
  } = {}
): Response {
  const { status = 200, contentType = 'application/liquid' } = options;

  return new Response(html, {
    status,
    headers: {
      'Content-Type': contentType,
    },
  });
}

/**
 * Create a JSON response for app proxy
 *
 * @param data - Data to return as JSON
 * @param status - HTTP status code
 * @returns Response object
 */
export function createProxyJsonResponse(
  data: any,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
