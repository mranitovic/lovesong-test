import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test basic Shopify API connectivity
    const storefrontEndpoint = `https://${process.env.SHOPIFY_STORE_URL}/api/2024-10/graphql.json`;

    console.log('Testing Shopify connection...');
    console.log('Endpoint:', storefrontEndpoint);
    console.log('Token length:', process.env.SHOPIFY_ACCESS_TOKEN?.length);

    // Simple query to test connection
    const testQuery = `
      {
        shop {
          name
          primaryDomain {
            url
          }
        }
      }
    `;

    const response = await fetch(storefrontEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN!
      },
      body: JSON.stringify({
        query: testQuery
      })
    });

    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      endpoint: storefrontEndpoint,
      data: data,
      tokenLength: process.env.SHOPIFY_ACCESS_TOKEN?.length,
      storeUrl: process.env.SHOPIFY_STORE_URL
    });

  } catch (error) {
    console.error('Error testing Shopify:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
