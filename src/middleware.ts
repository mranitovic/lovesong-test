import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always use locale prefix
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip internationalization for Shopify proxy routes, embed routes, and API routes
  if (
    pathname.startsWith('/api/shopify-proxy') ||
    pathname.startsWith('/shopify/widget') ||
    pathname.startsWith('/embed') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Apply next-intl middleware for all other routes
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except static files, API routes that need to be excluded
  matcher: [
    '/',
    '/(de|en|pt-BR)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/shopify/:path*',
    '/embed/:path*'
  ]
};
