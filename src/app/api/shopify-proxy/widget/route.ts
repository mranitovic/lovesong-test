import { NextRequest, NextResponse } from 'next/server';
import {
  verifyShopifyProxyRequest,
  parseShopifyProxyParams,
  getLoggedInCustomerId,
  createLiquidResponse,
  createProxyJsonResponse,
} from '@/lib/shopify-proxy';

/**
 * Shopify App Proxy Widget Endpoint
 *
 * This endpoint handles requests from Shopify's app proxy.
 * When merchants add your app to their storefront, Shopify will proxy requests
 * from https://store.com/apps/love-album to this endpoint.
 *
 * URL Pattern: /a/love-album/* -> /api/shopify-proxy/widget
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Verify this is a legitimate Shopify request
  const secret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!secret) {
    console.error('SHOPIFY_CLIENT_SECRET not configured');
    return createProxyJsonResponse(
      { error: 'App configuration error' },
      500
    );
  }

  // Convert searchParams to plain object for verification
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // Verify the request signature
  if (!verifyShopifyProxyRequest(params, secret)) {
    console.error('Invalid Shopify proxy signature');
    return createProxyJsonResponse(
      { error: 'Unauthorized' },
      401
    );
  }

  // Parse Shopify-specific parameters
  const shopifyParams = parseShopifyProxyParams(searchParams);

  if (!shopifyParams) {
    console.error('Missing required Shopify proxy parameters');
    return createProxyJsonResponse(
      { error: 'Invalid request parameters' },
      400
    );
  }

  const { shop, logged_in_customer_id } = shopifyParams;
  const customerId = logged_in_customer_id;

  console.log(`📦 Shopify proxy request from shop: ${shop}, customer: ${customerId || 'guest'}`);

  // Build the widget URL with authentication context
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const widgetUrl = new URL('/shopify/widget', appUrl);

  // Pass shop and customer context to the widget
  widgetUrl.searchParams.set('shop', shop);
  if (customerId) {
    widgetUrl.searchParams.set('customer_id', customerId);
  }

  // Return HTML that loads the widget in an iframe or redirects
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .love-album-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      padding: 20px;
    }
    .love-album-iframe {
      width: 100%;
      min-height: 800px;
      border: none;
      border-radius: 8px;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="love-album-container">
    <div class="loading">Loading AI Love Album Generator...</div>
    <iframe
      id="love-album-frame"
      class="love-album-iframe"
      src="${widgetUrl.toString()}"
      frameborder="0"
      scrolling="yes"
      allow="payment"
    ></iframe>
  </div>
  <script>
    // Hide loading message once iframe loads
    document.getElementById('love-album-frame').addEventListener('load', function() {
      document.querySelector('.loading').style.display = 'none';
    });

    // Auto-resize iframe based on content
    window.addEventListener('message', function(event) {
      if (event.data.type === 'resize' && event.data.height) {
        document.getElementById('love-album-frame').style.height = event.data.height + 'px';
      }
    });
  </script>
</body>
</html>
  `.trim();

  // Return as liquid template so it can be rendered within Shopify theme
  return createLiquidResponse(html, {
    contentType: 'text/html; charset=utf-8',
  });
}

/**
 * Handle POST requests for form submissions or API calls from the widget
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!secret) {
    return createProxyJsonResponse({ error: 'Configuration error' }, 500);
  }

  // Convert searchParams to plain object
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // Verify the request
  if (!verifyShopifyProxyRequest(params, secret)) {
    return createProxyJsonResponse({ error: 'Unauthorized' }, 401);
  }

  const shopifyParams = parseShopifyProxyParams(searchParams);
  if (!shopifyParams) {
    return createProxyJsonResponse({ error: 'Invalid parameters' }, 400);
  }

  try {
    const body = await request.json();

    // Handle different action types
    const { action } = body;

    switch (action) {
      case 'check_auth':
        // Check if customer is authenticated
        return createProxyJsonResponse({
          authenticated: Boolean(shopifyParams.logged_in_customer_id),
          shop: shopifyParams.shop,
          customerId: shopifyParams.logged_in_customer_id,
        });

      default:
        return createProxyJsonResponse(
          { error: 'Unknown action' },
          400
        );
    }
  } catch (error) {
    console.error('Error handling proxy POST:', error);
    return createProxyJsonResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
