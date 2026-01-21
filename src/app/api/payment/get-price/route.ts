import { NextRequest, NextResponse } from 'next/server';
import { getCartTotal, getProductVariant } from '@/lib/shopify-storefront';

export async function GET(request: NextRequest) {
  const cartToken = request.nextUrl.searchParams.get('cartToken');

  try {
    // If cart token exists, get cart total
    if (cartToken) {
      const cartTotal = await getCartTotal(cartToken);
      if (cartTotal) {
        return NextResponse.json({
          success: true,
          data: { amount: cartTotal.amount, currencyCode: cartTotal.currencyCode },
        });
      }
    }

    // Otherwise, get variant price
    const variantId = process.env.SHOPIFY_PRODUCT_VARIANT_ID;
    if (!variantId) {
      return NextResponse.json(
        { success: false, error: 'Product not configured' },
        { status: 500 }
      );
    }

    const variant = await getProductVariant(variantId);
    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { amount: variant.price.amount, currencyCode: variant.price.currencyCode },
    });
  } catch (error) {
    console.error('Error fetching price:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch price' },
      { status: 500 }
    );
  }
}
